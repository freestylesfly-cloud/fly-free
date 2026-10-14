'use client';

import type { CSSProperties } from 'react';

/**
 * Canny, drawn in code.
 *
 * An SVG built from separate parts — body, head, tuft, eyes, beak, two wings,
 * feet and a T-shirt — so each part can move on its own: wings flap, eyes blink
 * and follow the cursor, the beak talks. No sprite sheets or 3D model: a pose
 * is a CSS class (see canny.css), and the tee is just a coloured shape with
 * text, so dressing Canny in a theme's colours is a prop.
 */

export type CannyPose = 'idle' | 'happy' | 'talk' | 'fly' | 'run' | 'sleep' | 'point' | 'surprised' | 'dizzy';

export interface CannyOutfitStyle {
  color: string;
  label: string;
  textColor?: string;
}

const INK = '#3a2412';
const CREAM = '#fff4dc';
const YELLOW = '#ffc93c';
const ORANGE = '#ff9f2e';
const BLUE = '#2f8fe0';
const BEAK = '#ff8a1f';

/** One wing, drawn pointing up and out from a shoulder at (0, 0). */
function Wing() {
  return (
    <>
      <path d="M0 0 C18 -28 40 -52 66 -60 C62 -38 46 -14 16 8 Z" fill={BLUE} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M0 4 C18 -16 38 -34 58 -40 C52 -22 38 -6 14 12 Z" fill={ORANGE} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M0 8 C14 -4 28 -16 44 -20 C38 -6 26 4 10 16 Z" fill={CREAM} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </>
  );
}

function Eyes({ pose }: { pose: CannyPose }) {
  if (pose === 'sleep') {
    return (
      <g stroke={INK} strokeWidth={3.5} strokeLinecap="round">
        <path d="M76 84 Q84 88 92 84" fill="none" />
        <path d="M108 84 Q116 88 124 84" fill="none" />
      </g>
    );
  }
  if (pose === 'happy' || pose === 'point' || pose === 'talk') {
    return (
      <g stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M76 86 Q84 76 92 86" />
        <path d="M108 86 Q116 76 124 86" />
      </g>
    );
  }
  if (pose === 'dizzy') {
    return (
      <g stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round">
        <path className="canny-swirl" d="M84 83 m-6 0 a6 6 0 1 0 6 -6 a3.5 3.5 0 1 0 3 4" />
        <path className="canny-swirl" d="M116 83 m-6 0 a6 6 0 1 0 6 -6 a3.5 3.5 0 1 0 3 4" />
      </g>
    );
  }
  const big = pose === 'surprised';
  return (
    <g className="canny-eyes">
      <g className="canny-blink">
        <ellipse cx={84} cy={83} rx={big ? 8 : 6.5} ry={big ? 10 : 8.5} fill={INK} />
        <ellipse cx={116} cy={83} rx={big ? 8 : 6.5} ry={big ? 10 : 8.5} fill={INK} />
        <circle cx={86.5} cy={79} r={2.4} fill="#fff" />
        <circle cx={118.5} cy={79} r={2.4} fill="#fff" />
      </g>
    </g>
  );
}

