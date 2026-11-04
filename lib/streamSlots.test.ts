import { describe, expect, it } from 'vitest';
import { createStreamSlots, releaseWhenDone } from './streamSlots';

describe('createStreamSlots', () => {
  it('refuses once a listener holds the maximum, and frees a slot on release', () => {
    const s = createStreamSlots(2, 1000, () => 0);
    const a = s.acquire('x')!;
    expect(s.acquire('x')).not.toBeNull();
    expect(s.acquire('x')).toBeNull();
    a();
    expect(s.acquire('x')).not.toBeNull();
  });
  it('keeps listeners separate', () => {
    const s = createStreamSlots(1, 1000, () => 0);
    expect(s.acquire('x')).not.toBeNull();
    expect(s.acquire('y')).not.toBeNull();
    expect(s.acquire('x')).toBeNull();
  });
  it('treats a double release as one', () => {
    const s = createStreamSlots(2, 1000, () => 0);
    const a = s.acquire('x')!;
    s.acquire('x');
    a();
    a();
    expect(s.acquire('x')).not.toBeNull();
    expect(s.acquire('x')).toBeNull();
  });
  it('expires a slot that was never released', () => {
    let t = 0;
    const s = createStreamSlots(1, 1000, () => t);
    s.acquire('x');
    expect(s.acquire('x')).toBeNull();
    t = 1000;
    expect(s.acquire('x')).not.toBeNull();
  });
});

describe('releaseWhenDone', () => {
  it('releases once when the stream ends', async () => {
    let n = 0;
    const out = releaseWhenDone(new Response('hello').body!, () => n++);
    expect(await new Response(out).text()).toBe('hello');
    expect(n).toBe(1);
  });
  it('releases when the consumer cancels', async () => {
    let n = 0;
    const out = releaseWhenDone(new Response('hello').body!, () => n++);
    await out.cancel();
    expect(n).toBe(1);
  });
  it('releases when the source errors', async () => {
    let n = 0;
    const bad = new ReadableStream<Uint8Array>({ pull: (c) => c.error(new Error('boom')) });
    await expect(new Response(releaseWhenDone(bad, () => n++)).text()).rejects.toThrow('boom');
    expect(n).toBe(1);
  });
});
