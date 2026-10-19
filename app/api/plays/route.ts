import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getShow } from '@/lib/drive';
import { recordPlay } from '@/lib/plays';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The player calls this once a show has had PLAY_THRESHOLD_SECONDS of listening. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { showId } = (await req.json().catch(() => ({}))) as { showId?: string };
  const show = typeof showId === 'string' ? await getShow(showId) : null;
  if (!show) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  try {
    await recordPlay({ showId: show.id, title: show.title, series: show.series, email: user.email });
  } catch (e) {
    // Stats are a nice-to-have: never let a Firestore problem surface to the listener.
    console.error('recordPlay failed', e);
    return NextResponse.json({ ok: false }, { status: 202 });
  }
  return NextResponse.json({ ok: true });
}
