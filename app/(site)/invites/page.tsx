import { notFound } from 'next/navigation';
import { listInvites } from '@/lib/access';
import { requireUser } from '@/lib/auth';
import { isAdmin } from '@/lib/plays';
import { addInviteAction, removeInviteAction } from './actions';

export const dynamic = 'force-dynamic';

const when = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function InvitesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  if (!isAdmin(user.email)) notFound();
  const { error } = await searchParams;

  let invites: Awaited<ReturnType<typeof listInvites>> = [];
  let failed = false;
  try {
    invites = await listInvites();
  } catch (e) {
    console.error('listInvites failed', e);
    failed = true;
  }

  return (
    <>
      <h1 className="section-title">Guest invites</h1>
      <p>IDEO addresses get in automatically. Anyone else needs to be on this list, then they can sign in with Google or an emailed link.</p>
      <form className="invite-form" action={addInviteAction}>
        <input type="email" name="email" required placeholder="guest@example.com" aria-label="Guest email address" />
        <button type="submit">Invite</button>
      </form>
      {error === 'invalid' && <p role="alert">That doesn’t look like an email address.</p>}
      {failed ? (
        <p>Couldn’t read the invite list from Firestore. Check that the database exists and the app’s service account can use it.</p>
      ) : invites.length === 0 ? (
        <p>No guests invited yet.</p>
      ) : (
        <table className="stats">
          <thead>
            <tr>
              <th>Email</th>
              <th>Invited by</th>
              <th>Added</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => (
              <tr key={i.email}>
                <td>{i.email}</td>
                <td>{i.addedBy}</td>
                <td>{i.addedAt ? when.format(i.addedAt) : ''}</td>
                <td>
                  <form action={removeInviteAction}>
                    <input type="hidden" name="email" value={i.email} />
                    <button type="submit" className="link-btn">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
