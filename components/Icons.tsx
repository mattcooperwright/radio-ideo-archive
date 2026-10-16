export function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.5v15l13-7.5z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" fill="currentColor" />
    </svg>
  );
}

export function SkipIcon({ dir, size = 20 }: { dir: 'back' | 'fwd'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={dir === 'fwd' ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" fill="currentColor" />
      <text x="12" y="16.5" fontSize="6.5" textAnchor="middle" fill="currentColor" style={dir === 'fwd' ? { transform: 'scaleX(-1)', transformOrigin: '12px 0' } : undefined}>30</text>
    </svg>
  );
}
