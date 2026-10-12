export interface DuckWindow {
  start: number;
  end: number;
  factor?: number;
  attack?: number;
  release?: number;
}

export const DEFAULT_DUCK_FACTOR = 0.28;

export interface MusicGainOptions {
  fadeInFrames?: number;
  fadeOutFrames?: number;
  totalFrames?: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const ramp = (
  frame: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): number => {
  if (x1 === x0) return frame >= x1 ? y1 : y0;
  const t = clamp((frame - x0) / (x1 - x0), 0, 1);
  return y0 + (y1 - y0) * t;
};

const windowGain = (frame: number, base: number, window: DuckWindow): number => {
  const factor = clamp(window.factor ?? DEFAULT_DUCK_FACTOR, 0, 1);
  const attack = Math.max(1, window.attack ?? 6);
  const release = Math.max(1, window.release ?? 14);
  const start = Math.min(window.start, window.end);
  const end = Math.max(window.start, window.end);
  const ducked = base * factor;

  if (frame <= start - attack) return base;
  if (frame < start) return ramp(frame, start - attack, start, base, ducked);
  if (frame <= end) return ducked;
  if (frame < end + release)
    return ramp(frame, end, end + release, ducked, base);
  return base;
};

export const computeMusicGain = (
  frame: number,
  base: number,
  windows: DuckWindow[],
  options: MusicGainOptions = {},
): number => {
  const { fadeInFrames = 10, fadeOutFrames = 15, totalFrames } = options;
  let gain = base;

  for (const window of windows) {
    gain = Math.min(gain, windowGain(frame, base, window));
  }

  if (fadeInFrames > 0) {
    gain = Math.min(gain, ramp(frame, 0, fadeInFrames, 0, base));
  }
  if (totalFrames && fadeOutFrames > 0) {
    gain = Math.min(
      gain,
      ramp(frame, totalFrames - fadeOutFrames, totalFrames, base, 0),
    );
  }

  return clamp(gain, 0, base);
};
