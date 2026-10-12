import type { FC, ReactNode } from "react";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { PaperGrain } from "../../components/ui/PaperGrain";
import { PlayMusic } from "../../utils/audioLibrary";
import { dampedImpulse, smoothstep } from "../../utils/kinetics";
import { DEFAULT_PROJECT_ID, loadProject } from "../../utils/projectLoader";
import { buildLaunchBrief, type LaunchBeat, type LaunchBrief, type LaunchRole, type LaunchSceneProps } from "./brief";
import { LaunchBackdrop } from "./backdrop";
import { ChaosFlashScene } from "./ChaosFlashScene";
import { CtaLaunchScene } from "./CtaLaunchScene";
import { EcosystemMorphScene } from "./EcosystemMorphScene";
import { EngineShowcaseScene } from "./EngineShowcaseScene";
import { FounderFreedomScene } from "./FounderFreedomScene";
import { TRANSITION_FRAMES, CHAOS_T, CTA_T } from "./timeline";

/**
 * The two hero accents are a single damped scale punch each — smooth, settles to
 * rest, and never translates or rotates the frame (`rules/roles/02` §3.6:
 * absolute motion stability, no shake / no jitter). Both fire on the outgoing
 * beat's own timeline so the engine scales to any bundle duration.
 */
const beatFrame = (
  brief: LaunchBrief,
  role: LaunchRole,
  nominal: number,
  localFrame: number,
): number => {
  const beat = brief.beats.find((b) => b.role === role);
  if (!beat) return 0;
  return beat.start + Math.round(localFrame * (beat.durationInFrames / nominal));
};

const SCENE_BY_ROLE: Record<LaunchRole, FC<LaunchSceneProps>> = {
  chaos: ChaosFlashScene,
  ecosystem: EcosystemMorphScene,
  engine: EngineShowcaseScene,
  founder: FounderFreedomScene,
  cta: CtaLaunchScene,
};

const BeatStage: FC<{ beat: LaunchBeat; children: ReactNode }> = ({ beat, children }) => {
  const frame = useCurrentFrame();
  const dur = beat.durationInFrames;
  const isFirst = beat.start === 0;
  const inP = isFirst ? 1 : smoothstep(0, TRANSITION_FRAMES, frame);
  const outP = smoothstep(dur - TRANSITION_FRAMES, dur, frame);
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${(1 - inP) * 70 - outP * 80}px) scale(${1 - outP * 0.045})`,
        opacity: inP * (1 - outP),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export interface EdvanoLaunchVideoProps {
  projectId?: string;
}

/** Beat energy 0..1 driving backdrop grid brightness and drift. */
const energyFor = (brief: LaunchBrief, frame: number): number => {
  const beat = brief.beats.find((b) => frame >= b.start && frame < b.start + b.durationInFrames);
  if (!beat) return 0.5;
  if (beat.role === "chaos") return 0.95;
  if (beat.role === "ecosystem") return 0.7;
  return 0.5;
};

/**
 * Edvano-Light 3D launch engine for `edvano_vercel_launch_16x9`: a light, airy
 * perspective stage with z-depth parallax, liquid beat transitions, a smooth
 * particle/grid backdrop, two damped scale accents (no shake), and a
 * shared-library SFX + ambient bed.
 */
export const EdvanoLaunchVideo: FC<EdvanoLaunchVideoProps> = ({ projectId = DEFAULT_PROJECT_ID }) => {
  const frame = useCurrentFrame();
  const project = useMemo(() => loadProject(projectId), [projectId]);
  const brief = useMemo(() => buildLaunchBrief(project), [project]);

  const dropFrame = beatFrame(brief, "chaos", CHAOS_T.nominal, CHAOS_T.blackout);
  const pressFrame = beatFrame(brief, "cta", CTA_T.nominal, CTA_T.press);
  const alarm = dampedImpulse(frame - dropFrame, 26);
  const punch = dampedImpulse(frame - dropFrame, 20) + 0.6 * dampedImpulse(frame - pressFrame, 18);
  const energy = energyFor(brief, frame);

  return (
    <AbsoluteFill style={{ backgroundColor: brief.palette.background, fontFamily: brief.fontFamily }}>
      <LaunchBackdrop brief={brief} alarm={alarm} energy={energy} />

      <AbsoluteFill style={{ transform: `scale(${1 + punch * 0.028})`, willChange: "transform" }}>
        {brief.beats.map((beat) => {
          const Renderer = SCENE_BY_ROLE[beat.role];
          return (
            <Sequence key={beat.scene.id} from={beat.start} durationInFrames={beat.durationInFrames}>
              <BeatStage beat={beat}>
                <Renderer beat={beat} brief={brief} />
              </BeatStage>
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <PaperGrain opacity={0.035} blend="multiply" animate={false} />

      {/* Ambient music bed (silent videos are forbidden). */}
      <PlayMusic id="ambient_light" volume={0.45} loop />
    </AbsoluteFill>
  );
};
