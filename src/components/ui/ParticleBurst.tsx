import type { FC } from "react";
import { useCurrentFrame } from "remotion";
import { mulberry32 } from "../../utils/prng";

export interface ParticleBurstProps {
  x: number;
  y: number;
  count?: number;
  delay?: number;
  durationInFrames?: number;
  color?: string;
  color2?: string;
  spread?: number;
  speed?: number;
  seed?: number;
  mode?: "lines" | "dust";
  lineLength?: number;
  size?: number;
  gravity?: number;
}

export const ParticleBurst: FC<ParticleBurstProps> = ({
  x,
  y,
  count = 44,
  delay = 0,
  durationInFrames = 34,
  color = "#FF2E63",
  color2 = "#FFD466",
  spread = 340,
  speed = 1,
  seed = 1,
  mode = "lines",
  lineLength = 46,
  size = 4,
  gravity = 0,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  if (local < 0 || local > durationInFrames) return null;

  const progress = local / durationInFrames;
  const random = mulberry32(seed);
  const items: React.ReactNode[] = [];

  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const reach = (0.35 + random() * 0.65) * spread * speed * Math.pow(progress, 0.55);
    const dx = Math.cos(angle) * reach;
    const dy =
      Math.sin(angle) * reach + gravity * progress * progress * durationInFrames * 0.6;
    const opacity = Math.max(0, 1 - Math.pow(progress, 1.4));
    const tint = random() > 0.6 ? color2 : color;

    if (mode === "lines") {
      const length = lineLength * (0.4 + random() * 0.8) * (1 - progress * 0.55);
      const tailX = x + dx * 0.45 - Math.cos(angle) * length;
      const tailY = y + dy * 0.45 - Math.sin(angle) * length;
      items.push(
        <line
          key={i}
          x1={x + dx}
          y1={y + dy}
          x2={tailX}
          y2={tailY}
          stroke={tint}
          strokeWidth={2 + 2 * (1 - progress)}
          strokeLinecap="round"
          opacity={opacity}
        />,
      );
    } else {
      items.push(
        <circle
          key={i}
          cx={x + dx}
          cy={y + dy}
          r={size * (0.4 + random()) * (1 - progress * 0.5)}
          fill={tint}
          opacity={opacity}
        />,
      );
    }
  }

  return <g style={{ mixBlendMode: "screen" }}>{items}</g>;
};
