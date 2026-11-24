import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'pv_editor_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function getSecret() {
  return process.env.EDITOR_SESSION_SECRET || '';
}

function sign(expiresAt: string) {
  return createHmac('sha256', getSecret()).update(expiresAt).digest('hex');
}

export function isEditorConfigured() {
  return Boolean(
    process.env.EDITOR_ACCESS_PASSWORD &&
    getSecret() &&
    process.env.GEMINI_API_KEY &&
    process.env.BLOB_READ_WRITE_TOKEN
  );
}

export function isEditorSessionValid(cookieHeader: string | null) {
  if (!isEditorConfigured() || !cookieHeader) return false;

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return false;

  const value = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
  const [expiresAt, signature] = value.split('.');
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

  const expected = sign(expiresAt);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function createEditorSessionCookie() {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS);
  const value = `${expiresAt}.${sign(expiresAt)}`;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function clearEditorSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

export function compareEditorPassword(candidate: string) {
  const expected = process.env.EDITOR_ACCESS_PASSWORD || '';
  if (!expected) return false;
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}
