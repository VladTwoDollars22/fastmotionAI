import { noise2D } from "@remotion/noise";
import type { FC } from "react";
import { useCurrentFrame } from "remotion";

export interface SpeedLinesProps {
  count?: number;
  color?: string;
  delay?: number;
  durationInFrames?: number;
  seed?: string;
  cx?: number;
  cy?: number;
  inner?: number;
  reach?: number;
  width?: number;
}

export const SpeedLines: FC<SpeedLinesProps> = ({
  count = 30,
  color = "#FFD466",
  delay = 0,
  durationInFrames = 18,
  seed = "speed",
  cx = 540,
  cy = 960,
  inner = 90,
  reach = 540,
  width = 3,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  if (local < 0 || local > durationInFrames) return null;

  const progress = local / durationInFrames;
  const grow = Math.pow(progress, 0.5);
  const items: React.ReactNode[] = [];

  for (let i = 0; i < count; i++) {
    const angle =
      (i / count) * Math.PI * 2 + noise2D(seed, i * 1.7, 0) * 0.12;
    const r0 = inner + grow * 44;
    const r1 =
      inner +
      reach * grow * (0.5 + 0.5 * Math.abs(noise2D(seed, i * 2.1, 1)));
    const opacity =
      Math.max(0, 1 - progress) *
      (0.45 + 0.55 * Math.abs(noise2D(seed, i, 2)));
    items.push(
      <line
        key={i}
        x1={cx + Math.cos(angle) * r0}
        y1={cy + Math.sin(angle) * r0}
        x2={cx + Math.cos(angle) * r1}
        y2={cy + Math.sin(angle) * r1}
        stroke={color}
        strokeWidth={width * (1 - progress * 0.5)}
        strokeLinecap="round"
        opacity={opacity}
      />,
    );
  }

  return <g style={{ mixBlendMode: "screen" }}>{items}</g>;
};
