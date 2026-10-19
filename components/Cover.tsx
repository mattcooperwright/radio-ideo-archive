import type { CSSProperties } from 'react';
import { neonArt } from '@/lib/neonArt';
import { Glyphs } from './Icons';

// Brand palette pairs from brand/logo/README.md. Picked per series so each one is recognisable.
const BRAND_COLOURWAYS = ['lime', 'white', 'grey', 'black'] as const;
// Neon and dots are only used when a series asks for them, never picked by the hash below.
export const COLOURWAYS = [...BRAND_COLOURWAYS, 'neon', 'dots'] as const;
export type Colourway = (typeof COLOURWAYS)[number];
type BrandColourway = (typeof BRAND_COLOURWAYS)[number];

const LIME = '#d9ff00';
const WHITE = '#ffffff';
const GREY = '#d9d9d9';
const BLACK = '#000000';

/**
 * Tones within each colourway: the series keeps its family, each show takes the next step.
 * Step 0 is the brand colour itself. Neighbouring steps are deliberately far apart so adjacent
 * shows read as different. Lime stays in the neon range, white and grey stay pale or grey, and
 * black keeps its dark tile but rotates the ink through the brand colours.
 */
const TONES: Record<BrandColourway, { bg: string; ink: string }[]> = {
  lime: [LIME, '#b4ff24', '#eeff1a', '#c4ff0a', '#e4ff5c', '#a8f000'].map((bg) => ({ bg, ink: BLACK })),
  white: [WHITE, '#f3ffb8', '#ededed', '#faffe0', '#e3e3e3'].map((bg) => ({ bg, ink: BLACK })),
  grey: [GREY, '#b3b3b3', '#ebebeb', '#a6a6a6', '#c6c6c6', '#e0e0e0'].map((bg) => ({ bg, ink: BLACK })),
  black: [
    { bg: BLACK, ink: LIME },
    { bg: '#1c1c1c', ink: WHITE },
    { bg: '#0d0d0d', ink: GREY },
    { bg: '#262626', ink: LIME },
    { bg: '#141414', ink: WHITE },
  ],
};

/**
 * Dot-matrix tiles for In the Zone, echoing the dot-matrix lettering of the show's visuals.
 * Dark greys only, so the lime play button and the white ink always have room. Each step changes
 * the dot's grey and size, so neighbouring shows are easy to tell apart.
 */
const DOT_TONES = [
  { bg: '#161616', dot: '#4d4d4d', r: '1.6cqw', ink: WHITE },
  { bg: '#262626', dot: '#6b6b6b', r: '2.2cqw', ink: WHITE },
  { bg: '#0d0d0d', dot: '#383838', r: '2.1cqw', ink: GREY },
  { bg: '#1f1f1f', dot: '#5c5c5c', r: '2.5cqw', ink: WHITE },
  { bg: '#2e2e2e', dot: '#707070', r: '1.9cqw', ink: WHITE },
];

function colourway(slug: string, preferred?: string): Colourway {
  if (COLOURWAYS.includes(preferred as Colourway)) return preferred as Colourway;
  let h = 2166136261; // FNV-1a
  for (const c of slug) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return BRAND_COLOURWAYS[(h >>> 0) % BRAND_COLOURWAYS.length];
}

/**
 * Square cover art. Uses the configured image when there is one; otherwise a tile in the
 * style of the stacked lockup: the series name over the four IDEO glyphs.
 */
export function Cover({
  name,
  slug,
  src,
  colour,
  tone = 0,
  className = '',
}: {
  name: string;
  slug: string;
  src?: string;
  colour?: string;
  /** The show's position in its series; leave out for the series' own cover. */
  tone?: number;
  className?: string;
}) {
  if (src) return <img src={src} alt="" className={`cover ${className}`} loading="lazy" />;
  const way = colourway(slug, colour);
  const dots = way === 'dots' ? DOT_TONES[tone % DOT_TONES.length] : undefined;
  const { bg, ink } = dots ?? (way === 'neon' ? neonArt(tone) : TONES[way][tone % TONES[way].length]);
  const style = { '--cover-bg': bg, '--cover-ink': ink, ...(dots && { '--cover-dot': dots.dot, '--cover-dot-r': dots.r }) } as CSSProperties;
  return (
    <div className={`cover cover--${way} ${className}`} style={style} aria-hidden="true">
      <div className="cover__inner">
        <span className="cover__name">{name}</span>
        <Glyphs className="cover__glyphs" />
      </div>
    </div>
  );
}
