import Link from 'next/link';
import { formatShowDate } from '@/lib/parseShow';
import type { Show } from '@/lib/types';
import { Cover } from './Cover';
import { StarIcon } from './Icons';
import { NowPlaying } from './NowPlaying';

/** A compact list entry that opens the show's page. The series is left out: the list's heading names it. */
export function ShowRow({ show }: { show: Show }) {
  return (
    <li>
      <Link href={`/shows/${show.id}`} className="show-row">
        <span className="show-row__thumb">
          <Cover name={show.series} slug={show.seriesSlug} src={show.cover} colour={show.colour} tone={show.tone} className="show-row__art" />
          {show.hallOfFame && (
            <span className="hof-mark" title="Hall of Fame">
              <StarIcon size={9} />
              <span className="sr-only">Hall of Fame</span>
            </span>
          )}
        </span>
        <span className="show-row__body">
          <span className="show-row__title">{show.title}</span>
          {!show.titleIsDate && (
            <time className="show-row__meta" dateTime={show.date}>
              {formatShowDate(show.date)}
            </time>
          )}
          {show.description && <span className="show-row__desc">{show.description}</span>}
        </span>
        <NowPlaying id={show.id} />
      </Link>
    </li>
  );
}
