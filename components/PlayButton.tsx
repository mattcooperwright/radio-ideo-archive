'use client';

import type { Show } from '@/lib/types';
import { PauseIcon, PlayIcon } from './Icons';
import { usePlayer } from './PlayerProvider';

export function PlayButton({ show, size = 'md' }: { show: Show; size?: 'md' | 'lg' }) {
  const { current, playing, play, toggle } = usePlayer();
  const isThis = current?.id === show.id;
  const isPlaying = isThis && playing;
  return (
    <button
      type="button"
      className={`play-btn play-btn--${size}${isPlaying ? ' is-playing' : ''}`}
      aria-label={isPlaying ? `Pause ${show.title}` : `Play ${show.title}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isThis) toggle();
        else play(show);
      }}
    >
      {isPlaying ? <PauseIcon size={size === 'lg' ? 28 : 18} /> : <PlayIcon size={size === 'lg' ? 28 : 18} />}
    </button>
  );
}
