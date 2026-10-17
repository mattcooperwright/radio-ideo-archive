'use client';

import Link from 'next/link';
import { Cover } from './Cover';
import { formatTime } from './format';
import { PauseIcon, PlayIcon, SkipIcon } from './Icons';
import { usePlayer } from './PlayerProvider';

const RATES = [1, 1.25, 1.5, 2];

export function PlayerBar() {
  const { current, playing, time, duration, rate, toggle, seek, skip, setRate } = usePlayer();
  if (!current) return null;

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div className="player" role="region" aria-label="Player">
      <div className="player__inner">
        <Link href={`/shows/${current.id}`} className="player__meta">
          <Cover name={current.series} slug={current.seriesSlug} src={current.cover} colour={current.colour} className="player__cover" />
          <span>
            <span className="player__title">{current.title}</span>
            <span className="player__series">{current.series}</span>
          </span>
        </Link>

        <div className="player__controls">
          <button type="button" className="icon-btn" onClick={() => skip(-30)} aria-label="Back 30 seconds">
            <SkipIcon dir="back" />
          </button>
          <button type="button" className="play-btn play-btn--md" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button type="button" className="icon-btn" onClick={() => skip(30)} aria-label="Forward 30 seconds">
            <SkipIcon dir="fwd" />
          </button>
        </div>

        <div className="player__progress">
          <span className="player__time">{formatTime(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
            style={{ ['--pct' as string]: `${pct}%` }}
            disabled={!duration}
          />
          <span className="player__time">{formatTime(duration)}</span>
        </div>

        <button
          type="button"
          className="rate-btn"
          onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
          aria-label={`Playback speed ${rate}x`}
        >
          {rate}×
        </button>
      </div>
    </div>
  );
}
