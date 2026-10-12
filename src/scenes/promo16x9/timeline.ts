import type { PromoBeat, PromoBrief, PromoRole } from "./brief";

/**
 * Beat sheets authored against a nominal scene length. Scenes call
 * `beatClock(beat, sheet)` so every cue scales with the bundle's actual
 * `durationInFrames` (swapping timings in content.json needs zero code edits).
 */
export const HOOK_T = {
  nominal: 120,
  browserIn: 0,
  headline: 8,
  body: 34,
  glitch: 58,
  glitchLen: 16,
} as const;

export const SHOWCASE_T = {
  nominal: 240,
  rows: [6, 26, 112],
  browserLoad: 10,
  gaugeStart: 22,
  gaugeEnd: 98,
  codeStart: 40,
  codeCharsPerFrame: 2.6,
  langSwitch: [126, 156, 186],
  body: 146,
} as const;

export const OFFER_T = {
  nominal: 210,
  modal: 2,
  headline: 12,
  body: 26,
  cursorIn: 36,
  field1: 58,
  type1: 64,
  type1End: 92,
  field2: 108,
  type2: 112,
  type2End: 146,
  button: 166,
  press: 170,
  success: 176,
} as const;

export const CTA_T = {
  nominal: 180,
  badge: 2,
  revealStart: 8,
  revealEnd: 32,
  burst: 12,
  body: 36,
  button: 62,
} as const;

/** Frames of overlap during which the outgoing beat swipes out. */
export const TRANSITION_FRAMES = 20;

export const beatClock = (beat: PromoBeat, nominal: number) => {
  const k = beat.durationInFrames / nominal;
  return (f: number): number => Math.round(f * k);
};

const NOMINAL_BY_ROLE: Record<PromoRole, number> = {
  hook: HOOK_T.nominal,
  showcase: SHOWCASE_T.nominal,
  offer: OFFER_T.nominal,
  cta: CTA_T.nominal,
  generic: 1,
};

export interface GlobalCue {
  frame: number;
  kind: "glitch" | "score" | "click" | "reveal" | "switch" | "cut";
}

/** Composition-level hero beats used for camera punches/shake (global frames). */
export const globalCues = (brief: PromoBrief): GlobalCue[] => {
  const cues: GlobalCue[] = [];
  for (const beat of brief.beats) {
    const k = beat.durationInFrames / NOMINAL_BY_ROLE[beat.role];
    const at = (f: number) => beat.start + Math.round(f * k);
    if (beat.start > 0) cues.push({ frame: beat.start, kind: "cut" });
    if (beat.role === "hook") cues.push({ frame: at(HOOK_T.glitch), kind: "glitch" });
    if (beat.role === "showcase") {
      cues.push({ frame: at(SHOWCASE_T.gaugeEnd), kind: "score" });
      if (brief.languages.length > 1) {
        for (const f of SHOWCASE_T.langSwitch) cues.push({ frame: at(f), kind: "switch" });
      }
    }
    if (beat.role === "offer") cues.push({ frame: at(OFFER_T.press), kind: "click" });
    if (beat.role === "cta") cues.push({ frame: at(CTA_T.burst), kind: "reveal" });
  }
  return cues;
};
