import Link from 'next/link';
import { PlayButton } from '@/components/PlayButton';
import { ShowBrowser } from '@/components/ShowBrowser';
import { getCatalogue } from '@/lib/drive';
import { formatShowDate } from '@/lib/parseShow';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { shows, series, years } = await getCatalogue();
  const latest = shows[0];

  return (
    <>
      {latest && (
        <section className="hero">
          <img src={latest.cover} alt="" className="hero__art" />
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
      <h2 className="section-title">The archive</h2>
      <ShowBrowser shows={shows} series={series} years={years} />
    </>
  );
}
