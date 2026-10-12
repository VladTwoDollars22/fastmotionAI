import type { FC } from "react";
import { memo, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { mulberry32 } from "../../utils/prng";

export interface RadialGaugeProps {
  /** Current score (0..max); may be fractional — the label rounds it. */
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color: string;
  trackColor?: string;
  textColor?: string;
  mutedColor?: string;
  label?: string;
  fontFamily?: string;
  /** 0..1 strength of the spark trail emitted from the arc tip. */
  sparks?: number;
  sparkColor?: string;
  /** 0..1 completion glow (halo + outer ring). */
  glow?: number;
  /** Extra scale applied to the numeric readout (for punches). */
  valueScale?: number;
  seed?: number;
}

const SWEEP_DEG = 270;
const START_DEG = 135;
const SPARK_COUNT = 26;
const SPARK_LIFE = 22;

interface SparkSeed {
  offset: number;
  drift: number;
  size: number;
  lateral: number;
}

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (cx: number, cy: number, r: number, fromDeg: number, toDeg: number) => {
  const a = polar(cx, cy, r, fromDeg);
  const b = polar(cx, cy, r, toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
};

/** Lighthouse/PageSpeed-style 270° score gauge with a frame-driven spark trail. */
const RadialGaugeImpl: FC<RadialGaugeProps> = ({
  value,
  max = 100,
  size = 360,
  stroke = 26,
  color,
  trackColor = "rgba(15, 23, 42, 0.08)",
  textColor = "#0F172A",
  mutedColor = "#64748B",
  label = "",
  fontFamily,
  sparks = 0,
  sparkColor,
  glow = 0,
  valueScale = 1,
  seed = 7,
}) => {
  const frame = useCurrentFrame();
  const seeds = useMemo<SparkSeed[]>(() => {
    const random = mulberry32(seed);
    return Array.from({ length: SPARK_COUNT }, () => ({
      offset: random() * SPARK_LIFE,
      drift: 0.6 + random() * 1.4,
      size: 1.6 + random() * 3.2,
      lateral: (random() - 0.5) * 2,
    }));
  }, [seed]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - stroke - 14;
  const ratio = Math.min(1, Math.max(0, value / max));
  const tipDeg = START_DEG + SWEEP_DEG * ratio;
  const tip = polar(cx, cy, r, tipDeg);
  const sparkFill = sparkColor ?? color;

  return (
    <div style={{ position: "relative", width: size, height: size, fontFamily }}>
      <div
        style={{
          position: "absolute",
          inset: -size * 0.18,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 62%)`,
          opacity: 0.1 + glow * 0.32,
        }}
      />
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path
          d={arcPath(cx, cy, r, START_DEG, START_DEG + SWEEP_DEG)}
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {Array.from({ length: 28 }, (_, i) => {
          const deg = START_DEG + (SWEEP_DEG * i) / 27;
          const a = polar(cx, cy, r - stroke * 0.95, deg);
          const b = polar(cx, cy, r - stroke * 0.95 - (i % 3 === 0 ? 12 : 6), deg);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={i / 27 <= ratio ? color : trackColor}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}
        {ratio > 0.001 ? (
          <path
            d={arcPath(cx, cy, r, START_DEG, tipDeg)}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
        {glow > 0.01 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r + stroke * 0.9}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={glow * 0.55}
          />
        ) : null}
        <circle cx={tip.x} cy={tip.y} r={stroke * 0.32} fill="#FFFFFF" opacity={0.95} />
        {sparks > 0.01
          ? seeds.map((s, i) => {
              const age = (frame + s.offset) % SPARK_LIFE;
              const life = age / SPARK_LIFE;
              // Sparks peel off the tip, trail backwards along the arc and drift outward.
              const deg = tipDeg - age * 1.6 * s.drift;
              const radius = r + stroke * 0.2 + age * 2.4 * s.drift + s.lateral * 6;
              const p = polar(cx, cy, radius, deg);
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={s.size * (1 - life * 0.7)}
                  fill={sparkFill}
                  opacity={sparks * (1 - life) * 0.95}
                />
              );
            })
          : null}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: size * 0.04,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            transform: `scale(${valueScale})`,
          }}
        >
          <span
            style={{
              color,
              fontSize: size * 0.3,
              fontWeight: 800,
              letterSpacing: -2,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {Math.round(value)}
          </span>
          <span style={{ color: mutedColor, fontSize: size * 0.075, fontWeight: 600 }}>
            /{max}
          </span>
        </div>
        {label ? (
          <span
            style={{
              marginTop: size * 0.03,
              color: textColor,
              fontSize: size * 0.06,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              opacity: 0.75,
            }}
          >
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export const RadialGauge = memo(RadialGaugeImpl);
