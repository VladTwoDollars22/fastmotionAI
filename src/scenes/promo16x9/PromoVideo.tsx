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
import {
  buildPromoBrief,
  type PromoBeat,
  type PromoRole,
  type PromoSceneProps,
} from "./brief";
import { CtaScene } from "./CtaScene";
import { HookScene } from "./HookScene";
import { OfferScene } from "./OfferScene";
import { PromoBackdrop } from "./PromoBackdrop";
import { SolutionScene } from "./SolutionScene";
import { TRANSITION_FRAMES } from "./timeline";

/**
 * Camera impact shake is allowed ONLY on these two frames: the Scene-1 warning
 * burst and the Scene-3 "Записаться" button click. Every other frame keeps the
 * camera perfectly still (no pan, no roll, no breathing).
 */
const WARNING_FRAME = 60;
const CLICK_FRAME = 520;
const SHAKES: ShakeTrigger[] = [
  { start: WARNING_FRAME, decay: 28, amp: 16 },
  { start: CLICK_FRAME, decay: 20, amp: 10 },
];

/** Bundle-driven fallback act for beats with an unregistered role. */
const GenericBeat: FC<PromoSceneProps> = ({ beat, brief }) => (
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
      style={{ color: brief.palette.text, fontSize: 96, fontWeight: 800 }}
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

const RENDERERS: Record<PromoRole, FC<PromoSceneProps>> = {
  hook: HookScene,
  showcase: SolutionScene,
  offer: OfferScene,
  cta: CtaScene,
  generic: GenericBeat,
};

/**
 * Per-beat stage: a horizontal wipe-in and a fade-out. The incoming beat slides
 * from the right while fading up; the outgoing beat fades through the backdrop,
 * producing a clean fade-through cut.
 */
const BeatStage: FC<{ beat: PromoBeat; children: ReactNode }> = ({ beat, children }) => {
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

export interface PromoVideoProps {
  projectId?: string;
}

/**
 * 16:9 widescreen commercial engine for the Edvano promo. Stitches the bundled
 * beats into one timeline: a static light-theme backdrop (hue evolves per beat),
 * a rock-solid camera with two authored impact shakes, per-beat transitions, a
 * static paper-grain grade, and a synchronized SFX + ambient audio bed.
 */
export const PromoVideo: FC<PromoVideoProps> = ({ projectId = DEFAULT_PROJECT_ID }) => {
  const frame = useCurrentFrame();
  const project = useMemo(() => loadProject(projectId), [projectId]);
  const brief = useMemo(() => buildPromoBrief(project), [project]);

  const shake = shakeOffset(frame, SHAKES);
  const shakeAmp = Math.hypot(shake.x, shake.y);
  const alarm = dampedImpulse(frame - WARNING_FRAME, 26);

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
          const Renderer = RENDERERS[beat.role];
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

      {/* Grade: static paper grain + impact-reactive vignette. */}
      <PaperGrain opacity={0.06} blend="soft-light" animate={false} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 95% at 50% 46%, rgba(15,23,42,0) 58%, rgba(15,23,42,${(0.06 + Math.min(0.05, shakeAmp * 0.004)).toFixed(3)}) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Ambient music bed (silent videos are forbidden). */}
      <PlayMusic id="ambient_light" volume={0.5} loop />
    </AbsoluteFill>
  );
};
