import type { CSSProperties, FC } from "react";
import { withAlpha } from "../promo16x9/brief";
import type { LaunchPalette } from "./brief";

export interface CardSurfaceOptions {
  palette: LaunchPalette;
  /** Accent colour used for the soft outer glow (defaults to indigo primary). */
  glow?: string;
  /** 0..1 glow strength. */
  glowStrength?: number;
  radius?: number;
}

/** Shared frosted-white card surface (Edvano Light theme). */
export const cardSurface = ({
  palette,
  glow,
  glowStrength = 0.4,
  radius = 26,
}: CardSurfaceOptions): CSSProperties => {
  const edge = glow ?? palette.primary;
  return {
    borderRadius: radius,
    border: `1.5px solid ${palette.border}`,
    background: "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)",
    boxShadow: `0 24px 50px -26px rgba(15,23,42,0.24), 0 6px 16px -10px rgba(15,23,42,0.1), 0 0 ${
      14 + glowStrength * 24
    }px -6px ${withAlpha(edge, 0.16 + glowStrength * 0.26)}, inset 0 1px 0 rgba(255,255,255,0.9)`,
    backdropFilter: "blur(10px)",
  };
};

export interface AlertBadgeProps {
  color: string;
  label: string;
  fontFamily?: string;
  style?: CSSProperties;
}

/** Rose alert chip (the chaos "overdue" tag). */
export const AlertBadge: FC<AlertBadgeProps> = ({ color, label, fontFamily, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 14px",
      borderRadius: 999,
      background: withAlpha(color, 0.12),
      border: `1.5px solid ${withAlpha(color, 0.5)}`,
      color,
      fontFamily,
      fontSize: 19,
      fontWeight: 800,
      letterSpacing: 0.3,
      ...style,
    }}
  >
    <span style={{ width: 9, height: 9, borderRadius: 999, background: color }} />
    {label}
  </span>
);

export interface MetricChipProps {
  label: string;
  value?: string;
  palette: LaunchPalette;
  tone?: string;
  fontFamily?: string;
  style?: CSSProperties;
}

/** Floating white metric chip used for supporting scene density. */
export const MetricChip: FC<MetricChipProps> = ({
  label,
  value,
  palette,
  tone,
  fontFamily,
  style,
}) => {
  const c = tone ?? palette.primary;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 14,
        background: palette.card,
        border: `1.5px solid ${palette.border}`,
        boxShadow:
          "0 14px 30px -18px rgba(15,23,42,0.24), inset 0 1px 0 rgba(255,255,255,0.9)",
        fontFamily,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          background: c,
          boxShadow: `0 0 8px ${withAlpha(c, 0.7)}`,
        }}
      />
      {value ? <span style={{ color: palette.text, fontSize: 22, fontWeight: 800 }}>{value}</span> : null}
      <span style={{ color: palette.muted, fontSize: 18, fontWeight: 700 }}>{label}</span>
    </div>
  );
};

export interface StatusDotProps {
  color: string;
  /** 0..1 pulse (caller supplies a smooth sine value). */
  pulse?: number;
  size?: number;
}

/** Small smooth-pulsing status dot. */
export const StatusDot: FC<StatusDotProps> = ({ color, pulse = 1, size = 9 }) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: 999,
      background: color,
      opacity: 0.5 + 0.5 * pulse,
      boxShadow: `0 0 ${6 + pulse * 8}px ${withAlpha(color, 0.8)}`,
    }}
  />
);
