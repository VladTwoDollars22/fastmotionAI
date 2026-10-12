import { noise2D } from "@remotion/noise";
import type { FC } from "react";
import { memo, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { smoothstep } from "../../utils/kinetics";
import { mulberry32 } from "../../utils/prng";
import { mixHex, withAlpha, type PromoBrief, type PromoRole } from "./brief";

export interface PromoBackdropProps {
  brief: PromoBrief;
  /** 0..1 alarm flash (hook glitch) that floods the key light with the danger hue. */
  alarm: number;
  /** Camera offset applied with background-depth parallax. */
  camX: number;
  camY: number;
}

const tintFor = (role: PromoRole, brief: PromoBrief): string => {
  const { palette } = brief;
  switch (role) {
    case "hook":
      return palette.danger;
    case "showcase":
      return palette.accent;
    default:
      return palette.primary;
  }
};

/** Grid scroll speed per beat (px/frame) — the floor rushes during the speed beat. */
const speedFor = (role: PromoRole): number =>
  role === "showcase" ? 2.6 : role === "hook" ? 0.35 : role === "offer" ? 0.9 : 1.4;

const BLOB_COUNT = 6;

interface BlobSeed {
  x: number;
  y: number;
  r: number;
  hueIndex: number;
}

/**
 * Light-theme environment layer (rule 01 §13): moving key-light gradients whose
 * hue follows the active beat, a perspective floor grid that changes speed and
 * tint per beat, drifting soft orbs, a dot field and a soft vignette.
 */
const PromoBackdropImpl: FC<PromoBackdropProps> = ({ brief, alarm, camX, camY }) => {
  const frame = useCurrentFrame();
  const { palette, beats } = brief;

  const blobs = useMemo<BlobSeed[]>(() => {
    const random = mulberry32(1607);
    return Array.from({ length: BLOB_COUNT }, (_, i) => ({
      x: 0.08 + random() * 0.84,
      y: 0.1 + random() * 0.8,
      r: 160 + random() * 220,
      hueIndex: i % 3,
    }));
  }, []);

  // Blend the environment tint across each beat boundary (±18 frames).
  let tint = beats.length > 0 ? tintFor(beats[0].role, brief) : palette.primary;
  let gridScroll = 0;
  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    const next = tintFor(beat.role, brief);
    if (i > 0) tint = mixHex(tint, next, smoothstep(beat.start - 18, beat.start + 18, frame));
    // Integrate the scroll speed so speed changes never jump the grid position.
    const span = Math.max(0, Math.min(frame, beat.start + beat.durationInFrames) - beat.start);
    gridScroll += span * speedFor(beat.role);
  }
  tint = mixHex(tint, palette.danger, alarm);

  const t = frame / 30;
  const keyX = 28 + 14 * Math.sin(t * 0.35) + camX * 0.02;
  const keyY = 26 + 10 * Math.cos(t * 0.28);
  const fillX = 76 + 10 * Math.cos(t * 0.31);
  const fillY = 74 + 8 * Math.sin(t * 0.4);
  const sheenAngle = 115 + 18 * Math.sin(t * 0.22);
  const bgX = camX * -0.35;
  const bgY = camY * -0.35;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.background, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 70% at ${keyX}% ${keyY}%, ${withAlpha(tint, 0.16 + alarm * 0.18)} 0%, ${withAlpha(tint, 0)} 70%), radial-gradient(55% 60% at ${fillX}% ${fillY}%, ${withAlpha(palette.primary, 0.13)} 0%, ${withAlpha(palette.primary, 0)} 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${sheenAngle}deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 64%, ${withAlpha(palette.primary, 0.05)} 100%)`,
        }}
      />

      {/* Dot field (upper half), slow diagonal drift. */}
      <AbsoluteFill
        style={{
          transform: `translate(${bgX}px, ${bgY}px)`,
          backgroundImage: `radial-gradient(${withAlpha(palette.muted, 0.22)} 1.4px, transparent 1.6px)`,
          backgroundSize: "34px 34px",
          backgroundPosition: `${(frame * 0.25) % 34}px ${(frame * 0.12) % 34}px`,
          maskImage: "linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 40%, transparent 62%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 40%, transparent 62%)",
        }}
      />

      {/* Perspective floor grid: scroll speed + line tint follow the beat. */}
      <div
        style={{
          position: "absolute",
          left: "-50%",
          width: "200%",
          bottom: -40,
          height: "62%",
          transform: `translate(${bgX * 1.4}px, 0) perspective(760px) rotateX(66deg)`,
          transformOrigin: "50% 100%",
          backgroundImage: `linear-gradient(${withAlpha(tint, 0.32)} 1.5px, transparent 1.5px), linear-gradient(90deg, ${withAlpha(tint, 0.26)} 1.5px, transparent 1.5px)`,
          backgroundSize: "88px 88px",
          backgroundPosition: `0px ${gridScroll % 88}px`,
          maskImage: "linear-gradient(0deg, black 0%, rgba(0,0,0,0.6) 35%, transparent 80%)",
          WebkitMaskImage:
            "linear-gradient(0deg, black 0%, rgba(0,0,0,0.6) 35%, transparent 80%)",
          opacity: 0.55,
        }}
      />

      {/* Drifting soft orbs (gradient falloff, no blur filter). */}
      {blobs.map((blob, i) => {
        const dx = 70 * noise2D(`orb-x${i}`, frame * 0.006, i);
        const dy = 50 * noise2D(`orb-y${i}`, frame * 0.005, i * 2.1);
        const pulse = 1 + 0.08 * Math.sin(t * 0.6 + i);
        const color = [tint, palette.primary, palette.accent][blob.hueIndex];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${blob.x * 100}%`,
              top: `${blob.y * 100}%`,
              width: blob.r * 2,
              height: blob.r * 2,
              marginLeft: -blob.r,
              marginTop: -blob.r,
              borderRadius: "50%",
              transform: `translate(${dx + bgX}px, ${dy + bgY}px) scale(${pulse})`,
              background: `radial-gradient(circle, ${withAlpha(color, 0.14)} 0%, ${withAlpha(color, 0)} 70%)`,
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 95% at 50% 45%, rgba(15,23,42,0) 55%, rgba(15,23,42,0.10) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const PromoBackdrop = memo(PromoBackdropImpl);
