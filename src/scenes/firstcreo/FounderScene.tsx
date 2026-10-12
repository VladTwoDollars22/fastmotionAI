import { BadgeCheck, TrendingUp } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { PlaySfx } from "../../utils/audioLibrary";
import { dampedImpulse, smoothstep } from "../../utils/kinetics";
import { progressBetween, withAlpha } from "../promo16x9/brief";
import type { FirstCreoSceneProps } from "./brief";
import { FOUNDER_T, TRANSITION_FRAMES, beatClock } from "./timeline";

const CARD = { left: 370, top: 300, width: 1180, height: 566 };
const DEAL_TARGET = 48;
const METER_TARGETS = [0.98, 0.84, 0.9, 0.76];

/**
 * Scene 3 — Founder Freedom & Value. A clean glass panel reports live inbound
 * leads: a revenue/deal counter ticks up in real time while progress meters
 * fill and lead notifications land.
 */
export const FounderScene: FC<FirstCreoSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = beatClock(beat, FOUNDER_T.nominal);
  const { palette, springs, fontFamily } = brief;
  const { scene } = beat;

  const cardsAt = at(FOUNDER_T.card);
  const countStart = at(FOUNDER_T.countStart);
  const countEnd = at(FOUNDER_T.countEnd);
  const levelUp = at(FOUNDER_T.levelUp);

  const cardIn = spring({ frame: frame - cardsAt, fps, config: springs.entrance });
  const countP = 1 - Math.pow(1 - progressBetween(frame, countStart, countEnd), 3);
  const deals = Math.round(DEAL_TARGET * countP);
  const levelPunch = dampedImpulse(frame - levelUp, 20);

  const meters = brief.meterLabels.slice(0, 4);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <KineticText
        text={scene.headline}
        mode="word"
        entry="up"
        delay={at(FOUNDER_T.headline)}
        stagger={3}
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        distance={56}
        motionBlur={8}
        ambient={0.01}
        seed="founder-headline"
        style={{
          position: "absolute",
          top: 96,
          left: 0,
          width: "100%",
          color: palette.text,
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: -1.2,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: CARD.left,
          top: CARD.top,
          width: CARD.width,
          height: CARD.height,
          borderRadius: 32,
          background: "rgba(255,255,255,0.74)",
          backdropFilter: "blur(24px) saturate(1.3)",
          WebkitBackdropFilter: "blur(24px) saturate(1.3)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow: `0 50px 110px -44px ${withAlpha(palette.secondary, 0.5)}, inset 0 1px 0 rgba(255,255,255,0.95)`,
          display: "flex",
          gap: 48,
          padding: 48,
          transform: `translateY(${(1 - cardIn) * 60}px) scale(${0.92 + 0.08 * cardIn})`,
          opacity: cardIn,
        }}
      >
        {/* Left: live deal counter + lead feed. */}
        <div style={{ width: 452, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 20px",
              borderRadius: 999,
              background: withAlpha(palette.accent, 0.12),
              color: palette.accent,
              fontSize: 22,
              fontWeight: 800,
              alignSelf: "flex-start",
            }}
          >
            <TrendingUp size={24} strokeWidth={2.8} />
            Сделки
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "baseline",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 132,
                fontWeight: 900,
                color: palette.text,
                letterSpacing: -2,
                transform: `scale(${1 + levelPunch * 0.06})`,
                transformOrigin: "0% 70%",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {deals}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 999,
                background: withAlpha(palette.accent, 0.16),
                color: palette.accent,
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              +1
            </span>
          </div>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {brief.meterLabels.slice(0, 3).map((label, i) => {
              const appear = smoothstep(
                at(FOUNDER_T.feeds[i] ?? 0),
                at(FOUNDER_T.feeds[i] ?? 0) + 12,
                frame,
              );
              return (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 18px",
                    borderRadius: 16,
                    background: palette.card,
                    border: `1.5px solid ${withAlpha(palette.accent, 0.22)}`,
                    boxShadow: `0 16px 34px -26px ${withAlpha(palette.secondary, 0.5)}`,
                    opacity: appear,
                    transform: `translateX(${(1 - appear) * 30}px)`,
                  }}
                >
                  <BadgeCheck size={26} strokeWidth={2.6} color={palette.accent} />
                  <span style={{ flex: 1, color: palette.text, fontSize: 22, fontWeight: 700 }}>
                    {label}
                  </span>
                  <span style={{ color: palette.accent, fontSize: 22, fontWeight: 800 }}>+1</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: progress meters. */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 }}>
          {meters.map((label, i) => {
            const p = 1 - Math.pow(1 - progressBetween(frame, cardsAt + 20 + i * 16, cardsAt + 130 + i * 16), 3);
            const pct = Math.round(METER_TARGETS[i % METER_TARGETS.length] * p * 100);
            return (
              <div key={label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: palette.text }}>{label}</span>
                  <span style={{ color: palette.muted, fontVariantNumeric: "tabular-nums" }}>
                    {pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 16,
                    borderRadius: 999,
                    background: withAlpha(palette.secondary, 0.08),
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${withAlpha(palette.primary, 0.75)} 0%, ${palette.accent} 100%)`,
                      boxShadow: `0 0 18px ${withAlpha(palette.accent, 0.5)}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SFX: rhythmic soft ticks + warm level-up chime + exit sweep. */}
      <PlaySfx
        id="counter_tick_soft"
        frame={countStart}
        durationInFrames={Math.max(1, countEnd - countStart)}
        loop
        volume={0.5}
      />
      <PlaySfx id="score_level_up" frame={levelUp} volume={0.6} />
      <PlaySfx
        id="whoosh_air_fast"
        frame={Math.max(0, beat.durationInFrames - TRANSITION_FRAMES)}
        volume={0.65}
        pitch={-1}
      />
    </AbsoluteFill>
  );
};
