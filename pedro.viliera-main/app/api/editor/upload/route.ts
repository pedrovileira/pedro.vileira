import { setTtl } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { checkPublicLimit, hasValidEditorOrigin } from '@/lib/editor-public-guard';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/image-types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!hasValidEditorOrigin(request)) {
    return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403 });
  }
  const limit = checkPublicLimit(request, 'upload');
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Limite temporário atingido. Aguarde e tente novamente.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('pv-editor/input/')) {
          throw new Error('Caminho de upload inválido.');
        }

        return {
          allowedContentTypes: [...ACCEPTED_IMAGE_TYPES], // image/jpeg (.jpeg/.jpg), image/png, image/webp
          maximumSizeInBytes: 12 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ scope: 'pv-editor' }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Fallback: remove uploads abandonados após pelo menos um dia.
        await setTtl(blob.url, { ttlDays: 1 }).catch(() => undefined);
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível iniciar o upload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
