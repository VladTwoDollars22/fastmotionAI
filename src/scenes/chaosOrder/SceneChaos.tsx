import { noise2D } from "@remotion/noise";
import type { CSSProperties, FC, ReactNode } from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GlowOverlay } from "../../components/ui/GlowOverlay";
import { KineticText } from "../../components/ui/KineticText";
import { OrganicBlob } from "../../components/ui/OrganicBlob";
import { ParticleBurst } from "../../components/ui/ParticleBurst";
import { SpeedLines } from "../../components/ui/SpeedLines";
import type { SceneSprings } from "../../utils/motionPresets";
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

/**
 * The five freelancers' signature props from the brief: Coral + stylus,
 * Electric Blue + brackets, Amber + megaphone, Mint + pencil, Violet + bar chart.
 */
const FreelancerProp: FC<{
  index: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
  palette: Palette;
}> = ({ index, x, y, rotation, scale, opacity, palette }) => {
  const stroke = palette.cream;
  const accent = palette.chaos[index % palette.chaos.length];
  const line = {
    stroke,
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
      opacity={opacity}
    >
      {index === 0 ? (
        <>
          <line x1={-16} y1={16} x2={12} y2={-12} {...line} />
          <path d="M 12 -12 L 22 -18 L 26 -14 L 16 -4 Z" fill={accent} stroke={stroke} strokeWidth={2} />
        </>
      ) : index === 1 ? (
        <>
          <path d="M -6 -18 L -20 0 L -6 18" {...line} />
          <path d="M 6 -18 L 20 0 L 6 18" {...line} />
        </>
      ) : index === 2 ? (
        <>
          <path d="M -20 8 L -2 -8 L 16 -14 L 16 14 L -2 8 Z" fill={accent} stroke={stroke} strokeWidth={2} />
          <path d="M 22 -6 A 14 14 0 0 1 22 -22" {...line} />
          <path d="M 30 -2 A 22 22 0 0 1 30 -30" {...line} />
        </>
      ) : index === 3 ? (
        <>
          <rect x={-18} y={-8} width={34} height={16} rx={3} fill={accent} stroke={stroke} strokeWidth={2} />
          <path d="M 16 -8 L 26 0 L 16 8 Z" fill={stroke} />
        </>
      ) : (
        <>
          {[0, 1, 2].map((bar) => (
            <rect
              key={bar}
              x={-18 + bar * 13}
              y={2 - bar * 6}
              width={9}
              height={16 + bar * 6}
              rx={2}
              fill={accent}
              stroke={stroke}
              strokeWidth={2}
            />
          ))}
        </>
      )}
    </g>
  );
};

export interface SceneChaosProps {
  palette: Palette;
  energy: number;
  copy: ChaosCopy;
  springs: SceneSprings;
}

