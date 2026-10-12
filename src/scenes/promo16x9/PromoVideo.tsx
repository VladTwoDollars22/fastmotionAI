import type { FC, ReactNode } from "react";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { PaperGrain } from "../../components/ui/PaperGrain";
import {
  cameraFrame,
  dampedImpulse,
  shakeOffset,
  smoothstep,
  type PunchTrigger,
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
import { TRANSITION_FRAMES, globalCues } from "./timeline";

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
 * producing a clean fade-through cut that rides the camera punch on each cut.
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
        transform: `translateX(${(1 - inP) * 90 - outP * 110}px) scale(${1 + 0.012 * (1 - outP)})`,
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
 * beats into one timeline: shared light-theme backdrop, a global camera rig
 * driven by the beat cues, per-beat transitions and a paper-grain grade.
 */
export const PromoVideo: FC<PromoVideoProps> = ({ projectId = DEFAULT_PROJECT_ID }) => {
  const frame = useCurrentFrame();
  const project = useMemo(() => loadProject(projectId), [projectId]);
  const brief = useMemo(() => buildPromoBrief(project), [project]);

  const { punches, shakes, glitchFrame } = useMemo(() => {
    const p: PunchTrigger[] = [];
    const s: ShakeTrigger[] = [];
    let glitch = -1;
    for (const cue of globalCues(brief)) {
      switch (cue.kind) {
        case "cut":
          p.push({ start: cue.frame, decay: 12, amount: 0.05 });
          break;
        case "glitch":
          glitch = cue.frame;
          p.push({ start: cue.frame, decay: 16, amount: 0.1 });
          s.push({ start: cue.frame, decay: 30, amp: 16 });
          break;
        case "score":
          p.push({ start: cue.frame, decay: 16, amount: 0.11 });
          break;
        case "switch":
          p.push({ start: cue.frame, decay: 8, amount: 0.03 });
          break;
        case "click":
          p.push({ start: cue.frame, decay: 10, amount: 0.05 });
          break;
        case "reveal":
          p.push({ start: cue.frame, decay: 20, amount: 0.13 });
          s.push({ start: cue.frame, decay: 24, amp: 9 });
          break;
      }
    }
    return { punches: p, shakes: s, glitchFrame: glitch };
  }, [brief]);

  const cam = cameraFrame(frame, {
    seed: "promo",
    punches,
    shakes,
    rollDeg: 1.5,
    panX: 14,
    panY: 18,
  });
  const shakeAmp = Math.hypot(shakeOffset(frame, shakes).x, shakeOffset(frame, shakes).y);

  const alarm = glitchFrame >= 0 ? dampedImpulse(frame - glitchFrame, 26) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: brief.palette.background, fontFamily: brief.fontFamily }}>
      <PromoBackdrop brief={brief} alarm={alarm} camX={cam.x} camY={cam.y} />

      <AbsoluteFill
        style={{
          transform: `translate(${cam.x}px, ${cam.y}px) rotate(${cam.roll}deg) scale(${cam.zoom})`,
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

      {/* Grade: paper grain + reactive chromatic vignette on heavy shake. */}
      <PaperGrain opacity={0.06} blend="soft-light" />
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 95% at 50% 46%, rgba(15,23,42,0) 58%, rgba(15,23,42,${(0.06 + Math.min(0.05, shakeAmp * 0.004)).toFixed(3)}) 100%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
