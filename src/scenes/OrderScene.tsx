import type { FC } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { LoadedProject, ProjectScene } from "../utils/projectLoader";
import {
  BLOBS,
  CENTER,
  CREAM,
  CRIMSON,
  GOLD,
  HERO,
  NEAR_BLACK,
  lerp,
  spikePath,
} from "./chaosShared";

const CHECK_LEN = 400;
const LINE_LEN = 900;

export const OrderScene: FC<{ project: LoadedProject; scene: ProjectScene }> = ({
  project,
  scene,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const draw = interpolate(frame, [0, 45], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hero = spring({
    frame: frame - 45,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const merge = interpolate(frame, [90, 180], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const entity = interpolate(merge, [0.82, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const knotScale = interpolate(frame, [180, 236], [6.2, 0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const knotOpacity = interpolate(frame, [0, 120, 180, 225], [0.85, 0.68, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camera = interpolate(frame, [0, 90, 150, 240], [1, 1.03, 1.14, 0.9], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const check = spring({
    frame: frame - 186,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  const graph = [
    { x: 636, h: 46 },
    { x: 690, h: 86 },
    { x: 744, h: 128 },
    { x: 798, h: 172 },
  ];

  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          <filter id="order-goo" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
          <filter id="order-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="16"
              floodColor={GOLD}
              floodOpacity="0.9"
            />
          </filter>
        </defs>

        <g
          transform={`translate(${CENTER[0]} ${CENTER[1]}) scale(${camera}) translate(${-CENTER[0]} ${-CENTER[1]})`}
        >
          <g
            opacity={knotOpacity}
            transform={`translate(${CENTER[0]} ${CENTER[1]}) scale(${knotScale})`}
          >
            <path
              d={spikePath(0, 0, 120, 62, 12)}
              fill={NEAR_BLACK}
              stroke={CRIMSON}
              strokeWidth={6}
            />
          </g>

          <g opacity={draw} filter="url(#order-glow)">
            <line
              x1={90}
              y1={CENTER[1]}
              x2={990}
              y2={CENTER[1]}
              stroke={GOLD}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={LINE_LEN}
              strokeDashoffset={LINE_LEN * (1 - draw)}
            />
          </g>

          <g
            opacity={interpolate(frame, [50, 66, 150, 168], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
            filter="url(#order-glow)"
          >
            <circle
              cx={HERO[0]}
              cy={lerp(CENTER[1], HERO[1] - 66, hero)}
              r={lerp(10, 62, hero)}
              fill={GOLD}
            />
            <rect
              x={HERO[0] - 80}
              y={HERO[1] - 4}
              width={160}
              height={lerp(0, 300, hero)}
              rx={lerp(10, 80, hero)}
              fill={GOLD}
            />
          </g>

          <g filter="url(#order-goo)">
            {BLOBS.map((b, i) => {
              const reach = interpolate(frame, [45 + i * 3, 92 + i * 3], [0, 1], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const aBase = (i / BLOBS.length) * Math.PI * 2 - Math.PI / 2;
              const approachR = 150;
              const ax = HERO[0] + Math.cos(aBase) * approachR;
              const ay = HERO[1] + Math.sin(aBase) * approachR;
              const rx = lerp(b.corner[0], ax, reach);
              const ry = lerp(b.corner[1], ay, reach);
              const angle = aBase + merge * Math.PI * 2 * 1.4;
              const radius = lerp(approachR, 70, merge);
              const mx = HERO[0] + Math.cos(angle) * radius;
              const my = HERO[1] + Math.sin(angle) * radius;
              const x = lerp(rx, mx, merge);
              const y = lerp(ry, my, merge);
              return (
                <circle key={b.key} cx={x} cy={y} r={56} fill={b.color} />
              );
            })}
          </g>

          <g opacity={entity}>
            <circle cx={HERO[0]} cy={HERO[1]} r={96} fill={CREAM} opacity={0.14} />
            {BLOBS.map((b, i) => {
              const a0 = (i / BLOBS.length) * Math.PI * 2 + frame * 0.06;
              const a1 = a0 + Math.PI * 0.7;
              const r = 74;
              const sx = HERO[0] + Math.cos(a0) * r;
              const sy = HERO[1] + Math.sin(a0) * r;
              const ex = HERO[0] + Math.cos(a1) * r;
              const ey = HERO[1] + Math.sin(a1) * r;
              return (
                <path
                  key={`stream-${b.key}`}
                  d={`M${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`}
                  fill="none"
                  stroke={b.color}
                  strokeWidth={14}
                  strokeLinecap="round"
                  opacity={0.85}
                />
              );
            })}
            <circle cx={HERO[0]} cy={HERO[1]} r={46} fill={GOLD} filter="url(#order-glow)" />
          </g>

          <g
            opacity={interpolate(frame, [184, 196], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
            filter="url(#order-glow)"
          >
            <path
              d="M420 972 L506 1056 L676 848"
              fill="none"
              stroke={GOLD}
              strokeWidth={38}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={CHECK_LEN}
              strokeDashoffset={CHECK_LEN * (1 - check)}
            />
          </g>

          <g
            opacity={interpolate(frame, [196, 210], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          >
            {graph.map((bar, i) => {
              const grow = interpolate(frame, [198 + i * 6, 226 + i * 6], [0, 1], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <rect
                  key={bar.x}
                  x={bar.x}
                  y={1190 - bar.h * grow}
                  width={30}
                  height={bar.h * grow}
                  rx={8}
                  fill={GOLD}
                />
              );
            })}
          </g>
        </g>
      </svg>

      {scene.sfx.map((cue, index) => {
        const resolved = project.resolveSfx(cue.src);
        if (!resolved) return null;
        return (
          <Sequence key={`${cue.src}-${index}`} from={cue.atFrame}>
            <Audio src={staticFile(resolved)} volume={cue.volume} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
