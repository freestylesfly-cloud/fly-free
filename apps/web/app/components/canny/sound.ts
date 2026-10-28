/**
 * Canny's sounds — all synthesised with Web Audio, nothing to download.
 *
 * - babble(): cute "bird talk". Each syllable of a line becomes a short, soft,
 *   rising chirp, the way game mascots talk. It rises at a "?" and bounces at a
 *   "!". This is Canny's voice by default: it always sounds the same, sounds
 *   friendly on every device, and never sounds like a robot.
 * - playVoice(): real words in Canny's cute recorded voice. Every fixed line is
 *   pre-recorded (public/canny-voice, made by scripts/generate-canny-voice.mts)
 *   and played through the same unlocked engine, so it works on every phone.
 * - speak(): the device's own voice, only for text that has no recording.
 * - chirp() / blip(): little effects.
 *
 * Browsers only allow audio that starts from a tap or key press, and iPhones
 * only if the audio engine is switched on *during* that tap. So the engine is
 * created and resumed inside the first gesture, and resumed again on later
 * gestures in case the phone suspended it (a call, the app going to background).
 */

import { speakText } from './voice';

const SOUND_KEY = 'canny_sound';
const WORDS_KEY = 'canny_words';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;
/** The last line said before any tap (when sound is not allowed yet). */
let pending: { line: string; shown: string; at: number } | null = null;

function engine() {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    // One soft master volume and a gentle low-pass keep every sound cute, not shrill.
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3200;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(lowpass).connect(ctx.destination);
  }
  return ctx;
}

if (typeof window !== 'undefined') {
  const wake = () => {
    const firstTap = !unlocked;
    unlocked = true;
    // A line Canny said before this first tap was silent; say it now.
    if (firstTap && pending && Date.now() - pending.at < 10000) {
      const { line, shown } = pending;
      window.setTimeout(() => void sayAloud(line, shown), 60);
    }
    pending = null;
    try {
      const ac = engine();
      if (!ac) return;
      if (ac.state !== 'running') void ac.resume();
      // iOS: playing a silent buffer inside the gesture finishes the unlock.
      const silent = ac.createBuffer(1, 1, 22050);
      const source = ac.createBufferSource();
      source.buffer = silent;
      source.connect(ac.destination);
      source.start(0);
    } catch {
      // No Web Audio: Canny just stays quiet.
    }
  };
  window.addEventListener('pointerdown', wake, { passive: true });
  window.addEventListener('touchend', wake, { passive: true });
  window.addEventListener('keydown', wake);
}

function readFlag(key: string, fallback: boolean) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === 'on';
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    window.localStorage.setItem(key, on ? 'on' : 'off');
  } catch {
    // ignore
  }
}

export const soundEnabled = () => readFlag(SOUND_KEY, true);
export function setSoundEnabled(on: boolean) {
  writeFlag(SOUND_KEY, on);
  if (!on) window.speechSynthesis?.cancel();
}

/** Canny speaks real words (the recorded voice) rather than bird talk. On by default. */
export const wordsEnabled = () => readFlag(WORDS_KEY, true);
export const setWordsEnabled = (on: boolean) => writeFlag(WORDS_KEY, on);

function audio() {
  if (!unlocked || !soundEnabled()) return null;
  const ac = engine();
  if (!ac || !master) return null;
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}

/** One soft rising tone: the building block of every Canny sound. */
function tone(ac: AudioContext, start: number, from: number, to: number, length: number, volume: number, type: OscillatorType = 'sine') {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + length * 0.75);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.012, length / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(master!);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

