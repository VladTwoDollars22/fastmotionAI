// Automated QA + self-healing gate for the motion pipeline.
//
//   npm run render:qa  ->  tsc --noEmit  ->  qa-check.ts  ->  remotion render
//
// Two layers of inspection:
//   1. Static scene-code scan for authoring defects (double hyphens, broken word
//      splits, residual scene opacity, rotated logo wrappers, lingering cursors,
//      forbidden text light-sweeps).
//   2. Frame snapshots via `npx remotion still`, decoded with jpeg-js, checked for
//      blank/empty renders.
//
// Exits non-zero when any ERROR is found so the render chain stops (self-heal).
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import path from "node:path";
import jpeg from "jpeg-js";

const ROOT = path.resolve(__dirname, "..");
const SCENES_DIR = path.join(ROOT, "src", "scenes");
const INPUT_DIR = path.join(ROOT, "input");
const KINETIC = path.join(ROOT, "src", "components", "ui", "KineticText.tsx");
const CLI = path.join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");
const ENTRY = "src/index.ts";
const COMPOSITION = "MainVideo";
const QA_DIR = path.join(ROOT, "output", ".qa");

const SNAPSHOT_FRAMES = [80, 300, 500, 860];
const BLANK_STD_THRESHOLD = 8;

type Severity = "error" | "warn";

interface Finding {
  check: string;
  severity: Severity;
  file: string;
  line: number;
  message: string;
}

const findings: Finding[] = [];
const record = (
  check: string,
  severity: Severity,
  file: string,
  line: number,
  message: string,
): void => {
  findings.push({ check, severity, file, line, message });
};

const rel = (p: string): string => path.relative(ROOT, p).replace(/\\/g, "/");

