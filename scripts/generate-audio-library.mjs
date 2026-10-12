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
const TAU = Math.PI * 2;

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

const noise = (rnd) => rnd() * 2 - 1;
const lp1 = (input, prev, a) => prev + a * (input - prev);

const normalize = (buf, peak) => {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max === 0) return buf;
  const k = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= k;
  return buf;
};

/** Render `dur` seconds mono via a per-sample callback fn(t, i, n). */
const render = (dur, fn) => {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i, n);
  return out;
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
// Shared primitives
// ---------------------------------------------------------------------------

/** Band-passed noise whoosh with a moving cut and a sine-window envelope. */
const whoosh = ({ dur, cutBase, cutSwing, curve = 1.4, amp = 1, peak = 0.6, seed }) => {
  const rnd = mulberry32(seed);
  let lp = 0;
  let hp = 0;
  return normalize(
    render(dur, (_t, i, n) => {
      const p = i / (n - 1);
      const env = Math.pow(Math.sin(Math.PI * p), curve);
      const cut = cutBase + cutSwing * Math.sin(Math.PI * p);
      const x = noise(rnd);
      lp = lp1(x, lp, cut);
      hp = lp1(lp, hp, 0.006);
      return (lp - hp) * env * amp;
    }),
    peak,
  );
};

/** Additive bell from [freq, amp, decay] partials. */
const bell = ({ dur, partials, div = 2, peak = 0.6 }) =>
  normalize(
    render(dur, (t) => {
      let s = 0;
      for (const [f, a, d] of partials) s += Math.sin(TAU * f * t) * a * Math.exp(-d * t);
      return s / div;
    }),
    peak,
  );

/** Staggered arpeggio of partials (rising "level up" / sparkle). */
const arpeggio = ({ dur, freqs, step, amp = 0.45, decay = 6, peak = 0.6 }) =>
  normalize(
    render(dur, (t) => {
      let s = 0;
      freqs.forEach((f, k) => {
        const d = t - k * step;
        if (d >= 0) s += Math.sin(TAU * f * d) * amp * Math.exp(-decay * d);
      });
      return s;
    }),
    peak,
  );

// ---------------------------------------------------------------------------
// 1) Clicks & Taps
// ---------------------------------------------------------------------------
const click_soft_light = () => {
  const rnd = mulberry32(101);
  let lp = 0;
  return normalize(
    render(0.09, (t) => {
      lp = lp1(noise(rnd), lp, 0.55);
      return (
        lp * Math.exp(-60 * t) * 0.5 +
        Math.sin(TAU * 230 * t) * Math.exp(-45 * t) * 0.5 +
        Math.sin(TAU * 1250 * t) * Math.exp(-75 * t) * 0.28
      );
    }),
    0.7,
  );
};

const click_tactile_bubble = () => {
  let ph = 0;
  return normalize(
    render(0.14, (t) => {
      const f = 480 + 500 * (t / 0.14);
      ph += (TAU * f) / SR;
      return Math.sin(ph) * Math.exp(-30 * t) * 0.6;
    }),
    0.68,
  );
};

const click_switch_toggle = () =>
  normalize(
    render(0.12, (t) => {
      const tick = Math.sin(TAU * 1400 * t) * Math.exp(-90 * t) * 0.4;
      const d = t - 0.045;
      const tok = d > 0 ? Math.sin(TAU * 320 * d) * Math.exp(-55 * d) * 0.55 : 0;
      return tick + tok;
    }),
    0.7,
  );

const click_subtle_press = () => {
  const rnd = mulberry32(104);
  let lp = 0;
  return normalize(
    render(0.11, (t) => {
      lp = lp1(noise(rnd), lp, 0.25);
      return lp * Math.exp(-45 * t) * 0.5 + Math.sin(TAU * 170 * t) * Math.exp(-38 * t) * 0.55;
    }),
    0.66,
  );
};

const tap_modern_ui = () => {
  const rnd = mulberry32(105);
  let lp = 0;
  return normalize(
    render(0.08, (t) => {
      lp = lp1(noise(rnd), lp, 0.6);
      return lp * Math.exp(-70 * t) * 0.55 + Math.sin(TAU * 900 * t) * Math.exp(-80 * t) * 0.3;
    }),
    0.68,
  );
};

