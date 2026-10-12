import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import jpeg from "jpeg-js";
import { mulberry32 } from "../src/utils/prng.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "input", "_template", "sources");
const sfxDir = path.join(outDir, "sfx");

let crcTable = null;
const makeCrcTable = () => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
};
const crc32 = (buf) => {
  if (!crcTable) crcTable = makeCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const pngChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
};
const encodePng = (w, h, rgba) => {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
};
const inRounded = (x, y, w, h, r) => {
  const dx = Math.max(r - x, x - (w - r), 0);
  const dy = Math.max(r - y, y - (h - r), 0);
  return dx * dx + dy * dy <= r * r;
};

const encodeWav = (samples, sampleRate) => {
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

const SR = 44100;

const makeWhoosh = () => {
  const n = Math.floor(SR * 0.45);
  const out = new Float32Array(n);
  const rnd = mulberry32(7);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.pow(Math.sin(Math.PI * t), 1.5);
    const noise = rnd() * 2 - 1;
    lp = lp + (0.02 + 0.2 * t) * (noise - lp);
    out[i] = lp * env * 0.7;
  }
  return out;
};

const makePop = () => {
  const n = Math.floor(SR * 0.14);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 800 * Math.exp(-8 * t) + 200;
    phase += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(phase) * Math.exp(-18 * t) * 0.8;
  }
  return out;
};

const makeClick = () => {
  const n = Math.floor(SR * 0.035);
  const out = new Float32Array(n);
  const rnd = mulberry32(11);
  for (let i = 0; i < n; i++) out[i] = (rnd() * 2 - 1) * Math.exp(-70 * (i / SR)) * 0.7;
  return out;
};

const makeDing = () => {
  const n = Math.floor(SR * 1.4);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-5 * t);
    const s =
      Math.sin(2 * Math.PI * 880 * t) +
      0.5 * Math.sin(2 * Math.PI * 1320 * t) +
      0.25 * Math.sin(2 * Math.PI * 1760 * t);
    out[i] = (s / 1.75) * env * 0.7;
  }
  return out;
};

const makeMusic = () => {
  const dur = 10;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  const freqs = [110, 164.81, 220, 329.63, 440];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (let k = 0; k < freqs.length; k++) {
      const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * (0.07 + k * 0.03) * t + k);
      s += Math.sin(2 * Math.PI * freqs[k] * t) * lfo;
    }
    const env = Math.min(1, t / 1.5) * Math.min(1, (dur - t) / 2);
    out[i] = (s / freqs.length) * 0.5 * env;
  }
  return out;
};

const makeVoiceover = () => {
  const dur = 4;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 150 + 30 * Math.sin(2 * Math.PI * 0.7 * t);
    let s = 0;
    for (let h = 1; h <= 5; h++) s += Math.sin(2 * Math.PI * f * h * t) / h;
    const am = 0.6 + 0.4 * Math.sin(2 * Math.PI * 4.5 * t);
    const env = Math.min(1, t / 0.3) * Math.min(1, (dur - t) / 0.5);
    out[i] = (s / 2.2) * am * env * 0.6;
  }
  return out;
};

const makeLogo = () => {
  const w = 512;
  const h = 512;
  const data = Buffer.alloc(w * h * 4);
  const primary = [124, 92, 255];
  const accent = [34, 211, 238];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!inRounded(x, y, w, h, 120)) {
        data[i + 3] = 0;
        continue;
      }
      const t = (x / w) * 0.5 + (y / h) * 0.5;
      data[i] = Math.round(primary[0] * (1 - t) + accent[0] * t);
      data[i + 1] = Math.round(primary[1] * (1 - t) + accent[1] * t);
      data[i + 2] = Math.round(primary[2] * (1 - t) + accent[2] * t);
      data[i + 3] = 255;
      const cx = x - w / 2;
      const cy = y - h / 2;
      const d = Math.sqrt(cx * cx + cy * cy);
      if (Math.abs(d - 150) < 12) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
    }
  }
  return encodePng(w, h, data);
};

const makeProduct = () => {
  const w = 900;
  const h = 900;
  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const t = y / h;
      let r = 12 + t * 20;
      let g = 10 + t * 40;
      let b = 40 + t * 90;
      const b1 = Math.exp(-(((x - 300) ** 2 + (y - 280) ** 2) / (2 * 180 * 180)));
      const b2 = Math.exp(-(((x - 620) ** 2 + (y - 640) ** 2) / (2 * 220 * 220)));
      r += b1 * 120 + b2 * 20;
      g += b1 * 60 + b2 * 140;
      b += b1 * 180 + b2 * 200;
      data[i] = Math.min(255, Math.round(r));
      data[i + 1] = Math.min(255, Math.round(g));
      data[i + 2] = Math.min(255, Math.round(b));
      data[i + 3] = 255;
    }
  }
  return jpeg.encode({ data, width: w, height: h }, 88).data;
};

const main = async () => {
  await mkdir(sfxDir, { recursive: true });
  await writeFile(path.join(outDir, "logo.png"), makeLogo());
  await writeFile(path.join(outDir, "product.jpg"), makeProduct());
  await writeFile(path.join(outDir, "music.wav"), encodeWav(makeMusic(), SR));
  await writeFile(path.join(outDir, "voiceover.wav"), encodeWav(makeVoiceover(), SR));
  await writeFile(path.join(sfxDir, "whoosh.wav"), encodeWav(makeWhoosh(), SR));
  await writeFile(path.join(sfxDir, "pop.wav"), encodeWav(makePop(), SR));
  await writeFile(path.join(sfxDir, "click.wav"), encodeWav(makeClick(), SR));
  await writeFile(path.join(sfxDir, "ding.wav"), encodeWav(makeDing(), SR));
  console.log("Generated sample assets in input/_template/sources");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
