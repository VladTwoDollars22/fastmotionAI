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
  damping = 12,
  stiffness = 220,
  mass = 0.9,
  rotate = 0,
  distance = 54,
  motionBlur = 0,
  ambient = 0.02,
  seed = "kinetic",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isRendering } = getRemotionEnvironment();
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
          config: { damping, stiffness, mass },
          from: 0,
          to: 1,
        });
        const isLast = index === units.length - 1;
        const content = mode === "letter" && unit === " " ? "\u00A0" : unit;

        // Motion blur is a per-glyph CSS filter (expensive); keep it for the final
        // render only and use opacity/transform for the preview tier.
        const blur = isRendering ? motionBlur * Math.max(0, 1 - progress) : 0;
        // Smooth ambient micro-motion (deterministic sine, never noise) so text
        // stays rock-solid and jitter-free (`rules/roles/02` §3.6).
        let ambientSeed = 0;
        for (let c = 0; c < seed.length; c++) {
          ambientSeed = (ambientSeed * 31 + seed.charCodeAt(c)) >>> 0;
        }
        const ambientPhase = (ambientSeed % 1000) / 1000 + index * 0.35;
        const ambientScale =
          1 + ambient * Math.sin(frame * 0.045 + ambientPhase * Math.PI * 2);
        const ambientY =
          ambient * 10 * Math.sin(frame * 0.05 + ambientPhase * Math.PI * 2);
        const ambientRot =
          ambient * 42 * Math.sin(frame * 0.04 + ambientPhase * Math.PI * 2 * 1.3);

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
