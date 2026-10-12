import { noise2D } from "@remotion/noise";

export const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const hexToRgb = (hex: string): [number, number, number] => {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3 ? raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2] : raw;
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

export interface ShakeTrigger {
  start: number;
  decay: number;
  amp: number;
}

export interface Float {
  x: number;
  y: number;
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

export interface PunchTrigger {
  start: number;
  decay: number;
  amount: number;
}

export const zoomPunch = (frame: number, triggers: PunchTrigger[]): number => {
  let amount = 0;
  for (const trigger of triggers) {
    const d = frame - trigger.start;
    if (d >= 0 && d < trigger.decay) {
      const falloff = 1 - d / trigger.decay;
      amount = Math.max(amount, trigger.amount * falloff * falloff);
    }
  }
  return 1 + amount;
};

export const floatOffset = (
  frame: number,
  seed: string,
  ampX: number,
  ampY: number,
  speed = 0.6,
): Float => {
  const t = frame * speed;
  return {
    x: ampX * noise2D(`${seed}-x`, t * 0.5, 0.13),
    y: ampY * noise2D(`${seed}-y`, t * 0.45, 0.71),
  };
};

export const spin = (
  frame: number,
  seed: string,
  ampDeg: number,
  speed = 0.4,
): number => ampDeg * noise2D(`${seed}-r`, frame * speed * 0.4, 0.37);

export const breathe = (
  frame: number,
  seed: string,
  amp = 0.03,
  speed = 0.05,
): number => 1 + amp * noise2D(`${seed}-b`, frame * speed, 0.9);

export interface CameraFrameOptions {
  seed: string;
  punches: PunchTrigger[];
  shakes: ShakeTrigger[];
  rollDeg: number;
  panX: number;
  panY: number;
}

export interface CameraFrameState {
  zoom: number;
  roll: number;
  x: number;
  y: number;
}

export const cameraFrame = (
  frame: number,
  options: CameraFrameOptions,
): CameraFrameState => {
  const punch = zoomPunch(frame, options.punches);
  const roll = spin(frame, `${options.seed}-roll`, options.rollDeg, 0.5);
  const pan = floatOffset(frame, `${options.seed}-cam`, options.panX, options.panY, 0.5);
  const shake = shakeOffset(frame, options.shakes);
  return {
    zoom: punch * breathe(frame, `${options.seed}-cam-breath`, 0.02, 0.08),
    roll: roll + shake.rot,
    x: pan.x + shake.x,
    y: pan.y + shake.y,
  };
};
