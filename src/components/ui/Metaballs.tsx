import { noise2D } from "@remotion/noise";
import type { FC } from "react";
import { getRemotionEnvironment, useCurrentFrame } from "remotion";

export interface GooFilterDefsProps {
  id: string;
  blur?: number;
  strength?: number;
}

export const GooFilterDefs: FC<GooFilterDefsProps> = ({
  id,
  blur = 20,
  strength = 19,
}) => (
  <defs>
    <filter id={id} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
      <feColorMatrix
        in="blur"
        mode="matrix"
        values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${strength} ${-(strength / 2)}`}
        result="goo"
      />
      <feComposite in="SourceGraphic" in2="goo" operator="atop" />
    </filter>
  </defs>
);

export interface Metaball {
  x: number;
  y: number;
  r: number;
  color?: string;
}

export type MetaballMode = "auto" | "goo" | "soft";

export interface MetaballsProps {
  id: string;
  blobs: Metaball[];
  color?: string;
  opacity?: number;
  wobble?: number;
  seed?: string;
  speed?: number;
  /**
   * "auto" (default) uses the expensive goo filter only during a final render and a
   * cheaper overlap-composited pass during Studio preview. "goo"/"soft" force either.
   */
  mode?: MetaballMode;
}

export const Metaballs: FC<MetaballsProps> = ({
  id,
  blobs,
  color = "#4F8CFF",
  opacity = 1,
  wobble = 0.08,
  seed = "meta",
  speed = 1,
  mode = "auto",
}) => {
  const frame = useCurrentFrame();
  const { isRendering } = getRemotionEnvironment();
  const time = frame / 30;
  const useGoo = mode === "goo" || (mode === "auto" && isRendering);

  const circles = blobs.map((blob, index) => {
    const ripple = 1 + wobble * noise2D(`${seed}-${index}`, time * speed, index);
    return (
      <circle
        key={index}
        cx={blob.x + noise2D(`${seed}-x${index}`, time * speed, 0.4) * 6}
        cy={blob.y + noise2D(`${seed}-y${index}`, time * speed, 1.1) * 6}
        r={blob.r * ripple}
        fill={blob.color ?? color}
      />
    );
  });

  if (useGoo) {
    return (
      <g filter={`url(#${id})`} fill={color} opacity={opacity}>
        {circles}
      </g>
    );
  }

  // Preview-friendly path: overlapping opacity-composited circles, no SVG filter pass.
  return (
    <g opacity={opacity} style={{ mixBlendMode: "screen" }}>
      {circles}
    </g>
  );
};
