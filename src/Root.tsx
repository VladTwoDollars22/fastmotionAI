import "./index.css";
import { Composition } from "remotion";
import { ChaosOrderScene } from "./scenes/chaosOrder/ChaosOrderScene";
import { TestScene } from "./scenes/TestScene";
import { DEFAULT_PROJECT_ID } from "./utils/projectLoader";

/**
 * Showcase bundle rendered by `MainVideo`. Forced here so Studio and renders
 * never fall back to the dummy `_template` bundle.
 */
export const SHOWCASE_PROJECT_ID = "project_2026_10_12_freelance_chaos_to_order";

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
        defaultProps={{ projectId: SHOWCASE_PROJECT_ID }}
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
