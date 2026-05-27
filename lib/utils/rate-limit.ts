/**
 * In-memory rate limiter using a Map with TTL-based sliding window.
 *
 * Design notes:
 * - No external dependencies (no Redis, no Upstash)
 * - Resets on serverless cold starts — acceptable for MVP burst prevention
 * - Key is typically `userId:endpoint` or `ip:endpoint`
 * - Entries are cleaned up lazily on each check (no background timer needed)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

interface RateLimiterOptions {
  /** Time window in milliseconds */
  interval: number;
  /** Maximum requests allowed within the window */
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window */
  remaining: number;
  /** When the current window resets (Unix ms timestamp) */
  resetAt: number;
}

/**
 * Creates a stateful rate limiter.
 *
 * @example
 * // 10 room creations per hour per user
 * const createRoomLimiter = createRateLimiter({ interval: 60 * 60 * 1000, maxRequests: 10 });
 *
 * // 5 joins per minute per user
 * const joinRoomLimiter = createRateLimiter({ interval: 60 * 1000, maxRequests: 5 });
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { interval, maxRequests } = options;
  const store = new Map<string, RateLimitEntry>();

  return {
    /**
     * Checks whether `key` is within rate limits and increments the counter.
     * Returns `allowed: false` if the limit has been exceeded.
     */
    check(key: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now >= entry.resetAt) {
        // First request or window has expired — start a fresh window
        const resetAt = now + interval;
        store.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
      }

      if (entry.count >= maxRequests) {
        // Window still active, limit reached
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      // Window still active, increment
      entry.count += 1;
      const remaining = maxRequests - entry.count;
      return { allowed: true, remaining, resetAt: entry.resetAt };
    },

    /**
     * Removes the entry for `key`. Useful for testing or manual resets.
     */
    reset(key: string): void {
      store.delete(key);
    },

    /**
     * Cleans up all expired entries. Call periodically to prevent memory growth
     * in long-running environments (e.g., during development with `next dev`).
     */
    cleanup(): void {
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        if (now >= entry.resetAt) {
          store.delete(key);
        }
      }
    },

    /** Current number of tracked keys (useful for monitoring). */
    get size(): number {
      return store.size;
    },
  };
}

// ──────────────────────────────────────────────
// Singleton rate limiters — shared across all API route invocations
// (within the same serverless instance)
// ──────────────────────────────────────────────

/** Room creation: 10 per hour per user */
export const createRoomLimiter = createRateLimiter({
  interval: 60 * 60 * 1000,
  maxRequests: 10,
});

/** Number selection (join room): 5 per minute per user */
export const joinRoomLimiter = createRateLimiter({
  interval: 60 * 1000,
  maxRequests: 5,
});

/** General API: 100 per minute per user */
export const generalLimiter = createRateLimiter({
  interval: 60 * 1000,
  maxRequests: 100,
});
