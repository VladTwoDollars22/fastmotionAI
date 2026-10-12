import type { FC } from "react";
import { useMemo } from "react";
import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import { AudioEngine, type AudioCue } from "../components/audio/AudioEngine";
import { DEFAULT_DUCK_FACTOR } from "../components/audio/ducking";
import { FloatingCard3D } from "../components/3d/FloatingCard3D";
import { ParticleField } from "../components/3d/ParticleField";
import { ThreeCanvas } from "../components/3d/ThreeCanvas";
import { GlassPanel } from "../components/ui/GlassPanel";
import { KineticText } from "../components/ui/KineticText";
import {
  loadProject,
  type LoadedProject,
  type ProjectScene,
} from "../utils/projectLoader";

export const DEFAULT_PROJECT_ID = "_template";

export type MainVideoProps = { projectId?: string };

const SceneOverlay: FC<{
  scene: ProjectScene;
  start: number;
  project: LoadedProject;
}> = ({ scene, start, project }) => {
  const { colors, fonts } = project.styleguide;
  const media = scene.media ? project.resolveMedia(scene.media) : null;

  return (
    <Sequence from={start} durationInFrames={scene.durationInFrames}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          padding: "180px 96px 220px",
          fontFamily: `${fonts.heading}, ${fonts.body}, system-ui, sans-serif`,
        }}
      >
        <div />
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          <KineticText
            text={scene.headline}
            mode="word"
            delay={6}
            stagger={4}
            style={{
              color: colors.text,
              fontSize: 96,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.02,
            }}
          />
          {media ? (
            <GlassPanel
              delay={14}
              style={{ padding: 0, overflow: "hidden", width: 520 }}
            >
              <Img
                src={staticFile(media)}
                style={{ width: "100%", display: "block" }}
              />
            </GlassPanel>
          ) : null}
          {scene.body ? (
            <GlassPanel delay={20} style={{ padding: "28px 36px", maxWidth: 780 }}>
              <p
                style={{
                  margin: 0,
                  color: colors.text,
                  fontSize: 38,
                  lineHeight: 1.35,
                  textAlign: "center",
                  opacity: 0.92,
                }}
              >
                {scene.body}
              </p>
            </GlassPanel>
          ) : null}
        </div>
        <GlassPanel
          delay={26}
          direction="down"
          style={{ padding: "22px 34px" }}
        >
          <span
            style={{
              color: colors.accent,
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {project.content.cta || project.styleguide.brand}
          </span>
        </GlassPanel>
      </AbsoluteFill>
    </Sequence>
  );
};

export const TestScene: FC<MainVideoProps> = ({
  projectId = DEFAULT_PROJECT_ID,
}) => {
  const project = useMemo(() => loadProject(projectId), [projectId]);
  const { styleguide, content } = project;

  const timeline = useMemo(() => {
    let cursor = 0;
    return content.scenes.map((scene) => {
      const start = cursor;
      cursor += scene.durationInFrames;
      return { scene, start };
    });
  }, [content.scenes]);

  const cues = useMemo<AudioCue[]>(() => {
    const list: AudioCue[] = [];
    for (const { scene, start } of timeline) {
      for (const sfx of scene.sfx) {
        const resolved = project.resolveSfx(sfx.src);
        if (resolved) {
          list.push({
            src: resolved,
            atFrame: start + sfx.atFrame,
            volume: sfx.volume,
            duck: sfx.duck,
          });
        }
      }
    }
    return list;
  }, [timeline, project]);

  const musicSrc = styleguide.music.src
    ? project.resolveMedia(styleguide.music.src)
    : null;
  const voiceoverSrc = content.voiceover
    ? project.resolveMedia(content.voiceover.src)
    : null;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 50% 0%, ${styleguide.colors.primary}33, ${styleguide.colors.background} 55%)`,
      }}
    >
      <ThreeCanvas cameraPosition={[0, 0, 8.5]} fov={38}>
        <ParticleField color={styleguide.colors.accent} count={900} radius={13} />
        <FloatingCard3D
          position={[0, 0, 0]}
          size={[2, 2.7, 0.2]}
          color={styleguide.colors.primary}
          accent={styleguide.colors.accent}
        />
      </ThreeCanvas>

      {timeline.map(({ scene, start }) => (
        <SceneOverlay key={scene.id} scene={scene} start={start} project={project} />
      ))}

      <AudioEngine
        musicSrc={musicSrc}
        musicVolume={styleguide.music.volume}
        cues={cues}
        voiceoverSrc={voiceoverSrc}
        voiceoverAtFrame={content.voiceover?.atFrame ?? 0}
        voiceoverDurationInFrames={content.voiceover?.durationInFrames ?? null}
        duckFactor={DEFAULT_DUCK_FACTOR}
      />
    </AbsoluteFill>
  );
};
