import { setTtl } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { isEditorSessionValid } from '@/lib/editor-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isEditorSessionValid(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
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
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
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
