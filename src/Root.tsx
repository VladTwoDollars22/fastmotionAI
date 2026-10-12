import "./index.css";
import { Composition } from "remotion";
import { ChaosOrderScene } from "./scenes/chaosOrder/ChaosOrderScene";
import { PromoVideo } from "./scenes/promo16x9/PromoVideo";
import { TestScene } from "./scenes/TestScene";
import { DEFAULT_PROJECT_ID } from "./utils/projectLoader";

/**
 * Showcase bundle rendered by `MainVideo`. Fixed here so Studio and renders
 * never fall back to the dummy `_template` bundle.
 */
export const SHOWCASE_PROJECT_ID = "project_edvano_promo_16x9";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={PromoVideo}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ projectId: SHOWCASE_PROJECT_ID }}
      />
      <Composition
        id="ChaosOrderShowcase"
        component={ChaosOrderScene}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ projectId: "project_2026_10_12_freelance_chaos_to_order" }}
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
