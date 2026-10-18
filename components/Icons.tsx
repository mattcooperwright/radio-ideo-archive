// Controls drawn from the logo's own glyphs (brand/logo/svg/radio-ideo-wordmark-*.svg):
// the play triangle is the "D", pause is two "I" bars, and the record circle is the "O".

const PLAY_PATH =
  'M300.728 58.8738C301.843 59.6716 301.843 61.3284 300.728 62.1262L262.164 89.7347C260.841 90.6822 259 89.7362 259 88.1085L259 32.8915C259 31.2638 260.841 30.3178 262.164 31.2653L300.728 58.8738Z';

export function PlayIcon({ size = 20 }: { size?: number }) {
  // Nudged right so the triangle looks optically centred in a round button.
  return (
    <svg width={size} height={size} viewBox="250 26 60 70" aria-hidden="true">
      <path d={PLAY_PATH} fill="currentColor" transform="translate(4 0)" />
    </svg>
  );
}

export function PauseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-6 -6 61 70" aria-hidden="true">
      <rect x="0" y="0" width="19" height="58" rx="2" fill="currentColor" />
      <rect x="30" y="0" width="19" height="58" rx="2" fill="currentColor" />
    </svg>
  );
}

export function RecordDot({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 59 59" aria-hidden="true">
      <circle cx="29.5" cy="29.5" r="29.5" fill="currentColor" />
    </svg>
  );
}

/** The four IDEO glyphs in a row, as in the logo. */
export function Glyphs({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="224 31 206 60" aria-hidden="true">
      <rect x="224" y="32" width="19" height="58" rx="2" fill="currentColor" />
      <path d={PLAY_PATH} fill="currentColor" />
      <rect x="309" y="33" width="51" height="56" rx="2" fill="currentColor" />
      <circle cx="400.5" cy="60.5" r="29.5" fill="currentColor" />
    </svg>
  );
}

/** Hall of Fame mark: a five-point star with the same small rounded corners as the logo's glyphs. */
export function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.2l2.95 6.3 6.85.8-5.07 4.7 1.35 6.8L12 17.4l-6.08 3.4 1.35-6.8L2.2 9.3l6.85-.8z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SkipIcon({ dir, size = 22 }: { dir: 'back' | 'fwd'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g transform={dir === 'fwd' ? 'translate(24 0) scale(-1 1)' : undefined}>
        <path d="M12 4a8 8 0 1 1-8 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 0.8v6.4L7.6 4z" fill="currentColor" />
      </g>
      <text x="12" y="15.4" fontSize="7.5" fontWeight="700" textAnchor="middle" fill="currentColor" fontFamily="var(--font-primary)">
        30
      </text>
    </svg>
  );
}
