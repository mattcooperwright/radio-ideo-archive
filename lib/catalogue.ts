import { formatShowDate, parseFilename, slugify } from './parseShow';
import type { Catalogue, Series, Show } from './types';

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  description?: string;
};

export type SeriesConfig = Record<string, { name?: string; blurb?: string; cover?: string; colour?: string }>;
export type Overrides = Record<
  string,
  { title?: string; series?: string; date?: string; description?: string; hidden?: boolean }
>;

export function buildCatalogue(files: DriveFile[], seriesConfig: SeriesConfig, overrides: Overrides): Catalogue {
  const shows: Show[] = [];

  for (const f of files) {
    const o = overrides[f.id] ?? {};
    if (o.hidden) continue;

    const parsed = parseFilename(f.name);
    const seriesRaw = o.series ?? parsed.series;
    const seriesSlug = slugify(seriesRaw);
    const series = seriesConfig[seriesSlug]?.name || seriesRaw;
    const date = o.date ? new Date(o.date).toISOString() : (parsed.date ?? f.createdTime);
    const customTitle = o.title ?? parsed.title;

    shows.push({
      id: f.id,
      title: customTitle ?? formatShowDate(date, 'long'),
      titleIsDate: customTitle == null,
      series,
      seriesSlug,
      date,
      year: new Date(date).getUTCFullYear(),
      mimeType: f.mimeType,
      size: Number(f.size ?? 0),
      description: o.description ?? f.description ?? '',
      cover: seriesConfig[seriesSlug]?.cover ?? '',
      colour: seriesConfig[seriesSlug]?.colour ?? '',
    });
  }

  shows.sort((a, b) => b.date.localeCompare(a.date));

  const bySlug = new Map<string, Series>();
  for (const s of shows) {
    const existing = bySlug.get(s.seriesSlug);
    if (existing) {
      existing.count++;
    } else {
      bySlug.set(s.seriesSlug, {
        slug: s.seriesSlug,
        name: s.series,
        blurb: seriesConfig[s.seriesSlug]?.blurb ?? '',
        cover: s.cover,
        colour: s.colour,
        count: 1,
      });
    }
  }

  const series = [...bySlug.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const years = [...new Set(shows.map((s) => s.year))].sort((a, b) => b - a);
  return { shows, series, years };
}
