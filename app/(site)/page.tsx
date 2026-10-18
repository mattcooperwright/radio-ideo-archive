import Link from 'next/link';
import { Carousel } from '@/components/Carousel';
import { Cover } from '@/components/Cover';
import { StarIcon } from '@/components/Icons';
import { PlayButton } from '@/components/PlayButton';
import { ShowCard } from '@/components/ShowCard';
import { ShowBrowser } from '@/components/ShowBrowser';
import { getCatalogue } from '@/lib/drive';
import { formatShowDate } from '@/lib/parseShow';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { shows, series, years } = await getCatalogue();
  const latest = shows[0];
  // Most recently inducted first.
  const hall = shows.filter((s) => s.hallOfFame).sort((a, b) => b.hallOfFame!.localeCompare(a.hallOfFame!));

  return (
    <>
      {latest && (
        <section className="hero">
          <Cover name={latest.series} slug={latest.seriesSlug} src={latest.cover} colour={latest.colour} tone={latest.tone} className="hero__art" />
          <div className="hero__body">
            <p className="eyebrow">Latest show</p>
            <h1 className="hero__title">
              <Link href={`/shows/${latest.id}`}>{latest.title}</Link>
            </h1>
            <p className="hero__meta">
              <Link href={`/series/${latest.seriesSlug}`}>{latest.series}</Link>
              {!latest.titleIsDate && <> · {formatShowDate(latest.date)}</>}
            </p>
            {latest.description && <p className="hero__desc">{latest.description}</p>}
            <PlayButton show={latest} size="lg" />
          </div>
        </section>
      )}
      {hall.length > 0 && (
        <section className="hall" aria-labelledby="hall-title">
          <h2 className="section-title hall__title" id="hall-title">
            <StarIcon size={22} /> Hall of Fame
          </h2>
          <p className="hall__lede">The standout shows, from every series.</p>
          <Carousel label="Hall of Fame">
            {hall.map((s) => (
              <div key={s.id} role="listitem" className="carousel__item">
                <ShowCard show={s} />
              </div>
            ))}
          </Carousel>
        </section>
      )}
      <h2 className="section-title">The archive</h2>
      <ShowBrowser shows={shows} series={series} years={years} />
    </>
  );
}
