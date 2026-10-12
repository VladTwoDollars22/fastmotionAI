import type { FC } from "react";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { mulberry32 } from "../../utils/prng";

export interface ParticleFieldProps {
  count?: number;
  radius?: number;
  color?: string;
  size?: number;
  speed?: number;
  seed?: number;
  opacity?: number;
}

export const ParticleField: FC<ParticleFieldProps> = ({
  count = 900,
  radius = 13,
  color = "#9DB2FF",
  size = 0.06,
  speed = 1,
  seed = 1,
  opacity = 0.85,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const positions = useMemo(() => {
    const random = mulberry32(seed);
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      array[i * 3] = (random() * 2 - 1) * radius;
      array[i * 3 + 1] = (random() * 2 - 1) * radius * 1.4;
      array[i * 3 + 2] = (random() * 2 - 1) * radius;
    }
    return array;
  }, [count, radius, seed]);

  return (
    <group
      rotation={[0, time * 0.12 * speed, 0]}
      position={[0, Math.sin(time * 0.3) * 0.3, 0]}
    >
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={size}
          color={color}
          transparent
          opacity={opacity}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
