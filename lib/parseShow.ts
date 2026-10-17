export const DEFAULT_SERIES = 'Radio IDEO';

export type ParsedName = {
  series: string;
  /** null when the filename carries no date; the caller falls back to Drive's createdTime. */
  date: string | null;
  /** Free-form title when the name does not follow the recorder's "Series - date time" pattern. */
  title: string | null;
};

const STAMPED = /^(.*?)[\s_-]*(\d{4})-(\d{2})-(\d{2})(?:[ _T]+(\d{2})[-:.](\d{2})(?:[-:.](\d{2}))?)?\s*$/;

export function stripExtension(name: string): string {
  return name.replace(/\.[a-z0-9]{2,4}$/i, '');
}

export function slugify(series: string): string {
  return series.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** "FRIDAY SHOW" -> "Friday Show". Mixed-case names like "ShuffleMode" are left alone. */
export function tidySeriesName(raw: string): string {
  const s = raw.trim().replace(/\s+/g, ' ');
  if (s && s === s.toUpperCase() && /[A-Z]/.test(s)) {
    return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return s;
}

export function parseFilename(filename: string): ParsedName {
  const base = stripExtension(filename).trim();

  const m = base.match(STAMPED);
  if (m) {
    const [, prefix, y, mo, d, h = '00', mi = '00', s = '00'] = m;
    const series = tidySeriesName(prefix.replace(/[\s_-]+$/, '')) || DEFAULT_SERIES;
    return { series, date: `${y}-${mo}-${d}T${h}:${mi}:${s}Z`, title: null };
  }

  // Older free-form names, e.g. "Radio IDEO - Shuffle Mode - October 2022".
  const cleaned = base.replace(/^radio ideo\s*-\s*/i, '').trim();
  const parts = cleaned.split(/\s+-\s+/);
  const candidate = parts.length > 1 ? parts[0] : '';
  const series = candidate && !/^\d/.test(candidate) ? tidySeriesName(candidate) : DEFAULT_SERIES;
  return { series, date: null, title: cleaned || base };
}

export function formatShowDate(iso: string, style: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: style === 'long' ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}
