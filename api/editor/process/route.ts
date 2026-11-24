import { del, get } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { isEditorSessionValid } from '@/lib/editor-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = 'gemini-3-pro-image';
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_RATIOS = new Set(['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']);

export async function POST(request: Request) {
  if (!isEditorSessionValid(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'A chave GEMINI_API_KEY não está configurada.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const blobUrl = typeof body.blobUrl === 'string' ? body.blobUrl : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const aspectRatio = typeof body.aspectRatio === 'string' ? body.aspectRatio : 'auto';
  const imageSize = typeof body.imageSize === 'string' ? body.imageSize : '2K';

  if (!blobUrl || !prompt || prompt.length > 4000) {
    return NextResponse.json({ error: 'Informe a imagem e um prompt de até 4.000 caracteres.' }, { status: 400 });
  }

  if (!['1K', '2K', '4K'].includes(imageSize)) {
    return NextResponse.json({ error: 'Resolução inválida.' }, { status: 400 });
  }
  if (aspectRatio !== 'auto' && !ALLOWED_RATIOS.has(aspectRatio)) {
    return NextResponse.json({ error: 'Proporção inválida.' }, { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(blobUrl);
  } catch {
    return NextResponse.json({ error: 'Endereço da imagem inválido.' }, { status: 400 });
  }

  const allowedBlobHost = sourceUrl.hostname.endsWith('.private.blob.vercel-storage.com');
  if (sourceUrl.protocol !== 'https:' || !allowedBlobHost || !sourceUrl.pathname.includes('/pv-editor/input/')) {
    return NextResponse.json({ error: 'Origem da imagem não permitida.' }, { status: 400 });
  }

  try {
    const sourceBlob = await get(blobUrl, { access: 'private', useCache: false });
    if (!sourceBlob || sourceBlob.statusCode !== 200 || !sourceBlob.stream) {
      throw new Error('Não foi possível recuperar a imagem enviada.');
    }

    const mimeType = (sourceBlob.blob.contentType || '').split(';')[0].trim();
    if (!ALLOWED_TYPES.has(mimeType)) throw new Error('Formato de imagem não permitido.');

    const imageBuffer = Buffer.from(await new Response(sourceBlob.stream).arrayBuffer());
    if (imageBuffer.byteLength > MAX_IMAGE_BYTES) throw new Error('A imagem ultrapassa o limite de 12 MB.');

    const imagePart = {
      type: 'image',
      mime_type: mimeType,
      data: imageBuffer.toString('base64'),
    };

    const instructions = [
      'Edite a fotografia fornecida. Ela é a imagem-fonte e deve continuar reconhecível como a mesma fotografia.',
      'Aplique somente as mudanças solicitadas pelo usuário. Preserve a identidade visual, os objetos, a arquitetura, a geometria, a perspectiva e a composição que não foram explicitamente solicitados para mudar.',
      'Não crie uma colagem, mosaico, grade, montagem ou várias versões. Gere uma única imagem final correspondente a esta fotografia.',
      'Não invente elementos estruturais nem remova detalhes importantes sem instrução explícita.',
      `Instrução de edição: ${prompt}`,
    ].join('\n\n');

    const responseFormat: Record<string, string> = {
      type: 'image',
      mime_type: 'image/png',
      image_size: imageSize,
    };
    if (aspectRatio !== 'auto') responseFormat.aspect_ratio = aspectRatio;

    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
        'Api-Revision': '2026-05-20',
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { type: 'text', text: instructions },
          imagePart,
        ],
        response_format: responseFormat,
      }),
      signal: AbortSignal.timeout(55_000),
    });

    const geminiData = await geminiResponse.json().catch(() => ({}));
    if (!geminiResponse.ok) {
      const message = typeof geminiData?.error?.message === 'string'
        ? geminiData.error.message
        : 'O Google Gemini não conseguiu processar esta imagem.';
      throw new Error(message.slice(0, 500));
    }

    const imageData = geminiData?.output_image?.data;
    const outputMimeType = geminiData?.output_image?.mime_type || 'image/png';
    if (typeof imageData !== 'string' || !imageData.length) {
      throw new Error('A IA não retornou uma imagem. Tente novamente com outro prompt.');
    }

    return NextResponse.json({ imageData, mimeType: outputMimeType, model: MODEL });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar a imagem.';
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    // As imagens originais ficam temporariamente no Blob e são apagadas após cada tentativa.
    await del(blobUrl).catch(() => undefined);
  }
}
