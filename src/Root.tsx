import "./index.css";
import { Composition } from "remotion";
import { ChaosOrderScene } from "./scenes/chaosOrder/ChaosOrderScene";
import { EdvanoLaunchVideo } from "./scenes/edvanoLaunch/EdvanoLaunchVideo";
import { FirstCreoVideo } from "./scenes/firstcreo/FirstCreoVideo";
import { PromoVideo } from "./scenes/promo16x9/PromoVideo";
import { TestScene } from "./scenes/TestScene";
import { DEFAULT_PROJECT_ID } from "./utils/projectLoader";

/**
 * Showcase bundle rendered by `MainVideo`. Fixed here so Studio and renders
 * never fall back to the dummy `_template` bundle.
 */
export const SHOWCASE_PROJECT_ID = "firstcreo2026_12_10";

/** Dark 3D launch promo rendered by `MainVideo`. */
export const EDVANO_LAUNCH_PROJECT_ID = "edvano_vercel_launch_16x9";

/** Edvano OS keynote reveal — the current `MainVideo` default. */
export const EDVANO_OS_PROJECT_ID = "edvano_os_launch_16x9";

/** Previously-rendered Edvano promo (kept renderable as a separate composition). */
export const EDVANO_PROJECT_ID = "project_edvano_promo_16x9";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={EdvanoLaunchVideo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ projectId: EDVANO_OS_PROJECT_ID }}
      />
      <Composition
        id="EdvanoVercel16x9"
        component={EdvanoLaunchVideo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ projectId: EDVANO_LAUNCH_PROJECT_ID }}
      />
      <Composition
        id="FirstCreoShowcase"
        component={FirstCreoVideo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ projectId: SHOWCASE_PROJECT_ID }}
      />
      <Composition
        id="EdvanoPromo16x9"
        component={PromoVideo}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ projectId: EDVANO_PROJECT_ID }}
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
