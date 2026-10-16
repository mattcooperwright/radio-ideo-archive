import { Glyphs } from './Icons';

// Brand palette pairs from brand/logo/README.md. Picked per series so each one is recognisable.
export const COLOURWAYS = ['lime', 'white', 'grey', 'black'] as const;
export type Colourway = (typeof COLOURWAYS)[number];

function colourway(slug: string, preferred?: string): Colourway {
  if (COLOURWAYS.includes(preferred as Colourway)) return preferred as Colourway;
  let h = 2166136261; // FNV-1a
  for (const c of slug) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return COLOURWAYS[(h >>> 0) % COLOURWAYS.length];
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
  className = '',
}: {
  name: string;
  slug: string;
  src?: string;
  colour?: string;
  className?: string;
}) {
  if (src) return <img src={src} alt="" className={`cover ${className}`} loading="lazy" />;
  return (
    <div className={`cover cover--${colourway(slug, colour)} ${className}`} aria-hidden="true">
      <div className="cover__inner">
        <span className="cover__name">{name}</span>
        <Glyphs className="cover__glyphs" />
      </div>
    </div>
  );
}
