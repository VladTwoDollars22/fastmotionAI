import type { CSSProperties, FC } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface KineticTextProps {
  text: string;
  mode?: "letter" | "word";
  delay?: number;
  stagger?: number;
  className?: string;
  style?: CSSProperties;
  unitStyle?: CSSProperties;
}

export const KineticText: FC<KineticTextProps> = ({
  text,
  mode = "word",
  delay = 0,
  stagger = 3,
  className,
  style,
  unitStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const units = mode === "letter" ? Array.from(text) : text.split(" ");

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
          config: { damping: 200 },
          from: 0,
          to: 1,
        });
        const isLast = index === units.length - 1;
        const content = mode === "letter" && unit === " " ? "\u00A0" : unit;

        return (
          <span
            key={index}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: progress,
              transform: `translateY(${(1 - progress) * 0.6}em) scale(${
                0.92 + 0.08 * progress
              })`,
              marginRight: mode === "word" && !isLast ? "0.28em" : undefined,
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
