import { noise2D } from "@remotion/noise";
import type { CSSProperties, FC, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GlowOverlay } from "../../components/ui/GlowOverlay";
import { KineticText } from "../../components/ui/KineticText";
import { OrganicBlob } from "../../components/ui/OrganicBlob";
import { ParticleBurst } from "../../components/ui/ParticleBurst";
import { SpeedLines } from "../../components/ui/SpeedLines";
import {
  CHAOS_CENTER,
  CHAOS_HOMES,
  smoothstep,
  spikeAngles,
  spin,
  zoomPunch,
  type ChaosCopy,
  type Palette,
} from "./theme";

const GRID = 60;
const SPIKE_COUNT = 16;

const svgLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

const Tendril: FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  seed: string;
  opacity: number;
  speed: number;
}> = ({ from, to, color, seed, opacity, speed }) => {
  const frame = useCurrentFrame();
  const t = (frame / 30) * speed;
  const cx = (from.x + to.x) / 2 + noise2D(seed, t * 0.6, 0) * 210;
  const cy = (from.y + to.y) / 2 + noise2D(seed, t * 0.6, 1.6) * 150;
  return (
    <path
      d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
      stroke={color}
      strokeWidth={2.5}
      fill="none"
      opacity={opacity}
      strokeDasharray="4 12"
    />
  );
};

const TextRow: FC<{ top: number; scale: number; children: ReactNode }> = ({
  top,
  scale,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      pointerEvents: "none",
      transform: `scale(${scale})`,
    }}
  >
    {children}
  </div>
);

export interface SceneChaosProps {
  palette: Palette;
  energy: number;
  copy: ChaosCopy;
}

