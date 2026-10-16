'use client';

import { RecordDot } from './Icons';
import { usePlayer } from './PlayerProvider';

/** A record-light badge on the card of the show that's currently playing. */
export function NowPlaying({ id }: { id: string }) {
  const { current, playing } = usePlayer();
  if (current?.id !== id) return null;
  return (
    <span className={`now-playing${playing ? ' is-live' : ''}`}>
      <RecordDot size={8} /> {playing ? 'Playing' : 'Paused'}
    </span>
  );
}
