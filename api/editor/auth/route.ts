import { NextResponse } from 'next/server';
import {
  clearEditorSessionCookie,
  compareEditorPassword,
  createEditorSessionCookie,
  isEditorConfigured,
  isEditorSessionValid,
} from '@/lib/editor-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return NextResponse.json({
    configured: isEditorConfigured(),
    authenticated: isEditorSessionValid(request.headers.get('cookie')),
  });
}

export async function POST(request: Request) {
  if (!isEditorConfigured()) {
    return NextResponse.json({ error: 'Configure EDITOR_ACCESS_PASSWORD e EDITOR_SESSION_SECRET na Vercel.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === 'string' ? body.password : '';

  if (!compareEditorPassword(password)) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.headers.append('Set-Cookie', createEditorSessionCookie());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.headers.append('Set-Cookie', clearEditorSessionCookie());
  return response;
}
