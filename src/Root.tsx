import "./index.css";
import { Composition } from "remotion";
import {
  ChaosOrderScene,
  FREELANCE_PROJECT_ID,
} from "./scenes/chaosOrder/ChaosOrderScene";
import { DEFAULT_PROJECT_ID, TestScene } from "./scenes/TestScene";

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
        defaultProps={{ projectId: FREELANCE_PROJECT_ID }}
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
