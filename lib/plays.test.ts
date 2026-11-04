import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('./firebaseAdmin', () => ({ adminAuth: () => ({}) }));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: {}, getFirestore: () => ({}), Timestamp: class {} }));

import { isAdmin, PLAY_DEDUPE_MS, playDocId, summarise, type PlayEvent } from './plays';

const play = (showId: string, email: string, at: string): PlayEvent => ({
  showId,
  title: showId.toUpperCase(),
  series: 'ShuffleMode',
  email,
  at: new Date(at),
});

describe('summarise', () => {
  it('counts plays and distinct listeners per show, most played first', () => {
    const rows = summarise([
      play('a', 'x@ideo.com', '2026-10-01T10:00:00Z'),
      play('b', 'x@ideo.com', '2026-10-02T10:00:00Z'),
      play('b', 'X@ideo.com', '2026-10-03T10:00:00Z'),
      play('b', 'y@ideo.com', '2026-10-04T10:00:00Z'),
    ]);
    expect(rows.map((r) => [r.showId, r.plays, r.listeners])).toEqual([
      ['b', 3, 2],
      ['a', 1, 1],
    ]);
    expect(rows[0].lastPlayed.toISOString()).toBe('2026-10-04T10:00:00.000Z');
  });
  it('is empty with no plays', () => {
    expect(summarise([])).toEqual([]);
  });
});

describe('isAdmin', () => {
  it('matches the configured email ignoring case', () => {
    expect(isAdmin('MCooper@ideo.com')).toBe(true);
    expect(isAdmin('someone@ideo.com')).toBe(false);
  });
});

describe('playDocId', () => {
  const t = Date.UTC(2026, 9, 1, 10, 0, 0);
  it('is the same for repeats inside the window, whatever the email case', () => {
    expect(playDocId('X@ideo.com', 'a', t)).toBe(playDocId('x@ideo.com', 'a', t + 60_000));
  });
  it('differs by listener, show and window', () => {
    const base = playDocId('x@ideo.com', 'a', t);
    expect(playDocId('y@ideo.com', 'a', t)).not.toBe(base);
    expect(playDocId('x@ideo.com', 'b', t)).not.toBe(base);
    expect(playDocId('x@ideo.com', 'a', t + PLAY_DEDUPE_MS)).not.toBe(base);
  });
});
