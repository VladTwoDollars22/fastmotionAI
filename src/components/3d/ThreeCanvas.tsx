import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import type { CSSProperties, FC, ReactNode } from "react";
import { Component, Suspense, useEffect, useMemo } from "react";
import {
  AbsoluteFill,
  getRemotionEnvironment,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { PerspectiveCamera } from "three";
import { floatOffset } from "../../utils/kinetics";

export type CanvasQuality = "auto" | "preview" | "high";

const FrameRenderer: FC<{ frame: number }> = ({ frame }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    gl.render(scene, camera);
  }, [frame, gl, scene, camera]);
  return null;
};

interface CameraRigProps {
  basePosition: [number, number, number];
  baseFov: number;
  fovPunch: number;
  dolly: number;
  rollDeg: number;
}

/**
 * Frame-driven R3F camera choreography: fov zoom-punch, position dolly, drift,
 * and a small roll. Runs before <FrameRenderer/> so the explicit render uses the
 * updated projection.
 */
const CameraRig: FC<CameraRigProps> = ({
  basePosition,
  baseFov,
  fovPunch,
  dolly,
  rollDeg,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    const time = frame / fps;
    const drift = floatOffset(frame, "camera-rig", 0.12, 0.1, 0.4);
    const zoom = 0.5 + 0.5 * Math.sin(time * 0.6);
    cam.fov = baseFov - fovPunch * zoom;
    cam.position.set(
      basePosition[0] + drift.x,
      basePosition[1] + drift.y,
      basePosition[2] + dolly * Math.sin(time * 0.45),
    );
    cam.lookAt(0, 0, 0);
    cam.rotation.z = (rollDeg * Math.sin(time * 0.3) * Math.PI) / 180;
    cam.updateProjectionMatrix();
  }, [camera, frame, fps, basePosition, baseFov, fovPunch, dolly, rollDeg]);

  return null;
};

const StudyLights: FC = () => (
  <>
    <ambientLight intensity={0.5} />
    <hemisphereLight args={[0xffffff, 0x141433, 0.7]} />
    <directionalLight position={[5, 8, 5]} intensity={1.5} color="#ffffff" />
  </>
);

interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

/** Deterministic DOM fallback so a failed 3D subtree never yields a blank frame. */
class SceneErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface ThreeCanvasProps {
  children?: ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  enableOrbitControls?: boolean;
  /** Enable frame-driven fov/position/roll camera choreography (default true). */
  cameraAnimation?: boolean;
  fovPunch?: number;
  dolly?: number;
  rollDeg?: number;
  /** Solid color painted if the 3D subtree throws. */
  fallbackColor?: string;
  /** "auto" (default) = full quality while rendering, light during Studio preview. */
  quality?: CanvasQuality;
  className?: string;
  style?: CSSProperties;
}

export const ThreeCanvas: FC<ThreeCanvasProps> = ({
  children,
  cameraPosition = [0, 0, 6],
  fov = 35,
  enableOrbitControls = false,
  cameraAnimation = true,
  fovPunch = 5,
  dolly = 0.6,
  rollDeg = 0.6,
  fallbackColor = "#05060e",
  quality = "auto",
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const { isRendering } = getRemotionEnvironment();
  const highQuality = quality === "high" || (quality === "auto" && isRendering);
  const camX = cameraPosition[0];
  const camY = cameraPosition[1];
  const camZ = cameraPosition[2];
  const basePosition = useMemo<[number, number, number]>(
    () => [camX, camY, camZ],
    [camX, camY, camZ],
  );

  return (
    <AbsoluteFill className={className} style={style}>
      <SceneErrorBoundary
        fallback={<AbsoluteFill style={{ backgroundColor: fallbackColor }} />}
      >
        <Canvas
          frameloop="never"
          dpr={highQuality ? [1, 2] : 1}
          gl={{
            antialias: highQuality,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ fov, position: basePosition, near: 0.1, far: 100 }}
        >
          <StudyLights />
          {cameraAnimation ? (
            <CameraRig
              basePosition={basePosition}
              baseFov={fov}
              fovPunch={fovPunch}
              dolly={dolly}
              rollDeg={rollDeg}
            />
          ) : null}
          <FrameRenderer frame={frame} />
          <Suspense fallback={null}>{children}</Suspense>
          {enableOrbitControls ? <OrbitControls makeDefault /> : null}
        </Canvas>
      </SceneErrorBoundary>
    </AbsoluteFill>
  );
};