export const SceneChaos: FC<SceneChaosProps> = ({
  palette,
  energy,
  copy,
  springs,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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

  const verticals = useMemo(() => {
    const list: number[] = [];
    for (let x = 0; x <= 1080; x += GRID) list.push(x);
    return list;
  }, []);
  const horizontals = useMemo(() => {
    const list: number[] = [];
    for (let y = 0; y <= 1920; y += GRID) list.push(y);
    return list;
  }, []);

  const angles = useMemo(() => spikeAngles(SPIKE_COUNT, "spike-a"), []);

  // Blobs hold their corners with a *bounded* orbit swing (never a full spin),
  // then ease outward as the crimson knot bursts. The final centre is clamped to
  // the 1080x1920 safe area so no blob (or its prop) ever clips the frame edge.
  const orbitSwing = 0.24 * Math.sin(time * 0.9);
  const shrink = smoothstep(120, 148, frame);
  const outward = 1 + shrink * 0.7;

  const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

  // Compute each anchor's orbited + drifted position once per frame (shared by
  // tendrils, blobs and their freelancer props) instead of sampling noise twice.
  const anchors = CHAOS_HOMES.map((home, index) => {
    const dx = home.x - CHAOS_CENTER.x;
    const dy = home.y - CHAOS_CENTER.y;
    const baseR = Math.hypot(dx, dy) || 1;
    const baseA = Math.atan2(dy, dx);
    const dir = index % 2 === 0 ? 1 : -1;
    const a = baseA + orbitSwing * dir;
    const radius = index === 4 ? 96 : 78;
    const r = baseR * 0.94 * outward * (1 + 0.03 * Math.sin(time * 1.3 + index));
    const padX = 120 + radius;
    const padTop = 180 + radius;
    // Keep the bottom row clear of the persistent brand pill (y ~1606+).
    const padBottom = 430;
    const x = clamp(
      CHAOS_CENTER.x + Math.cos(a) * r + noise2D(`bx${index}`, time, index) * 26,
      padX,
      1080 - padX,
    );
    const y = clamp(
      CHAOS_CENTER.y + Math.sin(a) * r + noise2D(`by${index}`, time, index * 2) * 26,
      padTop,
      1920 - padBottom,
    );
    return { x, y, nx: Math.cos(a), ny: Math.sin(a), r: radius };
  });

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

          {anchors.map((anchor, index) => (
            <Tendril
              key={`t${index}`}
              from={{ x: anchor.x, y: anchor.y }}
              to={CHAOS_CENTER}
              color={palette.chaos[index]}
              seed={`tendril${index}`}
              opacity={0.28}
              speed={energy}
            />
          ))}

          {anchors.map((anchor, index) => (
            <OrganicBlob
              key={`b${index}`}
              cx={anchor.x}
              cy={anchor.y}
              r={anchor.r * (1 - shrink * 0.55)}
              color={palette.chaos[index]}
              seed={`blob${index}`}
              speed={(1.1 + index * 0.1) * energy}
              wobble={0.34}
              spin={6 + index * 2}
              delay={index * 5}
              glow={26}
              opacity={0.9 * (1 - shrink * 0.85)}
              physics={springs.entrance}
            />
          ))}

          {anchors.map((anchor, index) => (
            <FreelancerProp
              key={`p${index}`}
              index={index}
              x={clamp(anchor.x + anchor.nx * (anchor.r + 30), 150, 930)}
              y={clamp(anchor.y + anchor.ny * (anchor.r + 30), 250, 1550)}
              rotation={spin(frame, `prop${index}`, 12 + index * 3, 0.5)}
              scale={0.95 * (1 - shrink * 0.6)}
              opacity={0.95 * (1 - shrink * 0.9)}
              palette={palette}
            />
          ))}

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
                    fill={index % 2 === 0 ? palette.crimson : palette.nearBlack}
                    stroke={palette.crimson}
                    strokeWidth={2}
                    opacity={spikeFade * flicker * 0.85}
                  />
                );
              })
            : null}

          {spikeGrow > 0 ? (
            <g opacity={spikeFade}>
              <circle
                cx={CHAOS_CENTER.x}
                cy={CHAOS_CENTER.y}
                r={spikeGrow * 86}
                fill={palette.nearBlack}
                stroke={palette.crimson}
                strokeWidth={4}
              />
              <circle
                cx={CHAOS_CENTER.x}
                cy={CHAOS_CENTER.y}
                r={spikeGrow * 54}
                fill="none"
                stroke={palette.crimson}
                strokeWidth={2}
                opacity={0.7}
              />
            </g>
          ) : null}

          {[100, 117].map((start, index) => {
            const local = frame - start;
            if (local < 0) return null;
            // Snappy-accent spring envelope on the impact rings.
            const progress = spring({
              frame: local,
              fps,
              config: springs.accent,
              from: 0,
              to: 1,
            });
            if (progress > 0.999) return null;
            return (
              <circle
                key={`w${index}`}
                cx={CHAOS_CENTER.x}
                cy={CHAOS_CENTER.y}
                r={progress * (index === 0 ? 300 : 260)}
                fill="none"
                stroke={index === 0 ? palette.crimson : palette.gold}
                strokeWidth={(3 - index) * 3}
                opacity={(1 - progress) * 0.6}
              />
            );
          })}

          <SpeedLines
            color={palette.crimson}
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
            color={palette.crimson}
            color2={palette.primary}
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
            color={palette.crimson}
            color2={palette.gold}
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
            padding: "0 24px",
            textAlign: "center",
            color: palette.text,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          {copy.cardLabel}
        </span>
      </div>

      <TextRow top={210} scale={punch1}>
        <KineticText
          text={copy.line1}
          mode="word"
          delay={8}
          stagger={4}
          entry="pop"
          damping={springs.entrance.damping}
          stiffness={springs.entrance.stiffness}
          mass={springs.entrance.mass}
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
          damping={springs.entrance.damping}
          stiffness={springs.entrance.stiffness}
          mass={springs.entrance.mass}
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
          damping={springs.entrance.damping}
          stiffness={springs.entrance.stiffness}
          mass={springs.entrance.mass}
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
          damping={springs.settle.damping}
          stiffness={springs.settle.stiffness}
          mass={springs.settle.mass}
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
