import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('./firebaseAdmin', () => ({ adminAuth: () => ({}) }));

const docs = new Map<string, boolean>();
let reads = 0;
let failing = false;
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'now' },
  Timestamp: class {},
  getFirestore: () => ({
    collection: () => ({
      doc: (id: string) => ({
        get: async () => {
          reads += 1;
          if (failing) throw new Error('firestore down');
          return { exists: docs.has(id) };
        },
        set: async () => docs.set(id, true),
        delete: async () => docs.delete(id),
      }),
    }),
  }),
}));

import { addInvite, canAccess } from './access';

beforeEach(() => {
  docs.clear();
  reads = 0;
  failing = false;
});

describe('canAccess', () => {
  it('lets verified IDEO addresses in without reading the invite list', async () => {
    expect(await canAccess('a@ideo.com', true)).toBe(true);
    expect(reads).toBe(0);
  });
  it('lets verified invited guests in, whatever the case', async () => {
    docs.set('guest@example.com', true);
    expect(await canAccess('Guest@Example.com', true)).toBe(true);
  });
  it('turns away guests who are not invited', async () => {
    expect(await canAccess('stranger@example.com', true)).toBe(false);
  });
  it('turns away unverified addresses even when invited', async () => {
    docs.set('guest2@example.com', true);
    expect(await canAccess('guest2@example.com', false)).toBe(false);
    expect(await canAccess(undefined, true)).toBe(false);
  });
  it('fails closed for guests but not for IDEO when the list cannot be read', async () => {
    failing = true;
    expect(await canAccess('guest3@example.com', true)).toBe(false);
    expect(await canAccess('a@ideo.com', true)).toBe(true);
  });
  it('sees a new invite straight away on this instance despite the cache', async () => {
    expect(await canAccess('late@example.com', true)).toBe(false);
    await addInvite('late@example.com', 'mcooper@ideo.com');
    expect(await canAccess('late@example.com', true)).toBe(true);
  });
});
