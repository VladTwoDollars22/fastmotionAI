import type { FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { PlaySfx, playRotatedSfx } from "../../utils/audioLibrary";
import { sineFloat } from "../../utils/kinetics";
import { withAlpha } from "../promo16x9/brief";
import type { LaunchSceneProps } from "./brief";
import { MetricChip, StatusDot, cardSurface } from "./glass";
import { FOUNDER_T, beatClock } from "./timeline";

const RING_SIZE = 256;
const RING_STROKE = 22;

const AMBIENT_BADGES = [
  { label: "Автопилот", x: 132, y: 322, tone: "primary" as const },
  { label: "Конверсия +34%", x: 1580, y: 372, tone: "accent" as const },
  { label: "24/7 Лиды", x: 150, y: 782, tone: "primary" as const },
  { label: "Telegram Sync", x: 1566, y: 806, tone: "accent" as const },
];

const ProgressRing: FC<{ progress: number; color: string; track: string; text: string; sub: string }> = ({
  progress,
  color,
  track,
  text,
  sub,
}) => {
  const r = RING_SIZE / 2 - RING_STROKE;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE}>
        <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r} fill="none" stroke={track} strokeWidth={RING_STROKE} />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <span style={{ color, fontSize: 72, fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {text}
        </span>
        <span style={{ color: "#64748B", fontSize: 16, fontWeight: 700, letterSpacing: 1.4 }}>{sub}</span>
      </div>
    </div>
  );
};

/** Scene 4 — Founder freedom: white macro dashboard + ambient floating badges. */
export const FounderFreedomScene: FC<LaunchSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { palette, fontFamily, springs } = brief;

  const k = beatClock(beat, FOUNDER_T.nominal);
  const headlineAt = k(FOUNDER_T.headline);
  const dashboardAt = k(FOUNDER_T.dashboard);
  const dealFrames = brief.deals.map((_, i) => k(FOUNDER_T.deals[i] ?? FOUNDER_T.deals[0]));

  const panelIn = spring({ frame: Math.max(0, frame - dashboardAt), fps, config: springs.settle });
  const appeared = dealFrames.filter((f) => frame >= f).length;
  const ring = Math.min(1, appeared / Math.max(1, dealFrames.length));

  const tiltX = 5 * Math.sin(frame * 0.012);
  const tiltY = 6.5 * Math.sin(frame * 0.009 + 0.5);

  return (
    <AbsoluteFill style={{ perspective: 1200, perspectiveOrigin: "50% 46%", fontFamily }}>
      {/* Glowing protective aura ring (smooth linear dash travel, no jitter). */}
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: 0.85 * panelIn }}>
        <circle
          cx={960}
          cy={566}
          r={430}
          fill="none"
          stroke={withAlpha(palette.primary, 0.3)}
          strokeWidth={3}
          strokeDasharray="6 16"
          strokeDashoffset={-frame * 1.1}
        />
        <circle
          cx={960}
          cy={566}
          r={474}
          fill="none"
          stroke={withAlpha(palette.accent, 0.2)}
          strokeWidth={1.5}
          strokeDasharray="2 12"
          strokeDashoffset={frame * 0.8}
        />
      </svg>

      <KineticText
        text={beat.scene.headline}
        mode="word"
        entry="up"
        delay={headlineAt}
        stagger={2.2}
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        distance={26}
        seed="founder-launch-headline"
        style={{
          position: "absolute",
          top: 54,
          left: 0,
          width: "100%",
          color: palette.text,
          fontSize: 60,
          fontWeight: 900,
          letterSpacing: -0.8,
          textShadow: `0 8px 26px ${withAlpha(palette.primary, 0.16)}`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 352,
          top: 316,
          width: 1216,
          padding: 36,
          display: "flex",
          alignItems: "center",
          gap: 44,
          transform: `translate3d(0px, ${(1 - panelIn) * 34}px, 0px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${
            0.88 + 0.12 * panelIn
          })`,
          opacity: panelIn,
          ...cardSurface({ palette, glow: palette.primary, glowStrength: 0.4 }),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <ProgressRing
            progress={ring}
            color={palette.accent}
            track={withAlpha(palette.border, 0.9)}
            text={`${appeared}`}
            sub="СДЕЛОК"
          />
          <span
            style={{
              color: palette.primary,
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: 2,
              opacity: 0.5 + 0.5 * Math.abs(Math.sin(frame / 3)),
            }}
          >
            LIVE • 24/7
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: palette.text, fontSize: 28, fontWeight: 800 }}>
              Система продаж работает без вас
            </span>
            <span style={{ color: palette.muted, fontSize: 19, fontWeight: 700 }}>CRM • Realtime</span>
          </div>

          {brief.deals.map((_, i) => {
            const at = dealFrames[i];
            const pop = spring({ frame: Math.max(0, frame - at), fps, config: springs.entrance });
            const float = sineFloat(frame, `deal-${i}`, 4, 3, 150);
            const status = 0.5 + 0.5 * Math.abs(Math.sin(frame * 0.06 + i * 1.4));
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 22px",
                  borderRadius: 18,
                  border: `1.5px solid ${withAlpha(palette.accent, 0.4)}`,
                  background: withAlpha(palette.accent, 0.07),
                  transform: `translate3d(${float.x}px, ${(1 - pop) * 22 + float.y}px, ${(1 - pop) * -50}px) scale(${
                    0.74 + 0.26 * pop
                  })`,
                  opacity: pop,
                }}
              >
                <span
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: withAlpha(palette.accent, 0.18),
                    color: palette.accent,
                    fontSize: 25,
                    fontWeight: 900,
                  }}
                >
                  +1
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ color: palette.text, fontSize: 23, fontWeight: 800 }}>Новая оплаченная заявка</span>
                  <span style={{ color: palette.muted, fontSize: 17, fontWeight: 600 }}>
                    {brief.pushAmount} • оплачено
                  </span>
                </div>
                <span
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: palette.accent,
                    fontSize: 17,
                    fontWeight: 800,
                    opacity: status,
                  }}
                >
                  <StatusDot color={palette.accent} pulse={status} />
                  ЗАЧИСЛЕНО
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ambient floating badges (smooth sine float waves). */}
      {AMBIENT_BADGES.map((badge, i) => {
        const float = sineFloat(frame, `badge-${i}`, 12, 11, 160);
        const tone = badge.tone === "accent" ? palette.accent : palette.primary;
        return (
          <div
            key={badge.label}
            style={{
              position: "absolute",
              left: badge.x,
              top: badge.y,
              transform: `translate3d(${float.x}px, ${float.y}px, 120px) rotateX(${6 * Math.sin(frame * 0.02 + i)}deg)`,
              opacity: 0.68 + 0.32 * Math.abs(Math.sin(frame * 0.05 + i * 1.2)),
            }}
          >
            <MetricChip
              label={badge.label}
              palette={palette}
              tone={tone}
              fontFamily={fontFamily}
              style={{ boxShadow: `0 18px 38px -20px ${withAlpha(tone, 0.5)}` }}
            />
          </div>
        );
      })}

      {dealFrames.map((f, i) => (
        <PlaySfx key={`deal-${i}`} {...playRotatedSfx("counters", { frame: f, volume: 0.4, index: i })} />
      ))}
      <PlaySfx {...playRotatedSfx("pops", { frame: dashboardAt, volume: 0.45 })} />
    </AbsoluteFill>
  );
};
