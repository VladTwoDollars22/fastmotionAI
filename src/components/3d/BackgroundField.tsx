import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { Canvas, useThree } from "@react-three/fiber";
import { BlendFunction } from "postprocessing";
import type { CSSProperties, FC } from "react";
import { useEffect, useMemo } from "react";
import {
  AbsoluteFill,
  getRemotionEnvironment,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as THREE from "three";
import { mulberry32 } from "../../utils/prng";
import { lerpHex } from "../../utils/kinetics";

export type FieldQuality = "auto" | "preview" | "high";

export interface BackgroundFieldProps {
  background?: string;
  particleColor?: string;
  accentColor?: string;
  count?: number;
  mood?: number;
  caX?: number;
  caY?: number;
  grain?: number;
  /** Ambient 3D grid lines that shift in depth (rule 01 §13). Default on. */
  grid?: boolean;
  /** "auto" (default) = full quality while rendering, light during Studio preview. */
  quality?: FieldQuality;
  /** When false, the (expensive) EffectComposer post pipeline is skipped entirely. */
  postFx?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface FieldProps {
  background: string;
  particleColor: string;
  accentColor: string;
  count: number;
  mood: number;
  caX: number;
  caY: number;
  grain: number;
  grid: boolean;
  usePost: boolean;
}

const RenderOnFrame: FC<{ frame: number }> = ({ frame }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    gl.render(scene, camera);
  }, [frame, gl, scene, camera]);
  return null;
};

const Field: FC<FieldProps> = ({
  background,
  particleColor,
  accentColor,
  count,
  mood,
  caX,
  caY,
  grain,
  grid,
  usePost,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const cloud = useMemo(() => {
    const random = mulberry32(1337);
    const primary = new Float32Array(count * 3);
    const accent = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      primary[i * 3] = (random() * 2 - 1) * 14;
      primary[i * 3 + 1] = (random() * 2 - 1) * 20;
      primary[i * 3 + 2] = (random() * 2 - 1) * 14;
      accent[i * 3] = (random() * 2 - 1) * 16;
      accent[i * 3 + 1] = (random() * 2 - 1) * 22;
      accent[i * 3 + 2] = (random() * 2 - 1) * 16;
    }
    return { primary, accent };
  }, [count]);

  const offset = useMemo(() => new THREE.Vector2(caX, caY), [caX, caY]);
  const tintA = lerpHex(particleColor, accentColor, mood);
  const tintB = lerpHex(accentColor, particleColor, mood);
  const gridTint = lerpHex(background, accentColor, 0.24);

  return (
    <>
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.6} />
      <group rotation={[0, time * 0.09, 0]} position={[0, Math.sin(time * 0.22) * 0.6, 0]}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cloud.primary, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color={tintA}
            transparent
            opacity={0.85}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
      <group rotation={[0, -time * 0.05, 0]} position={[0, Math.cos(time * 0.17) * 0.5, 0]}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cloud.accent, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.09}
            color={tintB}
            transparent
            opacity={0.6}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

      {grid ? (
        <>
          <group position={[0, -7, (time * 0.5) % 4 - 2]}>
            <gridHelper args={[64, 32, gridTint, gridTint]} rotation={[0, time * 0.05, 0]} />
          </group>
          <group position={[0, 7, (time * 0.42 + 2) % 4 - 2]}>
            <gridHelper
              args={[64, 32, gridTint, gridTint]}
              rotation={[0, -time * 0.04, 0]}
            />
          </group>
        </>
      ) : null}

      {usePost ? (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            intensity={0.7 + mood * 0.6}
            luminanceThreshold={0.12}
            luminanceSmoothing={0.25}
            radius={0.78}
            levels={7}
          />
          <ChromaticAberration
            offset={offset}
            radialModulation
            modulationOffset={0.42}
          />
          <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={grain} />
          <Vignette eskil={false} offset={0.24} darkness={0.62} />
        </EffectComposer>
      ) : (
        <RenderOnFrame frame={frame} />
      )}
    </>
  );
};

export const BackgroundField: FC<BackgroundFieldProps> = ({
  background = "#05060e",
  particleColor = "#FF2E63",
  accentColor = "#B23BFF",
  count = 1400,
  mood = 0,
  caX = 0.0012,
  caY = 0.0008,
  grain = 0.12,
  grid = true,
  quality = "auto",
  postFx = true,
  className,
  style,
}) => {
  const { isRendering } = getRemotionEnvironment();
  const highQuality = quality === "high" || (quality === "auto" && isRendering);
  const renderCount = highQuality ? count : Math.max(1, Math.round(count * 0.5));

  return (
    <AbsoluteFill className={className} style={style}>
      <Canvas
        frameloop={highQuality ? "always" : "never"}
        dpr={highQuality ? 1 : 0.75}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ fov: 58, position: [0, 0, 9], near: 0.1, far: 100 }}
      >
        <Field
          background={background}
          particleColor={particleColor}
          accentColor={accentColor}
          count={renderCount}
          mood={mood}
          caX={caX}
          caY={caY}
          grain={grain}
          grid={grid}
          usePost={highQuality && postFx}
        />
      </Canvas>
    </AbsoluteFill>
  );
};
