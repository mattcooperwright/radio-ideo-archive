import 'server-only';
import { unstable_cache } from 'next/cache';
import { MOCK_DRIVE, SERATO_PROFILE, SETLIST_TTL_SECONDS } from './config';
import { mockSeratoHtml, mockSeratoNight } from './fixtures';
import { isSeratoUrl, parsePlaylist, playlistUrls, tracksForShow, type Playlist, type Track } from './setlist';
import type { Show } from './types';

const fetchPlaylist = unstable_cache(
  async (url: string): Promise<Playlist | null> => {
    if (MOCK_DRIVE) {
      return playlistUrls(SERATO_PROFILE, mockSeratoNight).includes(url) ? parsePlaylist(mockSeratoHtml, url) : null;
    }
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioIDEOArchive/1.0)',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      return parsePlaylist(await res.text(), url);
    } catch {
      return null;
    }
  },
  ['serato-playlist-v2'],
  { revalidate: SETLIST_TTL_SECONDS },
);

const dayOf = (s: Show) => s.date.slice(0, 10);

/**
 * The set list for a show, or null when there isn't one (no public playlist, Serato unreachable,
 * or a page we can't read). `all` is the full catalogue, used to split a night with two shows.
 */
export async function getSetlist(show: Show, all: Show[]): Promise<{ url: string; tracks: Track[] } | null> {
  if (show.serato === false) return null;

  let candidates: string[];
  let night: Show[];
  if (typeof show.serato === 'string') {
    if (!isSeratoUrl(show.serato)) return null;
    candidates = [show.serato];
    night = [show];
  } else {
    if (!show.dated) return null;
    candidates = playlistUrls(SERATO_PROFILE, show.date);
    night = all.filter((s) => s.dated && s.serato === null && dayOf(s) === dayOf(show));
  }

  for (const url of candidates) {
    const playlist = await fetchPlaylist(url);
    if (!playlist) continue;
    const tracks = tracksForShow(show, night, playlist);
    return tracks.length ? { url, tracks } : null;
  }
  return null;
}
