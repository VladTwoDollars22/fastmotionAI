import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import type { CSSProperties, FC, ReactNode } from "react";
import { useEffect } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

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
    <ambientLight intensity={0.55} />
    <hemisphereLight args={[0xffffff, 0x141433, 0.6]} />
    <directionalLight
      position={[5, 8, 5]}
      intensity={1.4}
      castShadow
      color="#ffffff"
    />
    <directionalLight position={[-6, -2, -4]} intensity={0.5} color="#8ab4ff" />
    <pointLight position={[0, 2, 3]} intensity={12} color="#c7d2ff" />
  </>
);

export interface ThreeCanvasProps {
  children?: ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  enableOrbitControls?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const ThreeCanvas: FC<ThreeCanvasProps> = ({
  children,
  cameraPosition = [0, 0, 6],
  fov = 35,
  enableOrbitControls = false,
  className,
  style,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className={className} style={style}>
      <Canvas
        frameloop="never"
        dpr={[1, 2]}
        gl={{
          antialias: true,
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
