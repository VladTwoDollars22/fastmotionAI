import { staticFile } from "remotion";
import type { LoadedProject, ProjectScene } from "../../utils/projectLoader";
import { resolveSceneSprings, type SceneSprings } from "../../utils/motionPresets";

/**
 * Resolved design tokens for the widescreen promo engine. Everything comes from
 * `styleguide.json` (`colors` + flat `palette` tokens); the literals below are
 * neutral fallbacks used only when a bundle omits a token.
 */
export interface PromoPalette {
  background: string;
  card: string;
  primary: string;
  accent: string;
  danger: string;
  secondary: string;
  text: string;
  muted: string;
}

export type PromoRole = "hook" | "showcase" | "offer" | "cta" | "generic";

export interface PromoBeat {
  scene: ProjectScene;
  role: PromoRole;
  start: number;
  durationInFrames: number;
}

/** Props every promo beat renderer receives (frame inside is beat-local). */
export interface PromoSceneProps {
  beat: PromoBeat;
  brief: PromoBrief;
}

/**
 * Beat-specific tokens extracted from the bundle copy and `prompt.txt` brief.
 * Each has a neutral fallback so any bundle stays renderable.
 */
export interface PromoBrief {
  brand: string;
  url: string;
  fontFamily: string;
  monoFamily: string;
  palette: PromoPalette;
  springs: SceneSprings;
  beats: PromoBeat[];
  totalFrames: number;
  /** Seconds the hook's lag timer counts to (from "... за 3 секунды?"). */
  lagSeconds: number;
  /** Short seconds unit found in the copy (e.g. "сек"); falls back to "s". */
  secondsUnit: string;
  /** Headline of the showcase beat split on bullet separators. */
  featureSegments: string[];
  /** Language codes for the toggle pills (e.g. RU / EN / UK). */
  languages: string[];
  gaugeFrom: number;
  gaugeTarget: number;
  gaugeLabel: string;
  /** Primary action label clicked in the offer modal. */
  actionLabel: string;
  /** Duration chip in the offer modal (e.g. "15 мин"), or "" when absent. */
  offerDurationLabel: string;
  offerMinutes: number;
  /** Resolved logo URL (via `resolveMedia` + `staticFile`) or null. */
  logoSrc: string | null;
}

const ROLE_BY_TYPE: Record<string, PromoRole> = {
  problem_hook: "hook",
  hook: "hook",
  feature_showcase: "showcase",
  showcase: "showcase",
  offer_modal: "offer",
  offer: "offer",
  cta_resolution: "cta",
  cta: "cta",
};

const roleFor = (scene: ProjectScene): PromoRole =>
  ROLE_BY_TYPE[scene.type] ?? ROLE_BY_TYPE[scene.id] ?? "generic";

const HEX = /^#([0-9a-f]{6})$/i;

const pickHex = (...candidates: Array<string | undefined | null>): string => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && HEX.test(candidate)) return candidate;
  }
  return "#000000";
};

/** First family of a CSS font list, with a cross-platform UI fallback stack. */
const fontStack = (family: string, fallback: string): string => {
  const first = family.split(",")[0]?.trim();
  return first ? `${first}, ${fallback}` : fallback;
};

const firstMatch = (source: string, pattern: RegExp): RegExpMatchArray | null =>
  source.length > 0 ? source.match(pattern) : null;

/**
 * Gauge start score. The brief only fixes the target (`NN/100`); this is the
 * neutral "poor" value the gauge climbs from.
 */
const DEFAULT_GAUGE_FROM = 42;

