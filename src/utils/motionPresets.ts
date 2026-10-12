import type { MotionPreset, StyleguideMotionPresets } from "./projectLoader";

/** Explicit spring physics — mass/damping/stiffness are always all present. */
export interface SpringPhysics {
  damping: number;
  stiffness: number;
  mass: number;
}

export type PresetKey = "entranceBounce" | "smoothSettle" | "snappyAccent";

export const PRESET_DEFAULTS: Record<PresetKey, SpringPhysics> = {
  entranceBounce: { damping: 12, stiffness: 220, mass: 0.9 },
  smoothSettle: { damping: 200, stiffness: 120, mass: 1 },
  snappyAccent: { damping: 20, stiffness: 300, mass: 0.8 },
};

/** Resolve one preset from a bundle, filling any missing field with the explicit default. */
export const resolvePreset = (
  presets: StyleguideMotionPresets | null | undefined,
  key: PresetKey,
): SpringPhysics => {
  const preset: MotionPreset | null | undefined = presets ? presets[key] : undefined;
  const base = PRESET_DEFAULTS[key];
  return {
    damping: preset?.damping ?? base.damping,
    stiffness: preset?.stiffness ?? base.stiffness,
    mass: preset?.mass ?? base.mass,
  };
};

export interface SceneSprings {
  entrance: SpringPhysics;
  settle: SpringPhysics;
  accent: SpringPhysics;
}

/** All three standardized presets for a bundle, ready to hand to scene components. */
export const resolveSceneSprings = (
  presets: StyleguideMotionPresets | null | undefined,
): SceneSprings => ({
  entrance: resolvePreset(presets, "entranceBounce"),
  settle: resolvePreset(presets, "smoothSettle"),
  accent: resolvePreset(presets, "snappyAccent"),
});

export const DEFAULT_SPRINGS: SceneSprings = resolveSceneSprings(null);
