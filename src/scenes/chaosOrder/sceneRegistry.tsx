import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import type { LoadedProject, ProjectScene } from "../../utils/projectLoader";
import type { SceneSprings } from "../../utils/motionPresets";
import { SceneChaos } from "./SceneChaos";
import { SceneOrder } from "./SceneOrder";
import type { ChaosCopy, Palette } from "./theme";

export interface SceneRendererProps {
  project: LoadedProject;
  scene: ProjectScene;
  palette: Palette;
  energy: number;
  copy: ChaosCopy;
  springs: SceneSprings;
}

export type SceneRenderer = FC<SceneRendererProps>;

/**
 * Generic bundle-driven act: renders whatever `headline`/`body` the scene
 * provides. Used when a scene's `type`/`id` has no dedicated act registered,
 * so any bundle remains renderable without code changes.
 */
export const GenericAct: SceneRenderer = ({ scene, palette, springs }) => (
  <AbsoluteFill
    style={{
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 96px",
      gap: 28,
    }}
  >
    {scene.headline ? (
      <KineticText
        text={scene.headline}
        mode="word"
        entry="pop"
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        style={{
          color: palette.text,
          fontSize: 96,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.04,
        }}
      />
    ) : null}
    {scene.body ? (
      <KineticText
        text={scene.body}
        mode="word"
        delay={10}
        damping={springs.settle.damping}
        stiffness={springs.settle.stiffness}
        mass={springs.settle.mass}
        style={{
          color: palette.text,
          fontSize: 40,
          fontWeight: 500,
          textAlign: "center",
          opacity: 0.85,
        }}
      />
    ) : null}
  </AbsoluteFill>
);

/**
 * Dynamic scene router: `scene.type -> Component`, falling back to `scene.id`
 * (dedicated acts the bundle marks only as a generic type), then to `GenericAct`.
 */
export const SCENE_REGISTRY: Record<string, SceneRenderer> = {
  chaos: SceneChaos,
  order: SceneOrder,
};

export const resolveSceneRenderer = (scene: ProjectScene): SceneRenderer =>
  SCENE_REGISTRY[scene.type] ?? SCENE_REGISTRY[scene.id] ?? GenericAct;
