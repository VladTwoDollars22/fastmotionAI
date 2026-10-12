import { noise2D } from "@remotion/noise";
import type { Styleguide } from "../../utils/projectLoader";

export {
  breathe,
  cameraFrame,
  floatOffset,
  lerpHex,
  shakeOffset,
  smoothstep,
  spin,
  zoomPunch,
  type CameraFrameState,
  type Float,
  type PunchTrigger,
  type ShakeTrigger,
} from "../../utils/kinetics";

export const BACKGROUND = "#05060e";

export const CHAOS_CENTER = { x: 540, y: 1010 };
export const CHAOS_HOMES = [
  { x: 232, y: 560 },
  { x: 848, y: 636 },
  { x: 196, y: 1210 },
  { x: 884, y: 1268 },
  { x: 540, y: 1490 },
];

export const spikeAngles = (count: number, seed: string): number[] => {
  const angles: number[] = [];
  for (let i = 0; i < count; i++) {
    angles.push((i / count) * Math.PI * 2 + noise2D(seed, i * 1.3, 0) * 0.22);
  }
  return angles;
};

export interface ChaosCopy {
  line1: string;
  line2: string;
  bigChaos: string;
  caption: string;
  bigOrder: string;
  subtitle: string;
}

export interface Palette {
  background: string;
  chaos: string[];
  order: string[];
  primary: string;
  accent: string;
  text: string;
  gold: string;
  energy: number;
}

export const FALLBACK_PALETTE: Palette = {
  background: "#05060e",
  chaos: ["#FF2E63", "#FF6B3D", "#FF3D6E", "#FFA23D", "#B23BFF"],
  order: ["#22D3EE", "#4F8CFF", "#8B5CF6", "#FFD466", "#5EEAD4"],
  primary: "#FF2E63",
  accent: "#22D3EE",
  text: "#EAFBFF",
  gold: "#FFD466",
  energy: 1,
};

const SPEED_FACTOR: Record<string, number> = { slow: 0.7, normal: 1, fast: 1.4 };

export const energyFactor = (speed: string): number => SPEED_FACTOR[speed] ?? 1;

export const buildPalette = (styleguide: Styleguide): Palette => {
  const blobs = styleguide.palette?.blobs ?? null;
  const candidateChaos = blobs
    ? [blobs.coral, blobs.electricBlue, blobs.amber, blobs.mint, blobs.violet].filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const chaos =
    candidateChaos.length === 5 ? candidateChaos : FALLBACK_PALETTE.chaos;
  const gold =
    styleguide.palette?.resolution?.gold ?? styleguide.colors.accent;
  const order = [
    styleguide.colors.accent,
    styleguide.colors.primary,
    blobs?.electricBlue ?? FALLBACK_PALETTE.order[2],
    gold,
    styleguide.colors.text,
  ];

  return {
    background: styleguide.colors.background,
    chaos,
    order,
    primary: styleguide.colors.primary,
    accent: styleguide.colors.accent,
    text: styleguide.colors.text,
    gold,
    energy: energyFactor(styleguide.motion.speed),
  };
};
