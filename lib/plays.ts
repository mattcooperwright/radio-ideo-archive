import 'server-only';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { ADMIN_EMAILS, MOCK_AUTH } from './config';
import { adminAuth } from './firebaseAdmin';

export type PlayEvent = { showId: string; title: string; series: string; email: string; at: Date };

export type ShowStats = {
  showId: string;
  title: string;
  series: string;
  plays: number;
  listeners: number;
  lastPlayed: Date;
};

export function isAdmin(email: string): boolean {
  // The fake local sign-in is always allowed in, so the page can be developed without a real account.
  return MOCK_AUTH || ADMIN_EMAILS.includes(email.toLowerCase());
}

const COLLECTION = 'plays';
/** The stats page reads at most this many of the newest plays. Plenty for a team archive. */
const MAX_EVENTS = 5000;

// Local development has no Firestore, so plays live in memory until the server restarts.
// It hangs off globalThis because Next's dev server bundles routes and pages separately.
const mockPlays: PlayEvent[] = ((globalThis as { __mockPlays?: PlayEvent[] }).__mockPlays ??= []);

function db() {
  adminAuth(); // makes sure the default Firebase app exists
  return getFirestore();
}

export async function recordPlay(play: Omit<PlayEvent, 'at'>): Promise<void> {
  if (MOCK_AUTH) {
    mockPlays.push({ ...play, at: new Date() });
    return;
  }
  await db().collection(COLLECTION).add({ ...play, at: FieldValue.serverTimestamp() });
}

export async function recentPlays(): Promise<PlayEvent[]> {
  if (MOCK_AUTH) return [...mockPlays].reverse();
  const snap = await db().collection(COLLECTION).orderBy('at', 'desc').limit(MAX_EVENTS).get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      showId: data.showId,
      title: data.title,
      series: data.series,
      email: data.email,
      at: (data.at as Timestamp).toDate(),
    };
  });
}

/** One row per show, most played first. */
export function summarise(events: PlayEvent[]): ShowStats[] {
  const byShow = new Map<string, { stats: ShowStats; people: Set<string> }>();
  for (const e of events) {
    let entry = byShow.get(e.showId);
    if (!entry) {
      entry = { stats: { showId: e.showId, title: e.title, series: e.series, plays: 0, listeners: 0, lastPlayed: e.at }, people: new Set() };
      byShow.set(e.showId, entry);
    }
    entry.stats.plays += 1;
    entry.people.add(e.email.toLowerCase());
    if (e.at > entry.stats.lastPlayed) entry.stats.lastPlayed = e.at;
  }
  return [...byShow.values()]
    .map(({ stats, people }) => ({ ...stats, listeners: people.size }))
    .sort((a, b) => b.plays - a.plays || b.lastPlayed.getTime() - a.lastPlayed.getTime());
}
