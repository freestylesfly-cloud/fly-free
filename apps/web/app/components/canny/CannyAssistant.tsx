'use client';

import './canny.css';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { CannyBird, type CannyOutfitStyle, type CannyPose } from './CannyBird';
import { CannyGame } from './CannyGame';
import { getCannyOutfit, onCannyOutfit, onCannySay } from './bus';

/**
 * Canny — an on-page companion in the spirit of Shimeji desktop pets.
 *
 * Nothing in this file knows about Fly Free: what Canny says, which buttons it
 * points at and what it wears all come from `config` (see flyfree.ts), so the
 * same component drops into another project with a different config.
 *
 * Behaviour, roughly:
 * - roams: hops along the floor, flies about, says something now and then;
 * - falls asleep after a while with no activity, and wakes when you come back;
 * - eyes follow the cursor; it turns to face you;
 * - drag it anywhere — it stays there (remembered across pages);
 * - tap it for a menu: say hi, ask a question, play Tee Catch, follow me, nap, hide;
 * - guides: on matching pages it flies to a button and points at it, once;
 * - reacts to hovering products and to fast scrolling;
 * - wears the outfit the current page announces (<CannyOutfit />).
 *
 * Movement is a CSS transform on one fixed element, written directly to the DOM
 * during drags and follows so the page never re-renders per frame.
 */

export interface CannyTip {
  id: string;
  /** Pages this tip applies to. */
  path: RegExp;
  /** The element to point at. */
  target: string;
  text: string;
  delayMs?: number;
}

export interface CannyLines {
  greeting: string[];
  welcomeBack: string[];
  hi: string[];
  idle: string[];
  wake: string[];
  drop: string[];
  tickle: string[];
  scrollFast: string[];
  pageEnd: string[];
  hover: string[];
  /** May use {label}. */
  newOutfit: string[];
  followStart: string[];
  followEnd: string[];
  nap: string[];
  gameStart: string[];
  /** May use {score} and {best}. */
  gameEnd: string[];
  hide: string[];
}

export interface CannyConfig {
  name: string;
  storageKey: string;
  defaultOutfit: CannyOutfitStyle;
  lines: CannyLines;
  tips: CannyTip[];
  /** Hovering one of these for a moment gets a comment. */
  hoverTarget?: string;
  /** Space kept free below Canny's floor, e.g. for a mobile tab bar. */
  bottomOffset: { mobile: number; desktop: number };
  /** Keep Canny out of this much of the right edge (e.g. a chat button). */
  rightReserve: { mobile: number; desktop: number };
  onAsk?: () => void;
  askLabel?: string;
}

type Mode = 'roam' | 'drag' | 'follow' | 'guide' | 'sleep' | 'game';

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function storage(key: string, value?: string | null) {
  try {
    if (value === undefined) return window.localStorage.getItem(key);
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: Canny just forgets.
  }
  return null;
}

function sessionSet(key: string) {
  try {
    return new Set<string>(JSON.parse(window.sessionStorage.getItem(key) || '[]'));
  } catch {
    return new Set<string>();
  }
}

