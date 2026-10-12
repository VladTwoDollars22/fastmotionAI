import type { PromoBeat } from "../promo16x9/brief";

/**
 * Beat sheets for the `firstcreo2026_12_10` commercial, authored against a
 * nominal scene length. Scenes call `beatClock(beat, sheet)` so every cue scales
 * with the bundle's actual `durationInFrames`.
 *
 * Bundle timeline (900 frames @ 30fps):
 *   chaos_hook 150 · ecosystem_showcase 240 · founder_value 270 · cta_resolution 240
 */

export const CHAOS_T = {
  nominal: 150,
  headline: 6,
  cards: [20, 34, 48, 62, 76],
  burst: 120,
  exit: 130,
} as const;

export const ECO_T = {
  nominal: 240,
  headline: 8,
  body: 26,
  flow: 34,
  activations: [58, 96, 134, 172],
  dealPop: 196,
  exit: 220,
} as const;

export const FOUNDER_T = {
  nominal: 270,
  headline: 8,
  card: 18,
  countStart: 42,
  countEnd: 190,
  feeds: [74, 112, 150, 186],
  levelUp: 204,
  exit: 250,
} as const;

export const RESOLVE_T = {
  nominal: 240,
  modal: 2,
  headline: 8,
  cursorIn: 24,
  field1: 40,
  type1: 46,
  type1End: 74,
  field2: 88,
  type2: 92,
  type2End: 120,
  button: 132,
  press: 140,
  success: 150,
  revealStart: 164,
  burst: 168,
  revealEnd: 192,
  cta: 200,
} as const;

/** Frames of overlap during which the outgoing beat swipes out. */
export const TRANSITION_FRAMES = 20;

export const beatClock = (beat: PromoBeat, nominal: number) => {
  const k = beat.durationInFrames / nominal;
  return (f: number): number => Math.round(f * k);
};
