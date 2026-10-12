import { Zap } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { RadialGauge } from "../../components/ui/RadialGauge";
import { PlaySfx, playRotatedSfx } from "../../utils/audioLibrary";
import { dampedImpulse, sineFloat, smoothstep } from "../../utils/kinetics";
import { withAlpha } from "../promo16x9/brief";
import type { LaunchSceneProps } from "./brief";
import { MetricChip, StatusDot, cardSurface } from "./glass";
import { ENGINE_T, beatClock } from "./timeline";

const GAUGE_SIZE = 452;
const FUNNEL_X = 1444;
const FUNNEL_W = 384;
const FUNNEL_H = 116;
const FUNNEL_YS = [300, 470, 640, 810];

const PERF_CHIPS = [
  { value: "0.4s", label: "LCP" },
  { value: "0.00", label: "CLS" },
  { value: "0.1s", label: "TTFB" },
];

const NET_NODES = [
  { x: 150, y: 168 },
  { x: 470, y: 120 },
  { x: 1460, y: 150 },
  { x: 1806, y: 286 },
  { x: 300, y: 950 },
  { x: 940, y: 986 },
  { x: 1706, y: 918 },
  { x: 700, y: 618 },
];
const NET_EDGES = [
  [0, 1],
  [1, 7],
  [7, 4],
  [4, 5],
  [5, 6],
  [6, 3],
  [3, 2],
  [2, 7],
];

