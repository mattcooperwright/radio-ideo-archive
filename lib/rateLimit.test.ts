import { describe, expect, it } from 'vitest';
import { createLimiter } from './rateLimit';

describe('createLimiter', () => {
  it('allows up to the limit, then refuses with a wait time', () => {
    let t = 0;
    const l = createLimiter(3, 60_000, () => t);
    for (let i = 0; i < 3; i++) expect(l.take('a').ok).toBe(true);
    const r = l.take('a');
    expect(r).toEqual({ ok: false, retryAfterSeconds: 60 });
  });
  it('keeps keys separate', () => {
    const l = createLimiter(1, 60_000, () => 0);
    expect(l.take('a').ok).toBe(true);
    expect(l.take('b').ok).toBe(true);
    expect(l.take('a').ok).toBe(false);
  });
  it('lets hits through again once the window has passed', () => {
    let t = 0;
    const l = createLimiter(1, 60_000, () => t);
    l.take('a');
    t = 59_999;
    expect(l.take('a').ok).toBe(false);
    t = 60_000;
    expect(l.take('a').ok).toBe(true);
  });
  it('does not count refused hits against the caller', () => {
    let t = 0;
    const l = createLimiter(1, 60_000, () => t);
    l.take('a');
    for (let i = 0; i < 50; i++) l.take('a');
    t = 60_000;
    expect(l.take('a').ok).toBe(true);
  });
});