const walk = (dir: string, ext: string): string[] => {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  const entries = readdirSync(dir);
  for (let i = 0; i < entries.length; i++) {
    const full = path.join(dir, entries[i]);
    const st = statSync(full);
    if (st.isDirectory()) {
      const nested = walk(full, ext);
      for (let j = 0; j < nested.length; j++) out.push(nested[j]);
    } else if (full.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
};

const lineAt = (text: string, index: number): number => {
  let line = 1;
  const stop = Math.min(index, text.length);
  for (let i = 0; i < stop; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
};

// Short Russian/English function words that are legitimate standalone tokens
// (prevents false "mid-word split" reports like "вашу архитектуру").
const STOPWORDS: Record<string, true> = {
  все: true, всё: true, весь: true, вся: true, это: true, этот: true, эта: true,
  эти: true, эту: true, того: true, тому: true, тем: true, тех: true, чем: true,
  кто: true, что: true, где: true, как: true, так: true, там: true, тут: true,
  уже: true, ещё: true, или: true, для: true, при: true, без: true, про: true,
  над: true, под: true, из: true, от: true, до: true, за: true, на: true,
  по: true, не: true, ни: true, но: true, мы: true, вы: true, ты: true,
  он: true, она: true, оно: true, они: true, же: true, ли: true, бы: true,
  да: true, то: true, нас: true, вас: true, нам: true, вам: true, них: true,
  его: true, её: true, ему: true, ей: true, им: true, их: true, мой: true,
  моя: true, свою: true, себя: true, тебя: true, меня: true, ваш: true,
  ваша: true, вашу: true, ваши: true, наш: true, наша: true, нашу: true,
  наши: true, сам: true, сама: true, сами: true, один: true, одна: true,
  два: true, три: true,
};

const PROSE_LITERAL =
  /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`]*)`/g;

const isProse = (value: string): boolean => {
  if (value.length < 6) return false;
  if (!/\s/.test(value)) return false;
  if (/[\u0400-\u04FF]/.test(value)) return true;
  return /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(value);
};

/**
 * Mid-word split detector. High precision: only flags a Cyrillic 3–4 letter
 * fragment glued to a 5+ letter Cyrillic word when the fragment is not a known
 * standalone word (e.g. the "архи тектуру" defect). Code-ish strings are skipped.
 */
const flagBrokenSplits = (value: string, file: string, baseLine: number): void => {
  if (!/[\u0400-\u04FF]/.test(value)) return;
  if (/[{}();=<>\/*]/.test(value)) return;
  const tokens = value.split(/\s+/);
  for (let i = 1; i < tokens.length; i++) {
    const prev = tokens[i - 1].toLowerCase();
    const next = tokens[i].toLowerCase();
    if (
      /^[а-яё]{3,4}$/.test(prev) &&
      /^[а-яё]{5,}$/.test(next) &&
      !STOPWORDS[prev]
    ) {
      record(
        "broken-word-split",
        "warn",
        file,
        baseLine,
        `possible mid-word split: "${tokens[i - 1]} ${tokens[i]}"`,
      );
    }
  }
};

const scanDoubleHyphen = (): void => {
  const bundles = existsSync(INPUT_DIR)
    ? readdirSync(INPUT_DIR).filter((name) => statSync(path.join(INPUT_DIR, name)).isDirectory())
    : [];
  for (let b = 0; b < bundles.length; b++) {
    const dir = path.join(INPUT_DIR, bundles[b]);
    const content = path.join(dir, "content.json");
    if (existsSync(content)) {
      const text = readFileSync(content, "utf8");
      const idx = text.indexOf("--");
      if (idx >= 0) {
        record("double-hyphen", "error", rel(content), lineAt(text, idx), "content contains '--'");
      }
    }
    const prompt = path.join(dir, "prompt.txt");
    if (existsSync(prompt)) {
      const text = readFileSync(prompt, "utf8");
      const idx = text.indexOf("--");
      if (idx >= 0) {
        record("double-hyphen", "warn", rel(prompt), lineAt(text, idx), "prompt contains '--'");
      }
    }
  }
};

const scanScenes = (): void => {
  const files = walk(SCENES_DIR, ".tsx");
  for (let f = 0; f < files.length; f++) {
    const file = files[f];
    const text = readFileSync(file, "utf8");
    const short = rel(file);

    // Prose string literals: double hyphens + broken word splits.
    PROSE_LITERAL.lastIndex = 0;
    let match: RegExpExecArray | null = PROSE_LITERAL.exec(text);
    while (match !== null) {
      const value = match[1] !== undefined ? match[1] : match[2] !== undefined ? match[2] : match[3];
      if (isProse(value)) {
        const line = lineAt(text, match.index);
        if (value.indexOf("--") >= 0) {
          record("double-hyphen", "error", short, line, `text contains '--': "${value.slice(0, 40)}"`);
        }
        flagBrokenSplits(value, short, line);
      }
      match = PROSE_LITERAL.exec(text);
    }

    // Forbidden light-sweep across text.
    const sweepRe = /sweep=\{\s*([0-9]*\.?[0-9]+)\s*\}/g;
    let sweep = sweepRe.exec(text);
    while (sweep !== null) {
      if (parseFloat(sweep[1]) > 0) {
        record("text-sweep", "error", short, lineAt(text, sweep.index), "KineticText sweep must be 0 (text must be solid)");
      }
      sweep = sweepRe.exec(text);
    }

    // Logo wrapper must never rotate.
    if (text.indexOf("logoSrc") >= 0) {
      const rotRe = /rotate\(\s*([^)]*?)\s*\)/g;
      let rot = rotRe.exec(text);
      while (rot !== null) {
        const arg = rot[1].trim();
        if (arg !== "0" && arg !== "0deg") {
          record("logo-rotation", "error", short, lineAt(text, rot.index), `logo wrapper rotates (${arg}) - must stay 0deg`);
        }
        rot = rotRe.exec(text);
      }

      // A logo-reveal screen must not leave a static cursor lingering.
      const cursorIdx = text.indexOf("AnimatedCursor");
      if (cursorIdx >= 0) {
        const after = text.slice(cursorIdx);
        const opacity = /opacity=\{([^}]*)\}/.exec(after);
        if (opacity && opacity[1].indexOf("smoothstep") < 0) {
          record("lingering-cursor", "error", short, lineAt(text, cursorIdx + opacity.index), "cursor stays visible on the final CTA/logo screen");
        }
      }
    }

    // Scene wrapper must fade fully out (no residual overlap with the next scene).
    if (text.indexOf("const outP") >= 0 && !/1\s*-\s*outP/.test(text)) {
      record("overlapping-opacity", "error", short, 1, "beat exit does not reach opacity 0 (scenes overlap)");
    }
  }
};

const scanKineticDefault = (): void => {
  if (!existsSync(KINETIC)) return;
  const text = readFileSync(KINETIC, "utf8");
  const m = /sweep\s*=\s*([0-9]*\.?[0-9]+)\s*,/.exec(text);
  if (m && parseFloat(m[1]) > 0) {
    record("text-sweep", "error", rel(KINETIC), lineAt(text, m.index), "KineticText default sweep must be 0");
  }
};

const runStill = (frame: number, out: string): string | null => {
  try {
    execFileSync(
      process.execPath,
      [CLI, "still", ENTRY, COMPOSITION, out, "--frame", String(frame), "--image-format", "jpeg", "--overwrite", "--quiet", "--log", "error"],
      { cwd: ROOT, stdio: "pipe" },
    );
    return null;
  } catch (err) {
    const e = err as { stderr?: Buffer; message?: string };
    const detail = e.stderr ? e.stderr.toString().split("\n").slice(-3).join(" ").trim() : e.message;
    return detail || "still render failed";
  }
};

const analyze = (buf: Buffer): { mean: number; std: number } | null => {
  try {
    const img = jpeg.decode(buf, { useTArray: true }) as {
      width: number;
      height: number;
      data: Uint8Array;
    };
    const { data, width, height } = img;
    let count = 0;
    let sum = 0;
    let sumSq = 0;
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += lum;
        sumSq += lum * lum;
        count++;
      }
    }
    const mean = sum / count;
    const variance = Math.max(0, sumSq / count - mean * mean);
    return { mean, std: Math.sqrt(variance) };
  } catch {
    return null;
  }
};

const runSnapshots = (): void => {
  mkdirSync(QA_DIR, { recursive: true });
  for (let i = 0; i < SNAPSHOT_FRAMES.length; i++) {
    const frame = SNAPSHOT_FRAMES[i];
    const out = path.join(QA_DIR, `frame-${frame}.jpeg`);
    const failure = runStill(frame, out);
    if (failure) {
      record("snapshot", "error", `${ENTRY}#${COMPOSITION}`, frame, `still render failed: ${failure}`);
      continue;
    }
    const stats = analyze(readFileSync(out));
    if (!stats) {
      record("snapshot", "error", `${ENTRY}#${COMPOSITION}`, frame, "could not decode snapshot");
    } else if (stats.std < BLANK_STD_THRESHOLD) {
      record("blank-frame", "error", `${ENTRY}#${COMPOSITION}`, frame, `frame looks blank (std ${stats.std.toFixed(1)})`);
    }
  }
  rmSync(QA_DIR, { recursive: true, force: true });
};

const report = (): void => {
  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const ordered = errors.concat(warns);

  console.log("\n=== Motion QA report ===");
  if (ordered.length === 0) {
    console.log("PASS - no defects detected.");
  }
  for (let i = 0; i < ordered.length; i++) {
    const f = ordered[i];
    const tag = f.severity === "error" ? "ERROR" : "WARN ";
    console.log(`${tag} [${f.check}] ${f.file}:${f.line} - ${f.message}`);
  }
  console.log(`--- ${errors.length} error(s), ${warns.length} warning(s) ---`);
  if (errors.length > 0) process.exitCode = 1;
};

const main = (): void => {
  scanDoubleHyphen();
  scanScenes();
  scanKineticDefault();
  if (process.argv.indexOf("--skip-snapshots") < 0) runSnapshots();
  report();
};

main();
