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
  BLOB_PATH,
  CENTER,
  CRIMSON,
  Glyph,
  NAVY,
  NEAR_BLACK,
  lerp,
  spikePath,
} from "./chaosShared";

const CARD_W = 380;
const CARD_H = 520;

export const ChaosScene: FC<{ project: LoadedProject; scene: ProjectScene }> = ({
  project,
  scene,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = project.styleguide.colors;

  const shake = interpolate(frame, [0, 60, 150, 240], [0, 0, 7, 18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = Math.sin(frame * 1.9) * shake;
  const shakeY = Math.cos(frame * 2.7) * shake;

  const pull = spring({
    frame: frame - 96,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
  const cardScaleX = interpolate(pull, [0, 1], [1, 1.26]);
  const cardScaleY = interpolate(pull, [0, 1], [1, 0.84]);
  const cardFade = interpolate(frame, [150, 178], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glitch = interpolate(frame, [148, 180, 208], [0, 14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const knot = spring({
    frame: frame - 150,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const knotScale = interpolate(knot, [0, 1], [0.06, 6.4]);
  const knotOpacity = interpolate(frame, [150, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const knotRot = Math.sin(Math.max(0, frame - 150) * 0.16) * 0.14;

  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          <filter id="chaos-crimson" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="18"
              floodColor={CRIMSON}
              floodOpacity="0.85"
            />
          </filter>
          <filter id="chaos-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="14"
              stdDeviation="16"
              floodColor="#000000"
              floodOpacity="0.35"
            />
          </filter>
        </defs>

        <g transform={`translate(${shakeX} ${shakeY})`}>
          {BLOBS.map((b) => {
            const enter = spring({
              frame: frame - b.delay,
              fps,
              config: { damping: 12, stiffness: 180 },
            });
            const homeX = lerp(b.from[0], b.home[0], enter);
            const homeY = lerp(b.from[1], b.home[1], enter);
            const retreat = interpolate(frame, [150, 236], [0, 1], {
              easing: Easing.inOut(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const x = lerp(homeX, b.corner[0], retreat);
            const y = lerp(homeY, b.corner[1], retreat);
            const grow = lerp(1, 0.3, retreat);
            const sy = enter * grow;
            const sx = (2 - enter) * grow;
            return (
              <g
                key={b.key}
                transform={`translate(${x} ${y}) scale(${sx} ${sy})`}
                filter="url(#chaos-soft)"
              >
                <path
                  d={BLOB_PATH}
                  transform="translate(-50 -50) scale(1.15)"
                  fill={b.color}
                />
                <g transform="scale(0.95)">
                  <Glyph kind={b.glyph} />
                </g>
              </g>
            );
          })}

          <g
            transform={`translate(${CENTER[0]} ${CENTER[1]}) scale(${cardScaleX} ${cardScaleY})`}
            opacity={cardFade}
            filter="url(#chaos-soft)"
          >
            <g opacity={glitch > 1 ? 0.9 : 0} transform={`translate(${-glitch} 0)`}>
              <rect
                x={-CARD_W / 2}
                y={-CARD_H / 2}
                width={CARD_W}
                height={CARD_H}
                rx={28}
                fill="none"
                stroke={CRIMSON}
                strokeWidth={8}
              />
            </g>
            <g opacity={glitch > 1 ? 0.9 : 0} transform={`translate(${glitch} 0)`}>
              <rect
                x={-CARD_W / 2}
                y={-CARD_H / 2}
                width={CARD_W}
                height={CARD_H}
                rx={28}
                fill="none"
                stroke="#3D7BFF"
                strokeWidth={8}
              />
            </g>
            <rect
              x={-CARD_W / 2}
              y={-CARD_H / 2}
              width={CARD_W}
              height={CARD_H}
              rx={28}
              fill="#FDF3E3"
              stroke={colors.primary}
              strokeWidth={6}
            />
            <rect x={-140} y={-170} width={280} height={26} rx={13} fill={colors.primary} opacity={0.85} />
            <rect x={-140} y={-120} width={210} height={18} rx={9} fill={NAVY} opacity={0.25} />
            <rect x={-140} y={-86} width={250} height={18} rx={9} fill={NAVY} opacity={0.25} />
            <rect x={-140} y={-52} width={180} height={18} rx={9} fill={NAVY} opacity={0.25} />
            <rect
              x={-140}
              y={40}
              width={280}
              height={120}
              rx={18}
              fill={NAVY}
              opacity={0.08}
              stroke={NAVY}
              strokeOpacity={0.25}
            />
            <circle cx={120} cy={150} r={26} fill={colors.accent} />
            <path
              d="M110 150 l8 9 l16 -20"
              fill="none"
              stroke={NAVY}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {BLOBS.map((b, i) => {
            const pop = spring({
              frame: frame - (62 + i * 5),
              fps,
              config: { damping: 14, stiffness: 200 },
            });
            const collide = interpolate(frame, [116, 150], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const bx = lerp(b.home[0], CENTER[0], collide * 0.55);
            const by = lerp(b.home[1] - 80, CENTER[1] - 150, collide * 0.6);
            const s = pop * interpolate(frame, [140, 154], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const rot = collide * 15 * (i % 2 === 0 ? 1 : -1);
            return (
              <g
                key={`bubble-${b.key}`}
                transform={`translate(${bx} ${by}) rotate(${rot}) scale(${Math.max(0, s)})`}
                opacity={Math.max(0, Math.min(1, pop))}
              >
                <rect x={-70} y={-46} width={140} height={92} rx={22} fill="#FDF3E3" stroke={b.color} strokeWidth={6} />
                <path d="M-14 46 l10 26 l24 -26 z" fill="#FDF3E3" stroke={b.color} strokeWidth={6} strokeLinejoin="round" />
                <rect x={-44} y={-22} width={88} height={12} rx={6} fill={b.color} opacity={0.75} />
                <rect x={-44} y={2} width={62} height={12} rx={6} fill={NAVY} opacity={0.35} />
              </g>
            );
          })}

          <g
            opacity={knotOpacity}
            transform={`translate(${CENTER[0]} ${CENTER[1]}) rotate(${knotRot}) scale(${knotScale})`}
            filter="url(#chaos-crimson)"
          >
            <path d={spikePath(0, 0, 110, 58, 12)} fill={NEAR_BLACK} stroke={CRIMSON} strokeWidth={5} />
            <path d={spikePath(0, 0, 62, 34, 9)} fill={CRIMSON} opacity={0.5} />
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
