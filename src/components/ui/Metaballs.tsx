import type { FC } from "react";

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

export interface MetaballsProps {
  id: string;
  blobs: Metaball[];
  color?: string;
  opacity?: number;
}

export const Metaballs: FC<MetaballsProps> = ({
  id,
  blobs,
  color = "#4F8CFF",
  opacity = 1,
}) => (
  <g filter={`url(#${id})`} fill={color} opacity={opacity}>
    {blobs.map((blob, index) => (
      <circle
        key={index}
        cx={blob.x}
        cy={blob.y}
        r={blob.r}
        fill={blob.color ?? color}
      />
    ))}
  </g>
);
