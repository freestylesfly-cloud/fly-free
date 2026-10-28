/**
 * Canny's speaking voice — one voice for the speech bubbles and the chat.
 *
 * Uses the browser's built-in speech (free, nothing to download). Voices differ
 * by device, so instead of taking the default — often a male or robotic one —
 * this picks the best female English voice available, preferring Indian English,
 * and tunes it to sound warm and bright rather than squeaky.
 *
 * Long text is spoken sentence by sentence: Chrome silently stops a single
 * utterance after about 15 seconds.
 */

/** Best first. Matched against the voice name, case-insensitively. */
const PREFERRED_FEMALE = [
  /neerja/i, // Microsoft Neerja (Natural) — en-IN, Edge
  /heera/i, // Microsoft Heera — en-IN, Windows
  /veena/i, // Veena — en-IN, Apple
  /google uk english female/i,
  /aria|jenny|sonia|libby|natasha|clara/i, // Microsoft natural female voices
  /samantha|karen|moira|tessa|serena|fiona|victoria/i, // Apple female voices
  /zira|hazel|susan|catherine|linda/i, // Windows female voices
  /female|woman/i
];

/** Never pick these, even as a fallback. */
const MALE = /\b(male|david|mark|ravi|rishi|prabhat|daniel|alex|fred|guy|george|james|ryan|thomas|oliver|arthur|aaron|rocko|grandpa)\b/i;

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis?.getVoices() || [];
  if (voices.length === 0) return null; // not loaded yet; try again next time
  const english = voices.filter((voice) => /^en/i.test(voice.lang) && !MALE.test(voice.name));
  const indian = english.filter((voice) => /en[-_]IN/i.test(voice.lang));

  let choice: SpeechSynthesisVoice | undefined;
  for (const pattern of PREFERRED_FEMALE) {
    choice = english.find((voice) => pattern.test(voice.name));
    if (choice) break;
  }
  // Android names its voices by language only ("English India"); those are
  // female by default, so an Indian English voice is the next best thing.
  choice = choice || indian[0] || english[0] || voices.find((voice) => !MALE.test(voice.name));
  cachedVoice = choice || null;
  return cachedVoice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Chrome loads voices asynchronously; re-pick once they arrive.
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = undefined;
    pickVoice();
  });
}

/** Turns chat text into something pleasant to hear. */
export function toSpeech(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [label](link) → label
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_#`~>]/g, '')
    .replace(/₹\s?([\d,]+)/g, '$1 rupees')
    .replace(/\bRs\.?\s?([\d,]+)/gi, '$1 rupees')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s*·\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chrome quirks this works around:
 * - Utterances that are only referenced by the speech queue can be garbage
 *   collected, and then simply never play. Every queued line is kept here until
 *   it has finished.
 * - speak() straight after cancel() is often dropped, so new speech starts a
 *   moment after the old speech is cancelled.
 * - The engine can be left paused; resume() before speaking.
 */
let queued: SpeechSynthesisUtterance[] = [];
let startTimer: number | undefined;
let finish: (() => void) | null = null;

export function stopSpeaking() {
  window.clearTimeout(startTimer);
  finish?.();
  finish = null;
  queued = [];
  window.speechSynthesis?.cancel();
}

/**
 * Speaks text in Canny's voice. Calls onStart when speech begins and onEnd
 * exactly once, when the last sentence finishes or speech is stopped or fails.
 */
export function speakText(text: string, handlers: { onStart?: () => void; onEnd?: () => void } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const words = toSpeech(text);
  if (!words) return;

  stopSpeaking();
  const synth = window.speechSynthesis;
  const sentences = words.match(/[^.!?]+[.!?]*/g)?.map((part) => part.trim()).filter(Boolean) || [words];

  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    window.clearTimeout(watchdog);
    if (finish === end) finish = null;
    handlers.onEnd?.();
  };
  finish = end;
  // If the device never starts speaking (no voice installed, blocked audio),
  // don't leave the UI saying "speaking" forever.
  let started = false;
  const watchdog = window.setTimeout(() => !started && end(), 4000);

  startTimer = window.setTimeout(() => {
    const voice = pickVoice();
    queued = sentences.map((sentence, index) => {
      const line = new SpeechSynthesisUtterance(sentence);
      if (voice) {
        line.voice = voice;
        line.lang = voice.lang;
      } else {
        line.lang = 'en-IN';
      }
      // Warm and bright, not squeaky: a touch above natural pitch, natural pace.
      line.pitch = 1.15;
      line.rate = 1;
      line.volume = 1;
      if (index === 0) {
        line.onstart = () => {
          started = true;
          handlers.onStart?.();
        };
      }
      if (index === sentences.length - 1) line.onend = end;
      line.onerror = end;
      return line;
    });
    synth.resume();
    queued.forEach((line) => synth.speak(line));
  }, 80);
}
