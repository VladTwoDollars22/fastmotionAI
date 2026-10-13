import { Check, ChevronRight } from "lucide-react";
import { Fragment } from "react";
import type { FC } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { PlaySfx, playRotatedSfx } from "../../utils/audioLibrary";
import { sineFloat, smoothstep } from "../../utils/kinetics";
import { withAlpha } from "../promo16x9/brief";
import type { LaunchSceneProps } from "./brief";
import { MetricChip, StatusDot, cardSurface } from "./glass";
import { ECOSYSTEM_T, beatClock } from "./timeline";

interface Point {
  x: number;
  y: number;
}

const CARD_W = 380;
const CARD_H = 210;
const CARD_Y = 474;
const CARD_XS = [65, 535, 1005, 1475];
const CONN_Y = CARD_Y + CARD_H / 2;

/** 6 faces of the central glass monolith cube (half-size 150). */
const CUBE_FACES = [
  "translateZ(150px)",
  "rotateY(90deg) translateZ(150px)",
  "rotateY(180deg) translateZ(150px)",
  "rotateY(-90deg) translateZ(150px)",
  "rotateX(90deg) translateZ(150px)",
  "rotateX(-90deg) translateZ(150px)",
];

/** Generic architecture tokens for the ambient background chips. */
const TECH_CHIPS = ["API", "SSR", "Edge", "Cache", "Queue", "Auth", "CDN", "GraphQL"];

const LATENCY_CHIPS = [
  { label: "12ms", x: 96, y: 300, tone: "primary" as const },
  { label: "99.9% uptime", x: 1548, y: 300, tone: "accent" as const },
  { label: "Active Sync", x: 104, y: 176, tone: "primary" as const },
];

const quadPoint = (p0: Point, c: Point, p1: Point, t: number): Point => {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y,
  };
};

