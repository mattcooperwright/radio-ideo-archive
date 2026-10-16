'use client';

import { useMemo, useState } from 'react';
import type { Series, Show } from '@/lib/types';
import { ShowCard } from './ShowCard';

export function ShowBrowser({ shows, series, years }: { shows: Show[]; series: Series[]; years: number[] }) {
  const [year, setYear] = useState<number | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return shows.filter(
      (s) =>
        (year == null || s.year === year) &&
        (slug == null || s.seriesSlug === slug) &&
        (!needle || `${s.title} ${s.series} ${s.description}`.toLowerCase().includes(needle)),
    );
  }, [shows, year, slug, q]);

  return (
    <section>
      <div className="filters">
        <input
          type="search"
          className="search"
          placeholder="Search shows"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search shows"
        />
        <div className="chips" role="group" aria-label="Year">
          <button type="button" className="chip" aria-pressed={year == null} onClick={() => setYear(null)}>
            All years
          </button>
          {years.map((y) => (
            <button key={y} type="button" className="chip" aria-pressed={year === y} onClick={() => setYear(year === y ? null : y)}>
              {y}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Series">
          <button type="button" className="chip" aria-pressed={slug == null} onClick={() => setSlug(null)}>
            All series
          </button>
          {series.map((s) => (
            <button key={s.slug} type="button" className="chip" aria-pressed={slug === s.slug} onClick={() => setSlug(slug === s.slug ? null : s.slug)}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid">
          {filtered.map((s) => (
            <ShowCard key={s.id} show={s} />
          ))}
        </div>
      ) : (
        <p className="empty">No shows match. Try clearing a filter.</p>
      )}
    </section>
  );
}
