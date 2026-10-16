import Link from 'next/link';
import { formatShowDate } from '@/lib/parseShow';
import type { Show } from '@/lib/types';
import { PlayButton } from './PlayButton';

export function ShowCard({ show }: { show: Show }) {
  return (
    <article className="card">
      <Link href={`/shows/${show.id}`} className="card__link">
        <div className="card__art">
          <img src={show.cover} alt="" loading="lazy" />
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
