export const MESSAGES: Record<string, string> = {
  not_invited: 'This address hasn’t been invited to Radio IDEO. Ask whoever shared the link to add you.',
  default: 'Sign-in didn’t work. Please try again.',
};

/** Swaps a fresh sign-in for the httpOnly session cookie. Throws an error code from MESSAGES. */
export async function createSession(body: object) {
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error ?? 'default');
  }
}
