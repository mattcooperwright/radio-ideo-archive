import 'server-only';
import { ADMIN_EMAILS, ALLOWED_DOMAIN, MOCK_AUTH } from './config';
import { adminAuth } from './firebaseAdmin';

export type Guest = { uid: string; email: string; createdAt: Date | null; lastSignInAt: Date | null };

function isIdeoAddress(email: string): boolean {
  return email.slice(email.lastIndexOf('@') + 1).toLowerCase() === ALLOWED_DOMAIN;
}

/**
 * Who may have a session: anyone with an account. Guests sign up themselves, and an admin deletes the ones
 * who shouldn't be here. IDEO and admin addresses must be verified, so nobody can sign up as one of them
 * with a password and inherit their access.
 */
export function canAccess(email: string | undefined | null, emailVerified: boolean | undefined): boolean {
  if (!email) return false;
  if (emailVerified === true) return true;
  return !isIdeoAddress(email) && !ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Everyone with an account who isn't on the IDEO domain, newest first. */
export async function listGuests(): Promise<Guest[]> {
  if (MOCK_AUTH) return [];
  const guests: Guest[] = [];
  let pageToken: string | undefined;
  do {
    const page = await adminAuth().listUsers(1000, pageToken);
    for (const u of page.users) {
      if (!u.email || isIdeoAddress(u.email)) continue;
      guests.push({
        uid: u.uid,
        email: u.email,
        createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime) : null,
        lastSignInAt: u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime) : null,
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return guests.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

/** Deletes the account. Session checks look the user up, so their cookie stops working straight away. */
export async function deleteGuest(uid: string): Promise<void> {
  if (MOCK_AUTH) return;
  const user = await adminAuth().getUser(uid);
  if (!user.email || isIdeoAddress(user.email) || ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    throw new Error('Not a guest account');
  }
  await adminAuth().deleteUser(uid);
}
