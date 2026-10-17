import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cover } from '@/components/Cover';
import { PlayButton } from '@/components/PlayButton';
import { ShowCard } from '@/components/ShowCard';
import { Tracklist } from '@/components/Tracklist';
import { getCatalogue } from '@/lib/drive';
import { formatShowDate } from '@/lib/parseShow';
import { getSetlist } from '@/lib/serato';

export const dynamic = 'force-dynamic';

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shows } = await getCatalogue();
  const show = shows.find((s) => s.id === id);
  if (!show) notFound();

  const setlist = await getSetlist(show, shows);
  const more = shows.filter((s) => s.seriesSlug === show.seriesSlug && s.id !== show.id).slice(0, 8);

  return (
    <>
      <section className="hero">
        <Cover name={show.series} slug={show.seriesSlug} src={show.cover} colour={show.colour} className="hero__art" />
        <div className="hero__body">
          <p className="eyebrow">
            <Link href={`/series/${show.seriesSlug}`}>{show.series}</Link>
          </p>
          <h1 className="hero__title">{show.title}</h1>
          {!show.titleIsDate && (
            <p className="hero__meta">
              <time dateTime={show.date}>{formatShowDate(show.date)}</time>
            </p>
          )}
          <PlayButton show={show} size="lg" />
        </div>
      </section>
      {show.description && (
        <section className="notes">
          <h2 className="section-title">Show notes</h2>
          <p>{show.description}</p>
        </section>
      )}
      {setlist && <Tracklist show={show} tracks={setlist.tracks} url={setlist.url} />}
      {more.length > 0 && (
        <>
          <h2 className="section-title">More {show.series}</h2>
          <div className="grid">
            {more.map((s) => (
              <ShowCard key={s.id} show={s} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
