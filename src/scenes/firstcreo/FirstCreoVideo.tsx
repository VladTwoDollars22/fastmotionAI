import type { FC, ReactNode } from "react";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { PaperGrain } from "../../components/ui/PaperGrain";
import { PlayMusic } from "../../utils/audioLibrary";
import {
  dampedImpulse,
  shakeOffset,
  smoothstep,
  type ShakeTrigger,
} from "../../utils/kinetics";
import { DEFAULT_PROJECT_ID, loadProject } from "../../utils/projectLoader";
import { PromoBackdrop } from "../promo16x9/PromoBackdrop";
import {
  buildFirstCreoBrief,
  type FirstCreoSceneProps,
} from "./brief";
import { ChaosScene } from "./ChaosScene";
import { EcosystemScene } from "./EcosystemScene";
import { FounderScene } from "./FounderScene";
import { ResolveScene } from "./ResolveScene";
import { TRANSITION_FRAMES } from "./timeline";

/**
 * Camera impact impulses are allowed ONLY on the two peak beats: the Scene-1
 * warning burst (frame 120) and the Scene-4 "Записаться" click (frame 800).
 * Every other frame keeps the camera and background perfectly still.
 */
const WARNING_FRAME = 120;
const CLICK_FRAME = 800;
const SHAKES: ShakeTrigger[] = [
  { start: WARNING_FRAME, decay: 28, amp: 16 },
  { start: CLICK_FRAME, decay: 20, amp: 11 },
];

const SCENE_BY_TYPE: Record<string, FC<FirstCreoSceneProps>> = {
  chaos_hook: ChaosScene,
  ecosystem_showcase: EcosystemScene,
  founder_value: FounderScene,
  cta_resolution: ResolveScene,
};

const FallbackBeat: FC<FirstCreoSceneProps> = ({ beat, brief }) => (
  <AbsoluteFill
    style={{
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 26,
      fontFamily: brief.fontFamily,
    }}
  >
    <KineticText
      text={beat.scene.headline}
      mode="word"
      entry="pop"
      damping={brief.springs.entrance.damping}
      stiffness={brief.springs.entrance.stiffness}
      mass={brief.springs.entrance.mass}
      style={{ color: brief.palette.text, fontSize: 92, fontWeight: 800 }}
    />
    {beat.scene.body ? (
      <KineticText
        text={beat.scene.body}
        mode="word"
        delay={10}
        damping={brief.springs.settle.damping}
        stiffness={brief.springs.settle.stiffness}
        mass={brief.springs.settle.mass}
        style={{ color: brief.palette.muted, fontSize: 40, fontWeight: 500 }}
      />
    ) : null}
  </AbsoluteFill>
);

const BeatStage: FC<{ beat: FirstCreoSceneProps["beat"]; children: ReactNode }> = ({
  beat,
  children,
}) => {
  const frame = useCurrentFrame();
  const dur = beat.durationInFrames;
  const isFirst = beat.start === 0;
  const inP = isFirst ? 1 : smoothstep(0, TRANSITION_FRAMES, frame);
  const outP = smoothstep(dur - TRANSITION_FRAMES, dur, frame);
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${(1 - inP) * 90 - outP * 110}px)`,
        opacity: inP * (1 - outP),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export interface FirstCreoVideoProps {
  projectId?: string;
}

/**
 * 16:9 light-mode commercial engine for `firstcreo2026_12_10` ("1 Deal Instead
 * of 5 Freelancers"): static backdrop, rock-solid camera with two impact
 * impulses, liquid beat transitions, static grain and synced soft SFX + ambient.
 */
export const FirstCreoVideo: FC<FirstCreoVideoProps> = ({ projectId = DEFAULT_PROJECT_ID }) => {
  const frame = useCurrentFrame();
  const project = useMemo(() => loadProject(projectId), [projectId]);
  const brief = useMemo(() => buildFirstCreoBrief(project), [project]);

  const shake = shakeOffset(frame, SHAKES);
  const shakeAmp = Math.hypot(shake.x, shake.y);
  const alarm = dampedImpulse(frame - WARNING_FRAME, 28);

  return (
    <AbsoluteFill style={{ backgroundColor: brief.palette.background, fontFamily: brief.fontFamily }}>
      <PromoBackdrop brief={brief} alarm={alarm} camX={shake.x} camY={shake.y} />

      <AbsoluteFill
        style={{
          transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rot}deg)`,
          willChange: "transform",
        }}
      >
        {brief.beats.map((beat) => {
          const Renderer = SCENE_BY_TYPE[beat.scene.type] ?? FallbackBeat;
          return (
            <Sequence
              key={beat.scene.id}
              from={beat.start}
              durationInFrames={beat.durationInFrames}
            >
              <BeatStage beat={beat}>
                <Renderer beat={beat} brief={brief} />
              </BeatStage>
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <PaperGrain opacity={0.06} blend="soft-light" animate={false} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 95% at 50% 46%, rgba(15,23,42,0) 58%, rgba(15,23,42,${(0.06 + Math.min(0.05, shakeAmp * 0.004)).toFixed(3)}) 100%)`,
          pointerEvents: "none",
        }}
      />

      <PlayMusic id="ambient_light" volume={0.45} loop />
    </AbsoluteFill>
  );
};
