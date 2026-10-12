import { Briefcase, Check, Filter, Globe, Target } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { PlaySfx, PlaySfxTrack, type SfxCue } from "../../utils/audioLibrary";
import { dampedImpulse, smoothstep } from "../../utils/kinetics";
import { withAlpha } from "../promo16x9/brief";
import type { FirstCreoSceneProps } from "./brief";
import { ECO_T, TRANSITION_FRAMES, beatClock } from "./timeline";

const NODE_W = 344;
const NODE_H = 150;

/** Node anchor positions (left, top) forming a gentle zig-zag flow. */
const NODE_POS = [
  { x: 92, y: 436 },
  { x: 522, y: 612 },
  { x: 952, y: 436 },
  { x: 1382, y: 612 },
];

const NODE_ICON = [Globe, Target, Filter, Briefcase];

const centerOf = (i: number) => ({
  x: NODE_POS[i].x + NODE_W / 2,
  y: NODE_POS[i].y + NODE_H / 2,
});

/** Point on a quadratic bezier (control point lifted above the chord midpoint). */
const bezier = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  t: number,
): { x: number; y: number } => {
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 - 90;
  const mt = 1 - t;
  return {
    x: mt * mt * from.x + 2 * mt * t * cx + t * t * to.x,
    y: mt * mt * from.y + 2 * mt * t * cy + t * t * to.y,
  };
};

/**
 * Scene 2 — Edvano All-in-One Ecosystem. Chaos collapses into one connected
 * flow of nodes with emerald data packets and live deal notifications.
 */
export const EcosystemScene: FC<FirstCreoSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = beatClock(beat, ECO_T.nominal);
  const { palette, springs, fontFamily } = brief;
  const { scene } = beat;

  const nodes = brief.ecosystemNodes.slice(0, 4);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <KineticText
        text={scene.headline}
        mode="word"
        entry="up"
        delay={at(ECO_T.headline)}
        stagger={3}
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        distance={56}
        motionBlur={8}
        ambient={0.01}
        seed="eco-headline"
        style={{
          position: "absolute",
          top: 84,
          left: 0,
          width: "100%",
          color: palette.text,
          fontSize: 74,
          fontWeight: 800,
          letterSpacing: -1.2,
        }}
      />
      <KineticText
        text={scene.body}
        mode="word"
        entry="up"
        delay={at(ECO_T.body)}
        stagger={1.6}
        damping={springs.settle.damping}
        stiffness={springs.settle.stiffness}
        mass={springs.settle.mass}
        distance={24}
        seed="eco-body"
        style={{
          position: "absolute",
          top: 196,
          left: 0,
          width: "100%",
          color: palette.muted,
          fontSize: 32,
          fontWeight: 600,
        }}
      />

      {/* Connectors + emerald data packets. */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {nodes.slice(1).map((_, i) => {
          const from = centerOf(i);
          const to = centerOf(i + 1);
          const live = smoothstep(
            at(ECO_T.activations[i]),
            at(ECO_T.activations[i + 1]),
            frame,
          );
          const p = (((frame - at(ECO_T.flow)) * 0.016 + i * 0.33) % 1 + 1) % 1;
          const dot = bezier(from, to, p);
          return (
            <g key={i}>
              <path
                d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 90} ${to.x} ${to.y}`}
                fill="none"
                stroke={withAlpha(palette.accent, 0.18 + 0.28 * live)}
                strokeWidth={4}
                strokeDasharray="10 12"
                strokeDashoffset={-frame * 1.6}
                strokeLinecap="round"
              />
              {live > 0.02 ? (
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={9}
                  fill={palette.accent}
                  opacity={0.85 * Math.min(1, live * 2)}
                />
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Nodes. */}
      {nodes.map((label, i) => {
        const Icon = NODE_ICON[i % NODE_ICON.length];
        const pos = NODE_POS[i];
        const enter = spring({
          frame: Math.max(0, frame - at(ECO_T.activations[i]) + 24),
          fps,
          config: springs.entrance,
        });
        const activeAt = at(ECO_T.activations[i]);
        const active = smoothstep(activeAt, activeAt + 10, frame);
        const punch = dampedImpulse(frame - activeAt, 16);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: NODE_W,
              height: NODE_H,
              borderRadius: 24,
              background: palette.card,
              border: `2px solid ${active > 0.5 ? withAlpha(palette.accent, 0.7) : withAlpha(palette.secondary, 0.1)}`,
              boxShadow: active > 0.5
                ? `0 30px 62px -32px ${withAlpha(palette.secondary, 0.5)}, 0 0 ${12 + active * 26}px ${withAlpha(palette.accent, 0.4)}`
                : `0 26px 54px -34px ${withAlpha(palette.secondary, 0.55)}`,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "0 22px",
              opacity: enter,
              transform: `translateY(${(1 - enter) * 40}px) scale(${0.94 + 0.06 * enter + 0.05 * punch})`,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: withAlpha(active > 0.5 ? palette.accent : palette.primary, 0.12),
                color: active > 0.5 ? palette.accent : palette.primary,
              }}
            >
              <Icon size={30} strokeWidth={2.6} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 800,
                  color: palette.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 18,
                  fontWeight: 700,
                  color: active > 0.5 ? palette.accent : palette.muted,
                }}
              >
                {active > 0.5 ? "активно" : "ожидание"}
              </div>
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: withAlpha(palette.accent, 0.16),
                color: palette.accent,
                opacity: active,
                flexShrink: 0,
              }}
            >
              <Check size={20} strokeWidth={3.4} />
            </div>
          </div>
        );
      })}

      {/* Live deal notification near the CRM node. */}
      {nodes.length >= 4 ? (
        <div
          style={{
            position: "absolute",
            left: NODE_POS[3].x + 96,
            top: NODE_POS[3].y - 84,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 22px",
            borderRadius: 999,
            background: palette.card,
            border: `1.5px solid ${withAlpha(palette.accent, 0.4)}`,
            boxShadow: `0 20px 40px -22px ${withAlpha(palette.accent, 0.9)}`,
            color: palette.accent,
            fontSize: 24,
            fontWeight: 800,
            opacity: smoothstep(at(ECO_T.dealPop), at(ECO_T.dealPop) + 14, frame),
            transform: `translateY(${(1 - smoothstep(at(ECO_T.dealPop), at(ECO_T.dealPop) + 14, frame)) * 16}px)`,
          }}
        >
          <Briefcase size={24} strokeWidth={2.8} />
          +1
        </div>
      ) : null}

      {/* SFX: slide-in, sparkle, and a crisp ding as each node activates. */}
      <PlaySfx id="whoosh_subtle_slide" frame={0} volume={0.7} />
      <PlaySfx id="chime_sparkle_light" frame={at(ECO_T.flow)} volume={0.5} pitch={3} />
      <PlaySfxTrack
        cues={nodes.map<SfxCue>((_, i) => ({
          id: "checkmark_ding_crisp",
          frame: at(ECO_T.activations[i]),
          volume: 0.55,
          pitch: i * 2,
        }))}
      />
      <PlaySfx
        id="whoosh_subtle_slide"
        frame={Math.max(0, beat.durationInFrames - TRANSITION_FRAMES)}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};
