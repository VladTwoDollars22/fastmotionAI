import type { CSSProperties, FC } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export type KineticMode = "letter" | "word";
export type KineticEntry = "up" | "pop" | "scale";

export interface KineticTextProps {
  text: string;
  mode?: KineticMode;
  delay?: number;
  stagger?: number;
  className?: string;
  style?: CSSProperties;
  unitStyle?: CSSProperties;
  entry?: KineticEntry;
  damping?: number;
  stiffness?: number;
  rotate?: number;
  distance?: number;
}

const splitText = (text: string, mode: KineticMode): string[] =>
  mode === "letter" ? Array.from(text) : text.split(" ");

export const KineticText: FC<KineticTextProps> = ({
  text,
  mode = "word",
  delay = 0,
  stagger = 3,
  className,
  style,
  unitStyle,
  entry = "up",
  damping = 14,
  stiffness = 170,
  rotate = 0,
  distance = 54,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const units = splitText(text, mode);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        ...style,
      }}
    >
      {units.map((unit, index) => {
        const progress = spring({
          frame: Math.max(0, frame - delay - index * stagger),
          fps,
          config: { damping, stiffness, mass: 0.9 },
          from: 0,
          to: 1,
        });
        const isLast = index === units.length - 1;
        const content = mode === "letter" && unit === " " ? "\u00A0" : unit;

        const offsetY = entry === "up" ? (1 - progress) * distance : 0;
        const scale =
          entry === "pop"
            ? 0.55 + 0.45 * progress
            : entry === "scale"
              ? 0.7 + 0.3 * progress
              : 0.94 + 0.06 * progress;
        const perUnitRotate =
          rotate * (1 - progress) * (index % 2 === 0 ? -1 : 1);

        return (
          <span
            key={index}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: Math.min(1, Math.max(0, progress)),
              transform: `translateY(${offsetY}px) scale(${scale}) rotate(${perUnitRotate}deg)`,
              transformOrigin: "50% 80%",
              marginRight: mode === "word" && !isLast ? "0.3em" : undefined,
              ...unitStyle,
            }}
          >
            {content}
          </span>
        );
      })}
    </div>
  );
};
