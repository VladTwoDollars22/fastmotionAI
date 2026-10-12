import type { FC } from "react";

export interface AnimatedCursorProps {
  x: number;
  y: number;
  /** 0..1 press depth (scales the pointer down slightly). */
  pressed?: number;
  fill?: string;
  outline?: string;
  scale?: number;
  opacity?: number;
}

/** Classic arrow pointer positioned by its hotspot (tip) at `x`,`y`. */
export const AnimatedCursor: FC<AnimatedCursorProps> = ({
  x,
  y,
  pressed = 0,
  fill = "#0F172A",
  outline = "#FFFFFF",
  scale = 1,
  opacity = 1,
}) => {
  const s = scale * (1 - 0.14 * pressed);
  return (
    <svg
      width={44}
      height={52}
      viewBox="0 0 22 26"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-3px, -2px) scale(${s}) rotate(${-4 * pressed}deg)`,
        transformOrigin: "3px 2px",
        opacity,
        overflow: "visible",
        filter: "drop-shadow(0 6px 8px rgba(15,23,42,0.28))",
      }}
    >
      <path
        d="M2 1.5 L2 20.5 L7.1 15.7 L10.6 23.6 L14.1 22.1 L10.7 14.4 L17.6 14.2 Z"
        fill={fill}
        stroke={outline}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
};

export interface ClickRippleProps {
  x: number;
  y: number;
  /** 0..1 lifetime of the ripple; nothing renders outside (0, 1). */
  progress: number;
  color: string;
  radius?: number;
  rings?: number;
}

/** Expanding concentric click rings — a tactile micro-interaction. */
export const ClickRipple: FC<ClickRippleProps> = ({
  x,
  y,
  progress,
  color,
  radius = 90,
  rings = 2,
}) => {
  if (progress <= 0 || progress >= 1) return null;
  return (
    <>
      {Array.from({ length: rings }, (_, i) => {
        const local = Math.min(1, Math.max(0, progress * (1 + i * 0.35) - i * 0.18));
        if (local <= 0) return null;
        const eased = 1 - Math.pow(1 - local, 3);
        const r = radius * eased;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `${Math.max(1, 5 * (1 - local))}px solid ${color}`,
              background: i === 0 ? `${color}22` : "transparent",
              opacity: 1 - local,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};