const tap_glass_soft = () =>
  normalize(
    render(0.26, (t) => {
      return (
        Math.sin(TAU * 1800 * t) * Math.exp(-22 * t) * 0.5 +
        Math.sin(TAU * 2650 * t) * Math.exp(-28 * t) * 0.32 +
        Math.sin(TAU * 3900 * t) * Math.exp(-34 * t) * 0.18
      );
    }),
    0.58,
  );

// ---------------------------------------------------------------------------
// 2) Whooshes & Transitions
// ---------------------------------------------------------------------------
const whoosh_air_fast = () =>
  whoosh({ dur: 0.45, cutBase: 0.05, cutSwing: 0.35, curve: 1.2, peak: 0.6, seed: 201 });
const whoosh_deep_sweep = () =>
  whoosh({ dur: 0.7, cutBase: 0.02, cutSwing: 0.16, curve: 1.6, peak: 0.62, seed: 202 });
const whoosh_subtle_slide = () =>
  whoosh({ dur: 0.55, cutBase: 0.04, cutSwing: 0.18, curve: 1.8, amp: 0.7, peak: 0.5, seed: 203 });
const transition_smooth_pass = () =>
  whoosh({ dur: 0.6, cutBase: 0.05, cutSwing: 0.22, curve: 1.5, peak: 0.55, seed: 204 });
const transition_light_breeze = () =>
  whoosh({ dur: 0.85, cutBase: 0.1, cutSwing: 0.3, curve: 1.3, amp: 0.65, peak: 0.5, seed: 205 });

const transition_pop_swipe = () => {
  const base = whoosh({ dur: 0.42, cutBase: 0.04, cutSwing: 0.3, curve: 1.2, peak: 0.55, seed: 206 });
  const pop = render(0.42, (t) => {
    const d = t - 0.3;
    if (d < 0) return 0;
    const f = 500 + 420 * (d / 0.12);
    return Math.sin(TAU * f * d) * Math.exp(-30 * d) * 0.5;
  });
  const mixed = new Float32Array(base.length);
  for (let i = 0; i < base.length; i++) mixed[i] = base[i] + pop[i];
  return normalize(mixed, 0.62);
};

// ---------------------------------------------------------------------------
// 3) Interface Pops & Inputs
// ---------------------------------------------------------------------------
const pop_soft_notification = () =>
  normalize(
    render(0.38, (t) => {
      const e1 = Math.exp(-14 * t);
      const d = t - 0.09;
      const e2 = d > 0 ? Math.exp(-14 * d) : 0;
      return Math.sin(TAU * 880 * t) * e1 * 0.45 + Math.sin(TAU * 1174.66 * t) * e2 * 0.45;
    }),
    0.58,
  );

const pop_micro_bubble = () => {
  let ph = 0;
  return normalize(
    render(0.13, (t) => {
      const f = 420 + 520 * (t / 0.13);
      ph += (TAU * f) / SR;
      return Math.sin(ph) * Math.exp(-32 * t) * 0.7;
    }),
    0.62,
  );
};

const type_single_keystroke = () => {
  const rnd = mulberry32(303);
  let lp = 0;
  return normalize(
    render(0.07, (t) => {
      lp = lp1(noise(rnd), lp, 0.5);
      return lp * Math.exp(-85 * t) * 0.5 + Math.sin(TAU * 520 * t) * Math.exp(-90 * t) * 0.3;
    }),
    0.56,
  );
};

const type_fast_subtle_burst = () => {
  const rnd = mulberry32(304);
  const hits = [];
  let f = 0;
  for (let k = 0; k < 12; k++) {
    hits.push(f);
    f += 0.03 + rnd() * 0.02;
  }
  return normalize(
    render(0.55, (t) => {
      let s = 0;
      for (const h of hits) {
        const d = t - h;
        if (d >= 0 && d < 0.06) {
          s += noise(rnd) * Math.exp(-80 * d) * 0.4 + Math.sin(TAU * 540 * d) * Math.exp(-85 * d) * 0.25;
        }
      }
      return s;
    }),
    0.58,
  );
};

