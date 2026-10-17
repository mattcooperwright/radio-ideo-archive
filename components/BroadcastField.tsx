'use client';

import { useEffect, useRef } from 'react';

// Concentric rings drawn like the pulsar plot on Joy Division's Unknown Pleasures: each ring is a
// line pushed outward by a few peaks, and inner rings are filled black so their peaks hide the
// rings behind. Every so often a "transmission" ripples out from somewhere on the page.

const RINGS = 14;
const POINTS = 220;
const FRAME_MS = 1000 / 30;
const DRIFT_S = 60; // the resting peaks take about a minute to rise and fall
const POP_LIFE_S = 4.5;
const POP_SPEED = 80; // px per second

type Peak = { angle: number; width: number; amp: number; phase: number };
type Pop = { x: number; y: number; born: number; rings: number; lime: boolean; peaks: Peak[] };

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function peaks(count: number, centre: number, spread: number, amp: [number, number]): Peak[] {
  return Array.from({ length: count }, () => ({
    angle: centre + rand(-spread, spread),
    width: rand(0.04, 0.14),
    amp: rand(...amp),
    phase: rand(0, Math.PI * 2),
  }));
}

/** Outward push at an angle: the sum of narrow bumps, like one trace of the pulsar plot. */
function lift(ps: Peak[], theta: number, scale: (p: Peak) => number) {
  let r = 0;
  for (const p of ps) {
    let d = Math.abs(theta - p.angle) % (Math.PI * 2);
    if (d > Math.PI) d = Math.PI * 2 - d;
    r += scale(p) * Math.exp(-((d / p.width) ** 2));
  }
  return r;
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, offset: (theta: number) => number) {
  ctx.beginPath();
  for (let i = 0; i <= POINTS; i++) {
    const theta = (i / POINTS) * Math.PI * 2;
    const rr = r + offset(theta);
    const px = x + Math.cos(theta) * rr;
    const py = y + Math.sin(theta) * rr;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export function BroadcastField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const black = token('--black', '#000000');
    const grey = token('--grey', '#d9d9d9');
    const lime = token('--lime', '#d9ff00');

    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let w = 0;
    let h = 0;
    let gap = 40;
    // Peaks gather on the side of each ring that faces into the page (down and to the left).
    const resting = Array.from({ length: RINGS }, () => peaks(4, Math.PI * 0.72, 0.55, [4, 20]));
    let pops: Pop[] = [];
    let nextPop = performance.now() + rand(3000, 6000);
    let raf = 0;
    let last = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = Math.max(28, Math.min(w, h) / 22);
    }

    function draw(now: number) {
      const t = now / 1000;
      ctx!.fillStyle = black;
      ctx!.fillRect(0, 0, w, h);
      ctx!.lineWidth = 1;
      ctx!.lineJoin = 'round';

      // Resting field, outermost first so each inner ring's fill hides what it overlaps.
      const cx = w * 0.94;
      const cy = -h * 0.04;
      for (let i = RINGS - 1; i >= 0; i--) {
        const r = gap * (i + 2);
        const drift = (p: Peak) => p.amp * (0.55 + 0.45 * Math.sin((t / DRIFT_S) * Math.PI * 2 + p.phase));
        ring(ctx!, cx, cy, r, (theta) => lift(resting[i], theta, drift));
        ctx!.fillStyle = black;
        ctx!.fill();
        ctx!.strokeStyle = grey;
        ctx!.globalAlpha = 0.05 + 0.03 * (1 - i / RINGS);
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      // Transmissions: rings that spread and flatten as they fade.
      pops = pops.filter((p) => t - p.born < POP_LIFE_S + p.rings * 0.35);
      for (const p of pops) {
        for (let k = 0; k < p.rings; k++) {
          const age = t - p.born - k * 0.35;
          if (age <= 0 || age >= POP_LIFE_S) continue;
          const progress = age / POP_LIFE_S;
          const spike = (1 - progress) ** 2;
          ring(ctx!, p.x, p.y, 6 + age * POP_SPEED, (theta) => lift(p.peaks, theta, (pk) => pk.amp * spike));
          ctx!.strokeStyle = p.lime ? lime : grey;
          ctx!.globalAlpha = (p.lime ? 0.26 : 0.18) * (1 - progress) ** 1.5;
          ctx!.stroke();
          ctx!.globalAlpha = 1;
        }
      }
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (now - last < FRAME_MS) return;
      last = now;
      if (now >= nextPop) {
        pops.push({
          x: rand(0.1, 0.9) * w,
          y: rand(0.15, 0.85) * h,
          born: now / 1000,
          rings: Math.round(rand(3, 5)),
          lime: Math.random() < 0.25,
          peaks: peaks(Math.round(rand(5, 8)), rand(0, Math.PI * 2), Math.PI, [6, 18]),
        });
        nextPop = now + rand(9000, 20000);
      }
      draw(now);
    }

    function start() {
      cancelAnimationFrame(raf);
      if (still.matches) draw(0);
      else if (!document.hidden) raf = requestAnimationFrame(frame);
    }

    function onResize() {
      resize();
      if (still.matches) draw(0);
    }

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        // Don't fire a backlog of transmissions after the tab comes back.
        nextPop = Math.max(nextPop, performance.now() + rand(3000, 8000));
        start();
      }
    }

    resize();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    still.addEventListener('change', start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      still.removeEventListener('change', start);
    };
  }, []);

  return <canvas ref={ref} className="broadcast" aria-hidden="true" />;
}
