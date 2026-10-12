import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import type { CSSProperties, FC, ReactNode } from "react";
import { useEffect } from "react";
import {
  AbsoluteFill,
  getRemotionEnvironment,
  useCurrentFrame,
} from "remotion";

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

const StudyLights: FC = () => (
  <>
    <ambientLight intensity={0.5} />
    <hemisphereLight args={[0xffffff, 0x141433, 0.7]} />
    <directionalLight position={[5, 8, 5]} intensity={1.5} color="#ffffff" />
  </>
);

export interface ThreeCanvasProps {
  children?: ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  enableOrbitControls?: boolean;
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
  quality = "auto",
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const { isRendering } = getRemotionEnvironment();
  const highQuality = quality === "high" || (quality === "auto" && isRendering);

  return (
    <AbsoluteFill className={className} style={style}>
      <Canvas
        frameloop="never"
        dpr={highQuality ? [1, 2] : 1}
        gl={{
          antialias: highQuality,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ fov, position: cameraPosition, near: 0.1, far: 100 }}
      >
        <StudyLights />
        <FrameRenderer frame={frame} />
        {children}
        {enableOrbitControls ? <OrbitControls makeDefault /> : null}
      </Canvas>
    </AbsoluteFill>
  );
};