/** Splits a line into syllable-sized beats for babble(). */
function beats(text: string) {
  const words = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '')
    .toLowerCase()
    .match(/[a-z0-9ऀ-෿']+/g) || [];
  const out: Array<{ seed: number; wordEnd: boolean }> = [];
  for (const word of words) {
    const syllables = Math.min(3, Math.max(1, (word.match(/[aeiouy]+/g) || []).length || Math.ceil(word.length / 3)));
    for (let i = 0; i < syllables; i++) {
      const ch = word.charCodeAt(Math.min(word.length - 1, Math.floor((i / syllables) * word.length)));
      out.push({ seed: ch, wordEnd: i === syllables - 1 });
    }
  }
  return out;
}

/**
 * Cute bird talk for a line of text. Returns how long it lasts (ms), so the
 * beak can move for exactly that long.
 */
export function babble(text: string): number {
  const ac = audio();
  if (!ac) return 0;
  let all = beats(text);
  if (all.length === 0) return 0;
  // Long lines: talk for at most ~2.6s, not the whole paragraph.
  const MAX = 26;
  if (all.length > MAX) all = all.filter((_, i) => i % Math.ceil(all.length / MAX) === 0).slice(0, MAX);

  const excited = /!/.test(text);
  const asking = /\?\s*\W*$/.test(text.trim());
  const base = excited ? 760 : 680;
  let t = ac.currentTime + 0.02;

  all.forEach((beat, i) => {
    // Each letter gives a slightly different, repeatable pitch: it sounds like
    // speech with a melody rather than random beeps.
    const step = ((beat.seed * 37) % 9) - 4; // -4..4
    let pitch = base * Math.pow(2, step / 24);
    const last = i === all.length - 1;
    if (last && asking) pitch *= 1.35;
    if (excited && i % 3 === 0) pitch *= 1.08;
    const length = last ? 0.11 : 0.065;
    tone(ac, t, pitch, pitch * 1.12, length, 0.075, 'triangle');
    tone(ac, t, pitch * 2, pitch * 2.2, length * 0.8, 0.018, 'sine'); // sparkle
    t += length + (beat.wordEnd ? 0.045 : 0.018);
  });
  return Math.round((t - ac.currentTime) * 1000);
}

/**
 * Canny's signature "tweet-tweet!" — two bright, rising notes, the second a
 * little higher. Plays before he speaks. Returns its length in ms.
 */
export function chirp(): number {
  const ac = audio();
  if (!ac) return 0;
  const now = ac.currentTime;
  const base = 1500 + Math.random() * 200;
  tone(ac, now, base, base * 1.5, 0.09, 0.14, 'triangle');
  tone(ac, now + 0.13, base * 1.12, base * 1.7, 0.11, 0.14, 'triangle');
  return 260;
}

/** A tiny pop, for catching a tee. */
export function blip() {
  const ac = audio();
  if (!ac) return;
  tone(ac, ac.currentTime, 700, 1400, 0.07, 0.08, 'triangle');
}

/** Real spoken words in Canny's voice, when the visitor has asked for them. */
export function speak(text: string) {
  if (!unlocked || !soundEnabled() || !wordsEnabled()) return false;
  speakText(text);
  return true;
}

// ---------- recorded voice ----------

const VOICE_BASE = '/canny-voice';
let manifest: Record<string, string> | null = null;
let manifestRequest: Promise<void> | null = null;
const decoded = new Map<string, Promise<AudioBuffer>>();
let current: AudioBufferSourceNode | null = null;

/** Loads the list of recorded lines once (a few KB). */
export function loadVoices() {
  if (manifestRequest || typeof window === 'undefined') return manifestRequest;
  // no-cache: after re-recording, visitors must get the new list, not a stale copy.
  manifestRequest = fetch(`${VOICE_BASE}/manifest.json`, { cache: "no-cache" })
    .then((response) => (response.ok ? response.json() : {}))
    .then((data) => {
      manifest = data || {};
    })
    .catch(() => {
      manifest = {};
    });
  return manifestRequest;
}

/** Whether a line has a recording (exact text, as written in the config). */
export const hasVoice = (line: string) => Boolean(manifest?.[line]);

export function stopVoice() {
  try {
    current?.stop();
  } catch {
    // already stopped
  }
  current = null;
}

/**
 * Plays the recording of a line. Resolves to its length in ms, or 0 when it
 * can't play (no recording, sound off, audio not unlocked yet).
 */
export async function playVoice(line: string): Promise<number> {
  const ac = audio();
  const file = manifest?.[line];
  if (!ac || !file) return 0;
  try {
    let buffer = decoded.get(file);
    if (!buffer) {
      buffer = fetch(`${VOICE_BASE}/${file}`)
        .then((response) => response.arrayBuffer())
        .then((data) => ac.decodeAudioData(data));
      decoded.set(file, buffer);
    }
    const audioBuffer = await buffer;
    stopVoice();
    const source = ac.createBufferSource();
    const gain = ac.createGain();
    gain.gain.value = 1;
    source.buffer = audioBuffer;
    // Straight to the speakers: the soft filter on the chirps would muffle a voice.
    source.connect(gain).connect(ac.destination);
    source.start();
    current = source;
    return Math.round(audioBuffer.duration * 1000);
  } catch {
    decoded.delete(file);
    return 0;
  }
}

if (typeof window !== 'undefined') void loadVoices();

/**
 * Says a line: Canny's recorded voice when there is a recording (waiting for the
 * list of recordings if it is still loading), otherwise cute bird talk.
 * line is the text as written in the config; shown is what is on screen.
 * Resolves to how long the sound lasts in ms (0 if nothing played).
 */
export async function sayAloud(line: string, shown: string = line): Promise<number> {
  if (!soundEnabled()) return 0;
  if (!unlocked) {
    pending = { line, shown, at: Date.now() };
    return 0;
  }
  if (wordsEnabled()) {
    await loadVoices();
    if (hasVoice(line)) {
      // "Tweet-tweet!" first, then the voice.
      const tweet = chirp();
      await new Promise((resolve) => window.setTimeout(resolve, tweet + 60));
      const ms = await playVoice(line);
      if (ms > 0) return tweet + 60 + ms;
    }
  }
  return babble(shown);
}