const input_autofill_sweep = () => {
  const rnd = mulberry32(305);
  let lp = 0;
  let ph = 0;
  return normalize(
    render(0.6, (t, i, n) => {
      const p = i / (n - 1);
      lp = lp1(noise(rnd), lp, 0.05 + 0.4 * p);
      const env = Math.pow(Math.sin(Math.PI * p), 1.2);
      const f = 300 + 700 * p;
      ph += (TAU * f) / SR;
      return (lp * 0.7 + Math.sin(ph) * 0.3) * env;
    }),
    0.6,
  );
};

const modal_open_damped = () => {
  const rnd = mulberry32(306);
  let lp = 0;
  return normalize(
    render(0.5, (t) => {
      lp = lp1(noise(rnd), lp, 0.08);
      return (
        Math.sin(TAU * 130 * t) * Math.exp(-18 * t) * 0.6 + lp * Math.exp(-9 * t) * 0.25
      );
    }),
    0.62,
  );
};

// ---------------------------------------------------------------------------
// 4) Counters, Tickers & Chimes
// ---------------------------------------------------------------------------
const counter_tick_soft = () => {
  const rnd = mulberry32(401);
  let lp = 0;
  return normalize(
    render(0.1, (t) => {
      lp = lp1(noise(rnd), lp, 0.7);
      return lp * Math.exp(-120 * t) * 0.5 + Math.sin(TAU * 2600 * t) * Math.exp(-130 * t) * 0.35;
    }),
    0.52,
  );
};

const counter_rapid_pulse = () => {
  const rnd = mulberry32(402);
  let lp = 0;
  return normalize(
    render(0.07, (t) => {
      lp = lp1(noise(rnd), lp, 0.85);
      return lp * Math.exp(-160 * t) * 0.5 + Math.sin(TAU * 3400 * t) * Math.exp(-150 * t) * 0.3;
    }),
    0.48,
  );
};

const chime_success_warm = () =>
  bell({
    dur: 1.3,
    partials: [
      [1046.5, 0.9, 3.0],
      [1318.5, 0.6, 3.4],
      [1568.0, 0.4, 3.8],
    ],
    peak: 0.58,
  });

const chime_sparkle_light = () =>
  arpeggio({
    dur: 1.0,
    freqs: [2637.0, 3136.0, 3951.0, 4699.0],
    step: 0.05,
    amp: 0.4,
    decay: 9,
    peak: 0.5,
  });

const score_level_up = () =>
  arpeggio({
    dur: 1.1,
    freqs: [523.25, 659.25, 783.99, 1046.5],
    step: 0.09,
    amp: 0.45,
    decay: 5,
    peak: 0.58,
  });

const checkmark_ding_crisp = () =>
  bell({
    dur: 0.9,
    partials: [
      [1568.0, 0.9, 3.2],
      [2349.0, 0.4, 4.0],
      [3136.0, 0.2, 5.0],
    ],
    div: 1.8,
    peak: 0.56,
  });

// ---------------------------------------------------------------------------
// 5) Impacts & Accents
// ---------------------------------------------------------------------------
const impact_soft_thud = () => {
  const rnd = mulberry32(501);
  let lp = 0;
  return normalize(
    render(0.4, (t) => {
      lp = lp1(noise(rnd), lp, 0.05);
      return Math.sin(TAU * 95 * t) * Math.exp(-16 * t) * 0.7 + lp * Math.exp(-30 * t) * 0.25;
    }),
    0.68,
  );
};

const impact_subtle_bass = () => {
  let ph = 0;
  return normalize(
    render(0.6, (t) => {
      const f = 58 - 14 * (t / 0.6);
      ph += (TAU * f) / SR;
      const env = Math.exp(-7 * t);
      return Math.sin(ph) * env * 0.8 + Math.sin(ph * 2) * env * 0.12;
    }),
    0.7,
  );
};

