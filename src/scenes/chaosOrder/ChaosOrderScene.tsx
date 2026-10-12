import type { FC } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { BackgroundField } from "../../components/3d/BackgroundField";
import { PaperGrain } from "../../components/ui/PaperGrain";
import { SceneChaos } from "./SceneChaos";
import { SceneOrder } from "./SceneOrder";
import {
  BACKGROUND,
  CHAOS_COLORS,
  ORDER_COLORS,
  lerpHex,
  shakeOffset,
  smoothstep,
  type ShakeTrigger,
} from "./theme";

const TRIGGERS: ShakeTrigger[] = [
  { start: 100, decay: 36, amp: 28 },
  { start: 150, decay: 18, amp: 15 },
  { start: 165, decay: 24, amp: 11 },
  { start: 252, decay: 28, amp: 9 },
];

export const ChaosOrderScene: FC = () => {
  const frame = useCurrentFrame();
  const mood = smoothstep(150, 224, frame);
  const shake = shakeOffset(frame, TRIGGERS);

  const shakeAmp = Math.hypot(shake.x, shake.y);
  const caX = 0.0008 + shakeAmp * 0.00005;
  const caY = 0.0006 + shakeAmp * 0.00004;

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND }}>
      <AbsoluteFill
        style={{
          transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rot}deg) scale(1.09)`,
        }}
      >
        <BackgroundField
          background={lerpHex("#0b0512", "#020a12", mood)}
          particleColor={lerpHex(CHAOS_COLORS[0], ORDER_COLORS[0], mood)}
          accentColor={lerpHex(CHAOS_COLORS[4], ORDER_COLORS[2], mood)}
          mood={mood}
          caX={caX}
          caY={caY}
          grain={0.1 + mood * 0.04}
        />

        <Sequence from={0} durationInFrames={150}>
          <SceneChaos />
        </Sequence>
        <Sequence from={150} durationInFrames={150}>
          <SceneOrder />
        </Sequence>

        <AbsoluteFill
          style={{
            background:
              "radial-gradient(120% 90% at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.78) 100%)",
            pointerEvents: "none",
          }}
        />

        <PaperGrain opacity={0.09} />

        <AbsoluteFill
          style={{
            background:
              "linear-gradient(0deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 12%, rgba(0,0,0,0) 88%, rgba(255,255,255,0.03) 100%)",
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
