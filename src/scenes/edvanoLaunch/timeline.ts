import type { LaunchBeat, LaunchRole } from "./brief";

/**
 * Beat sheets authored against a nominal scene length. Scenes call
 * `beatClock(beat, nominal)` so every cue scales with the bundle's actual
 * `durationInFrames` (swapping timings in content.json needs zero code edits).
 */
export const CHAOS_T = {
  nominal: 120,
  headline: 4,
  cards: [6, 20, 34, 48, 62],
  strobe: 6,
  blackout: 108,
} as const;

export const ECOSYSTEM_T = {
  nominal: 210,
  headline: 2,
  explode: 4,
  dollyStart: 8,
  dollyEnd: 96,
  nodes: [34, 58, 84, 110],
  lasers: 44,
} as const;

export const ENGINE_T = {
  nominal: 240,
  headline: 6,
  gaugeStart: 20,
  gaugeEnd: 122,
  funnel: 40,
  push: 150,
} as const;

export const FOUNDER_T = {
  nominal: 150,
  headline: 6,
  dashboard: 16,
  deals: [44, 74, 104],
} as const;

export const CTA_T = {
  nominal: 180,
  modal: 2,
  zoom: 0,
  cursorIn: 16,
  field1: 30,
  type1: 36,
  type1End: 56,
  field2: 62,
  type2: 66,
  type2End: 84,
  press: 98,
  success: 108,
  logo: 118,
  button: 140,
  slideOff: 150,
} as const;

/** Frames of overlap during which the outgoing beat swipes out. */
export const TRANSITION_FRAMES = 20;

export const beatClock = (beat: LaunchBeat, nominal: number) => {
  const k = beat.durationInFrames / nominal;
  return (f: number): number => Math.round(f * k);
};

export const SCENE_NOMINAL: Record<LaunchRole, number> = {
  chaos: CHAOS_T.nominal,
  ecosystem: ECOSYSTEM_T.nominal,
  engine: ENGINE_T.nominal,
  founder: FOUNDER_T.nominal,
  cta: CTA_T.nominal,
};

export const nominalFor = (role: LaunchRole): number => SCENE_NOMINAL[role];
