import 'server-only';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { MOCK_AUTH } from './config';
import { isAllowedEmail, normaliseEmail } from './email';
import { adminAuth } from './firebaseAdmin';

export type Invite = { email: string; addedBy: string; addedAt: Date | null };

const COLLECTION = 'invites';
/** How long "is this address invited?" is remembered per server instance. Bounds how late a removal lands. */
const CACHE_MS = 60_000;

// Local development has no Firestore. It hangs off globalThis because Next's dev server bundles routes and pages separately.
const mockInvites: Map<string, Invite> = ((globalThis as { __mockInvites?: Map<string, Invite> }).__mockInvites ??= new Map());
const cache = new Map<string, { invited: boolean; at: number }>();

function invites() {
  adminAuth(); // makes sure the default Firebase app exists
  return getFirestore().collection(COLLECTION);
}

export async function isInvited(email: string): Promise<boolean> {
  const key = normaliseEmail(email);
  if (MOCK_AUTH) return mockInvites.has(key);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.invited;
  const invited = (await invites().doc(key).get()).exists;
  cache.set(key, { invited, at: Date.now() });
  return invited;
}

/**
 * Who may have a session: anyone verified on the IDEO domain, plus verified addresses on the invite list.
 * If the invite list can't be read, guests are turned away and IDEO people are unaffected.
 */
export async function canAccess(email: string | undefined | null, emailVerified: boolean | undefined): Promise<boolean> {
  if (isAllowedEmail(email, emailVerified)) return true;
  if (!email || emailVerified !== true) return false;
  try {
    return await isInvited(email);
  } catch (e) {
    console.error('invite lookup failed', e);
    return false;
  }
}

export async function listInvites(): Promise<Invite[]> {
  if (MOCK_AUTH) return [...mockInvites.values()].sort((a, b) => a.email.localeCompare(b.email));
  const snap = await invites().get();
  return snap.docs
    .map((d) => {
      const data = d.data();
      return { email: d.id, addedBy: data.addedBy ?? '', addedAt: data.addedAt ? (data.addedAt as Timestamp).toDate() : null };
    })
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function addInvite(email: string, addedBy: string): Promise<void> {
  const key = normaliseEmail(email);
  cache.delete(key);
  if (MOCK_AUTH) {
    mockInvites.set(key, { email: key, addedBy, addedAt: new Date() });
    return;
  }
  await invites().doc(key).set({ addedBy, addedAt: FieldValue.serverTimestamp() });
}

/** Removes the invite and signs the person out everywhere, so access ends now rather than when their cookie expires. */
export async function removeInvite(email: string): Promise<void> {
  const key = normaliseEmail(email);
  cache.delete(key);
  if (MOCK_AUTH) {
    mockInvites.delete(key);
    return;
  }
  await invites().doc(key).delete();
  try {
    const user = await adminAuth().getUserByEmail(key);
    await adminAuth().revokeRefreshTokens(user.uid);
  } catch (e) {
    // Never signed in, so there is nothing to revoke.
    if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
  }
}