export const buildPromoBrief = (project: LoadedProject): PromoBrief => {
  const { styleguide, content, prompt } = project;
  const tokens = styleguide.palette?.tokens ?? {};

  const palette: PromoPalette = {
    background: pickHex(tokens.background, styleguide.colors.background, "#F8FAFC"),
    card: pickHex(tokens.card, "#FFFFFF"),
    primary: pickHex(tokens.primary, styleguide.colors.primary),
    accent: pickHex(tokens.accent, styleguide.colors.accent),
    danger: pickHex(tokens.crimson, tokens.danger, tokens.error, "#EF4444"),
    secondary: pickHex(tokens.secondary, "#1E293B"),
    text: pickHex(tokens.textDark, styleguide.colors.text),
    muted: pickHex(tokens.textMuted, styleguide.colors.muted),
  };

  let cursor = 0;
  const beats: PromoBeat[] = content.scenes.map((scene) => {
    const beat: PromoBeat = {
      scene,
      role: roleFor(scene),
      start: cursor,
      durationInFrames: scene.durationInFrames,
    };
    cursor += scene.durationInFrames;
    return beat;
  });

  const findScene = (role: PromoRole): ProjectScene | undefined =>
    beats.find((beat) => beat.role === role)?.scene;
  const hook = findScene("hook");
  const showcase = findScene("showcase");
  const offer = findScene("offer");
  const cta = findScene("cta");

  const allCopy = content.scenes.map((s) => `${s.headline} ${s.body}`).join(" ");

  const lagMatch = firstMatch(
    hook?.headline ?? "",
    /(\d+(?:[.,]\d+)?)\s*(?:сек|s(?:ec|econds?)?\b)/i,
  );
  const lagSeconds = lagMatch ? parseFloat(lagMatch[1].replace(",", ".")) : 3;
  const unitMatch = firstMatch(allCopy, /\d\s*(сек)/i);

  const featureSegments = (showcase?.headline ?? "")
    .split(/\s*[•·|]\s*/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const langMatch = firstMatch(prompt, /\b([A-Z]{2}(?:\s*\/\s*[A-Z]{2})+)\b/);
  const languages = langMatch
    ? langMatch[1].split("/").map((code) => code.trim())
    : [];

  const gaugeMatch = firstMatch(prompt, /(\d{1,3})\s*\/\s*100\b/);
  const gaugeTarget = gaugeMatch
    ? Math.min(100, Math.max(0, parseInt(gaugeMatch[1], 10)))
    : 100;
  const gaugeLabel = /pagespeed/i.test(prompt) ? "PageSpeed" : "";

  const actionMatch = firstMatch(
    prompt,
    /(?:click(?:ing|s)?|hitting|press(?:ing)?)\s+["“«]([^"”»]+)["”»]/i,
  );
  const actionLabel = actionMatch ? actionMatch[1].trim() : content.cta;

  const minutesMatch = firstMatch(offer?.headline ?? "", /(\d+)\s*-?\s*(мин|min)/i);
  const offerMinutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  const offerDurationLabel = minutesMatch ? `${minutesMatch[1]} ${minutesMatch[2]}` : "";

  const logoRef = cta?.media ?? beats.find((b) => b.scene.media)?.scene.media ?? null;
  const logoPath = logoRef ? project.resolveMedia(logoRef) : null;

  return {
    brand: styleguide.brand,
    url: content.cta,
    fontFamily: fontStack(
      styleguide.fonts.heading,
      '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif',
    ),
    monoFamily: '"JetBrains Mono", Consolas, "Cascadia Code", monospace',
    palette,
    springs: resolveSceneSprings(styleguide.motionPresets),
    beats,
    totalFrames: Math.max(1, cursor),
    lagSeconds: Number.isFinite(lagSeconds) && lagSeconds > 0 ? lagSeconds : 3,
    secondsUnit: unitMatch ? unitMatch[1] : "s",
    featureSegments,
    languages,
    gaugeFrom: Math.min(DEFAULT_GAUGE_FROM, gaugeTarget),
    gaugeTarget,
    gaugeLabel,
    actionLabel,
    offerDurationLabel,
    offerMinutes,
    logoSrc: logoPath ? staticFile(logoPath) : null,
  };
};

// ---------------------------------------------------------------------------
// Colour helpers (frame-independent, pure).
// ---------------------------------------------------------------------------

const hexToRgb = (hex: string): [number, number, number] => {
  const raw = hex.replace("#", "");
  const value = parseInt(raw.length === 3 ? raw.replace(/(.)/g, "$1$1") : raw, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

export const withAlpha = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha)).toFixed(3)})`;
};

/** Linear RGB mix returning a `#rrggbb` hex (so it can be fed back to `withAlpha`). */
export const mixHex = (from: string, to: string, t: number): string => {
  const k = Math.min(1, Math.max(0, t));
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const hex = a
    .map((channel, i) => Math.round(channel + (b[i] - channel) * k).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex}`;
};

const rgbToHsl = ([r, g, b]: [number, number, number]): [number, number, number] => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
};

/**
 * Hue-space interpolation: red → green travels through orange/amber (the
 * familiar score-gauge ramp) instead of muddy olive.
 */
export const lerpHsl = (from: string, to: string, t: number): string => {
  const k = Math.min(1, Math.max(0, t));
  const a = rgbToHsl(hexToRgb(from));
  const b = rgbToHsl(hexToRgb(to));
  let dh = b[0] - a[0];
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const h = (a[0] + dh * k + 360) % 360;
  const s = a[1] + (b[1] - a[1]) * k;
  const l = a[2] + (b[2] - a[2]) * k;
  return `hsl(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`;
};

/** Ease helper: clamped 0..1 progress between two local frames. */
export const progressBetween = (frame: number, start: number, end: number): number =>
  Math.min(1, Math.max(0, (frame - start) / Math.max(1, end - start)));
