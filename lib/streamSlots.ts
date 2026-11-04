/**
 * Caps how many audio streams one listener can hold open at once. State is per server instance, so
 * with N instances the real ceiling is N times `max`. A slot expires after `leaseMs` even if nothing
 * released it, so a stream that never reports back cannot lock a listener out for good.
 */
export function createStreamSlots(max: number, leaseMs: number, now: () => number = Date.now) {
  const held = new Map<string, Set<{ at: number }>>();

  return {
    /** Returns a release function, or null if the listener is already at the limit. */
    acquire(key: string): (() => void) | null {
      const t = now();
      const slots = new Set([...(held.get(key) ?? [])].filter((s) => t - s.at < leaseMs));
      if (slots.size >= max) {
        held.set(key, slots);
        return null;
      }
      const slot = { at: t };
      slots.add(slot);
      held.set(key, slots);
      return () => {
        const current = held.get(key);
        current?.delete(slot);
        if (current?.size === 0) held.delete(key);
      };
    },
  };
}

/** Passes a stream through unchanged and calls `release` once, when it ends, fails or is cancelled. */
export function releaseWhenDone(stream: ReadableStream<Uint8Array>, release: () => void): ReadableStream<Uint8Array> {
  const reader = stream.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          release();
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (e) {
        release();
        controller.error(e);
      }
    },
    cancel(reason) {
      release();
      return reader.cancel(reason);
    },
  });
}
