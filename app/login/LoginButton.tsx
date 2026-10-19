'use client';

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useState } from 'react';
import { clientAuth } from '@/lib/firebaseClient';
import { createSession, MESSAGES } from './createSession';

export function LoginButton({ mock }: { mock: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      if (mock) {
        await createSession({ mock: true });
      } else {
        const auth = clientAuth();
        const provider = new GoogleAuthProvider();
        // No hosted-domain hint: guests sign in with any Google account. The server decides who gets a session.
        provider.setCustomParameters({ prompt: 'select_account' });
        const cred = await signInWithPopup(auth, provider);
        try {
          await createSession({ idToken: await cred.user.getIdToken() });
        } finally {
          // The httpOnly cookie is the session from here on.
          await signOut(auth);
        }
      }
      window.location.href = '/';
    } catch (e) {
      const code = e instanceof Error ? e.message : 'default';
      if (!code.includes('popup-closed')) setError(MESSAGES[code] ?? MESSAGES.default);
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="google-btn" onClick={signIn} disabled={busy}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z" />
          <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z" />
        </svg>
        {busy ? 'Signing in…' : mock ? 'Continue as dev@ideo.com (mock)' : 'Sign in with Google'}
      </button>
      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
