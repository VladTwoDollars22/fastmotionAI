import { noise2D } from "@remotion/noise";
import type { CSSProperties, FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface GlowOverlayProps {
  color?: string;
  size?: number;
  intensity?: number;
  blur?: number;
  delay?: number;
  pulse?: number;
  seed?: string | number;
  style?: CSSProperties;
  className?: string;
}

export const GlowOverlay: FC<GlowOverlayProps> = ({
  color = "#22D3EE",
  size = 980,
  intensity = 0.6,
  blur = 70,
  delay = 0,
  pulse = 1,
  seed = "glow",
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 200 },
    from: 0,
    to: 1,
  });

  const n = 0.5 + 0.5 * noise2D(seed, frame * 0.03, 0);
  const scale = 1 + pulse * n * 0.2;
  const alpha = intensity * appear * (0.7 + 0.3 * n);

  return (
    <AbsoluteFill
      className={className}
      style={{
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 62%)`,
          filter: `blur(${blur}px)`,
          opacity: alpha,
          transform: `scale(${scale})`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};
