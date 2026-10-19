import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MOCK_AUTH, SESSION_COOKIE } from './config';
import { canAccess } from './access';
import { adminAuth } from './firebaseAdmin';

export type User = { email: string; name: string; picture?: string };

export const MOCK_SESSION_VALUE = 'mock-dev-session';

export async function getUser(): Promise<User | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;

  if (MOCK_AUTH) {
    return value === MOCK_SESSION_VALUE ? { email: 'dev@ideo.com', name: 'Dev Listener' } : null;
  }

  try {
    // checkRevoked: true so disabling a user in the Firebase console takes effect immediately.
    const claims = await adminAuth().verifySessionCookie(value, true);
    if (!(await canAccess(claims.email, claims.email_verified))) return null;
    return { email: claims.email!, name: (claims.name as string) ?? claims.email!, picture: claims.picture };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}
