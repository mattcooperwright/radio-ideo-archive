import { describe, expect, it } from 'vitest';
import { isAllowedEmail, isValidEmail, normaliseEmail } from './email';

describe('isAllowedEmail', () => {
  it('accepts verified ideo.com addresses', () => {
    expect(isAllowedEmail('mcooper@ideo.com', true)).toBe(true);
    expect(isAllowedEmail('Someone@IDEO.com', true)).toBe(true);
  });
  it('rejects unverified addresses', () => {
    expect(isAllowedEmail('mcooper@ideo.com', false)).toBe(false);
    expect(isAllowedEmail('mcooper@ideo.com', undefined)).toBe(false);
  });
  it('rejects lookalike and other domains', () => {
    expect(isAllowedEmail('x@ideo.com.evil.com', true)).toBe(false);
    expect(isAllowedEmail('x@notideo.com', true)).toBe(false);
    expect(isAllowedEmail('x@sub.ideo.com', true)).toBe(false);
    expect(isAllowedEmail('ideo.com', true)).toBe(false);
    expect(isAllowedEmail('x@gmail.com', true)).toBe(false);
    expect(isAllowedEmail('', true)).toBe(false);
    expect(isAllowedEmail(null, true)).toBe(false);
  });
});

describe('normaliseEmail and isValidEmail', () => {
  it('trims and lowercases', () => {
    expect(normaliseEmail('  Guest@Example.COM ')).toBe('guest@example.com');
  });
  it('accepts plain addresses and rejects junk', () => {
    expect(isValidEmail('guest@example.com')).toBe(true);
    expect(isValidEmail('guest@example')).toBe(false);
    expect(isValidEmail('guest example@x.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});
