import { parse } from 'node-html-parser';
import type { Show } from './types';

export type RawTrack = {
  /** Elapsed time as Serato prints it, e.g. "00:57:15". */
  time: string;
  /** Seconds since the Serato session started. */
  elapsed: number | null;
  artist: string;
  title: string;
};
export type Playlist = {
  url: string;
  tracks: RawTrack[];
  /** When the Serato session started, in seconds after midnight local time, or null if the page doesn't say. */
  start: number | null;
};
export type Track = { artist: string; title: string; time: string; offset: number | null };

const SERATO_HOST = 'https://serato.com/';
const DAY = 86400;

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

/** Elapsed times ("00:57:15", "03:21") to seconds. */
export function parseElapsed(raw: string): number | null {
  const m = raw.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** Clock times as Serato prints them ("9:03pm", "10:00 PM", "21:03") to seconds after midnight. */
export function parseClock(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const mer = m[4]?.toLowerCase();
  if (mer) {
    if (h < 1 || h > 12) return null;
    if (h === 12) h = 0;
    if (mer === 'p') h += 12;
  } else if (h > 23) {
    return null;
  }
  return h * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0);
}

function splitName(name: string): { artist: string; title: string } {
  const i = name.indexOf(' - ');
  return i > 0 ? { artist: name.slice(0, i).trim(), title: name.slice(i + 3).trim() } : { artist: '', title: name };
}

/**
 * Serato stamps some rows with the clock time to the minute ("9:03pm" on the first track, "10:00pm" on the
 * first track after each hour). Each stamp says the session began within a one-minute window; the start is
 * the middle of where those windows overlap.
 */
export function sessionStart(anchors: { clock: number; elapsed: number }[]): number | null {
  if (!anchors.length) return null;
  const norm = (s: number) => ((s % DAY) + DAY) % DAY;
  const first = norm(anchors[0].clock - anchors[0].elapsed);
  // Unwrap around the first estimate so a session spanning midnight still intersects cleanly.
  let lo = -Infinity;
  let hi = Infinity;
  for (const a of anchors) {
    let s = norm(a.clock - a.elapsed);
    if (s - first > DAY / 2) s -= DAY;
    if (first - s > DAY / 2) s += DAY;
    lo = Math.max(lo, s);
    hi = Math.min(hi, s + 60);
  }
  return norm(lo < hi ? Math.round((lo + hi) / 2) : first);
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
  const anchors: { clock: number; elapsed: number }[] = [];
  for (const row of root.querySelectorAll('.playlist-track')) {
    const name = row.querySelector('.playlist-trackname')?.text.replace(/\s+/g, ' ').trim() ?? '';
    if (!name) continue;
    const time = row.querySelector('.playlist-tracktime')?.text.trim() ?? '';
    const elapsed = parseElapsed(time);
    const stamp = row.querySelector('.playlist-timestamp')?.text.trim();
    const clock = stamp ? parseClock(stamp) : null;
    if (clock != null && elapsed != null) anchors.push({ clock, elapsed });
    tracks.push({ time, elapsed, ...splitName(name) });
  }
  if (!tracks.length) return null;
  return { url, tracks, start: sessionStart(anchors) };
}

const secondsOfDay = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
};

const plain = (t: RawTrack, offset: number | null): Track => ({ artist: t.artist, title: t.title, time: t.time, offset });

/**
 * Picks this show's tracks from the night's playlist and works out where each starts in the recording.
 * `night` is every dated show sharing this playlist; when there are two, each track goes to the show
 * that had most recently started. A show's start time comes from its filename.
 */
export function tracksForShow(show: Show, night: Show[], playlist: Playlist): Track[] {
  const all = playlist.tracks;
  const shows = [...night].sort((a, b) => a.date.localeCompare(b.date));

  if (playlist.start == null) {
    // No clock on the page: the first show of the night gets the list, timed from the session start.
    if (show.dated && shows.length && shows[0].id !== show.id) return [];
    return all.map((t) => plain(t, t.elapsed));
  }

  // Linked by hand and no start time of its own: assume recording began with the session.
  if (!show.dated) return all.map((t) => plain(t, t.elapsed));

  const starts = shows.map((s) => secondsOfDay(s.date));
  const mine = shows.findIndex((s) => s.id === show.id);
  if (mine < 0) return [];
  const session = playlist.start;
  // Put show starts on the session's timeline, so a show starting after midnight sorts after it.
  const onTimeline = starts.map((s) => (s < session - 6 * 3600 ? s + DAY : s));

  const out: Track[] = [];
  for (const t of all) {
    if (t.elapsed == null) continue;
    const at = session + t.elapsed;
    let owner = 0;
    onTimeline.forEach((s, i) => {
      if (s <= at + 120) owner = i;
    });
    if (owner === mine) out.push(plain(t, Math.max(0, at - onTimeline[mine])));
  }
  return out;
}
