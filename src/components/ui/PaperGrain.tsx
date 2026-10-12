import type { CSSProperties, FC } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

const NOISE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
  "<filter id='grain'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/>" +
  "</filter>" +
  "<rect width='100%' height='100%' filter='url(#grain)'/>" +
  "</svg>";

const NOISE_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`;

export interface PaperGrainProps {
  opacity?: number;
  scale?: number;
  speed?: number;
  blend?: CSSProperties["mixBlendMode"];
  animate?: boolean;
}

export const PaperGrain: FC<PaperGrainProps> = ({
  opacity = 0.08,
  scale = 190,
  speed = 1,
  blend = "overlay",
  animate = true,
}) => {
  const frame = useCurrentFrame();
  const ox = animate ? ((frame * speed * 6) % scale) : 0;
  const oy = animate ? ((frame * speed * 4.1) % scale) : 0;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: NOISE_URL,
        backgroundRepeat: "repeat",
        backgroundSize: `${scale}px ${scale}px`,
        backgroundPosition: `${ox}px ${oy}px`,
        opacity,
        mixBlendMode: blend,
      }}
    />
  );
};
