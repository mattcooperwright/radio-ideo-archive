import type { DriveFile } from './catalogue';

/** Used with DRIVE_MOCK=1. Names mirror the real Drive folder. */
export const mockFiles: DriveFile[] = [
  ['m1', 'FRIDAY SHOW - 2026-07-24 21-47-44.m4a', 'Warm-up records for the summer party, plus a couple of studio guests.'],
  ['m2', 'ShuffleMode - 2026-07-22 21-39-41.m4a', ''],
  ['m3', 'In the Zone - 2026-06-16 22-55-01.m4a', 'Long-form focus music. Put it on and get your head down.'],
  ['m4', 'ShuffleMode - 2026-06-16 21-12-58.m4a', ''],
  ['m5', 'ShuffleMode2026-04-15 21-14-03.m4a', ''],
  ['m6', 'ShuffleMode - 2025-11-05 21-02-10.m4a', ''],
  ['m7', 'In the Zone - 2025-03-12 22-01-00.m4a', ''],
  ['m8', 'Radio IDEO - Shuffle Mode - October 2022.mp3', ''],
  ['m9', 'Radio IDEO - 29 Apr 2022 - part 2.mp3', ''],
].map(([id, name, description], i) => ({
  id,
  name,
  description,
  mimeType: name.endsWith('.mp3') ? 'audio/mpeg' : 'audio/x-m4a',
  size: '0',
  createdTime: new Date(Date.UTC(2022, 0, 1 + i)).toISOString(),
}));

/** A short generated tone so the player can be exercised without Drive. */
export function mockAudio(id: string, seconds = 90): Buffer {
  const rate = 8000;
  const n = rate * seconds;
  const buf = Buffer.alloc(44 + n);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate, 28);
  buf.writeUInt16LE(1, 32);
  buf.writeUInt16LE(8, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n, 40);
  const freq = 220 + (id.charCodeAt(id.length - 1) % 8) * 55;
  for (let i = 0; i < n; i++) {
    const env = 0.5 + 0.5 * Math.sin((2 * Math.PI * i) / (rate * 2));
    buf[44 + i] = 128 + Math.round(40 * env * Math.sin((2 * Math.PI * freq * i) / rate));
  }
  return buf;
}
