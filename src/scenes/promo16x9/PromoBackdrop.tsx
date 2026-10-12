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
  /** Impact-only camera offset (non-zero ONLY on the two shake frames). */
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

const BLOB_COUNT = 6;

interface BlobSeed {
  x: number;
  y: number;
  r: number;
  hueIndex: number;
}

/**
 * Light-theme environment layer (rule 01 §13). The environment evolves its hue
 * per beat and an alarm flash on the hook, but every coordinate is **static**:
 * no noise drift, no time-based pan, no scrolling grid. The only movement is an
 * impact parallax driven by `camX`/`camY`, which are zero except on the two
 * authored impact frames (warning burst / button click).
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

  // Hue blends across each beat boundary; a colour change, not a translation.
  let tint = beats.length > 0 ? tintFor(beats[0].role, brief) : palette.primary;
  for (let i = 1; i < beats.length; i++) {
    const beat = beats[i];
    tint = mixHex(tint, tintFor(beat.role, brief), smoothstep(beat.start - 18, beat.start + 18, frame));
  }
  tint = mixHex(tint, palette.danger, alarm);

  // Fixed key/fill/sheen anchors — no time-based drift.
  const keyX = 30;
  const keyY = 28;
  const fillX = 74;
  const fillY = 72;
  const sheenAngle = 118;

  // Impact-only parallax (zero except on the two shake frames).
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

      {/* Static dot field (upper half). */}
      <AbsoluteFill
        style={{
          transform: `translate(${bgX}px, ${bgY}px)`,
          backgroundImage: `radial-gradient(${withAlpha(palette.muted, 0.22)} 1.4px, transparent 1.6px)`,
          backgroundSize: "34px 34px",
          backgroundPosition: "0px 0px",
          maskImage: "linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 40%, transparent 62%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 40%, transparent 62%)",
        }}
      />

      {/* Static perspective floor grid (beat-tinted, no scroll). */}
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
          backgroundPosition: "0px 0px",
          maskImage: "linear-gradient(0deg, black 0%, rgba(0,0,0,0.6) 35%, transparent 80%)",
          WebkitMaskImage:
            "linear-gradient(0deg, black 0%, rgba(0,0,0,0.6) 35%, transparent 80%)",
          opacity: 0.55,
        }}
      />

      {/* Static soft orbs (gradient falloff, no blur filter, no drift). */}
      {blobs.map((blob, i) => {
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
              transform: `translate(${bgX}px, ${bgY}px)`,
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
