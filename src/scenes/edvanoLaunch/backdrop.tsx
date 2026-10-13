import type { FC } from "react";
import { memo, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { mixHex, withAlpha } from "../promo16x9/brief";
import { mulberry32 } from "../../utils/prng";
import type { LaunchBrief } from "./brief";

export interface LaunchBackdropProps {
  brief: LaunchBrief;
  /** 0..1 rose alert wash (chaos / warning beats). */
  alarm?: number;
  /** Overall beat energy 0..1 — drives grid brightness and drift speed. */
  energy?: number;
}

interface Mote {
  x: number;
  y: number;
  r: number;
  drift: number;
  phase: number;
  tone: number;
}

const MOTE_COUNT = 54;

/**
 * Shared Edvano-Light environment: an airy slate canvas, soft indigo/emerald
 * tint blooms, a perspective grid and a deterministic drifting particle field.
 * Every value is a pure function of `frame` — no noise, no timers, no jitter.
 */
const LaunchBackdropImpl: FC<LaunchBackdropProps> = ({ brief, alarm = 0, energy = 0.6 }) => {
  const frame = useCurrentFrame();
  const { palette } = brief;

  const motes = useMemo<Mote[]>(() => {
    const random = mulberry32(20412);
    return Array.from({ length: MOTE_COUNT }, () => ({
      x: random() * 1920,
      y: random() * 1080,
      r: 1.6 + random() * 3.2,
      drift: 0.2 + random() * 0.5,
      phase: random() * Math.PI * 2,
      tone: random(),
    }));
  }, []);

  const t = frame / 900;
  const bloom = mixHex(palette.primary, palette.accent, 0.5 + 0.5 * Math.sin(t * Math.PI * 2));
  const gridAlpha = 0.035 + energy * 0.03;
  const gridScroll = (frame * (0.22 + energy * 0.24)) % 96;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: palette.background }}>
      <div
        style={{
          position: "absolute",
          inset: -140,
          background: `radial-gradient(60% 55% at 20% 16%, ${withAlpha(palette.primary, 0.12)} 0%, rgba(255,255,255,0) 62%),
            radial-gradient(55% 50% at 84% 22%, ${withAlpha(palette.accent, 0.1)} 0%, rgba(255,255,255,0) 64%),
            radial-gradient(80% 70% at 50% 116%, ${withAlpha(bloom, 0.1)} 0%, rgba(255,255,255,0) 68%)`,
        }}
      />

      {/* Glowing indigo/cyan aura waves (smooth sine drift). */}
      <div
        style={{
          position: "absolute",
          inset: -160,
          background: `radial-gradient(30% 34% at ${24 + 8 * Math.sin(frame * 0.007)}% ${
            30 + 6 * Math.cos(frame * 0.006)
          }%, ${withAlpha(palette.primary, 0.16)} 0%, rgba(255,255,255,0) 60%),
            radial-gradient(28% 32% at ${74 + 8 * Math.cos(frame * 0.005)}% ${
              40 + 6 * Math.sin(frame * 0.007)
            }%, ${withAlpha(palette.cyan, 0.16)} 0%, rgba(255,255,255,0) 62%)`,
          filter: "blur(2px)",
        }}
      />

      {/* Perspective grid floor. */}
      <div
        style={{
          position: "absolute",
          left: "-25%",
          right: "-25%",
          bottom: "-14%",
          height: "60%",
          transform: `perspective(900px) rotateX(66deg) translate3d(0px, ${gridScroll}px, 0)`,
          transformOrigin: "50% 100%",
          backgroundImage: `linear-gradient(${withAlpha(palette.primary, gridAlpha)} 1.4px, transparent 1.4px),
            linear-gradient(90deg, ${withAlpha(palette.primary, gridAlpha)} 1.4px, transparent 1.4px)`,
          backgroundSize: "96px 96px",
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))",
        }}
      />

      {/* Far glass grid (depth) + ceiling reflection for a 3D glass-box feel. */}
      <div
        style={{
          position: "absolute",
          left: "-30%",
          right: "-30%",
          bottom: "-20%",
          height: "70%",
          transform: `perspective(1100px) rotateX(70deg) translate3d(0px, ${gridScroll * 0.5}px, 0)`,
          transformOrigin: "50% 100%",
          backgroundImage: `linear-gradient(${withAlpha(palette.cyan, gridAlpha * 0.7)} 1.2px, transparent 1.2px),
            linear-gradient(90deg, ${withAlpha(palette.cyan, gridAlpha * 0.7)} 1.2px, transparent 1.2px)`,
          backgroundSize: "160px 160px",
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-30%",
          right: "-30%",
          top: "-30%",
          height: "46%",
          transform: `perspective(1000px) rotateX(-72deg) translate3d(0px, ${-gridScroll * 0.4}px, 0)`,
          transformOrigin: "50% 0%",
          backgroundImage: `linear-gradient(${withAlpha(palette.primary, gridAlpha * 0.5)} 1.2px, transparent 1.2px),
            linear-gradient(90deg, ${withAlpha(palette.primary, gridAlpha * 0.5)} 1.2px, transparent 1.2px)`,
          backgroundSize: "120px 120px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0))",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0))",
          opacity: 0.7,
        }}
      />

      {/* Drifting motes (smooth sine, multiply blend for a light canvas). */}
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}>
        {motes.map((mote, i) => {
          const x = (mote.x + frame * mote.drift + Math.sin(frame * 0.02 + mote.phase) * 22) % 1920;
          const y = (mote.y + frame * mote.drift * 0.32 + Math.cos(frame * 0.017 + mote.phase) * 16) % 1080;
          const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.03 + mote.phase));
          const fill = mote.tone > 0.55 ? palette.accent : palette.primary;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={mote.r * (0.7 + twinkle * 0.5)}
              fill={fill}
              opacity={0.06 + twinkle * 0.12}
            />
          );
        })}
      </svg>

      {alarm > 0.01 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(75% 85% at 50% 50%, ${withAlpha(palette.crimson, alarm * 0.16)} 0%, rgba(255,255,255,0) 72%)`,
          }}
        />
      ) : null}

      {/* Soft airy vignette. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(125% 100% at 50% 46%, rgba(255,255,255,0) 60%, ${withAlpha(
            "#0F172A",
            0.06,
          )} 100%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export const LaunchBackdrop = memo(LaunchBackdropImpl);
