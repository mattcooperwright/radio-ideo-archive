import { describe, expect, it } from 'vitest';
import { parseFilename, slugify, tidySeriesName } from './parseShow';

describe('parseFilename', () => {
  it('parses the recorder pattern', () => {
    expect(parseFilename('ShuffleMode - 2026-07-22 21-39-41.m4a')).toEqual({
      series: 'ShuffleMode',
      date: '2026-07-22T21:39:41Z',
      title: null,
    });
    expect(parseFilename('In the Zone - 2026-06-16 22-55-01.m4a').series).toBe('In the Zone');
  });

  it('copes with a missing separator', () => {
    expect(parseFilename('ShuffleMode2026-04-15 21-14-03.m4a')).toEqual({
      series: 'ShuffleMode',
      date: '2026-04-15T21:14:03Z',
      title: null,
    });
  });

  it('tidies shouty series names', () => {
    expect(parseFilename('FRIDAY SHOW - 2026-07-24 21-47-44.m4a').series).toBe('Friday Show');
  });

  it('falls back for free-form names', () => {
    expect(parseFilename('Radio IDEO - Shuffle Mode - October 2022.mp3')).toEqual({
      series: 'Shuffle Mode',
      date: null,
      title: 'Shuffle Mode - October 2022',
    });
    expect(parseFilename('Radio IDEO - 29 Apr 2022 - part 2.mp3')).toEqual({
      series: 'Radio IDEO',
      date: null,
      title: '29 Apr 2022 - part 2',
    });
    expect(parseFilename('heavy shuffle nov 22.m4a')).toEqual({
      series: 'Radio IDEO',
      date: null,
      title: 'heavy shuffle nov 22',
    });
  });
});

describe('slugify', () => {
  it('merges spacing variants of the same series', () => {
    expect(slugify('ShuffleMode')).toBe(slugify('Shuffle Mode'));
    expect(slugify('In the Zone')).toBe('inthezone');
  });
});

describe('tidySeriesName', () => {
  it('leaves mixed case alone', () => {
    expect(tidySeriesName('ShuffleMode')).toBe('ShuffleMode');
  });
});