function Beak({ pose }: { pose: CannyPose }) {
  const open = pose === 'happy' || pose === 'talk' || pose === 'point' || pose === 'surprised';
  if (!open) {
    return <path d="M93 92 Q100 89 107 92 L100 101 Z" fill={BEAK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />;
  }
  return (
    <g className={pose === 'talk' ? 'canny-beak-talk' : undefined}>
      <path d="M91 91 Q100 87 109 91 Q107 106 100 108 Q93 106 91 91 Z" fill="#c2410c" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={100} cy={102} rx={5} ry={3.5} fill="#ff7a8a" />
      <path d="M91 91 Q100 87 109 91 Q104 96 100 96 Q96 96 91 91 Z" fill={BEAK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
}

/** Shrinks long labels so "GUNS N ROSES" still fits across the chest. */
function teeFontSize(label: string) {
  const length = Math.max(label.length, 1);
  return Math.max(6, Math.min(12, 120 / length));
}

export function CannyBird({
  pose = 'idle',
  facing = 'right',
  outfit,
  size = 96,
  style
}: {
  pose?: CannyPose;
  facing?: 'left' | 'right';
  outfit?: CannyOutfitStyle | null;
  size?: number;
  style?: CSSProperties;
}) {
  const label = (outfit?.label || '').toUpperCase().slice(0, 16);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`canny-bird canny--${pose} canny--${facing}`}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className="canny-shadow" cx={100} cy={186} rx={40} ry={6} fill="rgba(0,0,0,.18)" />

      {/* Facing is its own layer: pose animations transform the body group, and
          would otherwise overwrite the mirror. */}
      <g className="canny-facing">
      <g className="canny-body-group">
        {/* Wings sit behind the body; each pivots at its shoulder. */}
        <g className="canny-wing canny-wing--back" transform="translate(62 118) scale(-1 1)">
          <g className="canny-wing-inner">
            <Wing />
          </g>
        </g>
        <g className="canny-wing canny-wing--front" transform="translate(138 118)">
          <g className="canny-wing-inner">
            <Wing />
          </g>
        </g>

        <g className="canny-feet" fill={BEAK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
          <path d="M80 164 l-8 14 q4 2 8 -2 q2 5 7 3 q-1 -6 -1 -15 Z" />
          <path d="M120 164 l8 14 q-4 2 -8 -2 q-2 5 -7 3 q1 -6 1 -15 Z" />
        </g>

        <ellipse cx={100} cy={128} rx={50} ry={46} fill={CREAM} stroke={INK} strokeWidth={3} />

        {outfit && (
          <g className="canny-tee">
            <path
              d="M58 116 Q100 102 142 116 L154 132 L140 138 L138 158 Q100 172 62 158 L60 138 L46 132 Z"
              fill={outfit.color}
              stroke={INK}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            <path d="M86 108 Q100 116 114 108" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            {label && (
              <text
                className="canny-tee-text"
                x={100}
                y={144}
                textAnchor="middle"
                fontSize={teeFontSize(label)}
                fontWeight={900}
                fontFamily="Inter, Arial, sans-serif"
                fill={outfit.textColor || '#fff'}
              >
                {label}
              </text>
            )}
          </g>
        )}

        <g className="canny-head">
          <circle cx={100} cy={80} r={42} fill={CREAM} stroke={INK} strokeWidth={3} />
          <path d="M60 72 A42 42 0 0 1 140 72 Q122 62 100 66 Q78 62 60 72 Z" fill={YELLOW} />
          <circle cx={100} cy={80} r={42} fill="none" stroke={INK} strokeWidth={3} />
          <g className="canny-tuft" fill={YELLOW} stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
            <path d="M98 40 C90 26 96 14 106 10 C102 22 106 30 110 38 Z" />
            <path d="M104 40 C108 28 118 22 128 22 C120 30 118 36 114 42 Z" />
            <path d="M94 41 C86 34 76 34 70 38 C78 40 84 44 88 46 Z" />
          </g>
          <ellipse cx={70} cy={96} rx={8} ry={4.5} fill="#ff9ea0" opacity={0.75} />
          <ellipse cx={130} cy={96} rx={8} ry={4.5} fill="#ff9ea0" opacity={0.75} />
          <Eyes pose={pose} />
          <Beak pose={pose} />
        </g>
      </g>
      </g>

      {pose === 'sleep' && (
        <g className="canny-zzz" fill={BLUE} fontFamily="Inter, Arial, sans-serif" fontWeight={900}>
          <text x={146} y={46} fontSize={18}>z</text>
          <text x={160} y={30} fontSize={14}>z</text>
          <text x={172} y={16} fontSize={11}>z</text>
        </g>
      )}
    </svg>
  );
}
