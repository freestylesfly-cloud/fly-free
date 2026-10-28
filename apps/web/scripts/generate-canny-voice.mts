/**
 * Records Canny's voice: every fixed line, spoken in a cute female voice by
 * Kokoro (open-source neural text-to-speech, Apache-2.0 — free for commercial
 * use), saved as small MP3s in public/canny-voice/ with a manifest.json that
 * maps each line to its file. The website just plays the files, so every
 * visitor hears the same voice and no speech library is shipped to them.
 *
 * The voice library is ~80 MB and only needed here, so it is not a project
 * dependency. Install it once in any folder:
 *
 *   mkdir canny-tts && cd canny-tts && npm init -y && npm i kokoro-js @breezystack/lamejs
 *
 * then, from apps/web:
 *
 *   CANNY_TTS_DEPS=/path/to/canny-tts npx tsx scripts/generate-canny-voice.mts
 *
 * Options (environment variables):
 *   CANNY_VOICE  Kokoro voice, default af_heart (try af_bella, af_nicole, af_sky)
 *   CANNY_SPEED  speaking speed, default 1.05
 *
 * Re-run after changing any line in canny/flyfree.ts or canny/voiceLines.ts.
 * Unchanged lines are skipped; recordings no longer used are deleted.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FLYFREE_CANNY } from '../app/components/canny/flyfree';
import { CHAT_LINES, SPOKEN_OVERRIDES } from '../app/components/canny/voiceLines';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'public', 'canny-voice');
const VOICE = process.env.CANNY_VOICE || 'af_heart';
const SPEED = Number(process.env.CANNY_SPEED || 1.05);
const DEPS = process.env.CANNY_TTS_DEPS;

if (!DEPS) {
  console.error('Set CANNY_TTS_DEPS to the folder where kokoro-js and @breezystack/lamejs are installed (see the top of this file).');
  process.exit(1);
}

const { KokoroTTS } = await import(pathToFileURL(join(DEPS, 'node_modules/kokoro-js/dist/kokoro.js')).href);
const { Mp3Encoder } = await import(pathToFileURL(join(DEPS, 'node_modules/@breezystack/lamejs/dist/lamejs.js')).href);

/** Every line as written in the config — these are the manifest keys. */
const lines = [
  ...new Set([
    ...Object.values(FLYFREE_CANNY.lines).flat(),
    ...FLYFREE_CANNY.tips.map((tip) => tip.text),
    ...Object.values(CHAT_LINES)
  ])
];

/** What is actually said: emoji and symbols out, blanks replaced. */
function spoken(line: string) {
  const text = (SPOKEN_OVERRIDES[line] ?? line)
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
  return /\{\w+\}/.test(text) ? null : text;
}

function toMp3(samples: Float32Array, rate: number) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const encoder = new Mp3Encoder(1, rate, 48);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const chunk = encoder.encodeBuffer(pcm.subarray(i, i + 1152));
    if (chunk.length) chunks.push(new Uint8Array(chunk));
  }
  chunks.push(new Uint8Array(encoder.flush()));
  return Buffer.concat(chunks);
}

mkdirSync(OUT, { recursive: true });
console.log(`Loading Kokoro (voice ${VOICE}, speed ${SPEED})...`);
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });

const manifest: Record<string, string> = {};
let made = 0;
let reused = 0;
for (const line of lines) {
  const text = spoken(line);
  if (!text) {
    console.warn(`  skipped (has a blank with no SPOKEN_OVERRIDES entry): ${line}`);
    continue;
  }
  const file = `${createHash('sha1').update(`${VOICE}|${SPEED}|${text}`).digest('hex').slice(0, 12)}.mp3`;
  manifest[line] = file;
  if (existsSync(join(OUT, file))) {
    reused++;
    continue;
  }
  const audio = await tts.generate(text, { voice: VOICE, speed: SPEED });
  writeFileSync(join(OUT, file), toMp3(audio.audio as Float32Array, audio.sampling_rate));
  made++;
  console.log(`  ${made}. ${text}`);
}

// Drop recordings nothing points at any more.
const keep = new Set(Object.values(manifest));
let removed = 0;
for (const name of readdirSync(OUT)) {
  if (name.endsWith('.mp3') && !keep.has(name)) {
    unlinkSync(join(OUT, name));
    removed++;
  }
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`Done: ${made} recorded, ${reused} unchanged, ${removed} removed, ${Object.keys(manifest).length} lines in manifest.`);
