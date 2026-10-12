import { RoundedBox } from "@react-three/drei";
import type { FC } from "react";
import { useMemo } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SpringPhysics } from "../../utils/motionPresets";

export type CardQuality = "auto" | "preview" | "high";

export interface FloatingCard3DProps {
  position?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  accent?: string;
  radius?: number;
  floatSpeed?: number;
  delay?: number;
  physics?: SpringPhysics;
}

export const FloatingCard3D: FC<FloatingCard3DProps> = ({
  position = [0, 0, 0],
  size = [2.6, 3.4, 0.18],
  color = "#B9C6FF",
  accent = "#22D3EE",
  radius = 0.18,
  floatSpeed = 1,
  delay = 0,
  physics,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const enter = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: physics ?? { damping: 200, stiffness: 120, mass: 1 },
    from: 0,
    to: 1,
  });

  const floatY = Math.sin(time * 1.1 * floatSpeed) * 0.14;
  const rotationY = Math.sin(time * 0.7 * floatSpeed) * 0.22;
  const rotationX = Math.cos(time * 0.5 * floatSpeed) * 0.08;

  const [sx, sy, sz] = size;
  const boxArgs = useMemo<[number, number, number]>(
    () => [sx, sy, sz],
    [sx, sy, sz],
  );
  const wireArgs = useMemo<[number, number, number]>(
    () => [sx * 1.03, sy * 1.03, sz * 0.5],
    [sx, sy, sz],
  );

  return (
    <group
      position={[position[0], position[1] + (1 - enter) * -1.2 + floatY, position[2]]}
      rotation={[rotationX, rotationY, 0]}
      scale={0.85 + 0.15 * enter}
    >
      <RoundedBox args={boxArgs} radius={radius} smoothness={6}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.42}
          roughness={0.14}
          metalness={0.05}
          emissive={accent}
          emissiveIntensity={0.16}
        />
      </RoundedBox>
      <RoundedBox args={wireArgs} radius={radius * 1.05} smoothness={4}>
        <meshBasicMaterial
          color={accent}
          wireframe
          transparent
          opacity={0.22}
        />
      </RoundedBox>
    </group>
  );
};
