import { notFound } from 'next/navigation';
import { Cover } from '@/components/Cover';
import { ShowCard } from '@/components/ShowCard';
import { getCatalogue } from '@/lib/drive';

export const dynamic = 'force-dynamic';

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { shows, series } = await getCatalogue();
  const info = series.find((s) => s.slug === slug);
  if (!info) notFound();
  const episodes = shows.filter((s) => s.seriesSlug === slug);

  return (
    <>
      <section className="hero hero--series">
        <Cover name={info.name} slug={info.slug} src={info.cover} colour={info.colour} className="hero__art" />
        <div className="hero__body">
          <p className="eyebrow">Series</p>
          <h1 className="hero__title">{info.name}</h1>
          <p className="hero__meta">
            {info.count} {info.count === 1 ? 'show' : 'shows'}
          </p>
          {info.blurb && <p className="hero__desc">{info.blurb}</p>}
        </div>
      </section>
      <div className="grid">
        {episodes.map((s) => (
          <ShowCard key={s.id} show={s} />
        ))}
      </div>
    </>
  );
}
