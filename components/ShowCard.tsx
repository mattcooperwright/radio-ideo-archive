import Link from 'next/link';
import { formatShowDate } from '@/lib/parseShow';
import type { Show } from '@/lib/types';
import { Cover } from './Cover';
import { StarIcon } from './Icons';
import { NowPlaying } from './NowPlaying';
import { PlayButton } from './PlayButton';

export function ShowCard({ show }: { show: Show }) {
  return (
    <article className="card">
      <Link href={`/shows/${show.id}`} className="card__link">
        <div className="card__art">
          <Cover name={show.series} slug={show.seriesSlug} src={show.cover} colour={show.colour} tone={show.tone} />
          <NowPlaying id={show.id} />
          {show.hallOfFame && (
            <span className="hof-mark" title="Hall of Fame">
              <StarIcon size={11} />
              <span className="sr-only">Hall of Fame</span>
            </span>
          )}
          <PlayButton show={show} />
        </div>
        <h3 className="card__title">{show.title}</h3>
      </Link>
      <p className="card__meta">
        <Link href={`/series/${show.seriesSlug}`}>{show.series}</Link>
        {!show.titleIsDate && (
          <>
            <span aria-hidden="true"> · </span>
            <time dateTime={show.date}>{formatShowDate(show.date)}</time>
          </>
        )}
      </p>
    </article>
  );
}
