import { NextResponse } from 'next/server';
import { MOCK_AUTH, SESSION_COOKIE, SESSION_MAX_AGE_MS } from '@/lib/config';
import { isAllowedEmail } from '@/lib/email';
import { adminAuth } from '@/lib/firebaseAdmin';
import { MOCK_SESSION_VALUE } from '@/lib/auth';

export const runtime = 'nodejs';

function withCookie(res: NextResponse, value: string, maxAgeMs: number) {
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(maxAgeMs / 1000),
  });
  return res;
}

/** Exchange a fresh Firebase ID token for an httpOnly session cookie. */
export async function POST(req: Request) {
  if (req.headers.get('content-type') !== 'application/json') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as { idToken?: string; mock?: boolean };

  if (MOCK_AUTH && body.mock) {
    return withCookie(NextResponse.json({ ok: true }), MOCK_SESSION_VALUE, SESSION_MAX_AGE_MS);
  }
  if (!body.idToken) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  try {
    const decoded = await adminAuth().verifyIdToken(body.idToken, true);
    if (!isAllowedEmail(decoded.email, decoded.email_verified)) {
      return NextResponse.json({ error: 'domain' }, { status: 403 });
    }
    // Only accept tokens from a sign-in that just happened.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: 'stale' }, { status: 401 });
    }
    const cookie = await adminAuth().createSessionCookie(body.idToken, { expiresIn: SESSION_MAX_AGE_MS });
    return withCookie(NextResponse.json({ ok: true }), cookie, SESSION_MAX_AGE_MS);
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }
}

export async function DELETE() {
  return withCookie(NextResponse.json({ ok: true }), '', 0);
}
