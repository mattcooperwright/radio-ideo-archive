import { describe, expect, it } from 'vitest';
import { parsePlaylist, parseTime, playlistUrls, tracksForShow, type Playlist } from './setlist';
import type { Show } from './types';

const page = (rows: [string, string][]) =>
  `<html><body><div class="playlist-tracks">${rows
    .map(([t, n]) => `<div class="playlist-track"><div class="playlist-tracktime">${t}</div><div class="playlist-trackname">${n}</div></div>`)
    .join('')}</div></body></html>`;

const show = (id: string, date: string, dated = true): Show => ({
  id, date, dated, title: '', titleIsDate: true, series: '', seriesSlug: '', year: 2026,
  mimeType: '', size: 0, description: '', cover: '', colour: '', serato: null,
});

describe('playlistUrls', () => {
  it('builds the day-first date slug', () => {
    expect(playlistUrls('id:12790432', '2026-06-09T21:00:00Z')).toEqual([
      'https://serato.com/playlists/id:12790432/09-06-2026',
      'https://serato.com/playlists/id:12790432/9-6-2026',
    ]);
    expect(playlistUrls('id:1', '2026-11-12T21:00:00Z')).toEqual(['https://serato.com/playlists/id:1/12-11-2026']);
  });
});

describe('parseTime', () => {
  it('reads 12- and 24-hour clocks and offsets', () => {
    expect(parseTime('9:14:02 PM')).toEqual({ seconds: 21 * 3600 + 14 * 60 + 2, meridiem: true });
    expect(parseTime('12:05:00 am')).toEqual({ seconds: 300, meridiem: true });
    expect(parseTime('21:14:02')).toEqual({ seconds: 76442, meridiem: false });
    expect(parseTime('03:21')).toEqual({ seconds: 201, meridiem: false });
    expect(parseTime('soon')).toBeNull();
  });
});

describe('parsePlaylist', () => {
  it('splits artist and title and spots clock times', () => {
    const p = parsePlaylist(page([['9:14:02 PM', 'Floating Points - LesAlpx'], ['9:18:40 PM', 'Untitled &amp; Unknown']]), 'u');
    expect(p?.clock).toBe(true);
    expect(p?.tracks[0]).toMatchObject({ artist: 'Floating Points', title: 'LesAlpx', seconds: 76442 });
    expect(p?.tracks[1]).toMatchObject({ artist: '', title: 'Untitled & Unknown' });
  });
  it('treats lists starting near zero as offsets', () => {
    expect(parsePlaylist(page([['00:00:00', 'A - B'], ['00:04:10', 'C - D']]), 'u')?.clock).toBe(false);
  });
  it('returns null for pages without tracks', () => {
    expect(parsePlaylist('<html><body>Not found</body></html>', 'u')).toBeNull();
    expect(parsePlaylist('', 'u')).toBeNull();
  });
});

describe('tracksForShow', () => {
  const pl: Playlist = parsePlaylist(
    page([
      ['9:13:30 PM', 'A - One'],
      ['9:20:00 PM', 'B - Two'],
      ['10:56:00 PM', 'C - Three'],
      ['12:10:00 AM', 'D - Four'],
    ]),
    'u',
  )!;
  const early = show('s1', '2026-06-16T21:12:58Z');
  const late = show('s2', '2026-06-16T22:55:01Z');

  it('splits a two-show night by start time, including after midnight', () => {
    expect(tracksForShow(early, [late, early], pl).map((t) => [t.title, t.offset])).toEqual([['One', 32], ['Two', 422]]);
    expect(tracksForShow(late, [early, late], pl).map((t) => [t.title, t.offset])).toEqual([['Three', 59], ['Four', 4499]]);
  });

  it('gives offset lists to the first show only', () => {
    const off = parsePlaylist(page([['00:00:00', 'A - B'], ['00:04:10', 'C - D']]), 'u')!;
    expect(tracksForShow(early, [early, late], off)).toHaveLength(2);
    expect(tracksForShow(late, [early, late], off)).toHaveLength(0);
  });

  it('lists everything without times for undated shows', () => {
    expect(tracksForShow(show('x', '2022-01-01T00:00:00Z', false), [], pl).every((t) => t.offset === null)).toBe(true);
  });
});
