import type { CSSProperties, FC, ReactNode } from "react";
import { useCurrentFrame } from "remotion";

export interface LightSweepProps {
  /** Frames per full pass; the sweep loops continuously. */
  period?: number;
  /** Frame offset so several sweeps can be de-synchronised. */
  offset?: number;
  /** Fraction of the period during which the band is travelling (0..1). */
  duty?: number;
  intensity?: number;
  width?: number;
  angle?: number;
  /** Band colour as an `r, g, b` triplet (default white). */
  tint?: string;
  blend?: CSSProperties["mixBlendMode"];
}

/**
 * A skewed specular band travelling across its (overflow-hidden) parent.
 * Purely frame-driven; place inside a positioned, `overflow: hidden` container.
 */
export const LightSweep: FC<LightSweepProps> = ({
  period = 54,
  offset = 0,
  duty = 0.55,
  intensity = 0.65,
  width = 34,
  angle = 18,
  tint = "255, 255, 255",
  blend = "overlay",
}) => {
  const frame = useCurrentFrame();
  const phase = ((((frame + offset) % period) + period) % period) / period;
  const travel = Math.min(1, phase / Math.max(0.05, duty));
  const eased = travel < 0.5 ? 2 * travel * travel : 1 - Math.pow(-2 * travel + 2, 2) / 2;
  const left = -width - 20 + eased * (100 + width * 2 + 40);
  return (
    <div
      style={{
        position: "absolute",
        top: "-30%",
        bottom: "-30%",
        left: `${left}%`,
        width: `${width}%`,
        transform: `skewX(${-angle}deg)`,
        background: `linear-gradient(90deg, rgba(${tint}, 0) 0%, rgba(${tint}, ${intensity}) 50%, rgba(${tint}, 0) 100%)`,
        opacity: travel >= 1 ? 0 : 1,
        pointerEvents: "none",
        mixBlendMode: blend,
      }}
    />
  );
};

export interface SweepButtonProps {
  label: string;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  color: string;
  textColor?: string;
  height?: number;
  fontSize?: number;
  /** 0..1 glow pulse strength. */
  glow?: number;
  /** Extra scale (presses/punches). */
  scale?: number;
  sweepPeriod?: number;
  sweepOffset?: number;
  fontFamily?: string;
  style?: CSSProperties;
}

/** Pill CTA with a continuous light sweep, inner highlight and frame-driven glow. */
export const SweepButton: FC<SweepButtonProps> = ({
  label,
  icon,
  trailingIcon,
  color,
  textColor = "#FFFFFF",
  height = 96,
  fontSize = 38,
  glow = 0.6,
  scale = 1,
  sweepPeriod = 48,
  sweepOffset = 0,
  fontFamily,
  style,
}) => (
  <div
    style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      height,
      padding: `0 ${height * 0.55}px`,
      borderRadius: height / 2,
      overflow: "hidden",
      background: `linear-gradient(180deg, ${color} 0%, ${color} 55%, rgba(0,0,0,0.12) 140%), ${color}`,
      color: textColor,
      fontFamily,
      fontSize,
      fontWeight: 800,
      letterSpacing: 0.4,
      transform: `scale(${scale})`,
      boxShadow: `0 ${18 + glow * 14}px ${40 + glow * 40}px -16px ${color}, 0 0 ${glow * 46}px ${color}88, inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.15)`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <LightSweep period={sweepPeriod} offset={sweepOffset} intensity={0.85} width={26} />
    {icon}
    <span style={{ position: "relative" }}>{label}</span>
    {trailingIcon}
  </div>
);
