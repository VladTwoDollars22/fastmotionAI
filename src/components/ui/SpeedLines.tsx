import { noise2D } from "@remotion/noise";
import type { CSSProperties, FC } from "react";
import { memo, useMemo } from "react";
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
  /** Blend mode of the line group; `screen` suits dark themes, `normal` light ones. */
  blend?: CSSProperties["mixBlendMode"];
}

interface LineFactor {
  angle: number;
  spread: number;
  alpha: number;
}

const SpeedLinesImpl: FC<SpeedLinesProps> = ({
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
  blend = "screen",
}) => {
  const frame = useCurrentFrame();

  // Per-line randomness depends only on index/seed, never on frame: compute once.
  const factors = useMemo(() => {
    const list: LineFactor[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        angle: (i / count) * Math.PI * 2 + noise2D(seed, i * 1.7, 0) * 0.12,
        spread: 0.5 + 0.5 * Math.abs(noise2D(seed, i * 2.1, 1)),
        alpha: 0.45 + 0.55 * Math.abs(noise2D(seed, i, 2)),
      });
    }
    return list;
  }, [count, seed]);

  const local = frame - delay;
  if (local < 0 || local > durationInFrames) return null;

  const progress = local / durationInFrames;
  const grow = Math.pow(progress, 0.5);
  const items: React.ReactNode[] = [];

  for (let i = 0; i < count; i++) {
    const factor = factors[i];
    const r0 = inner + grow * 44;
    const r1 = inner + reach * grow * factor.spread;
    const opacity = Math.max(0, 1 - progress) * factor.alpha;
    items.push(
      <line
        key={i}
        x1={cx + Math.cos(factor.angle) * r0}
        y1={cy + Math.sin(factor.angle) * r0}
        x2={cx + Math.cos(factor.angle) * r1}
        y2={cy + Math.sin(factor.angle) * r1}
        stroke={color}
        strokeWidth={width * (1 - progress * 0.5)}
        strokeLinecap="round"
        opacity={opacity}
      />,
    );
  }

  return <g style={{ mixBlendMode: blend }}>{items}</g>;
};

export const SpeedLines = memo(SpeedLinesImpl);
