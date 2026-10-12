import { RoundedBox } from "@react-three/drei";
import type { FC } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface FloatingCard3DProps {
  position?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  accent?: string;
  radius?: number;
  floatSpeed?: number;
  delay?: number;
}

export const FloatingCard3D: FC<FloatingCard3DProps> = ({
  position = [0, 0, 0],
  size = [2.6, 3.4, 0.18],
  color = "#B9C6FF",
  accent = "#22D3EE",
  radius = 0.18,
  floatSpeed = 1,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const enter = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 200 },
    from: 0,
    to: 1,
  });

  const floatY = Math.sin(time * 1.1 * floatSpeed) * 0.14;
  const rotationY = Math.sin(time * 0.7 * floatSpeed) * 0.22;
  const rotationX = Math.cos(time * 0.5 * floatSpeed) * 0.08;

  return (
    <group
      position={[position[0], position[1] + (1 - enter) * -1.2 + floatY, position[2]]}
      rotation={[rotationX, rotationY, 0]}
      scale={0.85 + 0.15 * enter}
    >
      <RoundedBox args={size} radius={radius} smoothness={6}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.34}
          roughness={0.08}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive={accent}
          emissiveIntensity={0.12}
        />
      </RoundedBox>
      <RoundedBox
        args={[size[0] * 1.03, size[1] * 1.03, size[2] * 0.5]}
        radius={radius * 1.05}
        smoothness={4}
      >
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
