import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseClock,
  parseElapsed,
  parsePlaylist,
  playlistUrls,
  sessionStart,
  tracksForShow,
} from './setlist';
import type { Show } from './types';

const realPage = readFileSync(path.join(import.meta.dirname, 'fixtures-data/serato-09-06-2026.html'), 'utf8');
const URL = 'https://serato.com/playlists/id:12790432/09-06-2026';
const hms = (h: number, m: number, s = 0) => h * 3600 + m * 60 + s;

const show = (id: string, date: string, dated = true): Show => ({
  id, date, dated, title: '', titleIsDate: true, series: '', seriesSlug: '', year: 2026,
  mimeType: '', size: 0, description: '', cover: '', colour: '', tone: 0, serato: null, hallOfFame: null,
});

describe('playlistUrls', () => {
  it('builds the day-first date slug', () => {
    expect(playlistUrls('id:12790432', '2026-06-09T21:00:00Z')).toEqual([
      URL,
      'https://serato.com/playlists/id:12790432/9-6-2026',
    ]);
    expect(playlistUrls('id:1', '2026-11-12T21:00:00Z')).toEqual(['https://serato.com/playlists/id:1/12-11-2026']);
  });
});

describe('time parsing', () => {
  it('reads Serato elapsed times', () => {
    expect(parseElapsed('00:57:15')).toBe(hms(0, 57, 15));
    expect(parseElapsed('01:37:00')).toBe(hms(1, 37));
    expect(parseElapsed('03:21')).toBe(201);
    expect(parseElapsed('9:03pm')).toBeNull();
  });
  it('reads Serato clock stamps', () => {
    expect(parseClock('9:03pm')).toBe(hms(21, 3));
    expect(parseClock('10:00pm')).toBe(hms(22, 0));
    expect(parseClock('12:15am')).toBe(hms(0, 15));
    expect(parseClock('12:15pm')).toBe(hms(12, 15));
    expect(parseClock('9:03 PM')).toBe(hms(21, 3));
    expect(parseClock('21:03')).toBe(hms(21, 3));
    expect(parseClock('later')).toBeNull();
  });
  it('narrows the session start from several minute stamps', () => {
    // 9:03pm at 0:00 and 10:00pm at 57:15 overlap between 21:03:00 and 21:03:45.
    expect(sessionStart([{ clock: hms(21, 3), elapsed: 0 }, { clock: hms(22, 0), elapsed: hms(0, 57, 15) }])).toBe(hms(21, 3, 23));
    expect(sessionStart([{ clock: hms(23, 58), elapsed: 0 }, { clock: hms(0, 0), elapsed: hms(0, 1, 30) }])).toBe(hms(23, 58, 45));
    expect(sessionStart([])).toBeNull();
  });
});

describe('parsePlaylist on the real 9 June 2026 page', () => {
  const p = parsePlaylist(realPage, URL)!;

  it('reads every track with artist and title split and entities decoded', () => {
    expect(p.tracks).toHaveLength(32);
    expect(p.tracks[0]).toMatchObject({ artist: 'Michael Jackson', title: 'Human Nature 7"', elapsed: 0, time: '00:00:00' });
    expect(p.tracks[6]).toMatchObject({ artist: 'Kerrier District', title: "Let's Dance And Freak" });
    expect(p.tracks[9]).toMatchObject({ artist: 'Vybz Kartel, Lukie D', title: 'Cruising (Ruckus Riddim)' });
    expect(p.tracks[31]).toMatchObject({ artist: 'The Blessed Madonna, Joy Anonymous, Danielle Ponder', elapsed: hms(1, 37) });
  });

  it('works out when the session started from the clock stamps', () => {
    expect(p.start).toBeGreaterThanOrEqual(hms(21, 3, 0));
    expect(p.start).toBeLessThanOrEqual(hms(21, 3, 45));
  });

  it('places tracks in a recording that started at 21:05:00', () => {
    const rec = show('r', '2026-06-09T21:05:00Z');
    const tracks = tracksForShow(rec, [rec], p);
    expect(tracks).toHaveLength(32);
    const at = (title: string) => tracks.find((t) => t.title === title)!.offset!;
    expect(at('Éternel été')).toBe(0); // began before recording
    expect(Math.abs(at('Tekk Pack') - hms(0, 4, 30))).toBeLessThanOrEqual(25);
    expect(Math.abs(at('Lostfound') - hms(0, 55, 37))).toBeLessThanOrEqual(25);
  });

  it('splits a two-show night at the second show’s start', () => {
    const first = show('a', '2026-06-09T21:05:00Z');
    const second = show('b', '2026-06-09T22:00:00Z');
    const a = tracksForShow(first, [second, first], p).map((t) => t.title);
    const b = tracksForShow(second, [first, second], p);
    expect(a.at(-1)).toBe('Nitten Nitti');
    expect(b[0].title).toBe('Lostfound');
    expect(b[0].offset).toBeLessThanOrEqual(60);
    expect(a.length + b.length).toBe(32);
  });

  it('times a hand-linked show with no start time from the session start', () => {
    const t = tracksForShow(show('x', '2022-01-01T00:00:00Z', false), [], p);
    expect(t[18]).toMatchObject({ title: 'Lostfound', offset: hms(0, 57, 15) });
  });
});

describe('parsePlaylist edge cases', () => {
  it('returns null for pages without tracks', () => {
    expect(parsePlaylist('<html><body>Not found</body></html>', 'u')).toBeNull();
    expect(parsePlaylist('', 'u')).toBeNull();
  });

  it('without clock stamps, gives the list to the first show of the night only', () => {
    const p = parsePlaylist(
      '<div class="playlist-track"><div class="playlist-tracktime">00:00:00</div><div class="playlist-trackname">A - B</div></div>' +
        '<div class="playlist-track"><div class="playlist-tracktime">00:04:10</div><div class="playlist-trackname">C - D</div></div>',
      'u',
    )!;
    expect(p.start).toBeNull();
    const early = show('s1', '2026-06-16T21:12:58Z');
    const late = show('s2', '2026-06-16T22:55:01Z');
    expect(tracksForShow(early, [early, late], p).map((t) => t.offset)).toEqual([0, 250]);
    expect(tracksForShow(late, [early, late], p)).toHaveLength(0);
  });
});
