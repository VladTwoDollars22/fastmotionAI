import { noise2D } from "@remotion/noise";
import type { CSSProperties, FC } from "react";
import {
  getRemotionEnvironment,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  mass?: number;
  rotate?: number;
  distance?: number;
  motionBlur?: number;
  ambient?: number;
  seed?: string;
  /** Light-sweep highlight strength (0 disables). Defaults to a subtle sheen. */
  sweep?: number;
  /** Frames for one full sweep of the highlight. */
  sweepPeriod?: number;
}

const SWEEP_PERIOD_DEFAULT = 54;

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
  damping = 12,
  stiffness = 220,
  mass = 0.9,
  rotate = 0,
  distance = 54,
  motionBlur = 0,
  ambient = 0.02,
  seed = "kinetic",
  sweep = 0.6,
  sweepPeriod = SWEEP_PERIOD_DEFAULT,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isRendering } = getRemotionEnvironment();
  const units = splitText(text, mode);

  const baseColor = typeof style?.color === "string" ? style.color : "#FFFFFF";
  const sweepActive = sweep > 0 && baseColor.length > 0;
  const highlight = `rgba(255,255,255,${Math.min(1, Math.max(0, sweep)).toFixed(3)})`;

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
          config: { damping, stiffness, mass },
          from: 0,
          to: 1,
        });
        const isLast = index === units.length - 1;
        const content = mode === "letter" && unit === " " ? "\u00A0" : unit;

        // Motion blur is a per-glyph CSS filter (expensive); keep it for the final
        // render only and use opacity/transform for the preview tier.
        const blur = isRendering ? motionBlur * Math.max(0, 1 - progress) : 0;
        const ambientScale =
          1 + ambient * noise2D(`${seed}-s${index}`, frame * 0.07, index);
        const ambientY =
          ambient * 10 * noise2D(`${seed}-y${index}`, frame * 0.05, index * 1.7);
        const ambientRot =
          ambient * 45 * noise2D(`${seed}-r${index}`, frame * 0.04, index * 2.3);

        // A traveling highlight wave: each glyph is phase-shifted so the sheen
        // reads left-to-right across the line (Rule 01 §9 light-sweep).
        const sweepPhase = ((((frame - delay) / sweepPeriod + index * 0.06) % 1) + 1) % 1;
        const sweepPos = 150 - sweepPhase * 300;

        const baseScale =
          entry === "pop"
            ? 0.55 + 0.45 * progress
            : entry === "scale"
              ? 0.7 + 0.3 * progress
              : 0.94 + 0.06 * progress;
        const offsetY =
          (entry === "up" ? (1 - progress) * distance : 0) + ambientY;
        const perUnitRotate =
          rotate * (1 - progress) * (index % 2 === 0 ? -1 : 1) + ambientRot;

        // Plain string map avoids csstype's huge color-keyword unions (TS2590).
        const sweepStyle: Record<string, string> = sweepActive
          ? {
              backgroundImage: `linear-gradient(100deg, ${baseColor} 0%, ${baseColor} 34%, ${highlight} 50%, ${baseColor} 66%, ${baseColor} 100%)`,
              backgroundSize: "220% 100%",
              backgroundPosition: `${sweepPos}% 0`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }
          : {};

        const motionStyle: CSSProperties = {
          display: "inline-block",
          whiteSpace: "pre",
          opacity: Math.min(1, Math.max(0, progress)),
          transform: `translateY(${offsetY}px) scale(${baseScale * ambientScale}) rotate(${perUnitRotate}deg)`,
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          transformOrigin: "50% 80%",
          marginRight: mode === "word" && !isLast ? "0.3em" : undefined,
        };
        // Object.assign (not object spread) keeps TS from building a huge
        // CSSProperties union across the merged style objects.
        const spanStyle = Object.assign(
          {} as CSSProperties,
          motionStyle,
          sweepStyle,
          unitStyle,
        ) as CSSProperties;

        return (
          <span key={index} style={spanStyle}>
            {content}
          </span>
        );
      })}
    </div>
  );
};
