import "./index.css";
import { Composition } from "remotion";
import { ChaosOrderScene } from "./scenes/chaosOrder/ChaosOrderScene";
import { TestScene } from "./scenes/TestScene";
import { DEFAULT_PROJECT_ID } from "./utils/projectLoader";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={ChaosOrderScene}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ projectId: DEFAULT_PROJECT_ID }}
      />
      <Composition
        id="TemplateVideo"
        component={TestScene}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ projectId: DEFAULT_PROJECT_ID }}
      />
    </>
  );
};