/** Scene 2 — ordered EDVANO OS ecosystem columns with step/flow indicators. */
export const EcosystemMorphScene: FC<LaunchSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { palette, fontFamily, springs } = brief;

  const k = beatClock(beat, ECOSYSTEM_T.nominal);
  const headlineAt = k(ECOSYSTEM_T.headline);
  const dollyStart = k(ECOSYSTEM_T.dollyStart);
  const dollyEnd = k(ECOSYSTEM_T.dollyEnd);
  const laserAt = k(ECOSYSTEM_T.lasers);

  const columns = brief.ecosystemColumns.slice(0, CARD_XS.length);
  const nodeFrames = columns.map((_, i) => k(ECOSYSTEM_T.nodes[i] ?? ECOSYSTEM_T.nodes[0]));

  const dolly = interpolate(frame, [dollyStart, dollyEnd], [-300, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const travel = interpolate(frame, [dollyStart, dollyEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tilt = 8 * (1 - travel) + 1.2 * Math.sin(frame * 0.012);
  const yaw = 1.8 * Math.sin(frame * 0.01 + 0.6);

  const pulse = (i: number) => 0.5 + 0.5 * Math.sin(frame * 0.06 + i * 1.1);

  return (
    <AbsoluteFill style={{ perspective: 1200, perspectiveOrigin: "50% 48%", fontFamily }}>
      {/* Ambient indigo/cyan aura waves. */}
      <div
        style={{
          position: "absolute",
          inset: -120,
          background: `radial-gradient(38% 42% at ${28 + 6 * Math.sin(frame * 0.006)}% 34%, ${withAlpha(
            palette.primary,
            0.12,
          )} 0%, rgba(255,255,255,0) 62%),
            radial-gradient(34% 40% at ${72 + 6 * Math.cos(frame * 0.005)}% 44%, ${withAlpha(
              palette.cyan,
              0.12,
            )} 0%, rgba(255,255,255,0) 64%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: `translate3d(0px, 0px, ${dolly}px) rotateX(${tilt}deg) rotateY(${yaw}deg)`,
        }}
      >
        {/* Central glass monolith (ambient depth behind the pipeline). */}
        <div
          style={{
            position: "absolute",
            left: 960 - 150,
            top: CONN_Y - 150,
            width: 300,
            height: 300,
            transformStyle: "preserve-3d",
            transform: `translateZ(-240px) rotateX(${12 + 4 * Math.sin(frame * 0.01)}deg) rotateY(${
              -20 + 16 * Math.sin(frame * 0.008)
            }deg)`,
            opacity: 0.14 + 0.12 * travel,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -50,
              background: `radial-gradient(circle, ${withAlpha(palette.primary, 0.22)} 0%, rgba(255,255,255,0) 70%)`,
              filter: "blur(8px)",
            }}
          />
          {CUBE_FACES.map((face, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 16,
                border: `1.5px solid ${withAlpha(palette.primary, 0.4)}`,
                background: `linear-gradient(150deg, ${withAlpha("#FFFFFF", 0.5)}, ${withAlpha("#FFFFFF", 0.12)})`,
                transform: face,
              }}
            />
          ))}
        </div>

        {/* Glowing connection arcs + traveling pulse dots + flow chevrons. */}
        <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
          {columns.slice(0, -1).map((_, i) => {
            const p0 = { x: CARD_XS[i] + CARD_W, y: CONN_Y };
            const p1 = { x: CARD_XS[i + 1], y: CONN_Y };
            const c = { x: (p0.x + p1.x) / 2, y: CONN_Y - 30 };
            const appear = interpolate(frame, [laserAt + i * 12, laserAt + i * 12 + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const travelT = ((frame * 0.02 + i * 0.3) % 1 + 1) % 1;
            const dot = quadPoint(p0, c, p1, travelT);
            const path = `M ${p0.x} ${p0.y} Q ${c.x} ${c.y} ${p1.x} ${p1.y}`;
            return (
              <g key={i} opacity={appear}>
                <path d={path} stroke={withAlpha(palette.primary, 0.2)} strokeWidth={7} fill="none" strokeLinecap="round" />
                <path
                  d={path}
                  stroke={palette.primary}
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="2 13"
                />
                <circle cx={dot.x} cy={dot.y} r={7} fill={palette.accent} style={{ filter: `drop-shadow(0 0 8px ${palette.accent})` }} />
              </g>
            );
          })}
        </svg>

        {/* Flow chevrons between columns. */}
        {columns.slice(0, -1).map((_, i) => {
          const cx = (CARD_XS[i] + CARD_W + CARD_XS[i + 1]) / 2;
          return (
            <div
              key={`arrow-${i}`}
              style={{
                position: "absolute",
                left: cx - 20,
                top: CONN_Y - 40,
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: palette.primary,
                opacity: 0.4 + 0.6 * pulse(i),
                transform: `scale(${0.9 + 0.15 * pulse(i)})`,
              }}
            >
              <ChevronRight size={34} strokeWidth={3} />
            </div>
          );
        })}

        {/* Ordered ecosystem columns. */}
        {columns.map((col, i) => {
          const at = nodeFrames[i];
          const pop = spring({ frame: Math.max(0, frame - at), fps, config: springs.entrance });
          const check = spring({ frame: Math.max(0, frame - at - 10), fps, config: springs.accent });
          const float = sineFloat(frame, `eco-${i}`, 6, 5, 170);
          const depth = i % 2 === 0 ? -60 : 10;
          const status = 0.5 + 0.5 * Math.sin(frame * 0.07 + i * 1.3);
          return (
            <div
              key={col.step}
              style={{
                position: "absolute",
                left: CARD_XS[i],
                top: CARD_Y,
                width: CARD_W,
                height: CARD_H,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transform: `translate3d(${float.x}px, ${float.y + (1 - pop) * 40}px, ${depth + (1 - pop) * -140}px) scale(${0.6 + 0.4 * pop})`,
                opacity: pop,
                ...cardSurface({ palette, glow: palette.primary, glowStrength: 0.4 }),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: palette.primary,
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    boxShadow: `0 8px 18px -8px ${withAlpha(palette.primary, 0.9)}`,
                  }}
                >
                  {col.step}
                </span>
                <span style={{ color: palette.text, fontSize: 23, fontWeight: 800, lineHeight: 1.15 }}>
                  {col.title}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: withAlpha(palette.accent, 0.18),
                    border: `1.5px solid ${withAlpha(palette.accent, 0.6)}`,
                    color: palette.accent,
                    transform: `scale(${0.4 + 0.6 * check})`,
                    opacity: check,
                  }}
                >
                  <Check size={18} strokeWidth={3.4} />
                </span>
              </div>

              <span style={{ color: palette.muted, fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>
                {col.detail}
              </span>

              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <StatusDot color={palette.accent} pulse={status} />
                <span style={{ color: palette.muted, fontSize: 14, fontWeight: 700, letterSpacing: 0.4 }}>
                  {steps(i)} • ONLINE
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ambient latency / uptime chips. */}
      {LATENCY_CHIPS.map((chip, i) => {
        const float = sineFloat(frame, `lat-${i}`, 8, 7, 130);
        const tone = chip.tone === "accent" ? palette.accent : palette.primary;
        return (
          <div
            key={chip.label}
            style={{
              position: "absolute",
              left: chip.x,
              top: chip.y,
              transform: `translate3d(${float.x}px, ${float.y}px, 150px)`,
              opacity: 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.05 + i)),
            }}
          >
            <MetricChip label={chip.label} palette={palette} tone={tone} fontFamily={fontFamily} />
          </div>
        );
      })}

      {/* Floating tech architecture chips (background depth). */}
      {TECH_CHIPS.map((label, i) => {
        const slots = [
          { x: 132, y: 720 },
          { x: 1660, y: 690 },
          { x: 320, y: 900 },
          { x: 1420, y: 906 },
          { x: 740, y: 928 },
          { x: 1060, y: 292 },
          { x: 520, y: 250 },
          { x: 1300, y: 236 },
        ];
        const slot = slots[i % slots.length];
        const float = sineFloat(frame, `tech-${i}`, 10, 9, 150);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: slot.x,
              top: slot.y,
              transform: `translate3d(${float.x}px, ${float.y}px, -60px)`,
              opacity: 0.32 + 0.16 * Math.abs(Math.sin(frame * 0.045 + i)),
            }}
          >
            <MetricChip label={label} palette={palette} tone={palette.cyan} fontFamily={fontFamily} />
          </div>
        );
      })}

      {/* Step progress indicator (order 01 -> 04). */}
      <div
        style={{
          position: "absolute",
          top: 168,
          left: 0,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          opacity: 0.9 * smoothstep(headlineAt + 6, headlineAt + 20, frame),
        }}
      >
        {columns.map((col, i) => {
          const lit = frame >= nodeFrames[i];
          return (
            <Fragment key={`step-${col.step}`}>
              {i > 0 ? (
                <span
                  style={{
                    width: 74,
                    height: 3,
                    borderRadius: 999,
                    background: lit ? palette.primary : withAlpha(palette.border, 0.9),
                    opacity: lit ? 1 : 0.6,
                  }}
                />
              ) : null}
              <span
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 19,
                  fontWeight: 900,
                  color: lit ? "#FFFFFF" : palette.muted,
                  background: lit ? palette.primary : withAlpha(palette.card, 0.85),
                  border: `1.5px solid ${lit ? palette.primary : palette.border}`,
                  boxShadow: lit ? `0 10px 22px -12px ${withAlpha(palette.primary, 0.9)}` : "none",
                  transform: `scale(${lit ? 1 : 0.92})`,
                }}
              >
                {col.step}
              </span>
            </Fragment>
          );
        })}
      </div>
      <span
        style={{
          position: "absolute",
          top: 136,
          left: 0,
          width: "100%",
          textAlign: "center",
          color: palette.muted,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 3,
          opacity: 0.85 * smoothstep(headlineAt + 6, headlineAt + 20, frame),
        }}
      >
        ПОРЯДОК ВНЕДРЕНИЯ
      </span>

      <KineticText
        text={beat.scene.headline}
        mode="word"
        entry="up"
        delay={headlineAt}
        stagger={2.2}
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        distance={28}
        seed="eco-launch-headline"
        style={{
          position: "absolute",
          top: 52,
          left: 0,
          width: "100%",
          color: palette.text,
          fontSize: 58,
          fontWeight: 900,
          letterSpacing: -1,
          textShadow: `0 8px 26px ${withAlpha(palette.primary, 0.16)}`,
        }}
      />

      {beat.scene.body ? (
        <KineticText
          text={beat.scene.body}
          mode="word"
          entry="up"
          delay={headlineAt + 16}
          stagger={1.6}
          damping={springs.settle.damping}
          stiffness={springs.settle.stiffness}
          mass={springs.settle.mass}
          distance={20}
          seed="eco-launch-body"
          style={{
            position: "absolute",
            bottom: 72,
            left: 0,
            width: "100%",
            color: palette.muted,
            fontSize: 30,
            fontWeight: 600,
          }}
        />
      ) : null}

      {nodeFrames.map((f, i) => (
        <PlaySfx key={`whoosh-${i}`} {...playRotatedSfx("whoosh", { frame: f, volume: 0.45, index: i })} />
      ))}
      <PlaySfx
        {...playRotatedSfx("counters", {
          id: "chime_success_warm",
          frame: Math.max(0, k(ECOSYSTEM_T.nodes[columns.length - 1] ?? ECOSYSTEM_T.nodes[0]) + 6),
          volume: 0.5,
        })}
      />
    </AbsoluteFill>
  );
};

/** "Шаг 01" style label. */
function steps(index: number): string {
  return `Шаг ${String(index + 1).padStart(2, "0")}`;
}