const accent_glitch_clean = () => {
  const rnd = mulberry32(503);
  let held = 0;
  let hc = 0;
  return normalize(
    render(0.4, (t) => {
      if (hc <= 0) {
        held = noise(rnd);
        hc = Math.max(1, Math.round(SR / 1600));
      }
      hc--;
      const q = Math.round(held * 8) / 8;
      const stut = 0.6 + 0.4 * Math.sin(TAU * 18 * t);
      const env = Math.exp(-7 * t) * stut;
      return q * env * 0.35 + Math.sin(TAU * 70 * t) * Math.exp(-5 * t) * 0.5;
    }),
    0.66,
  );
};

const accent_alert_soft_warning = () => {
  const seq = [
    [740, 0],
    [620, 0.22],
  ];
  return normalize(
    render(0.72, (t) => {
      let s = 0;
      for (const [f, st] of seq) {
        const d = t - st;
        if (d >= 0) s += Math.sin(TAU * f * d) * Math.exp(-6 * d) * 0.5;
      }
      return s;
    }),
    0.58,
  );
};

const accent_light_shimmer = () => {
  const rnd = mulberry32(505);
  let lp = 0;
  let hp = 0;
  return normalize(
    render(0.85, (_t, i, n) => {
      const p = i / (n - 1);
      lp = lp1(noise(rnd), lp, 0.25);
      hp = lp1(lp, hp, 0.02);
      const env = Math.pow(Math.sin(Math.PI * p), 1.5);
      return (lp - hp) * env * 0.8;
    }),
    0.48,
  );
};

const accent_pulse_subtle = () => {
  const rnd = mulberry32(506);
  let lp = 0;
  return normalize(
    render(0.3, (t) => {
      lp = lp1(noise(rnd), lp, 0.12);
      return (Math.sin(TAU * 300 * t) * 0.5 + lp * 0.3) * Math.exp(-14 * t);
    }),
    0.6,
  );
};

// ---------------------------------------------------------------------------
// Music bed
// ---------------------------------------------------------------------------
const ambient_light = () => {
  const dur = 8;
  const voices = [
    [110.0, 0.5],
    [164.81, 0.42],
    [220.0, 0.36],
    [277.18, 0.26],
    [329.63, 0.22],
    [440.0, 0.16],
  ];
  return normalize(
    render(dur, (t) => {
      let s = 0;
      voices.forEach(([f, a], k) => {
        const lfo = 0.6 + 0.4 * Math.sin(TAU * (0.05 + k * 0.021) * t + k * 1.3);
        const detune = 1 + 0.0015 * Math.sin(TAU * (0.03 + k * 0.011) * t);
        s += Math.sin(TAU * f * detune * t) * a * lfo;
      });
      const env = Math.min(1, t / 1.6) * Math.min(1, (dur - t) / 2.2);
      return (s / 1.9) * env;
    }),
    0.7,
  );
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

const SFX = {
  // 1) Clicks & Taps
  click_soft_light,
  click_tactile_bubble,
  click_switch_toggle,
  click_subtle_press,
  tap_modern_ui,
  tap_glass_soft,
  // 2) Whooshes & Transitions
  whoosh_air_fast,
  whoosh_deep_sweep,
  whoosh_subtle_slide,
  transition_smooth_pass,
  transition_light_breeze,
  transition_pop_swipe,
  // 3) Interface Pops & Inputs
  pop_soft_notification,
  pop_micro_bubble,
  type_single_keystroke,
  type_fast_subtle_burst,
  input_autofill_sweep,
  modal_open_damped,
  // 4) Counters, Tickers & Chimes
  counter_tick_soft,
  counter_rapid_pulse,
  chime_success_warm,
  chime_sparkle_light,
  score_level_up,
  checkmark_ding_crisp,
  // 5) Impacts & Accents
  impact_soft_thud,
  impact_subtle_bass,
  accent_glitch_clean,
  accent_alert_soft_warning,
  accent_light_shimmer,
  accent_pulse_subtle,
};

const main = async () => {
  await mkdir(sfxDir, { recursive: true });
  await mkdir(musicDir, { recursive: true });
  console.log("Generating shared audio library -> public/assets/audio/");
  for (const [name, fn] of Object.entries(SFX)) await toMp3(fn(), sfxDir, name);
  await toMp3(ambient_light(), musicDir, "ambient_light");
  console.log(`Done. ${Object.keys(SFX).length} SFX + 1 music bed.`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
