import type { CSSProperties, FC, ReactNode } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SpringPhysics } from "../../utils/motionPresets";

export type PanelDirection = "up" | "down" | "left" | "right";

export interface GlassPanelProps {
  children?: ReactNode;
  delay?: number;
  direction?: PanelDirection;
  physics?: SpringPhysics;
  className?: string;
  style?: CSSProperties;
}

const offsetFor = (direction: PanelDirection, progress: number): string => {
  const delta = (1 - progress) * 60;
  switch (direction) {
    case "down":
      return `translateY(${-delta}px)`;
    case "left":
      return `translateX(${delta}px)`;
    case "right":
      return `translateX(${-delta}px)`;
    case "up":
    default:
      return `translateY(${delta}px)`;
  }
};

export const GlassPanel: FC<GlassPanelProps> = ({
  children,
  delay = 0,
  direction = "up",
  physics,
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: physics ?? { damping: 200, stiffness: 120, mass: 1 },
    from: 0,
    to: 1,
  });

  return (
    <div
      className={className}
      style={{
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.14)",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
        boxShadow:
          "0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
        opacity: progress,
        transform: offsetFor(direction, progress),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
