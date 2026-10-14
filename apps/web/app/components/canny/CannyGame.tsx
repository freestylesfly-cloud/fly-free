'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * "Tee Catch": tees drop from the top of the screen; tap them before they fall
 * off the bottom. Twenty seconds a round. Pure DOM and CSS animations — each tee
 * is a button, so it works with a mouse, a finger or the keyboard.
 */

const ROUND_SECONDS = 20;
const TEE_COLORS = ['#2563eb', '#ff4a4e', '#ffb703', '#22c55e', '#111827', '#a855f7'];

interface Drop {
  id: number;
  left: number;
  duration: number;
  color: string;
  caught: boolean;
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

export function CannyGame({
  onCatch,
  onEnd
}: {
  onCatch?: (score: number) => void;
  onEnd: (score: number) => void;
}) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const scoreRef = useRef(0);
  const nextId = useRef(0);
  const ended = useRef(false);

  useEffect(() => {
    const spawn = window.setInterval(() => {
      const id = nextId.current++;
      setDrops((current) => [
        ...current.filter((drop) => !drop.caught || id - drop.id < 6).slice(-24),
        {
          id,
          left: 4 + Math.random() * 84,
          // Faster as the round goes on.
          duration: Math.max(1.8, 3.8 - (id / 30) * 1.6),
          color: TEE_COLORS[id % TEE_COLORS.length],
          caught: false
        }
      ]);
    }, 650);
    const clock = window.setInterval(() => setLeft((value) => value - 1), 1000);
    return () => {
      window.clearInterval(spawn);
      window.clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    if (left <= 0 && !ended.current) {
      ended.current = true;
      onEnd(scoreRef.current);
    }
  }, [left, onEnd]);

  function catchDrop(id: number) {
    setDrops((current) => current.map((drop) => (drop.id === id ? { ...drop, caught: true } : drop)));
    scoreRef.current += 1;
    setScore(scoreRef.current);
    onCatch?.(scoreRef.current);
  }

  return (
    <div className="canny-game" role="dialog" aria-label="Tee Catch game">
      <div className="canny-game-hud">
        <span>👕 {score}</span>
        <span>⏱ {Math.max(left, 0)}s</span>
        <button
          type="button"
          onClick={() => {
            if (ended.current) return;
            ended.current = true;
            onEnd(scoreRef.current);
          }}
        >
          Stop
        </button>
      </div>
      {drops.map((drop) => (
        <button
          key={drop.id}
          type="button"
          aria-label="Catch the tee"
          disabled={drop.caught}
          className="canny-tee-drop"
          style={{ left: `${drop.left}%`, animationDuration: `${drop.duration}s` }}
          onPointerDown={() => !drop.caught && catchDrop(drop.id)}
        >
          {/* The button keeps falling; only the tee inside bursts away when caught. */}
          <span className={drop.caught ? 'canny-tee-caught' : undefined} style={{ display: 'block' }}>
            <Tee color={drop.color} />
          </span>
        </button>
      ))}
    </div>
  );
}
