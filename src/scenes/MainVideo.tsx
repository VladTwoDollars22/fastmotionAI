import type { FC } from "react";
import { useMemo } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { loadProject } from "../utils/projectLoader";
import { ChaosScene } from "./ChaosScene";
import { OrderScene } from "./OrderScene";
import { SceneOverlay } from "./TestScene";

export const DEFAULT_PROJECT_ID =
  "project_2026_10_12_freelance_chaos_to_order";

export type MainVideoProps = { projectId?: string };

export const MainVideo: FC<MainVideoProps> = ({
  projectId = DEFAULT_PROJECT_ID,
}) => {
  const project = useMemo(() => loadProject(projectId), [projectId]);
  const { colors, fonts } = project.styleguide;

  const timeline = useMemo(() => {
    let cursor = 0;
    return project.content.scenes.map((scene) => {
      const start = cursor;
      cursor += scene.durationInFrames;
      return { scene, start };
    });
  }, [project.content.scenes]);

  return (
    <AbsoluteFill
      style={{
        background: colors.background,
        fontFamily: `${fonts.heading}, ${fonts.body}, system-ui, sans-serif`,
      }}
    >
      {timeline.map(({ scene, start }) => {
        if (scene.id === "chaos") {
          return (
            <Sequence
              key={scene.id}
              from={start}
              durationInFrames={scene.durationInFrames}
            >
              <ChaosScene project={project} scene={scene} />
            </Sequence>
          );
        }
        if (scene.id === "order") {
          return (
            <Sequence
              key={scene.id}
              from={start}
              durationInFrames={scene.durationInFrames}
            >
              <OrderScene project={project} scene={scene} />
            </Sequence>
          );
        }
        return (
          <SceneOverlay
            key={scene.id}
            scene={scene}
            start={start}
            project={project}
          />
        );
      })}
    </AbsoluteFill>
  );
};
