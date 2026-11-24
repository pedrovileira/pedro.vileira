/**
 * Best-effort in-memory throttling for the public Image Lab endpoints.
 * Serverless instances may restart or scale independently; this is not a
 * durable billing/quota system. Use a shared rate-limit store for stronger
 * protection before promoting the tool to unrestricted public traffic.
 */
type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

function clientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  return forwarded || realIp || 'unknown';
}

export function checkPublicLimit(request: Request, action: 'upload' | 'process') {
  const now = Date.now();
  const windowMs = action === 'process' ? 60_000 : 10 * 60_000;
  const max = action === 'process' ? 3 : 35;
  const key = `${action}:${clientKey(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= max) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function hasValidEditorOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    return Boolean(host && parsed.host === host);
  } catch {
    return false;
  }
}
