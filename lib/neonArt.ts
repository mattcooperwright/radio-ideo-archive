/**
 * Neon cover art for series set to the "neon" colourway (ShuffleMode). Each show gets two neons
 * and a layout, so the archive can hold many shows before any two covers match. All the neons are
 * light enough for the black name and glyphs to sit on them (about 7:1 or better).
 */
export const NEONS = [
  '#d9ff00', // lime, the brand colour
  '#ff4fb8', // pink
  '#3dd9ff', // blue
  '#ffea00', // yellow
  '#ff7a1a', // orange
  '#3dff8b', // green
  '#b78cff', // violet
] as const;

// How the second neon sits on the first. Rings echo the broadcast background.
const LAYOUTS = [
  (a: string, b: string) => `linear-gradient(180deg, ${a} 50%, ${b} 50%)`,
  (a: string, b: string) => `radial-gradient(circle at 100% 100%, ${b} 0 58%, ${a} 58%)`,
  (a: string, b: string) => `linear-gradient(135deg, ${a} 50%, ${b} 50%)`,
  (a: string, b: string) => `repeating-radial-gradient(circle at 100% 0, ${a} 0 14%, ${b} 14% 28%)`,
];

/** Every distinct pairing of two different neons with a layout. */
export const NEON_COMBOS = NEONS.length * (NEONS.length - 1) * LAYOUTS.length;

// Walk the combinations in big steps so consecutive shows change layout and both colours.
// The step shares no factor with NEON_COMBOS, so the first NEON_COMBOS shows are all different.
const STRIDE = 61;

export function neonArt(tone: number) {
  const i = (tone * STRIDE) % NEON_COMBOS;
  const layout = LAYOUTS[i % LAYOUTS.length];
  const pair = Math.floor(i / LAYOUTS.length);
  const a = pair % NEONS.length;
  const b = (a + 1 + Math.floor(pair / NEONS.length)) % NEONS.length;
  return { bg: layout(NEONS[a], NEONS[b]), ink: '#000000' };
}
