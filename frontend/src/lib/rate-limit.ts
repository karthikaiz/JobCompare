// DB-based rate limiter for API routes
// Works across serverless invocations (Vercel, etc.) without Redis

import { prisma } from "@/lib/prisma";

/**
 * Check rate limit for a given key.
 * Uses the RateLimit table in the database.
 * @returns null if allowed, or { retryAfter } seconds if rate limited.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ retryAfter: number } | null> {
  const now = new Date();

  try {
    // Try to find existing rate limit entry
    const existing = await prisma.rateLimit.findUnique({
      where: { key },
    });

    if (!existing || existing.expiresAt < now) {
      // No entry or expired — create/reset with count=1
      await prisma.rateLimit.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          expiresAt: new Date(now.getTime() + windowMs),
        },
        update: {
          count: 1,
          expiresAt: new Date(now.getTime() + windowMs),
        },
      });
      return null;
    }

    if (existing.count >= maxRequests) {
      const retryAfter = Math.ceil(
        (existing.expiresAt.getTime() - now.getTime()) / 1000
      );
      return { retryAfter };
    }

    // Increment count
    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return null;
  } catch (error) {
    // If DB is unavailable, fail open (allow the request)
    console.error("Rate limit check failed:", error);
    return null;
  }
}

/**
 * Clean up expired rate limit entries.
 * Call this periodically (e.g., from a cron job or API route).
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
