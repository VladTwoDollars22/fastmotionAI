import { noise2D } from "@remotion/noise";
import type { CSSProperties, FC } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GlowOverlay } from "../../components/ui/GlowOverlay";
import { KineticText } from "../../components/ui/KineticText";
import {
  GooFilterDefs,
  Metaballs,
  type Metaball,
} from "../../components/ui/Metaballs";
import { ParticleBurst } from "../../components/ui/ParticleBurst";
import { SpeedLines } from "../../components/ui/SpeedLines";
import {
  CHAOS_CENTER,
  CHAOS_HOMES,
  lerpHex,
  smoothstep,
  spikeAngles,
  spin,
  zoomPunch,
  type ChaosCopy,
  type Palette,
} from "./theme";

const SPIKE_COUNT = 16;
const SPIKE_REACH = 340;

const svgLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

export interface SceneOrderProps {
  palette: Palette;
  energy: number;
  copy: ChaosCopy;
}

export const SceneOrder: FC<SceneOrderProps> = ({ palette, energy, copy }) => {
  const frame = useCurrentFrame();
  const time = (frame / 30) * energy;

  const mergeP = smoothstep(20, 66, frame);
  const laserP = smoothstep(6, 15, frame);
  const laserFade = 1 - smoothstep(16, 36, frame);
  const shatterP = smoothstep(10, 24, frame);
  const cardP = smoothstep(58, 84, frame);
  const checkP = smoothstep(70, 88, frame);
  const graphP = smoothstep(78, 102, frame);
  const sweepP = frame >= 58 ? (((frame - 58) % 46) / 46) : 0;
  const flash = frame >= 8 && frame <= 16 ? (1 - (frame - 8) / 8) * 0.4 : 0;
  const roll = spin(frame, "order-roll", -1.1 * energy, 0.3);
  const punch = zoomPunch(frame, [{ start: 104, decay: 16, amount: 0.12 }]);

  const angles = spikeAngles(SPIKE_COUNT, "spike-a");
  const spikeOpacity = (1 - shatterP) * 0.9;
  const colorP = smoothstep(30, 56, frame);
  const unified = palette.accent;

  const blobs: Metaball[] = CHAOS_HOMES.map((home, index) => {
    const loose = 1 - mergeP;
    const x =
      home.x +
      (CHAOS_CENTER.x - home.x) * mergeP +
      noise2D(`ox${index}`, time * 0.8, index) * 28 * loose;
    const y =
      home.y +
      (CHAOS_CENTER.y - home.y) * mergeP +
      noise2D(`oy${index}`, time * 0.8, index * 2) * 28 * loose;
    const r = 76 + 60 * mergeP;
    return { x, y, r, color: lerpHex(palette.chaos[index], unified, colorP) };
  });

  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" style={svgLayer} preserveAspectRatio="none">
        <GooFilterDefs id="order-goo" blur={26} strength={19} />
        <g transform={`rotate(${roll} 540 960)`}>
          {angles.map((angle, index) => {
            if (spikeOpacity <= 0) return null;
            const inner = 74;
            const width = 9 * (1 - shatterP * 0.6);
            const len = SPIKE_REACH * (1 - shatterP * 0.35);
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            const px = -dy;
            const py = dx;
            const p1 = {
              x: CHAOS_CENTER.x + dx * inner + px * width,
              y: CHAOS_CENTER.y + dy * inner + py * width,
            };
            const p2 = {
              x: CHAOS_CENTER.x + dx * inner - px * width,
              y: CHAOS_CENTER.y + dy * inner - py * width,
            };
            const p3 = {
              x: CHAOS_CENTER.x + dx * (inner + len),
              y: CHAOS_CENTER.y + dy * (inner + len),
            };
            return (
              <path
                key={`s${index}`}
                d={`M ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y} Z`}
                fill={index % 2 === 0 ? palette.chaos[0] : palette.chaos[1]}
                opacity={spikeOpacity * (0.5 + 0.5 * Math.abs(noise2D("of", index, time * 5)))}
                style={{ filter: `drop-shadow(0 0 14px ${palette.chaos[0]})` }}
              />
            );
          })}

          {angles.map((angle, index) => {
            if (index % 2 !== 0) return null;
            return (
              <ParticleBurst
                key={`d${index}`}
                x={CHAOS_CENTER.x + Math.cos(angle) * SPIKE_REACH}
                y={CHAOS_CENTER.y + Math.sin(angle) * SPIKE_REACH}
                count={18}
                delay={12 + index * 0.4}
                durationInFrames={44}
                color={palette.chaos[1]}
                color2={palette.gold}
                spread={180}
                mode="dust"
                size={4}
                seed={120 + index}
              />
            );
          })}

          <Metaballs id="order-goo" blobs={blobs} opacity={0.95} seed="order" speed={energy} />

          {mergeP > 0
            ? palette.order.map((color, index) => {
                const appear = smoothstep(56, 76, frame);
                const angle = time * 0.9 + (index / palette.order.length) * Math.PI * 2;
                const x = CHAOS_CENTER.x + Math.cos(angle) * 268;
                const y = CHAOS_CENTER.y + Math.sin(angle) * 208;
                return (
                  <circle
                    key={`sat${index}`}
                    cx={x}
                    cy={y}
                    r={8}
                    fill={color}
                    opacity={appear * 0.9}
                    style={{ filter: `drop-shadow(0 0 12px ${color})` }}
                  />
                );
              })
            : null}

          <SpeedLines
            color={palette.accent}
            delay={8}
            durationInFrames={18}
            cx={CHAOS_CENTER.x}
            cy={CHAOS_CENTER.y}
            seed="order-speed"
          />

          <ParticleBurst
            x={CHAOS_CENTER.x}
            y={980}
            count={40}
            delay={92}
            durationInFrames={40}
            color={palette.gold}
            color2={palette.accent}
            spread={300}
            mode="lines"
            lineLength={40}
            ring
            seed={900}
          />
          <ParticleBurst
            x={CHAOS_CENTER.x}
            y={CHAOS_CENTER.y + 320}
            count={60}
            delay={86}
            durationInFrames={70}
            color={palette.gold}
            color2={palette.text}
            spread={240}
            mode="dust"
            size={4}
            gravity={-0.7}
            seed={901}
          />
        </g>
      </svg>

      <GlowOverlay
        color={palette.accent}
        size={1180}
        intensity={0.55}
        delay={44}
        pulse={0.8}
        seed="order-glow"
      />

      <div
        style={{
          position: "absolute",
          top: CHAOS_CENTER.y - 4,
          left: "50%",
          width: `${laserP * 130}%`,
          height: 7,
          transform: "translateX(-50%)",
          background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${palette.text} 30%, ${palette.accent} 50%, ${palette.text} 70%, rgba(0,0,0,0) 100%)`,
          boxShadow: `0 0 44px 12px ${palette.accent}`,
          borderRadius: 6,
          opacity: laserFade,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0) 42%, ${palette.accent}66 50%, rgba(0,0,0,0) 58%)`,
          transform: `translateY(${(1 - laserP) * 90}%)`,
          opacity: laserFade * 0.55,
        }}
      />

      <AbsoluteFill
        style={{
          backgroundColor: palette.accent,
          opacity: flash,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 350,
          top: 830,
          width: 380,
          height: 500,
          borderRadius: 38,
          border: `2px solid ${palette.accent}`,
          background:
            "linear-gradient(150deg, rgba(255,255,255,0.08), rgba(8,14,28,0.7))",
          boxShadow: `0 0 ${50 + graphP * 40}px ${palette.accent}`,
          opacity: cardP,
          transform: `translateY(${(1 - cardP) * 34}px) scale(${0.92 + 0.08 * cardP})`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "55%",
            background:
              "linear-gradient(105deg, rgba(0,0,0,0) 0%, rgba(255,255,255,0.5) 50%, rgba(0,0,0,0) 100%)",
            transform: `translateX(${-110 + sweepP * 270}%)`,
            opacity: cardP * 0.85,
          }}
        />
        <svg width={380} height={500} viewBox="0 0 380 500" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.text} />
              <stop offset="100%" stopColor={palette.gold} />
            </linearGradient>
          </defs>

          <g stroke={palette.accent} strokeWidth={4} fill="none" opacity={0.8 * cardP}>
            <path d="M 24 44 L 24 24 L 52 24" />
            <path d="M 356 44 L 356 24 L 328 24" />
            <path d="M 24 456 L 24 476 L 52 476" />
            <path d="M 356 456 L 356 476 L 328 476" />
          </g>

          <circle
            cx={190}
            cy={170}
            r={88}
            fill="none"
            stroke={palette.accent}
            strokeWidth={3}
            opacity={0.45 * checkP}
            strokeDasharray="10 12"
          />
          <path
            d="M 146 172 L 180 208 L 240 132"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - checkP}
            stroke={palette.order[4]}
            strokeWidth={13}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ filter: `drop-shadow(0 0 16px ${palette.accent})` }}
          />

          {[0, 1, 2, 3, 4].map((index) => {
            const target = 42 + index * 24;
            const h = target * graphP;
            const x = 92 + index * 42;
            return (
              <rect
                key={index}
                x={x}
                y={440 - h}
                width={26}
                height={h}
                rx={7}
                fill="url(#gold)"
                opacity={graphP}
              />
            );
          })}
          <line
            x1={84}
            y1={440}
            x2={296}
            y2={440}
            stroke={palette.text}
            strokeOpacity={0.5}
            strokeWidth={2}
            opacity={graphP}
          />
        </svg>
      </div>

      <div
        style={{
          position: "absolute",
          top: 180,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "0 80px",
          boxSizing: "border-box",
          transform: `scale(${punch})`,
        }}
      >
        <KineticText
          text={copy.bigOrder}
          mode="word"
          delay={104}
          stagger={5}
          entry="up"
          damping={14}
          stiffness={210}
          motionBlur={8}
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: 2,
            textAlign: "center",
            color: palette.text,
            textShadow: `0 0 34px ${palette.accent}`,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 1520,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "0 110px",
          boxSizing: "border-box",
        }}
      >
        <KineticText
          text={copy.subtitle}
          mode="word"
          delay={118}
          stagger={3}
          entry="up"
          damping={24}
          style={{
            fontSize: 38,
            fontWeight: 500,
            textAlign: "center",
            color: palette.text,
            letterSpacing: 1,
            opacity: 0.85,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
