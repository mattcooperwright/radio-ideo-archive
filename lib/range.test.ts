import { describe, expect, it } from 'vitest';
import { parseRange } from './range';

describe('parseRange', () => {
  it('handles open, closed and suffix ranges', () => {
    expect(parseRange('bytes=1000-', 5000)).toEqual({ start: 1000, end: 4999 });
    expect(parseRange('bytes=0-99', 5000)).toEqual({ start: 0, end: 99 });
    expect(parseRange('bytes=-500', 5000)).toEqual({ start: 4500, end: 4999 });
    expect(parseRange('bytes=0-99999', 5000)).toEqual({ start: 0, end: 4999 });
  });
  it('rejects junk', () => {
    expect(parseRange(null, 5000)).toBeNull();
    expect(parseRange('bytes=-', 5000)).toBeNull();
    expect(parseRange('bytes=6000-', 5000)).toBeNull();
    expect(parseRange('items=0-1', 5000)).toBeNull();
  });
});
