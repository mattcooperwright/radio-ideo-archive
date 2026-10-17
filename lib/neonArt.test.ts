import { describe, expect, it } from 'vitest';
import { NEON_COMBOS, NEONS, neonArt } from './neonArt';

describe('neonArt', () => {
  it('gives every show a different cover until the combinations run out', () => {
    const seen = new Set(Array.from({ length: NEON_COMBOS }, (_, t) => neonArt(t).bg));
    expect(seen.size).toBe(NEON_COMBOS);
  });

  it('starts on the brand lime and wraps around after the last combination', () => {
    expect(neonArt(0).bg).toContain(NEONS[0]);
    expect(neonArt(NEON_COMBOS).bg).toBe(neonArt(0).bg);
  });
});
