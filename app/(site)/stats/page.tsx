import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { isAdmin, recentPlays, summarise } from '@/lib/plays';

export const dynamic = 'force-dynamic';

const when = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function StatsPage() {
  const user = await requireUser();
  if (!isAdmin(user.email)) notFound();

  let events: Awaited<ReturnType<typeof recentPlays>> = [];
  let failed = false;
  try {
    events = await recentPlays();
  } catch (e) {
    console.error('recentPlays failed', e);
    failed = true;
  }
  const rows = summarise(events);
  const listeners = new Set(events.map((e) => e.email.toLowerCase())).size;

  return (
    <>
      <h1 className="section-title">Listening stats</h1>
      {failed ? (
        <p>Couldn’t read plays from Firestore. Check that the database exists and the app’s service account can use it.</p>
      ) : events.length === 0 ? (
        <p>No plays recorded yet. A show counts as played after 30 seconds of listening.</p>
      ) : (
        <>
          <p>
            {events.length} plays by {listeners} {listeners === 1 ? 'listener' : 'listeners'} across {rows.length} {rows.length === 1 ? 'show' : 'shows'}.
          </p>
          <table className="stats">
            <thead>
              <tr>
                <th>Show</th>
                <th>Series</th>
                <th>Plays</th>
                <th>Listeners</th>
                <th>Last played</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.showId}>
                  <td>
                    <Link href={`/shows/${r.showId}`}>{r.title}</Link>
                  </td>
                  <td>{r.series}</td>
                  <td>{r.plays}</td>
                  <td>{r.listeners}</td>
                  <td>{when.format(r.lastPlayed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
