'use client';

import type { Track } from '@/lib/setlist';
import type { Show } from '@/lib/types';
import { formatTime } from './format';
import { PlayIcon } from './Icons';
import { usePlayer } from './PlayerProvider';

export function Tracklist({ show, tracks, url }: { show: Show; tracks: Track[]; url: string }) {
  const { current, time, playAt } = usePlayer();
  const isThis = current?.id === show.id;
  // The row playing now: the last track that started before the playhead.
  const nowIndex = isThis ? tracks.reduce((acc, t, i) => (t.offset != null && t.offset <= time ? i : acc), -1) : -1;

  return (
    <section className="tracklist">
      <div className="tracklist__head">
        <h2 className="section-title">Tracklist</h2>
        <a href={url} target="_blank" rel="noreferrer" className="tracklist__source">
          Full playlist on Serato ↗
        </a>
      </div>
      <ol className="tracklist__list">
        {tracks.map((t, i) => {
          const body = (
            <>
              <span className="tracklist__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="tracklist__name">
                <span className="tracklist__title">{t.title}</span>
                {t.artist && <span className="tracklist__artist">{t.artist}</span>}
              </span>
              <span className="tracklist__time">{t.offset != null ? formatTime(t.offset) : t.time}</span>
            </>
          );
          return (
            <li key={i} className={i === nowIndex ? 'is-now' : undefined}>
              {t.offset != null ? (
                <button
                  type="button"
                  className="tracklist__row"
                  onClick={() => playAt(show, t.offset!)}
                  aria-label={`Play from ${t.title}${t.artist ? ` by ${t.artist}` : ''}, ${formatTime(t.offset)} in`}
                >
                  {body}
                  <span className="tracklist__play" aria-hidden="true">
                    <PlayIcon size={12} />
                  </span>
                </button>
              ) : (
                <div className="tracklist__row">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
