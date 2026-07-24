/**
 * Best-effort per-user rate limiting for expensive endpoints (the xAI calls).
 *
 * Deliberately in-memory: serverless instances don't share state, so a user
 * spread across N instances gets up to N× the quota. That's fine — the goal
 * is to stop a single client hammering the endpoint in a loop and burning
 * credits, not to enforce exact billing quotas. Swap for a Redis/Postgres
 * counter if hard limits are ever needed.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Drops expired buckets so the map can't grow without bound. */
function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets — send as Retry-After. */
  retryAfter: number;
}

/**
 * Returns whether `key` may perform another action in the current window.
 *
 * @param key     Usually `${route}:${userId}`.
 * @param limit   Max actions allowed per window.
 * @param windowMs Length of the window in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}
