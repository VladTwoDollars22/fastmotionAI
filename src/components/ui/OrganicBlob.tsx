import { noise2D } from "@remotion/noise";
import type { CSSProperties, FC } from "react";
import {
  getRemotionEnvironment,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SpringPhysics } from "../../utils/motionPresets";

export interface OrganicBlobProps {
  cx: number;
  cy: number;
  r: number;
  color?: string;
  seed?: string | number;
  speed?: number;
  wobble?: number;
  points?: number;
  opacity?: number;
  delay?: number;
  glow?: number;
  spin?: number;
  physics?: SpringPhysics;
  style?: CSSProperties;
}

interface Point {
  x: number;
  y: number;
}

const pointAt = (cx: number, cy: number, angle: number, radius: number): Point => ({
  x: cx + Math.cos(angle) * radius,
  y: cy + Math.sin(angle) * radius,
});

const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const smoothClosedPath = (pts: Point[]): string => {
  const n = pts.length;
  const start = midpoint(pts[n - 1], pts[0]);
  let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const mid = midpoint(pts[i], pts[(i + 1) % n]);
    d += ` Q ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)} ${mid.x.toFixed(2)} ${mid.y.toFixed(2)}`;
  }
  return `${d} Z`;
};

export const OrganicBlob: FC<OrganicBlobProps> = ({
  cx,
  cy,
  r,
  color = "#FF2E63",
  seed = "blob",
  speed = 1,
  wobble = 0.3,
  points = 16,
  opacity = 1,
  delay = 0,
  glow = 0,
  spin = 4,
  physics,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isRendering } = getRemotionEnvironment();
  const time = frame / fps;
  const rotation = (spin * time * Math.PI) / 180;

  const appear = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: physics ?? { damping: 16, stiffness: 110, mass: 0.9 },
    from: 0,
    to: 1,
  });

  const pts: Point[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const ripple = noise2D(seed, i * 0.85, time * speed);
    const ring = noise2D(
      seed,
      Math.cos(angle) * 1.4,
      Math.sin(angle) * 1.4 + time * speed * 0.7,
    );
    const radius =
      r * (1 + wobble * ripple + wobble * 0.5 * ring) * (0.55 + 0.45 * appear);
    pts.push(pointAt(cx, cy, angle + rotation, radius));
  }

  return (
    <path
      d={smoothClosedPath(pts)}
      fill={color}
      opacity={opacity * appear}
      style={{
        // A per-frame drop-shadow re-rasterizes the whole path; render-only.
        filter:
          glow > 0 && isRendering
            ? `drop-shadow(0 0 ${glow}px ${color})`
            : undefined,
        ...style,
      }}
    />
  );
};
