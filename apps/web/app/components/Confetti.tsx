'use client';

import { useEffect, useRef } from 'react';

// Module-level so the default keeps one identity: an inline array would be a new
// dependency every render and restart the burst.
const DEFAULT_COLORS = ['#ff4a4e', '#ffb703', '#2563eb', '#22c55e', '#ffffff'];

/**
 * A one-shot confetti burst over the whole viewport.
 *
 * Plain canvas rather than a library: it is a few seconds of decoration, and it
 * must never block a click — the canvas ignores pointer events and removes
 * itself when the last piece has fallen. Visitors who ask their OS for reduced
 * motion get nothing at all.
 */
export function Confetti({
  fire,
  colors = DEFAULT_COLORS,
  pieces = 160,
  durationMs = 3600
}: {
  /** Bursts each time this goes from false to true. */
  fire: boolean;
  colors?: string[];
  pieces?: number;
  durationMs?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);

    // Two cannons from the lower corners, angled in and up.
    const particles = Array.from({ length: pieces }, (_, index) => {
      const fromLeft = index % 2 === 0;
      const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.7;
      const speed = 9 + Math.random() * 9;
      return {
        x: fromLeft ? width * 0.08 : width * 0.92,
        y: height * 0.9,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: colors[index % colors.length],
        round: Math.random() < 0.3
      };
    });

    const started = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      const elapsed = now - started;
      context.clearRect(0, 0, width, height);
      // Fade the whole burst out over its last second.
      context.globalAlpha = Math.max(0, Math.min(1, (durationMs - elapsed) / 1000));

      for (const p of particles) {
        p.vy += 0.32; // gravity
        p.vx *= 0.99; // air
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        context.save();
        context.translate(p.x, p.y);
        context.rotate(p.rotation);
        context.fillStyle = p.color;
        if (p.round) {
          context.beginPath();
          context.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        context.restore();
      }

      if (elapsed < durationMs) frame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, width, height);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [fire, pieces, durationMs, colors]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1400] h-full w-full" />;
}
