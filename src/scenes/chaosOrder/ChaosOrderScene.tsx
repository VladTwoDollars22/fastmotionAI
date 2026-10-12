import type { FC } from "react";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { BackgroundField } from "../../components/3d/BackgroundField";
import { AudioEngine, type AudioCue } from "../../components/audio/AudioEngine";
import { PaperGrain } from "../../components/ui/PaperGrain";
import { loadProject } from "../../utils/projectLoader";
import { SceneChaos } from "./SceneChaos";
import { SceneOrder } from "./SceneOrder";
import {
  buildPalette,
  cameraFrame,
  floatOffset,
  lerpHex,
  shakeOffset,
  smoothstep,
  type ChaosCopy,
  type Palette,
  type PunchTrigger,
  type ShakeTrigger,
} from "./theme";

export const FREELANCE_PROJECT_ID =
  "project_2026_10_12_freelance_chaos_to_order";

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
  { start: 100, decay: 36, amp: 28 },
  { start: 150, decay: 18, amp: 15 },
  { start: 165, decay: 24, amp: 11 },
  { start: 252, decay: 28, amp: 9 },
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
  projectId = FREELANCE_PROJECT_ID,
}) => {
  const frame = useCurrentFrame();
  const project = useMemo(() => loadProject(projectId), [projectId]);
  const palette = useMemo<Palette>(
    () => buildPalette(project.styleguide),
    [project],
  );

  const copy = useMemo<ChaosCopy>(() => {
    const scenes = project.content.scenes;
    const chaos = scenes[0];
    const order = scenes[1] ?? scenes[0];
    return {
      line1: "5 FREELANCERS",
      line2: "NO SYNC",
      bigChaos: (chaos?.headline ?? "Chaos").toUpperCase(),
      caption: chaos?.body || "Everything is fragmented.",
      bigOrder: project.content.cta || "ONE UNIFIED SYSTEM",
      subtitle: order?.body || "One system. Every client. Zero chaos.",
    };
  }, [project]);

  const cues = useMemo<AudioCue[]>(() => {
    const list: AudioCue[] = [];
    project.content.scenes.slice(0, 2).forEach((scene, index) => {
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
  }, [project]);

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
        <Sequence durationInFrames={SCENE_FRAMES}>
          <SceneChaos palette={palette} energy={palette.energy} copy={copy} />
        </Sequence>
        <Sequence from={SCENE_FRAMES} durationInFrames={SCENE_FRAMES}>
          <SceneOrder palette={palette} energy={palette.energy} copy={copy} />
        </Sequence>

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
                  background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 68%)`,
                  filter: "blur(56px)",
                  opacity: 0.18,
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
