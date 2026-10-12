import type { FC } from "react";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundField } from "../../components/3d/BackgroundField";
import { AudioEngine, type AudioCue } from "../../components/audio/AudioEngine";
import { PaperGrain } from "../../components/ui/PaperGrain";
import { DEFAULT_PROJECT_ID, loadProject } from "../../utils/projectLoader";
import { resolveSceneSprings } from "../../utils/motionPresets";
import { resolveSceneRenderer } from "./sceneRegistry";
import {
  buildPalette,
  cameraFrame,
  floatOffset,
  lerpHex,
  shakeOffset,
  smoothstep,
  splitClauses,
  toUpper,
  truncateText,
  type ChaosCopy,
  type Palette,
  type PunchTrigger,
  type ShakeTrigger,
} from "./theme";

const SCENE_FRAMES = 150;

const PUNCHES: PunchTrigger[] = [
  { start: 8, decay: 12, amount: 0.08 },
  { start: 74, decay: 14, amount: 0.1 },
  { start: 100, decay: 18, amount: 0.16 },
  { start: 150, decay: 12, amount: 0.1 },
  { start: 165, decay: 14, amount: 0.12 },
  { start: 208, decay: 14, amount: 0.1 },
  { start: 258, decay: 16, amount: 0.09 },
];

const SHAKES: ShakeTrigger[] = [
  { start: 100, decay: 36, amp: 16 },
  { start: 150, decay: 18, amp: 9 },
  { start: 165, decay: 24, amp: 7 },
  { start: 252, decay: 28, amp: 6 },
];

const BOKEH = [
  { x: 200, y: 420, r: 160, ci: 0 },
  { x: 880, y: 620, r: 200, ci: 1 },
  { x: 300, y: 1420, r: 180, ci: 3 },
  { x: 820, y: 1360, r: 150, ci: 4 },
  { x: 540, y: 940, r: 240, ci: 2 },
];

export interface ChaosOrderSceneProps {
  projectId?: string;
}

