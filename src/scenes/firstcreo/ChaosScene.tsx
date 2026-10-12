import { AlertTriangle, Clock } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import {
  PlaySfx,
  PlaySfxTrack,
  type SfxCue,
} from "../../utils/audioLibrary";
import { dampedImpulse, smoothstep } from "../../utils/kinetics";
import { withAlpha, type PromoSceneProps } from "../promo16x9/brief";
import { CHAOS_T, TRANSITION_FRAMES, beatClock } from "./timeline";

interface Slot {
  x: number;
  y: number;
  rot: number;
}

/** Loose scatter for the five freelancer chat cards. */
const SLOTS: Slot[] = [
  { x: 120, y: 344, rot: -3 },
  { x: 700, y: 244, rot: 2.4 },
  { x: 1290, y: 344, rot: -2 },
  { x: 388, y: 588, rot: 2 },
  { x: 1040, y: 598, rot: -2.6 },
];

const CARD_W = 400;
const CARD_H = 132;
const MAX_CARDS = 5;

/**
 * Scene 1 — Chaos & Freelancer Overload. Five conflicting Telegram-style chat
 * cards spring in with crimson overdue badges, escalate into a warning burst
 * (frame 120), then swipe away on a liquid transition.
 */
export const ChaosScene: FC<PromoSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = beatClock(beat, CHAOS_T.nominal);
  const { palette, springs, fontFamily } = brief;
  const { scene } = beat;

  const roles = scene.body
    .split(/[•·|]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, MAX_CARDS);

  const burstFrame = at(CHAOS_T.burst);
  const alarm = dampedImpulse(frame - burstFrame, 28);
  const burstPunch = dampedImpulse(frame - burstFrame, 14);

  const popCues: SfxCue[] = roles.map((_, index) => ({
    id: "pop_soft_notification",
    frame: at(CHAOS_T.cards[index] ?? CHAOS_T.cards[0]),
    volume: 0.6,
  }));

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* Crimson escalation wash on the warning burst. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 80% at 50% 52%, ${withAlpha(palette.danger, alarm * 0.24)} 0%, ${withAlpha(palette.danger, 0)} 70%)`,
        }}
      />

      <KineticText
        text={scene.headline}
        mode="word"
        entry="up"
        delay={at(CHAOS_T.headline)}
        stagger={3}
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        distance={58}
        motionBlur={8}
        ambient={0.01}
        sweep={0.2}
        sweepPeriod={46}
        seed="chaos-headline"
        style={{
          position: "absolute",
          top: 96,
          left: 0,
          width: "100%",
          color: palette.text,
          fontSize: 80,
          fontWeight: 800,
          letterSpacing: -1.2,
        }}
      />

      {roles.map((role, index) => {
        const slot = SLOTS[index];
        const enter = spring({
          frame: Math.max(0, frame - at(CHAOS_T.cards[index] ?? 20)),
          fps,
          config: springs.entrance,
        });
        const active = smoothstep(at(CHAOS_T.cards[index] ?? 20), at(CHAOS_T.cards[index] ?? 20) + 10, frame);
        const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * 3 + index);
        const bad = alarm > 0.15;

        return (
          <div
            key={role}
            style={{
              position: "absolute",
              left: slot.x,
              top: slot.y,
              width: CARD_W,
              height: CARD_H,
              borderRadius: 22,
              background: palette.card,
              border: `1.5px solid ${bad ? withAlpha(palette.danger, 0.6) : withAlpha(palette.secondary, 0.1)}`,
              boxShadow: bad
                ? `0 30px 60px -30px ${withAlpha(palette.danger, 0.7)}, 0 0 ${18 + alarm * 40}px ${withAlpha(palette.danger, 0.5)}`
                : `0 26px 54px -30px ${withAlpha(palette.secondary, 0.55)}`,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "0 20px",
              opacity: enter,
              transform: `translateY(${(1 - enter) * 60}px) scale(${0.9 + 0.1 * enter + 0.05 * burstPunch}) rotate(${slot.rot * enter}deg)`,
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 26,
                color: "#FFFFFF",
                background: `linear-gradient(145deg, ${palette.primary} 0%, ${withAlpha(palette.primary, 0.7)} 100%)`,
                flexShrink: 0,
              }}
            >
              {role.slice(0, 1)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 27, fontWeight: 800, color: palette.text }}>{role}</div>
              <div
                style={{
                  marginTop: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: withAlpha(palette.danger, 0.12),
                  color: palette.danger,
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                <Clock size={16} strokeWidth={3} />
                −{2 + index}ч
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 12,
                background: withAlpha(palette.danger, 0.12),
                color: palette.danger,
                opacity: active,
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} strokeWidth={2.8} />
            </div>

            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: palette.danger,
                boxShadow: `0 0 ${6 + pulse * 12}px ${withAlpha(palette.danger, 0.9)}`,
                opacity: active,
              }}
            />
          </div>
        );
      })}

      {/* Escalation tally near the headline. */}
      <div
        style={{
          position: "absolute",
          top: 108,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          transform: "translateY(96px)",
          opacity: smoothstep(burstFrame - 10, burstFrame + 6, frame),
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            borderRadius: 999,
            background: withAlpha(palette.danger, 0.14),
            color: palette.danger,
            fontSize: 26,
            fontWeight: 800,
            transform: `scale(${1 + burstPunch * 0.22})`,
          }}
        >
          <AlertTriangle size={24} strokeWidth={3} />
          5 / 5
        </span>
      </div>

      {/* SFX: rapid interface pops, clean warning alert, liquid exit sweep. */}
      <PlaySfxTrack cues={popCues} />
      <PlaySfx id="accent_alert_soft_warning" frame={burstFrame} volume={0.7} />
      <PlaySfx
        id="whoosh_deep_sweep"
        frame={Math.max(0, beat.durationInFrames - TRANSITION_FRAMES)}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};
