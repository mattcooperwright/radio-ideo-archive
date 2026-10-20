import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('./firebaseAdmin', () => ({ adminAuth: () => ({}) }));

import { canAccess } from './access';

describe('canAccess', () => {
  it('lets verified IDEO addresses in', () => {
    expect(canAccess('a@ideo.com', true)).toBe(true);
  });
  it('lets guests in whether or not their address is verified', () => {
    expect(canAccess('guest@example.com', false)).toBe(true);
    expect(canAccess('guest@example.com', undefined)).toBe(true);
    expect(canAccess('guest@example.com', true)).toBe(true);
  });
  it('turns away unverified IDEO addresses, whatever the case', () => {
    expect(canAccess('a@ideo.com', false)).toBe(false);
    expect(canAccess('A@IDEO.com', undefined)).toBe(false);
  });
  it('turns away unverified admin addresses', () => {
    expect(canAccess('mcooper@ideo.com', false)).toBe(false);
  });
  it('turns away tokens with no email', () => {
    expect(canAccess(undefined, true)).toBe(false);
    expect(canAccess('', true)).toBe(false);
  });
  it('does not treat lookalike domains as IDEO', () => {
    expect(canAccess('x@ideo.com.evil.com', false)).toBe(true);
  });
});