export const ChaosOrderScene: FC<ChaosOrderSceneProps> = ({
  projectId = DEFAULT_PROJECT_ID,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const project = useMemo(() => loadProject(projectId), [projectId]);
  const palette = useMemo<Palette>(
    () => buildPalette(project.styleguide),
    [project],
  );
  const springs = useMemo(
    () => resolveSceneSprings(project.styleguide.motionPresets),
    [project],
  );

  const scenes = project.content.scenes;
  const acts = useMemo(() => {
    const max = Math.max(1, Math.floor(durationInFrames / SCENE_FRAMES));
    return scenes.slice(0, Math.min(scenes.length, max));
  }, [scenes, durationInFrames]);

  // Every display string is derived from the bundle (headline / body / cta / brand).
  const copy = useMemo<ChaosCopy>(() => {
    const chaos = scenes[0];
    const order = scenes[1] ?? scenes[0];
    const brand = project.styleguide.brand;
    const chaosBody = (chaos?.body ?? "").trim();
    const clauses = splitClauses(chaosBody);
    const lastClause = clauses.length > 0 ? clauses[clauses.length - 1] : "";
    return {
      line1: toUpper(clauses[0] ?? chaos?.headline ?? brand),
      line2: toUpper(clauses[1] ?? brand ?? order?.headline),
      bigChaos: toUpper(chaos?.headline ?? brand),
      caption: chaosBody || (order?.headline ?? brand),
      cardLabel: truncateText(toUpper(lastClause || chaos?.headline || brand)),
      bigOrder: toUpper(order?.headline ?? project.content.cta ?? brand),
      subtitle: order?.body ?? "",
    };
  }, [project, scenes]);

  const cues = useMemo<AudioCue[]>(() => {
    const list: AudioCue[] = [];
    acts.forEach((scene, index) => {
      const start = index * SCENE_FRAMES;
      const scale =
        scene.durationInFrames > 0 ? SCENE_FRAMES / scene.durationInFrames : 1;
      for (const sfx of scene.sfx) {
        const resolved = project.resolveSfx(sfx.src);
        if (!resolved) continue;
        list.push({
          src: resolved,
          atFrame: start + Math.round(sfx.atFrame * scale),
          volume: sfx.volume,
          duck: sfx.duck,
        });
      }
    });
    return list;
  }, [acts, project]);

  const musicSrc = project.styleguide.music.src
    ? project.resolveMedia(project.styleguide.music.src)
    : null;
  const voiceover = project.content.voiceover;

  const mood = smoothstep(SCENE_FRAMES, 224, frame);
  const cam = cameraFrame(frame, {
    seed: "main",
    punches: PUNCHES,
    shakes: SHAKES,
    rollDeg: 1.8 * palette.energy,
    panX: 16,
    panY: 20,
  });
  const shake = shakeOffset(frame, SHAKES);
  const shakeAmp = Math.hypot(shake.x, shake.y);

  const bgX = cam.x * -0.4;
  const bgY = cam.y * -0.4;
  const fgX = cam.x * 1.6;
  const fgY = cam.y * 1.7;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.background }}>
      <AbsoluteFill
        style={{ transform: `scale(1.14) translate(${bgX}px, ${bgY}px)` }}
      >
        <BackgroundField
          background={lerpHex(palette.background, "#02070f", mood)}
          particleColor={lerpHex(palette.chaos[0], palette.accent, mood)}
          accentColor={lerpHex(palette.chaos[4], palette.order[2], mood)}
          mood={mood}
          caX={0.0008 + shakeAmp * 0.00005}
          caY={0.0006 + shakeAmp * 0.00004}
          grain={0.1 + mood * 0.04}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          transform: `translate(${cam.x}px, ${cam.y}px) rotate(${cam.roll}deg) scale(${cam.zoom * 1.08})`,
        }}
      >
        {acts.map((scene, index) => {
          const Renderer = resolveSceneRenderer(scene);
          return (
            <Sequence
              key={scene.id}
              from={index * SCENE_FRAMES}
              durationInFrames={SCENE_FRAMES}
            >
              <Renderer
                project={project}
                scene={scene}
                palette={palette}
                energy={palette.energy}
                copy={copy}
                springs={springs}
              />
            </Sequence>
          );
        })}

        <AbsoluteFill
          style={{ transform: `translate(${fgX}px, ${fgY}px)`, pointerEvents: "none" }}
        >
          {BOKEH.map((blob, index) => {
            const drift = floatOffset(frame, `bokeh${index}`, 26, 32, 0.5);
            const color = palette.order[blob.ci % palette.order.length];
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: blob.x,
                  top: blob.y,
                  width: blob.r * 2,
                  height: blob.r * 2,
                  marginLeft: -blob.r,
                  marginTop: -blob.r,
                  borderRadius: "50%",
                  // Gradient falloff replaces a full-layer blur() (huge preview win).
                  background: `radial-gradient(circle, ${color} 0%, ${color}55 34%, rgba(0,0,0,0) 72%)`,
                  opacity: 0.22,
                  mixBlendMode: "screen",
                  transform: `translate(${drift.x}px, ${drift.y}px)`,
                }}
              />
            );
          })}
        </AbsoluteFill>

        <AbsoluteFill
          style={{
            background:
              "radial-gradient(120% 90% at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.78) 100%)",
            pointerEvents: "none",
          }}
        />

        <PaperGrain opacity={0.09} />
      </AbsoluteFill>

      <AudioEngine
        musicSrc={musicSrc}
        musicVolume={project.styleguide.music.volume}
        cues={cues}
        voiceoverSrc={voiceover ? project.resolveMedia(voiceover.src) : null}
        voiceoverAtFrame={voiceover?.atFrame ?? 0}
        voiceoverDurationInFrames={voiceover?.durationInFrames ?? null}
      />
    </AbsoluteFill>
  );
};
