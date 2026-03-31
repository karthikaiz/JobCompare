// In-memory rate limiter for API routes
// For production, replace with Redis-based solution

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key);
  });
}, 60_000);

/**
 * Check rate limit for a given key.
 * @returns null if allowed, or { retryAfter } seconds if rate limited.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { retryAfter: number } | null {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= maxRequests) {
    return { retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return null;
}
