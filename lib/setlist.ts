import { parse } from 'node-html-parser';
import type { Show } from './types';

export type RawTrack = { time: string; seconds: number | null; artist: string; title: string };
export type Playlist = {
  url: string;
  tracks: RawTrack[];
  /** True when track times are clock times ("9:14:02 PM"); false when they are offsets into the set. */
  clock: boolean;
};
export type Track = { artist: string; title: string; time: string; offset: number | null };

const SERATO_HOST = 'https://serato.com/';

export function isSeratoUrl(url: string): boolean {
  return url.startsWith(SERATO_HOST);
}

/** Serato names a live playlist after its date, day first: 09-06-2026. Tries the padded form, then unpadded. */
export function playlistUrls(profile: string, iso: string): string[] {
  const [y, m, d] = iso.slice(0, 10).split('-');
  const padded = `${SERATO_HOST}playlists/${profile}/${d}-${m}-${y}`;
  const bare = `${SERATO_HOST}playlists/${profile}/${Number(d)}-${Number(m)}-${y}`;
  return padded === bare ? [padded] : [padded, bare];
}

/** "9:14:02 PM", "21:14:02", "1:03:21" or "03:21" to seconds, plus whether it carried AM/PM. */
export function parseTime(raw: string): { seconds: number; meridiem: boolean } | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i);
  if (!m) return null;
  let [a, b, c] = [Number(m[1]), Number(m[2]), m[3] == null ? null : Number(m[3])];
  const mer = m[4]?.toLowerCase().replace(/\./g, '');
  if (c == null) {
    // mm:ss
    return mer ? null : { seconds: a * 60 + b, meridiem: false };
  }
  if (mer) {
    if (a === 12) a = 0;
    if (mer === 'pm') a += 12;
  }
  return { seconds: a * 3600 + b * 60 + c, meridiem: Boolean(mer) };
}

function splitName(name: string): { artist: string; title: string } {
  const i = name.indexOf(' - ');
  return i > 0 ? { artist: name.slice(0, i).trim(), title: name.slice(i + 3).trim() } : { artist: '', title: name };
}

/**
 * Reads a serato.com playlist page. Returns null for anything that doesn't look like one,
 * so a change on Serato's side means "no set list" rather than an error.
 */
export function parsePlaylist(html: string, url: string): Playlist | null {
  let root;
  try {
    root = parse(html);
  } catch {
    return null;
  }
  const tracks: RawTrack[] = [];
  let meridiem = false;
  for (const row of root.querySelectorAll('.playlist-track')) {
    const name = row.querySelector('.playlist-trackname')?.text.replace(/\s+/g, ' ').trim() ?? '';
    if (!name) continue;
    const time = row.querySelector('.playlist-tracktime')?.text.trim() ?? '';
    const t = parseTime(time);
    if (t?.meridiem) meridiem = true;
    tracks.push({ time, seconds: t?.seconds ?? null, ...splitName(name) });
  }
  if (!tracks.length) return null;

  // Without AM/PM, a list starting near zero is offsets into the set; otherwise it's a 24-hour clock.
  const first = tracks.find((t) => t.seconds != null)?.seconds;
  const clock = meridiem || (first != null && first >= 10 * 60);
  return { url, tracks, clock };
}

const DAY = 86400;
const secondsOfDay = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
};

/**
 * Picks this show's tracks from the night's playlist. When two shows share a date, each clock-timed track
 * goes to the show that started most recently before it. `night` is every dated show sharing this playlist.
 */
export function tracksForShow(show: Show, night: Show[], playlist: Playlist): Track[] {
  const all = playlist.tracks;
  const shows = [...night].sort((a, b) => a.date.localeCompare(b.date));

  if (!show.dated) return all.map((t) => ({ artist: t.artist, title: t.title, time: t.time, offset: null }));

  if (!playlist.clock) {
    // Offsets can't be split between shows, so the first show of the night gets the list.
    if (shows[0]?.id !== show.id) return [];
    return all.map((t) => ({ artist: t.artist, title: t.title, time: t.time, offset: t.seconds }));
  }

  const starts = shows.map((s) => secondsOfDay(s.date));
  const earliest = Math.min(...starts);
  const mine = shows.findIndex((s) => s.id === show.id);
  const out: Track[] = [];
  for (const t of all) {
    if (t.seconds == null) continue;
    // Tracks after midnight belong to the same night.
    const at = t.seconds < earliest - 6 * 3600 ? t.seconds + DAY : t.seconds;
    let owner = 0;
    starts.forEach((s, i) => {
      if (s <= at + 120) owner = i;
    });
    if (owner === mine) out.push({ artist: t.artist, title: t.title, time: t.time, offset: Math.max(0, at - starts[mine]) });
  }
  return out;
}
