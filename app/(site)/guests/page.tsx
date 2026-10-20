import { notFound } from 'next/navigation';
import { listGuests } from '@/lib/access';
import { requireUser } from '@/lib/auth';
import { isAdmin } from '@/lib/plays';
import { deleteGuestAction } from './actions';

export const dynamic = 'force-dynamic';

const when = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function GuestsPage() {
  const user = await requireUser();
  if (!isAdmin(user.email)) notFound();

  let guests: Awaited<ReturnType<typeof listGuests>> = [];
  let failed = false;
  try {
    guests = await listGuests();
  } catch (e) {
    console.error('listGuests failed', e);
    failed = true;
  }

  return (
    <>
      <h1 className="section-title">Guests</h1>
      <p>IDEO addresses get in with Google. Anyone else can sign up themselves from the sign-in page. Delete an account here and it stops working straight away.</p>
      {failed ? (
        <p>Couldn’t read the guest list from Firebase Authentication. Check that the app’s service account can view users.</p>
      ) : guests.length === 0 ? (
        <p>No guests have signed up yet.</p>
      ) : (
        <table className="stats">
          <thead>
            <tr>
              <th>Email</th>
              <th>Signed up</th>
              <th>Last sign-in</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.uid}>
                <td>{g.email}</td>
                <td>{g.createdAt ? when.format(g.createdAt) : ''}</td>
                <td>{g.lastSignInAt ? when.format(g.lastSignInAt) : ''}</td>
                <td>
                  <form action={deleteGuestAction}>
                    <input type="hidden" name="uid" value={g.uid} />
                    <button type="submit" className="link-btn">
                      Delete
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