function sessionAdd(key: string, id: string) {
  try {
    const set = sessionSet(key);
    set.add(id);
    window.sessionStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export function CannyAssistant({ config, path }: { config: CannyConfig; path: string }) {
  const { lines, storageKey: K } = config;

  const rootRef = useRef<HTMLDivElement>(null);
  const birdRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 16, y: 0 });
  const moveMsRef = useRef(0);
  const modeRef = useRef<Mode>('roam');
  const lastActivity = useRef(Date.now());
  const pointer = useRef({ x: 0, y: 0 });
  const timers = useRef<number[]>([]);
  const bubbleTimer = useRef<number | undefined>(undefined);
  const poseTimer = useRef<number | undefined>(undefined);
  const reduced = useRef(false);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const [ready, setReady] = useState(false);
  const [size, setSize] = useState(96);
  const [pose, setPoseState] = useState<CannyPose>('idle');
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [bubble, setBubble] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [outfit, setOutfit] = useState<CannyOutfitStyle>(config.defaultOutfit);

  const sizeRef = useRef(size);
  sizeRef.current = size;
  const bubbleRef = useRef(bubble);
  bubbleRef.current = bubble;
  const menuRef = useRef(menuOpen);
  menuRef.current = menuOpen;
  const hiddenRef = useRef(hidden);
  hiddenRef.current = hidden;
  const facingRef = useRef(facing);
  facingRef.current = facing;

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  // ---------- geometry ----------
  const isMobile = () => window.innerWidth < 768;
  /**
   * Where Canny stands: above the configured offset, and above any fixed bar a
   * page marks with `data-canny-floor` (a tab bar, a sticky Buy-now bar), so it
   * never sits on top of a button.
   */
  const floorY = () => {
    let floor = window.innerHeight - sizeRef.current - (isMobile() ? config.bottomOffset.mobile : config.bottomOffset.desktop);
    document.querySelectorAll('[data-canny-floor]').forEach((bar) => {
      const r = bar.getBoundingClientRect();
      if (r.height > 0 && r.top > window.innerHeight / 2) floor = Math.min(floor, r.top - sizeRef.current - 4);
    });
    return floor;
  };
  const maxX = () =>
    window.innerWidth - sizeRef.current - (isMobile() ? config.rightReserve.mobile : config.rightReserve.desktop);

  const applyTransform = () => {
    const el = rootRef.current;
    if (!el) return;
    const { x, y } = posRef.current;
    const ms = moveMsRef.current;
    el.style.transition = ms ? `transform ${ms}ms cubic-bezier(.45,.05,.35,1)` : 'none';
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  };

  const place = (x: number, y: number, ms = 0) => {
    posRef.current = {
      x: clamp(x, 6, window.innerWidth - sizeRef.current - 6),
      y: clamp(y, 6, window.innerHeight - sizeRef.current - 6)
    };
    moveMsRef.current = reduced.current ? 0 : ms;
    applyTransform();
  };

  const savePosition = () => {
    const { x, y } = posRef.current;
    storage(`${K}:pos`, JSON.stringify({ x, fromBottom: window.innerHeight - y }));
  };

  const homePosition = () => {
    try {
      const saved = JSON.parse(storage(`${K}:pos`) || 'null');
      if (saved && Number.isFinite(saved.x)) {
        return { x: clamp(saved.x, 6, maxX()), y: clamp(window.innerHeight - saved.fromBottom, 60, floorY()) };
      }
    } catch {
      // fall through
    }
    return { x: 16, y: floorY() };
  };

  // ---------- pose, speech ----------
  const setPose = useCallback((next: CannyPose, forMs?: number) => {
    window.clearTimeout(poseTimer.current);
    setPoseState(next);
    if (forMs) {
      poseTimer.current = window.setTimeout(() => {
        setPoseState(modeRef.current === 'sleep' ? 'sleep' : 'idle');
      }, forMs);
    }
  }, []);

  const say = useCallback(
    (text: string, ms?: number) => {
      if (!text || hiddenRef.current) return;
      window.clearTimeout(bubbleTimer.current);
      setBubble(text);
      setPoseState((current) => (current === 'idle' ? 'talk' : current));
      const duration = ms ?? clamp(2600 + text.length * 45, 3000, 7000);
      bubbleTimer.current = window.setTimeout(() => {
        setBubble(null);
        setPoseState((current) => (current === 'talk' ? 'idle' : current));
      }, duration);
    },
    []
  );

  /** Moves with a travel pose, resolving on arrival. */
  const moveTo = (x: number, y: number, travel: CannyPose, speed: number) =>
    new Promise<void>((resolve) => {
      const from = posRef.current;
      const distance = Math.hypot(x - from.x, y - from.y);
      if (distance < 4 || reduced.current) {
        place(x, y, 0);
        resolve();
        return;
      }
      if (Math.abs(x - from.x) > 4) setFacing(x < from.x ? 'left' : 'right');
      const ms = clamp(distance / speed, 280, 1800);
      setPose(travel);
      place(x, y, ms);
      later(() => {
        if (modeRef.current !== 'sleep') setPose('idle');
        resolve();
      }, ms);
    });

  // ---------- mount ----------
  useEffect(() => {
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const measure = () => setSize(window.innerWidth < 768 ? 72 : 96);
    measure();
    setHidden(storage(`${K}:hidden`) === '1');
    setOutfit(getCannyOutfit() || config.defaultOutfit);
    setReady(true);
    const onResize = () => {
      measure();
      later(() => place(posRef.current.x, Math.min(posRef.current.y, floorY()), 0), 50);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      timers.current.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(bubbleTimer.current);
      window.clearTimeout(poseTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // First placement once the size is known.
  useEffect(() => {
    if (!ready) return;
    const home = homePosition();
    place(home.x, home.y, 0);
    rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, size]);

  // ---------- greeting ----------
  useEffect(() => {
    if (!ready || hidden) return;
    let tries = 0;
    const greet = () => {
      // Never talk over a modal (e.g. the sponsorship announcement).
      if (document.querySelector('[aria-modal="true"]') && tries++ < 10) {
        later(greet, 2000);
        return;
      }
      const returning = storage(`${K}:visited`) === '1';
      storage(`${K}:visited`, '1');
      setPose('happy', 1600);
      say(pick(returning ? lines.welcomeBack : lines.greeting));
    };
    if (!sessionSet(`${K}:session`).has('greeted')) {
      sessionAdd(`${K}:session`, 'greeted');
      later(greet, 1800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hidden]);

  // ---------- outfit ----------
  useEffect(() => {
    if (!ready) return;
    return onCannyOutfit((next) => {
      const style = next || config.defaultOutfit;
      setOutfit(style);
      if (next && !sessionSet(`${K}:outfits`).has(next.label)) {
        sessionAdd(`${K}:outfits`, next.label);
        later(() => {
          if (modeRef.current !== 'roam' || bubbleRef.current) return;
          setPose('happy', 1400);
          say(fill(pick(lines.newOutfit), { label: next.label }));
        }, 1400);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    return onCannySay((text) => {
      setPose('happy', 1400);
      say(text);
    });
  }, [ready, say, setPose]);

  // ---------- activity, eyes, sleep ----------
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const wake = () => {
      lastActivity.current = Date.now();
      if (modeRef.current === 'sleep') {
        modeRef.current = 'roam';
        setPose('surprised', 900);
        later(() => say(pick(lines.wake)), 300);
      }
    };
    const onMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      wake();
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = birdRef.current;
        if (!el) return;
        const s = sizeRef.current;
        const cx = posRef.current.x + s / 2;
        const cy = posRef.current.y + s * 0.4;
        const dx = pointer.current.x - cx;
        const dy = pointer.current.y - cy;
        el.style.setProperty('--canny-look-x', String(clamp(dx / 300, -1, 1) * (facingRef.current === 'left' ? -1 : 1)));
        el.style.setProperty('--canny-look-y', String(clamp(dy / 300, -1, 1)));
        if (modeRef.current === 'roam' && Math.abs(dx) > s * 1.5) {
          const want = dx < 0 ? 'left' : 'right';
          if (facingRef.current !== want) setFacing(want);
        }
      });
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
    window.addEventListener('pointermove', onMove, { passive: true });
    events.forEach((name) => window.addEventListener(name, wake, { passive: true }));
    const sleepCheck = window.setInterval(() => {
      if (modeRef.current === 'roam' && !menuRef.current && Date.now() - lastActivity.current > 30000) {
        modeRef.current = 'sleep';
        setBubble(null);
        setPose('sleep');
      }
    }, 5000);
    return () => {
      window.removeEventListener('pointermove', onMove);
      events.forEach((name) => window.removeEventListener(name, wake));
      window.clearInterval(sleepCheck);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ---------- roaming ----------
  useEffect(() => {
    if (!ready || hidden || reduced.current) return;
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      const busy =
        modeRef.current !== 'roam' || menuRef.current || bubbleRef.current || document.hidden ||
        Date.now() - lastActivity.current > 25000;
      if (!busy) {
        const roll = Math.random();
        if (roll < 0.42) {
          await moveTo(12 + Math.random() * Math.max(maxX() - 12, 20), floorY(), 'run', 0.16);
        } else if (roll < 0.6) {
          const y = window.innerHeight * (0.3 + Math.random() * 0.35);
          await moveTo(12 + Math.random() * Math.max(maxX() - 12, 20), y, 'fly', 0.45);
          await new Promise((resolve) => later(() => resolve(null), 1800));
          if (modeRef.current === 'roam') {
            const home = homePosition();
            await moveTo(home.x, home.y, 'fly', 0.45);
          }
        } else if (roll < 0.82) {
          say(pick(lines.idle));
        } else {
          setPose('happy', 1200);
        }
      }
      if (alive) later(tick, 7000 + Math.random() * 8000);
    };
    later(tick, 9000);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hidden]);

  // ---------- new page: step up onto its floor ----------
  useEffect(() => {
    if (!ready || hidden) return;
    const id = later(() => {
      if (modeRef.current === 'roam' && posRef.current.y > floorY()) {
        void moveTo(posRef.current.x, floorY(), 'fly', 0.4);
      }
    }, 700);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hidden, path]);

  // ---------- page guide tips ----------
  useEffect(() => {
    if (!ready || hidden) return;
    const shown = sessionSet(`${K}:tips`);
    const tip = config.tips.find((candidate) => candidate.path.test(path) && !shown.has(candidate.id));
    if (!tip) return;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const guide = async (el: Element) => {
      if (cancelled || modeRef.current === 'game' || modeRef.current === 'drag') return;
      sessionAdd(`${K}:tips`, tip.id);
      modeRef.current = 'guide';
      setMenuOpen(false);
      const r = el.getBoundingClientRect();
      const s = sizeRef.current;
      let x: number;
      let y: number;
      let face: 'left' | 'right' = 'right';
      if (isMobile()) {
        // No room beside a button on a phone: hover just above it instead.
        x = clamp(r.left + r.width / 2 - s / 2, 6, window.innerWidth - s - 6);
        y = clamp(r.top - s - 4, 6, window.innerHeight - s - 6);
        face = x + s / 2 < window.innerWidth / 2 ? 'right' : 'left';
      } else {
        x = r.left - s - 6;
        if (x < 6) {
          x = r.right + 6;
          face = 'left';
        }
        y = clamp(r.top + r.height / 2 - s * 0.55, 6, window.innerHeight - s - 6);
      }
      await moveTo(x, y, 'fly', 0.5);
      if (cancelled) return;
      setFacing(face);
      setPose('point');
      say(tip.text, 6500);
      const endGuide = () => {
        window.removeEventListener('scroll', endGuide);
        if (modeRef.current !== 'guide') return;
        modeRef.current = 'roam';
        setBubble(null);
        const home = homePosition();
        void moveTo(home.x, home.y, 'fly', 0.5);
      };
      window.addEventListener('scroll', endGuide, { passive: true, once: true });
      later(endGuide, 7000);
    };

    let attempts = 0;
    const find = () => {
      if (cancelled) return;
      // A page can render the same button twice (desktop panel, mobile sticky
      // bar); use the one actually on screen, else the first one laid out.
      const candidates = Array.from(document.querySelectorAll(tip.target)).filter((node) => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const el =
        candidates.find((node) => {
          const r = node.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= window.innerHeight;
        }) || candidates[0];
      if (!el) {
        if (attempts++ < 10) later(find, 1000);
        return;
      }
      const r = el.getBoundingClientRect();
      const visible = r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0;
      if (visible) {
        void guide(el);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.intersectionRatio > 0.9)) {
            observer?.disconnect();
            // Let the scroll settle so Canny is not chasing a moving target.
            later(() => void guide(el), 700);
          }
        },
        { threshold: [0.9] }
      );
      observer.observe(el);
    };
    later(find, tip.delayMs ?? 2500);
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (modeRef.current === 'guide') modeRef.current = 'roam';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hidden, path]);

  // ---------- hover + scroll reactions ----------
  useEffect(() => {
    if (!ready || hidden) return;
    let hoverTimer: number | undefined;
    let lastHoverLine = 0;
    let lastScrollLine = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let endSaid = false;
    const canHover = window.matchMedia?.('(hover: hover)').matches;

    const onOver = (event: PointerEvent) => {
      if (!config.hoverTarget || !canHover) return;
      const target = (event.target as Element | null)?.closest?.(config.hoverTarget);
      window.clearTimeout(hoverTimer);
      if (!target) return;
      hoverTimer = window.setTimeout(() => {
        if (modeRef.current !== 'roam' || bubbleRef.current || Date.now() - lastHoverLine < 45000) return;
        lastHoverLine = Date.now();
        setPose('happy', 1200);
        say(pick(lines.hover));
      }, 1300);
    };
    const onScroll = () => {
      const now = performance.now();
      const speed = Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1);
      lastY = window.scrollY;
      lastT = now;
      if (modeRef.current !== 'roam') return;
      if (speed > 2.5 && Date.now() - lastScrollLine > 60000) {
        lastScrollLine = Date.now();
        setPose('fly', 1000);
        say(pick(lines.scrollFast));
      }
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      if (atEnd && !endSaid && document.documentElement.scrollHeight > window.innerHeight * 2) {
        endSaid = true;
        say(pick(lines.pageEnd));
      }
    };
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(hoverTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hidden, path]);

  // ---------- menu: close on outside tap / Escape ----------
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // ---------- drag, tap ----------
  const drag = useRef<{ id: number; startX: number; startY: number; offX: number; offY: number; moved: boolean; t: number } | null>(null);
  const clicks = useRef<number[]>([]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (modeRef.current === 'game') return;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offX: event.clientX - posRef.current.x,
      offY: event.clientY - posRef.current.y,
      moved: false,
      t: Date.now()
    };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < 6) return;
    if (!d.moved) {
      d.moved = true;
      modeRef.current = 'drag';
      setMenuOpen(false);
      setBubble(null);
      setPose('fly');
    }
    place(event.clientX - d.offX, event.clientY - d.offY, 0);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== event.pointerId) return;
    if (d.moved) {
      modeRef.current = 'roam';
      savePosition();
      const far = Math.hypot(event.clientX - d.startX, event.clientY - d.startY) > 220;
      setPose(far ? 'dizzy' : 'happy', 1500);
      say(pick(lines.drop));
      return;
    }
    tap();
  };

  const tap = () => {
    lastActivity.current = Date.now();
    if (modeRef.current === 'follow') {
      stopFollow();
      return;
    }
    if (modeRef.current === 'sleep') {
      modeRef.current = 'roam';
      setPose('surprised', 900);
      say(pick(lines.wake));
      return;
    }
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 1500), now];
    if (clicks.current.length >= 4) {
      clicks.current = [];
      setMenuOpen(false);
      setPose('happy', 1600);
      say(pick(lines.tickle));
      return;
    }
    setBubble(null);
    setMenuOpen((open) => !open);
  };

  // ---------- follow mode ----------
  const followFrame = useRef(0);
  const followUntil = useRef(0);

  const stopFollow = () => {
    cancelAnimationFrame(followFrame.current);
    modeRef.current = 'roam';
    say(pick(lines.followEnd));
    const x = posRef.current.x;
    void moveTo(x, floorY(), 'fly', 0.4).then(savePosition);
  };

  const startFollow = () => {
    setMenuOpen(false);
    modeRef.current = 'follow';
    followUntil.current = Date.now() + 15000;
    say(pick(lines.followStart));
    const step = () => {
      if (modeRef.current !== 'follow') return;
      if (Date.now() > followUntil.current) {
        stopFollow();
        return;
      }
      const s = sizeRef.current;
      const tx = pointer.current.x + 18;
      const ty = pointer.current.y - s * 0.2;
      const { x, y } = posRef.current;
      const nx = x + (tx - x) * 0.09;
      const ny = y + (ty - y) * 0.09;
      const moving = Math.hypot(nx - x, ny - y) > 0.8;
      place(nx, ny, 0);
      setPoseState((current) => (moving ? 'fly' : current === 'fly' ? 'idle' : current));
      if (Math.abs(tx - x) > 6) {
        const want = tx < x ? 'left' : 'right';
        if (facingRef.current !== want) setFacing(want);
      }
      followFrame.current = requestAnimationFrame(step);
    };
    followFrame.current = requestAnimationFrame(step);
  };

  // ---------- menu actions ----------
  const startGame = () => {
    setMenuOpen(false);
    modeRef.current = 'game';
    setPlaying(true);
    const s = sizeRef.current;
    void moveTo(window.innerWidth / 2 - s / 2, floorY(), 'fly', 0.6);
    say(pick(lines.gameStart), 2600);
  };

  const endGame = useCallback(
    (score: number) => {
      setPlaying(false);
      modeRef.current = 'roam';
      const best = Math.max(score, Number(storage(`${K}:best`) || 0));
      storage(`${K}:best`, String(best));
      setPose('happy', 2200);
      say(fill(pick(lines.gameEnd), { score, best }), 5000);
      later(() => {
        const home = homePosition();
        void moveTo(home.x, home.y, 'fly', 0.45);
      }, 2500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [K]
  );

  const hide = () => {
    setMenuOpen(false);
    say(pick(lines.hide), 1600);
    later(() => {
      setBubble(null);
      setHidden(true);
      storage(`${K}:hidden`, '1');
    }, 1500);
  };

  const unhide = () => {
    setHidden(false);
    storage(`${K}:hidden`, null);
    later(() => {
      setPose('happy', 1400);
      say(pick(lines.hi));
    }, 200);
  };

  if (!ready) return null;

  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (hidden) {
    return (
      <button
        type="button"
        className="canny-restore"
        style={{ bottom: (mobile ? config.bottomOffset.mobile : config.bottomOffset.desktop) + 8 }}
        onClick={unhide}
        aria-label={`Bring ${config.name} back`}
        title={`Bring ${config.name} back`}
      >
        <CannyBird size={34} pose="idle" outfit={null} />
      </button>
    );
  }

  const { x, y } = posRef.current;
  const below = y < 170;
  const alignEnd = x > window.innerWidth / 2;

  const menuItems: Array<{ label: string; run: () => void }> = [
    {
      label: '👋 Say hi',
      run: () => {
        setMenuOpen(false);
        setPose('happy', 1400);
        say(pick(lines.hi));
      }
    },
    ...(config.onAsk ? [{ label: config.askLabel || '💬 Ask me anything', run: () => { setMenuOpen(false); config.onAsk?.(); } }] : []),
    { label: '🎮 Play Tee Catch', run: startGame },
    ...(reduced.current ? [] : [{ label: '🐾 Follow me', run: startFollow }]),
    {
      label: '😴 Take a nap',
      run: () => {
        setMenuOpen(false);
        say(pick(lines.nap), 1800);
        later(() => {
          modeRef.current = 'sleep';
          lastActivity.current = 0;
          setBubble(null);
          setPose('sleep');
        }, 1800);
      }
    },
    { label: '🙈 Hide', run: hide }
  ];

  return (
    <>
      {playing && <CannyGame onEnd={endGame} onCatch={() => setPose('happy', 500)} />}
      <div
        ref={rootRef}
        className="canny-root"
        style={{
          width: size,
          height: size,
          zIndex: playing ? 1260 : undefined,
          transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
        }}
      >
        {bubble && (
          <div
            className={`canny-bubble ${below ? 'canny-bubble--below' : ''} ${alignEnd ? 'canny-bubble--end' : ''}`}
            role="status"
            aria-live="polite"
            onClick={() => setBubble(null)}
          >
            <span className="canny-bubble-name">{config.name}</span>
            {bubble}
          </div>
        )}

        {menuOpen && (
          <div className={`canny-menu ${below ? 'canny-menu--below' : ''} ${alignEnd ? 'canny-menu--end' : ''}`} role="menu">
            {menuItems.map((item) => (
              <button key={item.label} type="button" role="menuitem" onClick={item.run}>
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div
          ref={birdRef}
          className="canny-hit"
          role="button"
          tabIndex={0}
          aria-label={`${config.name}. Open menu`}
          aria-expanded={menuOpen}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              tap();
            }
          }}
        >
          <CannyBird pose={pose} facing={facing} outfit={outfit} size={size} />
        </div>
      </div>
    </>
  );
}
