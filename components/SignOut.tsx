'use client';

export function SignOut() {
  return (
    <button
      type="button"
      className="link-btn"
      onClick={async () => {
        await fetch('/api/session', { method: 'DELETE' });
        try {
          localStorage.removeItem('radio-ideo:last');
        } catch {}
        window.location.href = '/login';
      }}
    >
      Sign out
    </button>
  );
}
