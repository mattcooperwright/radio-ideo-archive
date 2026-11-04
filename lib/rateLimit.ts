/**
 * A small in-memory limiter: at most `limit` hits per key in any `windowMs`. State is per server
 * instance, so with N instances the real ceiling is N times the limit. That is fine as a backstop
 * against a scripted guest; the Firestore document ids in lib/plays.ts are what bound stored data.
 */
export function createLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();

  return {
    /** Records a hit and returns true if it is allowed, or false with how long to wait. */
    take(key: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((at) => t - at < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - t) / 1000)) };
      }
      recent.push(t);
      hits.set(key, recent);
      // Keep the map from growing without bound on a long-lived instance.
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.every((at) => t - at >= windowMs)) hits.delete(k);
      }
      return { ok: true };
    },
  };
}
