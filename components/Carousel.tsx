'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * A row that scrolls sideways: swipe on touch screens, trackpad or the arrow buttons elsewhere.
 * The buttons only show when there is more to see in that direction.
 */
export function Carousel({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canFwd, setCanFwd] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanBack(el.scrollLeft > 4);
    setCanFwd(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // Re-check whenever the row's size changes: window resizes, and styles or fonts arriving after mount.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="carousel">
      <div className="carousel__nav">
        <button type="button" className="carousel__btn" onClick={() => page(-1)} disabled={!canBack} aria-label={`Scroll ${label} back`}>
          <Arrow dir="back" />
        </button>
        <button type="button" className="carousel__btn" onClick={() => page(1)} disabled={!canFwd} aria-label={`Scroll ${label} forward`}>
          <Arrow dir="fwd" />
        </button>
      </div>
      <div className="carousel__track" ref={track} onScroll={update} role="list" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function Arrow({ dir }: { dir: 'back' | 'fwd' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === 'back' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
