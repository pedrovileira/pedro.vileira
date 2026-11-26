import { NextResponse } from 'next/server';

// Endpoint mantido por compatibilidade: o Image Lab agora é público.
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.GEMINI_API_KEY && process.env.BLOB_READ_WRITE_TOKEN), authenticated: true });
}
