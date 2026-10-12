// Synthesizes the shared reusable SFX/music library into public/assets/audio.
// Deterministic (seeded), royalty-free by construction — no network needed.
// Encodes PCM WAV -> MP3 with the ffmpeg bundled with @remotion/compositor.
//
// Usage: npm run audio
import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sfxDir = path.join(root, "public", "assets", "audio", "sfx");
const musicDir = path.join(root, "public", "assets", "audio", "music");
const ffmpeg = path.join(
  root,
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
  "ffmpeg.exe",
);

const SR = 44100;

/** Small deterministic PRNG so every regeneration is byte-identical. */
const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const normalize = (buf, peak = 0.92) => {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max === 0) return buf;
  const k = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= k;
  return buf;
};

const encodeWav = (samples, sampleRate = SR) => {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
};

// ---------------------------------------------------------------------------
// SFX synthesis
// ---------------------------------------------------------------------------

/** Crisp tactile click: broadband transient + low "thock". */
const makeClick = () => {
  const n = Math.floor(SR * 0.06);
  const out = new Float32Array(n);
  const rnd = mulberry32(11);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const transient = (rnd() * 2 - 1) * Math.exp(-90 * t) * 0.8;
    const body = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-42 * t) * 0.5;
    out[i] = transient + body;
  }
  return normalize(out, 0.9);
};

/** Smooth digital whoosh/sweep: band-passed noise with a rising-then-falling cut. */
const makeWhoosh = () => {
  const n = Math.floor(SR * 0.62);
  const out = new Float32Array(n);
  const rnd = mulberry32(23);
  let lp = 0;
  let hp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.pow(Math.sin(Math.PI * t), 1.4);
    const cut = 0.02 + 0.35 * Math.sin(Math.PI * t);
    const noise = rnd() * 2 - 1;
    lp += cut * (noise - lp);
    hp += 0.004 * (lp - hp);
    const band = lp - hp;
    out[i] = band * env * 1.1;
  }
  return normalize(out, 0.85);
};

/** Fast rhythmic counter tick (~8/s when looped). */
const makeTick = () => {
  const n = Math.floor(SR * 0.12);
  const out = new Float32Array(n);
  const rnd = mulberry32(5);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const click = (rnd() * 2 - 1) * Math.exp(-150 * t) * 0.6;
    const tone = Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-120 * t) * 0.5;
    out[i] = click + tone;
  }
  return normalize(out, 0.8);
};

/** Glitch error alert: bit-crushed sample-and-hold noise + sub thump. */
const makeGlitch = () => {
  const n = Math.floor(SR * 0.5);
  const out = new Float32Array(n);
  const rnd = mulberry32(97);
  let held = 0;
  let holdCounter = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // Sample & hold at ~2 kHz, then quantize (bitcrush).
    if (holdCounter <= 0) {
      held = rnd() * 2 - 1;
      holdCounter = Math.max(1, Math.round(SR / 2000));
    }
    holdCounter--;
    const crushed = Math.round(held * 6) / 6;
    const stutter = 0.5 + 0.5 * Math.sin(2 * Math.PI * 22 * t);
    const env = Math.exp(-5.5 * t) * (0.6 + 0.4 * stutter);
    const sub = Math.sin(2 * Math.PI * 58 * t) * Math.exp(-4 * t) * 0.7;
    out[i] = crushed * env * 0.7 + sub;
  }
  return normalize(out, 0.95);
};

/** Success chime: soft bell chord with long decay. */
const makeChime = () => {
  const n = Math.floor(SR * 1.4);
  const out = new Float32Array(n);
  const partials = [
    { f: 1046.5, a: 0.9, d: 3.2 },
    { f: 1318.5, a: 0.6, d: 3.6 },
    { f: 1568.0, a: 0.4, d: 4.0 },
    { f: 2093.0, a: 0.2, d: 5.0 },
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const p of partials) s += Math.sin(2 * Math.PI * p.f * t) * p.a * Math.exp(-p.d * t);
    out[i] = s / 2.1;
  }
  return normalize(out, 0.85);
};

/** Soft ambient pad: detuned sines with slow LFO movement. */
const makeAmbient = () => {
  const dur = 8;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  const voices = [
    { f: 110.0, a: 0.5 },
    { f: 164.81, a: 0.42 },
    { f: 220.0, a: 0.36 },
    { f: 277.18, a: 0.26 },
    { f: 329.63, a: 0.22 },
    { f: 440.0, a: 0.16 },
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (let k = 0; k < voices.length; k++) {
      const v = voices[k];
      const lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * (0.05 + k * 0.021) * t + k * 1.3);
      const detune = 1 + 0.0015 * Math.sin(2 * Math.PI * (0.03 + k * 0.011) * t);
      s += Math.sin(2 * Math.PI * v.f * detune * t) * v.a * lfo;
    }
    const env = Math.min(1, t / 1.6) * Math.min(1, (dur - t) / 2.2);
    out[i] = (s / 1.9) * env;
  }
  return normalize(out, 0.7);
};

// ---------------------------------------------------------------------------
// Encode
// ---------------------------------------------------------------------------

const toMp3 = async (samples, dir, name) => {
  const tmp = path.join(os.tmpdir(), `kilo-${name}.wav`);
  const dst = path.join(dir, `${name}.mp3`);
  await writeFile(tmp, encodeWav(samples));
  execFileSync(
    ffmpeg,
    ["-y", "-hide_banner", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", "192k", "-ar", String(SR), dst],
    { stdio: "inherit" },
  );
  await rm(tmp, { force: true });
  console.log(`  ${path.relative(root, dst)}`);
};

const main = async () => {
  await mkdir(sfxDir, { recursive: true });
  await mkdir(musicDir, { recursive: true });
  console.log("Generating shared audio library -> public/assets/audio/");
  await toMp3(makeClick(), sfxDir, "click_tactile");
  await toMp3(makeWhoosh(), sfxDir, "whoosh_transition");
  await toMp3(makeTick(), sfxDir, "counter_tick");
  await toMp3(makeGlitch(), sfxDir, "glitch_alert");
  await toMp3(makeChime(), sfxDir, "chime_success");
  await toMp3(makeAmbient(), musicDir, "ambient_light");
  console.log("Done.");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
