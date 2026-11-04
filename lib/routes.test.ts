import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const getUser = vi.fn();
const getShow = vi.fn();
const driveFetch = vi.fn();
const recordPlay = vi.fn().mockResolvedValue(true);
const deleteGuest = vi.fn();

vi.mock('@/lib/auth', () => ({ getUser, requireUser: getUser, MOCK_SESSION_VALUE: 'x' }));
vi.mock('@/lib/drive', () => ({ getShow, driveFetch }));
vi.mock('@/lib/plays', () => ({ recordPlay, isAdmin: (e: string) => e === 'admin@ideo.com' }));
vi.mock('@/lib/access', () => ({ deleteGuest }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const show = { id: 'abc', title: 'T', series: 'S', mimeType: 'audio/mp4' };

beforeEach(() => {
  vi.clearAllMocks();
  recordPlay.mockResolvedValue(true);
  getUser.mockResolvedValue({ email: 'guest@example.com', name: 'G' });
  getShow.mockImplementation(async (id: string) => (id === 'abc' ? show : null));
  driveFetch.mockResolvedValue(new Response('audio', { status: 206, headers: { 'Content-Range': 'bytes 0-4/5', 'Content-Length': '5' } }));
});

describe('GET /api/stream/[id]', () => {
  const call = async (id: string, headers: HeadersInit = {}) => {
    const { GET } = await import('../app/api/stream/[id]/route');
    return GET(new Request('http://x/api/stream/' + id, { headers }), { params: Promise.resolve({ id }) });
  };

  it('refuses a request with no valid session before touching Drive', async () => {
    getUser.mockResolvedValue(null);
    expect((await call('abc')).status).toBe(401);
    expect(getShow).not.toHaveBeenCalled();
    expect(driveFetch).not.toHaveBeenCalled();
  });

  it.each(['not-in-catalogue', '../../etc/passwd', 'abc/../../x', 'abc?alt=json', '%2e%2e', 'a'.repeat(5000), ''])(
    'never asks Drive for an id outside the catalogue: %s',
    async (id) => {
      expect((await call(id)).status).toBe(404);
      expect(driveFetch).not.toHaveBeenCalled();
    },
  );

  it('streams a catalogue show and passes the range through', async () => {
    const res = await call('abc', { range: 'bytes=0-4' });
    expect(res.status).toBe(206);
    expect(driveFetch.mock.calls[0][0]).toBe('files/abc?alt=media&supportsAllDrives=true');
    expect(driveFetch.mock.calls[0][1].headers).toEqual({ Range: 'bytes=0-4' });
  });

  it('allows four open streams per listener, refuses the fifth, and frees a slot when one closes', async () => {
    getUser.mockResolvedValue({ email: 'scraper@example.com', name: 'S' });
    driveFetch.mockImplementation(async () => new Response(new Uint8Array(1024), { status: 200 }));
    const open: Response[] = [];
    for (let i = 0; i < 4; i++) open.push(await call('abc'));
    expect(open.map((r) => r.status)).toEqual([200, 200, 200, 200]);

    const refused = await call('abc');
    expect(refused.status).toBe(429);
    expect(refused.headers.get('Retry-After')).toBe('5');
    expect(driveFetch).toHaveBeenCalledTimes(4);

    await open[0].body!.cancel();
    expect((await call('abc')).status).toBe(200);
  });

  it('frees the slot when a stream is read to the end, and when Drive errors', async () => {
    getUser.mockResolvedValue({ email: 'slow@example.com', name: 'S' });
    for (let i = 0; i < 6; i++) {
      driveFetch.mockResolvedValueOnce(new Response('abc', { status: 200 }));
      await (await call('abc')).text();
    }
    for (let i = 0; i < 6; i++) {
      driveFetch.mockResolvedValueOnce(new Response('nope', { status: 403 }));
      expect((await call('abc')).status).toBe(502);
    }
    driveFetch.mockRejectedValueOnce(new Error('network'));
    await expect(call('abc')).rejects.toThrow('network');
    driveFetch.mockResolvedValueOnce(new Response('abc', { status: 200 }));
    expect((await call('abc')).status).toBe(200);
  });

  it('hides Drive error detail from the listener', async () => {
    driveFetch.mockResolvedValue(new Response('secret service account detail', { status: 403 }));
    const res = await call('abc');
    expect(res.status).toBe(502);
    expect(await res.text()).toBe('Upstream error');
  });
});

describe('POST /api/plays', () => {
  const call = async (body: unknown) => {
    const { POST } = await import('../app/api/plays/route');
    return POST(new Request('http://x/api/plays', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }));
  };

  it('needs a session', async () => {
    getUser.mockResolvedValue(null);
    expect((await call({ showId: 'abc' })).status).toBe(401);
    expect(recordPlay).not.toHaveBeenCalled();
  });

  it.each([{}, { showId: 1 }, { showId: ['abc'] }, { showId: 'nope' }, '{not json'])('rejects bad input %j', async (body) => {
    expect((await call(body)).status).toBe(404);
    expect(recordPlay).not.toHaveBeenCalled();
  });

  it('stops a script after 20 requests an hour, with Retry-After, and writes nothing more', async () => {
    getUser.mockResolvedValue({ email: 'flood@example.com', name: 'F' });
    const statuses: number[] = [];
    let last: Response | undefined;
    for (let i = 0; i < 25; i++) {
      last = await call({ showId: 'abc' });
      statuses.push(last.status);
    }
    expect(statuses.filter((s) => s === 200).length).toBe(20);
    expect(statuses.slice(20)).toEqual([429, 429, 429, 429, 429]);
    expect(Number(last!.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(recordPlay).toHaveBeenCalledTimes(20);
  });

  it('records title, series and email from the server, ignoring anything the client sends', async () => {
    await call({ showId: 'abc', title: 'forged', series: 'forged', email: 'admin@ideo.com' });
    expect(recordPlay).toHaveBeenCalledWith({ showId: 'abc', title: 'T', series: 'S', email: 'guest@example.com' });
  });
});

describe('deleteGuestAction', () => {
  const call = async (uid: string) => {
    const { deleteGuestAction } = await import('../app/(site)/guests/actions');
    const fd = new FormData();
    fd.set('uid', uid);
    return deleteGuestAction(fd);
  };

  it('is forbidden for non-admins', async () => {
    await expect(call('u1')).rejects.toThrow('Forbidden');
    expect(deleteGuest).not.toHaveBeenCalled();
  });

  it('deletes for an admin', async () => {
    getUser.mockResolvedValue({ email: 'admin@ideo.com', name: 'A' });
    await call('u1');
    expect(deleteGuest).toHaveBeenCalledWith('u1');
  });
});
