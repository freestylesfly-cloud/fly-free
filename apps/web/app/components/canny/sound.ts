/**
 * Canny's voice: a synthesised chirp (Web Audio) and spoken lines (the
 * browser's built-in speech). No audio files to download.
 *
 * Browsers refuse to play sound before the visitor has interacted with the
 * page, so nothing plays until the first tap, click or key press. The visitor
 * can switch it all off from Canny's menu; that choice is remembered.
 */

const KEY = 'canny_sound';
let ctx: AudioContext | null = null;
let unlocked = false;

if (typeof window !== 'undefined') {
  const unlock = () => {
    unlocked = true;
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

export function soundEnabled() {
  try {
    return window.localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // ignore
  }
  if (!on) window.speechSynthesis?.cancel();
}

function audio() {
  if (!unlocked || !soundEnabled()) return null;
  try {
    ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One rising whistle — the building block of a tweet. */
function whistle(ac: AudioContext, start: number, from: number, to: number, length: number, volume = 0.12) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + length * 0.7);
  osc.frequency.exponentialRampToValueAtTime(to * 0.85, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

/** A short "tweet-tweet", slightly different each time. */
export function chirp() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const notes = 2 + Math.round(Math.random());
  for (let i = 0; i < notes; i++) {
    const base = 2100 + Math.random() * 500;
    whistle(ac, now + i * 0.11, base, base * 1.45, 0.08);
  }
}

/** A tiny pop, for catching a tee. */
export function blip() {
  const ac = audio();
  if (!ac) return;
  whistle(ac, ac.currentTime, 900, 1800, 0.07, 0.1);
}

/** Speaks a line in a small, bright voice. Emoji and symbols are skipped. */
export function speak(text: string) {
  if (!unlocked || !soundEnabled() || !('speechSynthesis' in window)) return;
  const words = text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!words) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const line = new SpeechSynthesisUtterance(words);
  const voices = synth.getVoices();
  line.voice =
    voices.find((v) => /en[-_]IN/i.test(v.lang)) ||
    voices.find((v) => /female|zira|samantha|google uk english female/i.test(v.name)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null;
  line.pitch = 1.7;
  line.rate = 1.05;
  line.volume = 0.9;
  synth.speak(line);
}
