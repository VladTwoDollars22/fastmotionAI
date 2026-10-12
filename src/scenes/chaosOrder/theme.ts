import { noise2D } from "@remotion/noise";

export const BACKGROUND = "#05060e";

export const CHAOS_COLORS = ["#FF2E63", "#FF6B3D", "#FF3D6E", "#FFA23D", "#B23BFF"];
export const ORDER_COLORS = ["#22D3EE", "#4F8CFF", "#8B5CF6", "#FFD466", "#5EEAD4"];

export const CHAOS_CENTER = { x: 540, y: 1010 };
export const CHAOS_HOMES = [
  { x: 232, y: 560 },
  { x: 848, y: 636 },
  { x: 196, y: 1210 },
  { x: 884, y: 1268 },
  { x: 540, y: 1490 },
];

const hexToRgb = (hex: string): [number, number, number] => {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2]
      : raw;
  const value = parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

export const lerpHex = (from: string, to: string, t: number): string => {
  const clamped = Math.min(1, Math.max(0, t));
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const r = Math.round(a[0] + (b[0] - a[0]) * clamped);
  const g = Math.round(a[1] + (b[1] - a[1]) * clamped);
  const bl = Math.round(a[2] + (b[2] - a[2]) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
};

export const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export const spikeAngles = (count: number, seed: string): number[] => {
  const angles: number[] = [];
  for (let i = 0; i < count; i++) {
    angles.push((i / count) * Math.PI * 2 + noise2D(seed, i * 1.3, 0) * 0.22);
  }
  return angles;
};

export interface ShakeTrigger {
  start: number;
  decay: number;
  amp: number;
}

export const shakeOffset = (
  frame: number,
  triggers: ShakeTrigger[],
): { x: number; y: number; rot: number } => {
  let amp = 0;
  for (const trigger of triggers) {
    const d = frame - trigger.start;
    if (d >= 0 && d < trigger.decay) {
      const falloff = 1 - d / trigger.decay;
      amp = Math.max(amp, trigger.amp * falloff * falloff);
    }
  }
  if (amp <= 0) return { x: 0, y: 0, rot: 0 };
  return {
    x: amp * noise2D("shake-x", frame * 0.9, 0.31),
    y: amp * noise2D("shake-y", frame * 0.8, 1.73),
    rot: amp * 0.05 * noise2D("shake-r", frame * 0.6, 2.11),
  };
};
