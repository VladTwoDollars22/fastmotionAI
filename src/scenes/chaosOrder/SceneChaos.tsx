import { noise2D } from "@remotion/noise";
import type { CSSProperties, FC, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GlowOverlay } from "../../components/ui/GlowOverlay";
import { KineticText } from "../../components/ui/KineticText";
import { OrganicBlob } from "../../components/ui/OrganicBlob";
import { ParticleBurst } from "../../components/ui/ParticleBurst";
import { CHAOS_CENTER, CHAOS_COLORS, CHAOS_HOMES, spikeAngles, smoothstep } from "./theme";

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
}> = ({ from, to, color, seed, opacity }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
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

const TextRow: FC<{ top: number; children: ReactNode }> = ({ top, children }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      pointerEvents: "none",
    }}
  >
    {children}
  </div>
);

export const SceneChaos: FC = () => {
  const frame = useCurrentFrame();
  const time = frame / 30;

  const gridOpacity = smoothstep(0, 24, frame) * 0.45;
  const spikeGrow = smoothstep(96, 118, frame);
  const spikeFade = 1 - smoothstep(140, 150, frame);
  const flash = frame >= 100 && frame <= 112 ? 1 - (frame - 100) / 12 : 0;
  const caStrength =
    frame >= 94 && frame <= 124 ? 1 - Math.abs(frame - 109) / 15 : 0;

  const verticals: number[] = [];
  for (let x = 0; x <= 1080; x += GRID) verticals.push(x);
  const horizontals: number[] = [];
  for (let y = 0; y <= 1920; y += GRID) horizontals.push(y);

  const angles = spikeAngles(SPIKE_COUNT, "spike-a");
  const cardJitterX = noise2D("card-x", time * 3.1, 0) * (2 + caStrength * 10);
  const cardJitterY = noise2D("card-y", time * 3.4, 1) * (2 + caStrength * 10);

  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" style={svgLayer} preserveAspectRatio="none">
        <g opacity={gridOpacity} stroke="#FF3D6E" strokeWidth={1}>
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
              color={CHAOS_COLORS[index]}
              seed={`tendril${index}`}
              opacity={0.28}
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
              color={CHAOS_COLORS[index]}
              seed={`blob${index}`}
              speed={1.1 + index * 0.1}
              wobble={0.34}
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
                  fill={index % 2 === 0 ? "#FF2E63" : "#FF6B3D"}
                  opacity={spikeFade * flicker * 0.85}
                  style={{ filter: "drop-shadow(0 0 18px #FF2E63)" }}
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
              stroke={index === 0 ? "#FF6B3D" : "#FFA23D"}
              strokeWidth={7 - index * 3}
              opacity={Math.max(0, 1 - d / 36) * 0.6}
            />
          );
        })}

        <ParticleBurst
          x={CHAOS_CENTER.x}
          y={CHAOS_CENTER.y}
          count={70}
          delay={100}
          durationInFrames={42}
          color="#FF2E63"
          color2="#FF6B3D"
          spread={560}
          mode="lines"
          lineLength={54}
          seed={11}
        />
        <ParticleBurst
          x={CHAOS_CENTER.x}
          y={CHAOS_CENTER.y}
          count={120}
          delay={104}
          durationInFrames={64}
          color="#FFD466"
          color2="#FFA23D"
          spread={660}
          mode="dust"
          size={5}
          gravity={0.8}
          seed={23}
        />
      </svg>

      <GlowOverlay
        color="#FF2E63"
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
          border: "2px solid rgba(255,60,110,0.55)",
          background:
            "linear-gradient(150deg, rgba(255,60,110,0.16), rgba(10,10,24,0.6))",
          boxShadow: `0 0 ${40 + caStrength * 60}px rgba(255,46,99,0.55)`,
          transform: `translate(${cardJitterX}px, ${cardJitterY}px) rotate(${noise2D(
            "card-r",
            time * 2.2,
            0,
          ) * (1 + caStrength * 3)}deg)`,
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
            stroke="#FF3D6E"
            strokeWidth={6}
            strokeDasharray="16 14"
            opacity={0.9}
          />
          <line x1={62} y1={62} x2={118} y2={118} stroke="#FF2E63" strokeWidth={9} strokeLinecap="round" />
          <line x1={118} y1={62} x2={62} y2={118} stroke="#FF2E63" strokeWidth={9} strokeLinecap="round" />
        </svg>
        <span
          style={{
            position: "absolute",
            bottom: 34,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "#FF8FA3",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 6,
          }}
        >
          FRAGMENTED
        </span>
      </div>

      <TextRow top={210}>
        <KineticText
          text="5 FREELANCERS"
          mode="word"
          delay={8}
          stagger={4}
          entry="pop"
          damping={11}
          style={{
            fontSize: 84,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: 2,
            textShadow: `0 0 26px rgba(255,60,110,0.8), ${caStrength * 5}px 0 rgba(255,40,90,0.9), ${-caStrength * 5}px 0 rgba(40,200,255,0.9)`,
          }}
        />
      </TextRow>

      <TextRow top={360}>
        <KineticText
          text="NO SYNC"
          mode="word"
          delay={44}
          stagger={5}
          entry="pop"
          damping={10}
          rotate={-6}
          style={{
            fontSize: 78,
            fontWeight: 800,
            color: "#FFB4C4",
            letterSpacing: 4,
            textShadow: "0 0 22px rgba(255,60,110,0.75)",
          }}
        />
      </TextRow>

      <TextRow top={560}>
        <KineticText
          text="CHAOS"
          mode="letter"
          delay={74}
          stagger={3}
          entry="scale"
          damping={9}
          stiffness={210}
          rotate={-8}
          style={{
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: 6,
            color: "#FF2E63",
            textShadow: `0 0 40px rgba(255,46,99,0.9), ${caStrength * 8}px 0 rgba(255,30,80,0.95), ${-caStrength * 8}px 0 rgba(30,180,255,0.95)`,
          }}
        />
      </TextRow>

      <TextRow top={1530}>
        <KineticText
          text="Everything is fragmented."
          mode="word"
          delay={114}
          stagger={3}
          entry="up"
          damping={22}
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: "#C9B6C0",
            letterSpacing: 1,
          }}
        />
      </TextRow>

      <AbsoluteFill
        style={{
          backgroundColor: "#FF2E63",
          opacity: flash * 0.5,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