export const SceneChaos: FC<SceneChaosProps> = ({ palette, energy, copy }) => {
  const frame = useCurrentFrame();
  const time = (frame / 30) * energy;

  const gridOpacity = smoothstep(0, 24, frame) * 0.45;
  const spikeGrow = smoothstep(96, 118, frame);
  const spikeFade = 1 - smoothstep(140, 150, frame);
  const flash = frame >= 100 && frame <= 112 ? 1 - (frame - 100) / 12 : 0;
  const caStrength =
    frame >= 94 && frame <= 124 ? 1 - Math.abs(frame - 109) / 15 : 0;
  const roll = spin(frame, "chaos-roll", 1.3 * energy, 0.32);

  const punch1 = zoomPunch(frame, [{ start: 8, decay: 12, amount: 0.16 }]);
  const punch2 = zoomPunch(frame, [{ start: 44, decay: 12, amount: 0.15 }]);
  const punch3 = zoomPunch(frame, [{ start: 74, decay: 14, amount: 0.2 }]);
  const punch4 = zoomPunch(frame, [{ start: 114, decay: 14, amount: 0.1 }]);

  const verticals: number[] = [];
  for (let x = 0; x <= 1080; x += GRID) verticals.push(x);
  const horizontals: number[] = [];
  for (let y = 0; y <= 1920; y += GRID) horizontals.push(y);

  const angles = spikeAngles(SPIKE_COUNT, "spike-a");

  const cardJitterX = noise2D("card-x", time * 3.1, 0) * (2 + caStrength * 10);
  const cardJitterY = noise2D("card-y", time * 3.4, 1) * (2 + caStrength * 10);
  const chaosColor = palette.chaos[0];

  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" style={svgLayer} preserveAspectRatio="none">
        <g transform={`rotate(${roll} 540 960)`}>
          <g opacity={gridOpacity} stroke={palette.chaos[2]} strokeWidth={1}>
            {verticals.map((x) => (
              <line key={`v${x}`} x1={x} y1={0} x2={x} y2={1920} />
            ))}
            {horizontals.map((y) => (
              <line key={`h${y}`} x1={0} y1={y} x2={1080} y2={y} />
            ))}
          </g>

          {CHAOS_HOMES.map((home, index) => {
            const bx = home.x + noise2D(`bx${index}`, time, index) * 30;
            const by = home.y + noise2D(`by${index}`, time, index * 2) * 30;
            return (
              <Tendril
                key={`t${index}`}
                from={{ x: bx, y: by }}
                to={CHAOS_CENTER}
                color={palette.chaos[index]}
                seed={`tendril${index}`}
                opacity={0.28}
                speed={energy}
              />
            );
          })}

          {CHAOS_HOMES.map((home, index) => {
            const bx = home.x + noise2D(`bx${index}`, time, index) * 30;
            const by = home.y + noise2D(`by${index}`, time, index * 2) * 30;
            return (
              <OrganicBlob
                key={`b${index}`}
                cx={bx}
                cy={by}
                r={index === 4 ? 96 : 78}
                color={palette.chaos[index]}
                seed={`blob${index}`}
                speed={(1.1 + index * 0.1) * energy}
                wobble={0.34}
                spin={6 + index * 2}
                delay={index * 5}
                glow={26}
                opacity={0.9}
              />
            );
          })}

          {spikeGrow > 0
            ? angles.map((angle, index) => {
                const len =
                  spikeGrow *
                  (200 + 340 * (0.5 + 0.5 * noise2D("spike-l", index * 1.7, 0.5)));
                const flicker =
                  0.55 + 0.45 * Math.abs(noise2D("spike-f", index * 2.2, time * 6));
                const inner = 74;
                const width = 9;
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
                    opacity={spikeFade * flicker * 0.85}
                    style={{ filter: `drop-shadow(0 0 18px ${palette.chaos[0]})` }}
                  />
                );
              })
            : null}

          {[100, 117].map((start, index) => {
            const d = frame - start;
            if (d < 0 || d > 36) return null;
            return (
              <circle
                key={`w${index}`}
                cx={CHAOS_CENTER.x}
                cy={CHAOS_CENTER.y}
                r={d * 27}
                fill="none"
                stroke={index === 0 ? palette.chaos[1] : palette.chaos[3]}
                strokeWidth={7 - index * 3}
                opacity={Math.max(0, 1 - d / 36) * 0.6}
              />
            );
          })}

          <SpeedLines
            color={palette.gold}
            delay={100}
            durationInFrames={20}
            cx={CHAOS_CENTER.x}
            cy={CHAOS_CENTER.y}
            seed="chaos-speed"
          />

          <ParticleBurst
            x={CHAOS_CENTER.x}
            y={CHAOS_CENTER.y}
            count={70}
            delay={100}
            durationInFrames={42}
            color={palette.chaos[0]}
            color2={palette.chaos[1]}
            spread={560}
            mode="lines"
            lineLength={54}
            ring
            seed={11}
          />
          <ParticleBurst
            x={CHAOS_CENTER.x}
            y={CHAOS_CENTER.y}
            count={120}
            delay={104}
            durationInFrames={64}
            color={palette.gold}
            color2={palette.chaos[3]}
            spread={660}
            mode="dust"
            size={5}
            gravity={0.8}
            seed={23}
          />
        </g>
      </svg>

      <GlowOverlay
        color={chaosColor}
        size={1100}
        intensity={0.5}
        delay={40}
        pulse={1.4}
        seed="chaos-glow"
      />

      <div
        style={{
          position: "absolute",
          left: 540 - 190,
          top: 1080 - 250,
          width: 380,
          height: 500,
          borderRadius: 38,
          border: `2px solid ${chaosColor}`,
          background:
            "linear-gradient(150deg, rgba(255,255,255,0.06), rgba(10,10,24,0.6))",
          boxShadow: `0 0 ${40 + caStrength * 60}px ${chaosColor}`,
          transform: `translate(${cardJitterX}px, ${cardJitterY}px) rotate(${
            noise2D("card-r", time * 2.2, 0) * (1 + caStrength * 3)
          }deg) scale(${zoomPunch(frame, [{ start: 100, decay: 20, amount: 0.08 }])})`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 2px, transparent 5px)",
          }}
        />
        <svg width={180} height={180} viewBox="0 0 180 180">
          <circle
            cx={90}
            cy={90}
            r={62}
            fill="none"
            stroke={palette.chaos[2]}
            strokeWidth={6}
            strokeDasharray="16 14"
            opacity={0.9}
          />
          <line x1={62} y1={62} x2={118} y2={118} stroke={chaosColor} strokeWidth={9} strokeLinecap="round" />
          <line x1={118} y1={62} x2={62} y2={118} stroke={chaosColor} strokeWidth={9} strokeLinecap="round" />
        </svg>
        <span
          style={{
            position: "absolute",
            bottom: 34,
            left: 0,
            right: 0,
            textAlign: "center",
            color: palette.text,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 6,
            opacity: 0.85,
          }}
        >
          FRAGMENTED
        </span>
      </div>

      <TextRow top={210} scale={punch1}>
        <KineticText
          text={copy.line1}
          mode="word"
          delay={8}
          stagger={4}
          entry="pop"
          damping={12}
          stiffness={220}
          motionBlur={10}
          style={{
            fontSize: 84,
            fontWeight: 800,
            color: palette.text,
            letterSpacing: 2,
            textShadow: `0 0 26px ${chaosColor}, ${caStrength * 5}px 0 rgba(255,40,90,0.9), ${-caStrength * 5}px 0 rgba(40,200,255,0.9)`,
          }}
        />
      </TextRow>

      <TextRow top={360} scale={punch2}>
        <KineticText
          text={copy.line2}
          mode="word"
          delay={44}
          stagger={5}
          entry="pop"
          damping={11}
          stiffness={230}
          rotate={-6}
          motionBlur={10}
          style={{
            fontSize: 78,
            fontWeight: 800,
            color: palette.chaos[1],
            letterSpacing: 4,
            textShadow: `0 0 22px ${chaosColor}`,
          }}
        />
      </TextRow>

      <TextRow top={560} scale={punch3}>
        <KineticText
          text={copy.bigChaos}
          mode="letter"
          delay={74}
          stagger={3}
          entry="scale"
          damping={10}
          stiffness={240}
          rotate={-8}
          motionBlur={14}
          style={{
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: 6,
            color: chaosColor,
            textShadow: `0 0 40px ${chaosColor}, ${caStrength * 8}px 0 rgba(255,30,80,0.95), ${-caStrength * 8}px 0 rgba(30,180,255,0.95)`,
          }}
        />
      </TextRow>

      <TextRow top={1530} scale={punch4}>
        <KineticText
          text={copy.caption}
          mode="word"
          delay={114}
          stagger={3}
          entry="up"
          damping={22}
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: palette.text,
            letterSpacing: 1,
            opacity: 0.8,
          }}
        />
      </TextRow>

      <AbsoluteFill
        style={{
          backgroundColor: chaosColor,
          opacity: flash * 0.5,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
