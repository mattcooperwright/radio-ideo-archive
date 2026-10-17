import { formatShowDate, parseFilename, slugify, stripExtension } from './parseShow';
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
/**
 * Keyed by Drive file ID, or by filename without its extension. A filename key lets a show be set up
 * before its file exists, e.g. an audio copy of a video. `file` is a reminder of which file an ID means.
 */
export type Overrides = Record<
  string,
  {
    file?: string;
    title?: string;
    series?: string;
    date?: string;
    description?: string;
    hidden?: boolean;
    serato?: string | false;
  }
>;

export function buildCatalogue(files: DriveFile[], seriesConfig: SeriesConfig, overrides: Overrides): Catalogue {
  const shows: Show[] = [];

  for (const f of files) {
    const o = overrides[f.id] ?? overrides[stripExtension(f.name)] ?? {};
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
      tone: 0,
      // Only a known start time counts: Serato track offsets are measured from it.
      dated: o.date ? /T\d/.test(o.date) : Boolean(parsed.date),
      serato: o.serato ?? null,
    });
  }

  shows.sort((a, b) => b.date.localeCompare(a.date));

  // Number each series oldest first, so a new show takes the next tone and older ones keep theirs.
  const counts = new Map<string, number>();
  for (const s of [...shows].reverse()) {
    const n = counts.get(s.seriesSlug) ?? 0;
    s.tone = n;
    counts.set(s.seriesSlug, n + 1);
  }

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
