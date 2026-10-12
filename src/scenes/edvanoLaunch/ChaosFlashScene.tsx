import type { FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { PlaySfx, playRotatedSfx } from "../../utils/audioLibrary";
import { dampedImpulse, sineFloat, smoothstep } from "../../utils/kinetics";
import { withAlpha } from "../promo16x9/brief";
import type { LaunchSceneProps } from "./brief";
import { AlertBadge, MetricChip, StatusDot, cardSurface } from "./glass";
import { CHAOS_T, beatClock } from "./timeline";

interface Slot {
  x: number;
  y: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  z: number;
}

/** Scattered 3D positions for the five freelancer cards. */
const SLOTS: Slot[] = [
  { x: 188, y: 322, rotX: 25, rotY: -15, rotZ: -7, z: -160 },
  { x: 764, y: 262, rotX: 25, rotY: 12, rotZ: 6, z: -140 },
  { x: 1322, y: 322, rotX: 25, rotY: -10, rotZ: -6, z: -172 },
  { x: 452, y: 700, rotX: 25, rotY: 11, rotZ: 8, z: -150 },
  { x: 1092, y: 712, rotX: 25, rotY: -12, rotZ: -9, z: -166 },
];

const WARN_CHIPS = [
  { label: "Overdue -2d", x: 150, y: 168, tone: "crimson" as const },
  { label: "Bug #42", x: 1504, y: 210, tone: "crimson" as const },
  { label: "Unanswered", x: 96, y: 560, tone: "primary" as const },
  { label: "Deadline Missed", x: 1512, y: 596, tone: "crimson" as const },
];

/** Scene 1 — Chaos flash: dense freelancer cards collapsing into a clean blackout. */
export const ChaosFlashScene: FC<LaunchSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { palette, fontFamily, springs } = brief;

  const k = beatClock(beat, CHAOS_T.nominal);
  const headlineAt = k(CHAOS_T.headline);
  const blackoutAt = k(CHAOS_T.blackout);
  const blackout = smoothstep(blackoutAt, blackoutAt + 11, frame);
  const alarm = dampedImpulse(frame - blackoutAt, 26);

  const names = brief.freelancers.slice(0, SLOTS.length);
  const cardFrames = names.map((_, i) => k(CHAOS_T.cards[i] ?? CHAOS_T.cards[0]));
  const pulse = (i: number) => 0.5 + 0.5 * Math.sin(frame * 0.06 + i * 1.1);

  return (
    <AbsoluteFill
      style={{ perspective: 1200, perspectiveOrigin: "50% 46%", fontFamily, opacity: 1 - blackout }}
    >
      {/* Frosted glass background panel. */}
      <div
        style={{
          position: "absolute",
          left: 92,
          top: 210,
          width: 1736,
          height: 690,
          borderRadius: 40,
          border: `1.5px solid ${withAlpha(palette.border, 0.9)}`,
          background: `linear-gradient(180deg, ${withAlpha("#FFFFFF", 0.55)}, ${withAlpha("#FFFFFF", 0.25)})`,
          backdropFilter: "blur(14px)",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7)`,
          opacity: 0.9 * smoothstep(0, 26, frame),
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(60% 55% at 50% 40%, ${withAlpha(palette.crimson, 0.08 + alarm * 0.22)} 0%, rgba(255,255,255,0) 70%)`,
        }}
      />

      <KineticText
        text={beat.scene.headline}
        mode="word"
        entry="scale"
        delay={headlineAt}
        stagger={2}
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        distance={24}
        seed="chaos-launch-headline"
        style={{
          position: "absolute",
          top: 62,
          left: 0,
          width: "100%",
          color: palette.text,
          fontSize: 82,
          fontWeight: 900,
          letterSpacing: -1.4,
          textShadow: `0 8px 26px ${withAlpha(palette.primary, 0.16)}`,
        }}
      />

      {beat.scene.body ? (
        <div
          style={{
            position: "absolute",
            top: 168,
            left: 0,
            width: "100%",
            textAlign: "center",
            color: palette.muted,
            fontSize: 24,
            fontWeight: 700,
            opacity: smoothstep(headlineAt + 10, headlineAt + 26, frame),
          }}
        >
          {beat.scene.body}
        </div>
      ) : null}

      {/* Floating warning chips. */}
      {WARN_CHIPS.map((chip, i) => {
        const float = sineFloat(frame, `warn-${i}`, 9, 8, 140);
        const tone = chip.tone === "crimson" ? palette.crimson : palette.primary;
        return (
          <div
            key={chip.label}
            style={{
              position: "absolute",
              left: chip.x,
              top: chip.y,
              transform: `translate3d(${float.x}px, ${float.y}px, ${140 + i * 12}px) rotateX(${8 * Math.sin(frame * 0.02 + i)}deg)`,
              opacity: 0.62 + 0.38 * pulse(i),
            }}
          >
            <MetricChip
              label={chip.label}
              palette={palette}
              tone={tone}
              fontFamily={fontFamily}
              style={{ boxShadow: `0 16px 34px -18px ${withAlpha(tone, 0.5)}` }}
            />
          </div>
        );
      })}

      {names.map((name, i) => {
        const at = cardFrames[i];
        const enter = spring({ frame: Math.max(0, frame - at), fps, config: springs.entrance });
        const slot = SLOTS[i % SLOTS.length];
        const float = sineFloat(frame, `chaos-${i}`, 10, 8, 150);
        const overdue = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.045 + i));
        const accent = i % 2 === 0 ? palette.crimson : palette.primary;

        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: slot.x,
              top: slot.y,
              width: 372,
              padding: 22,
              transform: `translate3d(${float.x}px, ${float.y + (1 - enter) * 60}px, ${
                slot.z + (1 - enter) * -200
              }px) rotateX(${slot.rotX}deg) rotateY(${slot.rotY}deg) rotateZ(${slot.rotZ}deg) scale(${
                0.76 + 0.24 * enter
              })`,
              opacity: enter,
              ...cardSurface({ palette, glow: accent, glowStrength: 0.4 }),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: palette.text, fontSize: 26, fontWeight: 800 }}>{name}</span>
              <AlertBadge color={palette.crimson} label="ПРОСРОЧЕНО" fontFamily={fontFamily} />
            </div>

            <div style={{ marginTop: 14, color: palette.muted, fontSize: 19, fontWeight: 600 }}>
              Дедлайн сдвинут • правки #{3 + i}
            </div>

            <div
              style={{
                marginTop: 14,
                height: 10,
                borderRadius: 999,
                background: withAlpha(palette.crimson, 0.12),
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${58 + overdue * 38}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${palette.crimson}, ${withAlpha(palette.crimson, 0.6)})`,
                }}
              />
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
              {[0, 1, 2].map((d) => (
                <StatusDot key={d} color={accent} pulse={pulse(i + d)} />
              ))}
              <span style={{ marginLeft: "auto", color: palette.muted, fontSize: 16, fontWeight: 700 }}>
                {24 + i + Math.round(3 * Math.sin(frame * 0.05 + i))} задач
              </span>
            </div>
          </div>
        );
      })}

      {/* Hard blackout at the drop. */}
      <AbsoluteFill style={{ backgroundColor: "#0B1120", opacity: blackout }} />

      {/* SFX: rapid tactile pops + a single damped impact on the drop. */}
      {cardFrames.map((f, i) => (
        <PlaySfx key={`pop-${i}`} {...playRotatedSfx("clicks", { frame: f, volume: 0.5, index: i })} />
      ))}
      <PlaySfx
        {...playRotatedSfx("impacts", { id: "impact_subtle_bass", frame: blackoutAt, volume: 1 })}
      />
    </AbsoluteFill>
  );
};
