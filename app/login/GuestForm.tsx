'use client';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useState } from 'react';
import { clientAuth } from '@/lib/firebaseClient';
import { createSession, MESSAGES } from './createSession';

const AUTH_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'That email already has an account. Try signing in instead.',
  'auth/weak-password': 'Choose a password of at least 6 characters.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-email': 'That doesn’t look like an email address.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
};

/** For guests without a Google account: sign up or sign in with an email and password. */
export function GuestForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth = clientAuth();
      const cred =
        mode === 'signup'
          ? await createUserWithEmailAndPassword(auth, email.trim(), password)
          : await signInWithEmailAndPassword(auth, email.trim(), password);
      try {
        await createSession({ idToken: await cred.user.getIdToken() });
      } finally {
        await signOut(auth);
      }
      window.location.href = '/';
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err instanceof Error ? err.message : '');
      setError(AUTH_ERRORS[code] ?? MESSAGES[code] ?? MESSAGES.default);
      setBusy(false);
    }
  }

  const signingUp = mode === 'signup';
  return (
    <form className="email-form" onSubmit={submit}>
      <label htmlFor="login-email">{signingUp ? 'No Google account? Create one here.' : 'Sign in with your email and password.'}</label>
      <div className="email-form__row">
        <input id="login-email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={signingUp ? 'new-password' : 'current-password'}
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : signingUp ? 'Create account' : 'Sign in'}
        </button>
      </div>
      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="link-btn" onClick={() => { setMode(signingUp ? 'signin' : 'signup'); setError(null); }}>
        {signingUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </form>
  );
}
