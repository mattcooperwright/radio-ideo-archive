export type Show = {
  id: string;
  title: string;
  /** True when the title is just the date, so the date needn't be repeated beside it. */
  titleIsDate: boolean;
  series: string;
  seriesSlug: string;
  /** ISO timestamp. Times from filenames are local wall-clock, stored as UTC so they format unchanged. */
  date: string;
  year: number;
  mimeType: string;
  size: number;
  description: string;
  cover: string;
  /** Brand colourway for the generated cover: lime, white, grey or black. */
  colour: string;
};

export type Series = {
  slug: string;
  name: string;
  blurb: string;
  cover: string;
  colour: string;
  count: number;
};

export type Catalogue = {
  shows: Show[];
  series: Series[];
  years: number[];
};
