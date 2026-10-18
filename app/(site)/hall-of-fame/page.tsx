import { StarIcon } from '@/components/Icons';
import { ShowCard } from '@/components/ShowCard';
import { getCatalogue } from '@/lib/drive';

export const dynamic = 'force-dynamic';

/** Every Hall of Fame show, most recently inducted first. The page switches the site to its white theme. */
export default async function HallOfFamePage() {
  const { shows } = await getCatalogue();
  const hall = shows.filter((s) => s.hallOfFame).sort((a, b) => b.hallOfFame!.localeCompare(a.hallOfFame!));

  return (
    <div className="hof-page">
      <header className="hof-page__head">
        <h1 className="hof-page__title">
          <StarIcon size={44} /> Hall of Fame
        </h1>
        <p className="hof-page__lede">The standout shows, from every series.</p>
        <p className="hof-page__count">
          {hall.length} {hall.length === 1 ? 'show' : 'shows'}
        </p>
      </header>
      {hall.length ? (
        <div className="grid hof-page__grid">
          {hall.map((s) => (
            <ShowCard key={s.id} show={s} />
          ))}
        </div>
      ) : (
        <p className="empty">No shows in the Hall of Fame yet.</p>
      )}
    </div>
  );
}