/** Scene 3 — Revenue engine: gauge, perf chips, lead pills, node network, push card. */
export const EngineShowcaseScene: FC<LaunchSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { palette, fontFamily, springs } = brief;

  const k = beatClock(beat, ENGINE_T.nominal);
  const headlineAt = k(ENGINE_T.headline);
  const gaugeStart = k(ENGINE_T.gaugeStart);
  const gaugeEnd = k(ENGINE_T.gaugeEnd);
  const funnelAt = k(ENGINE_T.funnel);
  const pushAt = k(ENGINE_T.push);

  const score = interpolate(frame, [gaugeStart, gaugeEnd], [42, brief.gaugeTarget], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scoreDone = smoothstep(gaugeEnd - 16, gaugeEnd, frame);
  const pushPop = spring({ frame: Math.max(0, frame - pushAt), fps, config: springs.accent });
  const pushPunch = dampedImpulse(frame - pushAt, 18);

  const funnelNodes = brief.funnelNodes.slice(0, FUNNEL_YS.length);
  const tickCount = 10;
  const tickFrames = Array.from({ length: tickCount }, (_, i) =>
    Math.round(gaugeStart + ((gaugeEnd - gaugeStart) * i) / (tickCount - 1)),
  );
  const leadCount = Math.round(smoothstep(gaugeStart, gaugeEnd, frame) * 12);

  return (
    <AbsoluteFill style={{ perspective: 1200, perspectiveOrigin: "50% 48%", fontFamily }}>
      {/* Pulsing background node network. */}
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        {NET_EDGES.map(([a, b], i) => {
          const na = NET_NODES[a];
          const nb = NET_NODES[b];
          const on = 0.3 + 0.3 * Math.abs(Math.sin(frame * 0.04 + i));
          return (
            <line
              key={i}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke={withAlpha(palette.primary, 0.1)}
              strokeWidth={2}
              opacity={on}
            />
          );
        })}
        {NET_NODES.map((n, i) => {
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.05 + i * 1.3));
          return <circle key={i} cx={n.x} cy={n.y} r={3 + pulse * 3} fill={palette.primary} opacity={0.12 + pulse * 0.14} />;
        })}
      </svg>

      <KineticText
        text={beat.scene.headline}
        mode="word"
        entry="up"
        delay={headlineAt}
        stagger={2}
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        distance={26}
        seed="engine-launch-headline"
        style={{
          position: "absolute",
          top: 48,
          left: 0,
          width: "100%",
          color: palette.text,
          fontSize: 56,
          fontWeight: 900,
          letterSpacing: -0.8,
          textShadow: `0 8px 26px ${withAlpha(palette.primary, 0.16)}`,
        }}
      />

      {/* PageSpeed gauge. */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 336,
          transform: `translateZ(${(1 - scoreDone) * -50}px) rotateY(-8deg)`,
        }}
      >
        <div style={{ ...cardSurface({ palette, glow: palette.accent, glowStrength: 0.4 }), padding: 28 }}>
          <RadialGauge
            value={score}
            max={100}
            size={GAUGE_SIZE - 56}
            stroke={26}
            color={palette.accent}
            trackColor={withAlpha(palette.border, 0.9)}
            textColor={palette.text}
            mutedColor={palette.muted}
            label={brief.gaugeTarget >= 100 ? "PageSpeed" : ""}
            fontFamily={fontFamily}
            sparks={scoreDone}
            sparkColor={palette.accent}
            glow={scoreDone}
            seed={3}
          />
        </div>
      </div>

      {/* PageSpeed perf chips. */}
      {PERF_CHIPS.map((chip, i) => {
        const float = sineFloat(frame, `perf-${i}`, 6, 6, 140);
        return (
          <div
            key={chip.label}
            style={{
              position: "absolute",
              left: 556,
              top: 486 + i * 58,
              transform: `translate3d(${float.x}px, ${float.y}px, 110px)`,
              opacity: 0.7 + 0.3 * Math.abs(Math.sin(frame * 0.05 + i)),
            }}
          >
            <MetricChip label={chip.label} value={chip.value} palette={palette} tone={palette.accent} fontFamily={fontFamily} />
          </div>
        );
      })}

      {/* Pulsing 3D funnel map. */}
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
        <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
          {funnelNodes.slice(0, -1).map((_, i) => {
            const y1 = FUNNEL_YS[i] + FUNNEL_H / 2;
            const y2 = FUNNEL_YS[i + 1] - FUNNEL_H / 2;
            const appear = interpolate(frame, [funnelAt + i * 10, funnelAt + i * 10 + 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const pulse = ((frame * 0.02 + i * 0.34) % 1 + 1) % 1;
            const py = y1 + (y2 - y1) * pulse;
            return (
              <g key={i} opacity={appear}>
                <line x1={FUNNEL_X} y1={y1} x2={FUNNEL_X} y2={y2} stroke={withAlpha(palette.primary, 0.3)} strokeWidth={5} strokeLinecap="round" />
                <line
                  x1={FUNNEL_X}
                  y1={y1}
                  x2={FUNNEL_X}
                  y2={y2}
                  stroke={palette.primary}
                  strokeWidth={3}
                  strokeDasharray="2 12"
                  strokeLinecap="round"
                />
                <circle cx={FUNNEL_X} cy={py} r={6} fill={palette.accent} />
              </g>
            );
          })}
        </svg>

        {funnelNodes.map((label, i) => {
          const at = funnelAt + i * 10;
          const pop = spring({ frame: Math.max(0, frame - at), fps, config: springs.entrance });
          const float = sineFloat(frame, `funnel-${i}`, 7, 6, 150);
          const status = 0.5 + 0.5 * Math.sin(frame * 0.06 + i * 1.2);
          return (
            <div
              key={label}
              style={{
                position: "absolute",
                left: FUNNEL_X - FUNNEL_W / 2,
                top: FUNNEL_YS[i],
                width: FUNNEL_W,
                height: FUNNEL_H,
                padding: "16px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                transform: `translate3d(${float.x}px, ${float.y}px, ${i % 2 === 0 ? -40 : 30}px) scale(${0.55 + 0.45 * pop})`,
                opacity: pop,
                ...cardSurface({ palette, glow: palette.primary, glowStrength: 0.35 }),
              }}
            >
              <span style={{ color: palette.text, fontSize: 24, fontWeight: 800 }}>{label}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusDot color={palette.primary} pulse={status} />
                <span style={{ color: palette.muted, fontSize: 16, fontWeight: 700 }}>{Math.round(88 + status * 12)}%</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Floating white PUSH card. */}
      <div
        style={{
          position: "absolute",
          left: 556,
          top: 316,
          width: 596,
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          transform: `translate3d(0px, ${(1 - pushPop) * 26}px, ${90 + pushPunch * 34}px) scale(${
            0.76 + 0.24 * pushPop + pushPunch * 0.05
          })`,
          opacity: pushPop,
          ...cardSurface({ palette, glow: palette.accent, glowStrength: 0.5 }),
        }}
      >
        <span
          style={{
            width: 62,
            height: 62,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: withAlpha(palette.accent, 0.14),
            border: `1.5px solid ${withAlpha(palette.accent, 0.5)}`,
            color: palette.accent,
          }}
        >
          <Zap size={30} strokeWidth={2.6} />
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ color: palette.text, fontSize: 27, fontWeight: 800 }}>
            Новая оплаченная заявка: {brief.pushAmount}
          </span>
          <span style={{ color: palette.muted, fontSize: 18, fontWeight: 600 }}>
            Telegram Lead • только что • CRM Deal
          </span>
        </div>
      </div>

      {/* Live lead-counter pills. */}
      <div style={{ position: "absolute", left: 64, top: 992, display: "flex", gap: 14 }}>
        <MetricChip
          label="оплачено"
          value="3"
          palette={palette}
          tone={palette.accent}
          fontFamily={fontFamily}
          style={{ opacity: pushPop }}
        />
        <MetricChip
          label="заявок сегодня"
          value={`+${leadCount}`}
          palette={palette}
          tone={palette.primary}
          fontFamily={fontFamily}
          style={{ opacity: smoothstep(gaugeStart, gaugeEnd, frame) }}
        />
      </div>

      {/* 3D smartphone live-switching languages (RU / EN / UK). */}
      <div
        style={{
          position: "absolute",
          left: 892,
          top: 688,
          width: 214,
          height: 312,
          padding: 14,
          transform: `translate3d(0px, 0px, 90px) rotateX(${6 * Math.sin(frame * 0.02)}deg) rotateY(${
            -14 + 4 * Math.sin(frame * 0.015)
          }deg) scale(${0.72 + 0.28 * smoothstep(gaugeStart, gaugeEnd, frame)})`,
          opacity: smoothstep(gaugeStart, gaugeEnd, frame),
          ...cardSurface({ palette, glow: palette.primary, glowStrength: 0.4 }),
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 18,
            background: `linear-gradient(180deg, ${withAlpha(palette.background, 0.92)}, ${withAlpha(palette.card, 0.7)})`,
            border: `1.5px solid ${palette.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <span style={{ width: 46, height: 6, borderRadius: 999, background: palette.border }} />
          <div style={{ display: "flex", gap: 8 }}>
            {brief.languagePills.map((pill, i) => {
              const active = Math.floor(frame / 40) % brief.languagePills.length === i;
              return (
                <span
                  key={pill}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontSize: 16,
                    fontWeight: 800,
                    color: active ? "#FFFFFF" : palette.muted,
                    background: active ? palette.primary : withAlpha(palette.border, 0.5),
                    transform: `scale(${active ? 1.08 : 1})`,
                  }}
                >
                  {pill}
                </span>
              );
            })}
          </div>
          <span style={{ color: palette.muted, fontSize: 14, fontWeight: 700 }}>Locale Sync</span>
        </div>
      </div>

      {/* Floating messaging pills. */}
      <div style={{ position: "absolute", left: 1180, top: 958, display: "flex", gap: 12 }}>
        {brief.messagingPills.map((pill, i) => {
          const float = sineFloat(frame, `msg-${i}`, 6, 5, 130);
          return (
            <div key={pill} style={{ transform: `translate3d(${float.x}px, ${float.y}px, 110px)` }}>
              <MetricChip
                label={pill}
                palette={palette}
                tone={i % 2 === 0 ? palette.accent : palette.primary}
                fontFamily={fontFamily}
              />
            </div>
          );
        })}
      </div>

      {tickFrames.map((f, i) => (
        <PlaySfx key={`tick-${i}`} {...playRotatedSfx("counters", { frame: f, volume: 0.35, index: i })} />
      ))}
      <PlaySfx {...playRotatedSfx("pops", { frame: pushAt, volume: 0.6 })} />
      <PlaySfx {...playRotatedSfx("counters", { id: "chime_success_warm", frame: gaugeEnd, volume: 0.55 })} />
    </AbsoluteFill>
  );
};
