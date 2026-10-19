'use client';

import { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { clientAuth } from '@/lib/firebaseClient';
import { createSession, MESSAGES } from './createSession';

const EMAIL_KEY = 'radio-ideo:email-for-sign-in';

function readEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

/** For guests without a Google account: Firebase emails a one-time link that signs them in. */
export function EmailLinkForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arriving from the emailed link: finish signing in.
  useEffect(() => {
    const auth = clientAuth();
    if (!isSignInWithEmailLink(auth, window.location.href)) return;
    setBusy(true);
    (async () => {
      try {
        // The link opened on a different device from the one that asked for it, so ask again.
        const address = readEmail() ?? window.prompt('Confirm your email address to finish signing in');
        if (!address) throw new Error('default');
        const cred = await signInWithEmailLink(auth, address.trim(), window.location.href);
        try {
          await createSession({ idToken: await cred.user.getIdToken() });
        } finally {
          await signOut(auth);
        }
        try {
          localStorage.removeItem(EMAIL_KEY);
        } catch {}
        window.location.href = '/';
      } catch (e) {
        const code = e instanceof Error ? e.message : 'default';
        setError(MESSAGES[code] ?? MESSAGES.default);
        setBusy(false);
        window.history.replaceState(null, '', '/login');
      }
    })();
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendSignInLinkToEmail(clientAuth(), email.trim(), { url: `${window.location.origin}/login`, handleCodeInApp: true });
      try {
        localStorage.setItem(EMAIL_KEY, email.trim());
      } catch {}
      setSent(true);
    } catch {
      setError(MESSAGES.default);
    }
    setBusy(false);
  }

  if (sent) return <p className="login__note">Check {email} for a sign-in link. It works once and you can close this tab.</p>;

  return (
    <form className="email-form" onSubmit={send}>
      <label htmlFor="login-email">No Google account? Get a link by email.</label>
      <div className="email-form__row">
        <input id="login-email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send link'}
        </button>
      </div>
      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
