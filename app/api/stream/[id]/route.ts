import { getUser } from '@/lib/auth';
import { MOCK_DRIVE } from '@/lib/config';
import { driveFetch, getShow } from '@/lib/drive';
import { mockAudio } from '@/lib/fixtures';
import { parseRange } from '@/lib/range';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Safari will not play "audio/x-m4a"; "audio/mp4" is the same container.
function playableType(mime: string) {
  return mime === 'audio/x-m4a' || mime === 'audio/m4a' ? 'audio/mp4' : mime;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getUser())) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  // Only files in the published catalogue can be streamed, whatever else the service account can see.
  const show = await getShow(id);
  if (!show) return new Response('Not found', { status: 404 });

  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
    'Content-Type': playableType(show.mimeType),
  });

  if (MOCK_DRIVE) {
    const audio = mockAudio(id);
    headers.set('Content-Type', 'audio/wav');
    const range = parseRange(req.headers.get('range'), audio.length);
    if (!range) {
      headers.set('Content-Length', String(audio.length));
      return new Response(new Uint8Array(audio), { status: 200, headers });
    }
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${audio.length}`);
    headers.set('Content-Length', String(range.end - range.start + 1));
    return new Response(new Uint8Array(audio.subarray(range.start, range.end + 1)), { status: 206, headers });
  }

  const range = req.headers.get('range');
  const upstream = await driveFetch(`files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`, {
    headers: range ? { Range: range } : {},
    signal: req.signal,
  });

  if (upstream.status === 416) return new Response(null, { status: 416, headers });
  if (!upstream.ok || !upstream.body) return new Response('Upstream error', { status: 502 });

  for (const h of ['Content-Length', 'Content-Range']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  // Streamed straight through, so large files never sit in memory.
  return new Response(upstream.body, { status: upstream.status, headers });
}
