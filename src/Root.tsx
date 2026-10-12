import "./index.css";
import { Composition } from "remotion";
import {
  DEFAULT_PROJECT_ID,
  MainVideo,
  type MainVideoProps,
} from "./scenes/MainVideo";
import { loadProject } from "./utils/projectLoader";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainVideo"
      component={MainVideo}
      durationInFrames={480}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ projectId: DEFAULT_PROJECT_ID } satisfies MainVideoProps}
      calculateMetadata={({ props }) => {
        const raw = (props as { projectId?: unknown }).projectId;
        const id = typeof raw === "string" ? raw : DEFAULT_PROJECT_ID;
        try {
          const total = loadProject(id).totalFrames();
          return {
            durationInFrames: Math.max(1, total),
            fps: 30,
            width: 1080,
            height: 1920,
          };
        } catch {
          return {};
        }
      }}
    />
  );
};
