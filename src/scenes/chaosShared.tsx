import type { FC } from "react";

export type Point = [number, number];

export const CANVAS = { width: 1080, height: 1920 } as const;
export const CENTER: Point = [540, 960];
export const HERO: Point = [540, 900];

export const CRIMSON = "#FF2E4D";
export const NEAR_BLACK = "#0A0A12";
export const GOLD = "#FFD166";
export const CREAM = "#FDF3E3";
export const NAVY = "#0E1330";

export const BLOB_PATH =
  "M52 3 C78 6 97 27 94 54 C91 80 72 97 47 95 C22 93 4 73 7 48 C10 22 27 0 52 3 Z";

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const anglePoint = (deg: number, radius: number): Point => {
  const r = (deg * Math.PI) / 180;
  return [
    CENTER[0] + Math.cos(r) * radius,
    CENTER[1] + Math.sin(r) * radius * 0.9,
  ];
};

export const spikePath = (
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  spikes: number,
): string => {
  const total = spikes * 2;
  let d = "";
  for (let i = 0; i < total; i++) {
    const a = (i / total) * Math.PI * 2 - Math.PI / 2;
    const wobble = 0.82 + 0.28 * Math.abs(Math.sin(i * 2.399));
    const r = (i % 2 === 0 ? rOuter : rInner) * wobble;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return `${d}Z`;
};

export type GlyphKind = "stylus" | "brackets" | "megaphone" | "pencil" | "chart";

export const Glyph: FC<{ kind: GlyphKind }> = ({ kind }) => {
  const stroke = {
    fill: "none",
    stroke: NAVY,
    strokeWidth: 9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "stylus":
      return (
        <g>
          <path d="M-24 24 L16 -16" {...stroke} />
          <path d="M16 -16 l13 -8 l-4 15 z" fill={NAVY} />
        </g>
      );
    case "brackets":
      return (
        <g>
          <path d="M-10 -24 L-30 0 L-10 24" {...stroke} />
          <path d="M10 -24 L30 0 L10 24" {...stroke} />
        </g>
      );
    case "megaphone":
      return (
        <g>
          <path d="M-28 8 L4 -18 L4 26 L-28 -2 Z" {...stroke} />
          <path d="M14 -14 q15 14 0 28" {...stroke} />
        </g>
      );
    case "pencil":
      return (
        <g transform="rotate(45)">
          <rect x="-9" y="-28" width="18" height="44" rx="4" {...stroke} />
          <path d="M-9 16 L0 28 L9 16" {...stroke} />
        </g>
      );
    case "chart":
      return (
        <g {...stroke}>
          <path d="M-26 26 L-26 -4" />
          <path d="M0 26 L0 -16" />
          <path d="M26 26 L26 -28" />
          <path d="M-34 26 L34 26" />
        </g>
      );
  }
};

export interface BlobDef {
  key: string;
  color: string;
  glyph: GlyphKind;
  home: Point;
  from: Point;
  corner: Point;
  delay: number;
}

export const BLOBS: BlobDef[] = [
  {
    key: "coral",
    color: "#FF5A5F",
    glyph: "stylus",
    home: anglePoint(-90, 470),
    from: [540, -220],
    corner: [160, 320],
    delay: 0,
  },
  {
    key: "blue",
    color: "#3D7BFF",
    glyph: "brackets",
    home: anglePoint(-18, 480),
    from: [1300, 300],
    corner: [920, 360],
    delay: 3,
  },
  {
    key: "amber",
    color: "#FFB703",
    glyph: "megaphone",
    home: anglePoint(54, 480),
    from: [1300, 1640],
    corner: [920, 1620],
    delay: 6,
  },
  {
    key: "mint",
    color: "#2EC4B6",
    glyph: "pencil",
    home: anglePoint(126, 480),
    from: [-220, 1640],
    corner: [160, 1620],
    delay: 9,
  },
  {
    key: "violet",
    color: "#8E5CFF",
    glyph: "chart",
    home: anglePoint(198, 480),
    from: [-220, 300],
    corner: [120, 960],
    delay: 12,
  },
];
