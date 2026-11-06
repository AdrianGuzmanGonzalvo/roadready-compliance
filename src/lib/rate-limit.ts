/**
 * In-memory fixed-window rate limiting. Enough for this app: it runs as one
 * long-lived server process (see docker-compose.yml), so every request sees
 * the same counters. A restart clears them, which only ever lets people in.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const MAX_TRACKED_KEYS = 10_000;

function liveWindow(key: string, windowMs: number, now: number): Window {
  const current = windows.get(key);
  if (current && current.resetAt > now) return current;

  // Expired windows are only dropped when the map gets big, so a flood of one-off keys can't grow it forever.
  if (windows.size >= MAX_TRACKED_KEYS) {
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    if (windows.size >= MAX_TRACKED_KEYS) windows.clear();
  }
  const fresh = { count: 0, resetAt: now + windowMs };
  windows.set(key, fresh);
  return fresh;
}

/** Seconds until `key` may try again, or 0 if it is under `limit` hits in the current window. */
export function retryAfterSeconds(key: string, limit: number, windowMs: number): number {
  const now = Date.now();
  const w = liveWindow(key, windowMs, now);
  return w.count >= limit ? Math.ceil((w.resetAt - now) / 1000) : 0;
}

/** Counts one hit against `key`. */
export function recordHit(key: string, windowMs: number): void {
  liveWindow(key, windowMs, Date.now()).count++;
}

export function resetHits(key: string): void {
  windows.delete(key);
}

/**
 * The visitor's IP. Requests only reach the app through the Cloudflare tunnel
 * (the container's port is bound to 127.0.0.1), so Cloudflare's header is trustworthy.
 */
export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function tooManyRequests(message: string, retryAfter: number): Response {
  return Response.json({ error: message }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
}
