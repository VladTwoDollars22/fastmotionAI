import type { FC } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { PlaySfx, playRotatedSfx } from "../../utils/audioLibrary";
import { sineFloat } from "../../utils/kinetics";
import { withAlpha } from "../promo16x9/brief";
import type { LaunchSceneProps } from "./brief";
import { MetricChip, StatusDot, cardSurface } from "./glass";
import { ECOSYSTEM_T, beatClock } from "./timeline";

interface Point {
  x: number;
  y: number;
}

const NODE_POS: Point[] = [
  { x: 360, y: 596 },
  { x: 760, y: 470 },
  { x: 1160, y: 596 },
  { x: 1558, y: 470 },
];

const NODE_HALF_W = 176;
const NODE_H = 156;

/** 6 faces of the central glass monolith cube (half-size 120). */
const CUBE_FACES = [
  "translateZ(120px)",
  "rotateY(90deg) translateZ(120px)",
  "rotateY(180deg) translateZ(120px)",
  "rotateY(-90deg) translateZ(120px)",
  "rotateX(90deg) translateZ(120px)",
  "rotateX(-90deg) translateZ(120px)",
];

const quadPoint = (p0: Point, c: Point, p1: Point, t: number): Point => {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y,
  };
};

const LATENCY_CHIPS = [
  { label: "12ms", value: "", x: 620, y: 352, tone: "primary" as const },
  { label: "99.9% uptime", value: "", x: 1300, y: 352, tone: "accent" as const },
];

/** Scene 2 — Ecosystem convergence: nodes, dotted arcs, pulse dots, latency chips. */
export const EcosystemMorphScene: FC<LaunchSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { palette, fontFamily, springs } = brief;

  const k = beatClock(beat, ECOSYSTEM_T.nominal);
  const headlineAt = k(ECOSYSTEM_T.headline);
  const dollyStart = k(ECOSYSTEM_T.dollyStart);
  const dollyEnd = k(ECOSYSTEM_T.dollyEnd);
  const laserAt = k(ECOSYSTEM_T.lasers);

  const labels = brief.ecosystemNodes.slice(0, NODE_POS.length);
  const nodeFrames = labels.map((_, i) => k(ECOSYSTEM_T.nodes[i] ?? ECOSYSTEM_T.nodes[0]));

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

  return (
    <AbsoluteFill style={{ perspective: 1200, perspectiveOrigin: "50% 48%", fontFamily }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(45% 45% at 50% 52%, ${withAlpha(
            palette.primary,
            0.14 * Math.max(0.2, 1 - travel),
          )} 0%, rgba(255,255,255,0) 70%)`,
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
        {/* Central glowing glass monolith (camera orbits and dives through it). */}
        <div
          style={{
            position: "absolute",
            left: 960 - 120,
            top: 528 - 120,
            width: 240,
            height: 240,
            transformStyle: "preserve-3d",
            transform: `translateZ(-170px) rotateX(${12 + 4 * Math.sin(frame * 0.01)}deg) rotateY(${
              -20 + 16 * Math.sin(frame * 0.008)
            }deg)`,
            opacity: 0.5 + 0.5 * travel,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -40,
              background: `radial-gradient(circle, ${withAlpha(palette.primary, 0.24)} 0%, rgba(255,255,255,0) 70%)`,
              filter: "blur(6px)",
            }}
          />
          {CUBE_FACES.map((face, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 14,
                border: `1.5px solid ${withAlpha(palette.primary, 0.35)}`,
                background: `linear-gradient(150deg, ${withAlpha("#FFFFFF", 0.62)}, ${withAlpha("#FFFFFF", 0.2)})`,
                backdropFilter: "blur(6px)",
                transform: face,
              }}
            />
          ))}
        </div>

        {/* Glowing dotted connection arcs + traveling pulse light-dots. */}
        <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
          {labels.slice(0, -1).map((_, i) => {
            const a = NODE_POS[i];
            const b = NODE_POS[i + 1];
            const p0 = { x: a.x + NODE_HALF_W, y: a.y };
            const p1 = { x: b.x - NODE_HALF_W, y: b.y };
            const c = { x: (p0.x + p1.x) / 2, y: Math.min(p0.y, p1.y) - 70 };
            const appear = interpolate(frame, [laserAt + i * 12, laserAt + i * 12 + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const pulse = ((frame * 0.016 + i * 0.3) % 1 + 1) % 1;
            const dot = quadPoint(p0, c, p1, pulse);
            const dot2 = quadPoint(p0, c, p1, (pulse + 0.5) % 1);
            const path = `M ${p0.x} ${p0.y} Q ${c.x} ${c.y} ${p1.x} ${p1.y}`;
            return (
              <g key={i} opacity={appear}>
                <path d={path} stroke={withAlpha(palette.primary, 0.16)} strokeWidth={7} fill="none" strokeLinecap="round" />
                <path
                  d={path}
                  stroke={palette.primary}
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="2 14"
                />
                <circle cx={dot.x} cy={dot.y} r={7} fill={palette.accent} style={{ filter: `drop-shadow(0 0 8px ${palette.accent})` }} />
                <circle cx={dot2.x} cy={dot2.y} r={5} fill={palette.primary} opacity={0.7} />
              </g>
            );
          })}
        </svg>

        {/* Crystal nodes. */}
        {labels.map((label, i) => {
          const at = nodeFrames[i];
          const pop = spring({ frame: Math.max(0, frame - at), fps, config: springs.entrance });
          const pos = NODE_POS[i];
          const float = sineFloat(frame, `eco-${i}`, 8, 7, 160);
          const depth = (i % 2 === 0 ? -60 : 20) + (1 - pop) * -160;
          const status = 0.5 + 0.5 * Math.sin(frame * 0.07 + i * 1.3);
          return (
            <div
              key={label}
              style={{
                position: "absolute",
                left: pos.x - NODE_HALF_W,
                top: pos.y - NODE_H / 2,
                width: NODE_HALF_W * 2,
                height: NODE_H,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 10,
                transform: `translate3d(${float.x}px, ${float.y}px, ${depth}px) scale(${0.4 + 0.6 * pop})`,
                opacity: pop,
                ...cardSurface({ palette, glow: palette.primary, glowStrength: 0.4 }),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: palette.primary,
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: 900,
                    boxShadow: `0 6px 16px -6px ${withAlpha(palette.primary, 0.8)}`,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: palette.text, fontSize: 25, fontWeight: 800, letterSpacing: 0.2 }}>
                  {label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatusDot color={palette.accent} pulse={status} />
                <span style={{ color: palette.muted, fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>
                  ONLINE • {Math.round(96 + status * 4)}ms
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Latency / uptime chips. */}
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
          top: 56,
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
            bottom: 76,
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
          frame: Math.max(0, k(ECOSYSTEM_T.nodes[labels.length - 1] ?? ECOSYSTEM_T.nodes[0]) + 6),
          volume: 0.5,
        })}
      />
    </AbsoluteFill>
  );
};
