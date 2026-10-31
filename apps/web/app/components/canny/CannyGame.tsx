'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CannyBird, type CannyOutfitStyle } from './CannyBird';

/**
 * "Tee Catch": tees drop from the top; Canny holds a basket at the bottom and
 * follows your mouse or finger. A tee that lands in the basket is caught — and
 * tapping a tee catches it too. Twenty seconds a round.
 *
 * Three screens: how to play → playing → score. Catching is checked once per
 * animation frame against each falling tee's on-screen box, so it matches what
 * the player sees, whatever the speed.
 */

const ROUND_SECONDS = 20;
const TEE_COLORS = ['#121212', '#FF4D1A', '#E11D48', '#22c55e', '#111827', '#a855f7'];
/** The basket is wider than Canny on purpose: catching should feel easy. */
const BASKET_WIDTH = 150;
const BIRD_SIZE = 84;

interface Drop {
  id: number;
  left: number;
  duration: number;
  color: string;
  caught: boolean;
}

interface Pop {
  id: number;
  x: number;
  y: number;
}

function Tee({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" width="58" height="58" aria-hidden="true">
      <path
        d="M20 8 L8 16 L2 30 L14 34 L16 58 L48 58 L50 34 L62 30 L56 16 L44 8 Q32 16 20 8 Z"
        fill={color}
        stroke="#3a2412"
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Basket() {
  return (
    <svg viewBox="0 0 100 44" width="100%" height="100%" aria-hidden="true">
      <path d="M4 8 H96 L86 40 H14 Z" fill="#c2814b" stroke="#3a2412" strokeWidth={3} strokeLinejoin="round" />
      <path d="M10 18 H90 M14 28 H86" stroke="#8a5530" strokeWidth={3} />
      <rect x={2} y={4} width={96} height={8} rx={4} fill="#d99a5e" stroke="#3a2412" strokeWidth={3} />
    </svg>
  );
}

export function CannyGame({
  outfit,
  best,
  onCatch,
  onEnd
}: {
  outfit?: CannyOutfitStyle | null;
  best: number;
  onCatch?: (score: number) => void;
  /** Called when the player closes the game, with the round's score (or 0). */
  onEnd: (score: number) => void;
}) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [catcherX, setCatcherX] = useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth / 2));

  const scoreRef = useRef(0);
  const nextId = useRef(0);
  const dropEls = useRef(new Map<number, HTMLButtonElement>());
  const caughtIds = useRef(new Set<number>());
  const basketRef = useRef<HTMLDivElement>(null);
  const catcherTarget = useRef(catcherX);

  const catchDrop = useCallback(
    (id: number) => {
      if (caughtIds.current.has(id)) return;
      caughtIds.current.add(id);
      const el = dropEls.current.get(id);
      const box = el?.getBoundingClientRect();
      setDrops((current) => current.map((drop) => (drop.id === id ? { ...drop, caught: true } : drop)));
      if (box) {
        const pop = { id, x: box.left + box.width / 2, y: box.top };
        setPops((current) => [...current.slice(-8), pop]);
        window.setTimeout(() => setPops((current) => current.filter((p) => p.id !== id)), 700);
      }
      scoreRef.current += 1;
      setScore(scoreRef.current);
      onCatch?.(scoreRef.current);
    },
    [onCatch]
  );

  const start = () => {
    scoreRef.current = 0;
    caughtIds.current.clear();
    dropEls.current.clear();
    setScore(0);
    setLeft(ROUND_SECONDS);
    setDrops([]);
    setPhase('play');
  };

  // Spawning and the clock run only while playing.
  useEffect(() => {
    if (phase !== 'play') return;
    const spawn = window.setInterval(() => {
      const id = nextId.current++;
      setDrops((current) => [
        ...current.slice(-20),
        {
          id,
          left: 4 + Math.random() * 84,
          // Slow and gentle; only slightly quicker as the score climbs.
          duration: Math.max(3.6, 5.6 - (scoreRef.current / 15) * 1.2),
          color: TEE_COLORS[id % TEE_COLORS.length],
          caught: false
        }
      ]);
    }, 1000);
    const clock = window.setInterval(() => setLeft((value) => value - 1), 1000);
    return () => {
      window.clearInterval(spawn);
      window.clearInterval(clock);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'play' && left <= 0) setPhase('done');
  }, [phase, left]);

  // The basket follows the pointer, smoothly; collisions checked every frame.
  useEffect(() => {
    if (phase !== 'play') return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      catcherTarget.current = event.clientX;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onMove);
    const loop = () => {
      setCatcherX((x) => {
        const next = x + (catcherTarget.current - x) * 0.35;
        return Math.abs(next - x) < 0.5 ? x : next;
      });
      const basket = basketRef.current?.getBoundingClientRect();
      if (basket) {
        dropEls.current.forEach((el, id) => {
          if (caughtIds.current.has(id)) return;
          const r = el.getBoundingClientRect();
          const centre = r.left + r.width / 2;
          if (r.bottom >= basket.top + 6 && r.top <= basket.bottom && centre >= basket.left && centre <= basket.right) {
            catchDrop(id);
          }
        });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
    };
  }, [phase, catchDrop]);

  // Leave at any moment: the corner ✕ and Esc both close the game outright.
  const exit = useCallback(() => onEnd(phase === 'intro' ? 0 : scoreRef.current), [onEnd, phase]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && exit();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exit]);

  const finalScore = scoreRef.current;
  // Best across this session's rounds too, not just what was stored on open.
  const [bestSoFar, setBestSoFar] = useState(best);
  useEffect(() => {
    if (phase === 'done') setBestSoFar((value) => Math.max(value, scoreRef.current));
  }, [phase]);
  const newBest = phase === 'done' && finalScore > 0 && finalScore >= bestSoFar && finalScore > best;

  return (
    <div className="canny-game" role="dialog" aria-label="Tee Catch game">
      <button type="button" className="canny-game-close" onClick={exit} aria-label="Close the game">
        ✕
      </button>
      {phase === 'intro' && (
        <div className="canny-game-panel">
          <CannyBird pose="happy" size={110} outfit={outfit} />
          <h2>Tee Catch</h2>
          <p>
            Tees are falling! <strong>Move your mouse</strong> (or slide your finger) to move my basket and catch them.
            You can also <strong>tap a tee</strong> to grab it.
          </p>
          <p className="canny-game-sub">{ROUND_SECONDS} seconds · {bestSoFar > 0 ? `your best: ${bestSoFar}` : 'set your first score!'}</p>
          <div className="canny-game-actions">
            <button type="button" className="canny-game-primary" onClick={start}>
              Start
            </button>
            <button type="button" onClick={() => onEnd(0)}>
              Not now
            </button>
          </div>
        </div>
      )}

      {phase === 'play' && (
        <>
          <div className="canny-game-hud">
            <span>👕 {score}</span>
            <span>⏱ {Math.max(left, 0)}s</span>
            <button type="button" onClick={() => setPhase('done')}>
              Finish
            </button>
          </div>

          {drops.map((drop) => (
            <button
              key={drop.id}
              ref={(el) => {
                if (el) dropEls.current.set(drop.id, el);
                else dropEls.current.delete(drop.id);
              }}
              type="button"
              aria-label="Catch the tee"
              disabled={drop.caught}
              className="canny-tee-drop"
              style={{ left: `${drop.left}%`, animationDuration: `${drop.duration}s` }}
              onPointerDown={() => catchDrop(drop.id)}
            >
              {/* The button keeps falling; only the tee inside bursts away when caught. */}
              <span className={drop.caught ? 'canny-tee-caught' : undefined} style={{ display: 'block' }}>
                <Tee color={drop.color} />
              </span>
            </button>
          ))}

          {pops.map((pop) => (
            <span key={pop.id} className="canny-game-pop" style={{ left: pop.x, top: pop.y }}>
              +1
            </span>
          ))}

          <div className="canny-catcher" style={{ left: catcherX - BASKET_WIDTH / 2, width: BASKET_WIDTH }}>
            <CannyBird pose="happy" size={BIRD_SIZE} outfit={outfit} style={{ margin: '0 auto' }} />
            <div ref={basketRef} className="canny-basket">
              <Basket />
            </div>
          </div>
        </>
      )}

      {phase === 'done' && (
        <div className="canny-game-panel">
          <CannyBird pose="happy" size={110} outfit={outfit} />
          <h2>{finalScore === 0 ? 'Oops, none caught!' : `You caught ${finalScore} tee${finalScore === 1 ? '' : 's'}!`}</h2>
          <p className="canny-game-sub">{newBest ? '🎉 New best score!' : `Your best: ${Math.max(bestSoFar, finalScore)}`}</p>
          <div className="canny-game-actions">
            <button type="button" className="canny-game-primary" onClick={start}>
              Play again
            </button>
            <button type="button" onClick={() => onEnd(finalScore)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
