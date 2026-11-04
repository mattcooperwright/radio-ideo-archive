import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const getUser = vi.fn();
const getShow = vi.fn();
const driveFetch = vi.fn();
const recordPlay = vi.fn();
const deleteGuest = vi.fn();

vi.mock('@/lib/auth', () => ({ getUser, requireUser: getUser, MOCK_SESSION_VALUE: 'x' }));
vi.mock('@/lib/drive', () => ({ getShow, driveFetch }));
vi.mock('@/lib/plays', () => ({ recordPlay, isAdmin: (e: string) => e === 'admin@ideo.com' }));
vi.mock('@/lib/access', () => ({ deleteGuest }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const show = { id: 'abc', title: 'T', series: 'S', mimeType: 'audio/mp4' };

beforeEach(() => {
  vi.clearAllMocks();
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
