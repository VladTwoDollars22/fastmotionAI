import type { FC } from "react";

export interface SegmentedPillsProps {
  items: string[];
  /** Highlight position in item units; fractional values slide between pills. */
  active: number;
  /** Index whose label renders in the active colour. */
  activeIndex: number;
  pillWidth?: number;
  height?: number;
  trackColor?: string;
  highlightColor?: string;
  activeTextColor?: string;
  textColor?: string;
  fontFamily?: string;
  /** Horizontal stretch of the highlight (1 = rest) for squash-and-stretch. */
  stretch?: number;
}

/** iOS-style segmented toggle whose highlight is positioned by the caller's spring. */
export const SegmentedPills: FC<SegmentedPillsProps> = ({
  items,
  active,
  activeIndex,
  pillWidth = 96,
  height = 56,
  trackColor = "rgba(15, 23, 42, 0.06)",
  highlightColor = "#4F46E5",
  activeTextColor = "#FFFFFF",
  textColor = "#334155",
  fontFamily,
  stretch = 1,
}) => {
  const pad = 6;
  const innerH = height - pad * 2;
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        padding: pad,
        height,
        borderRadius: height / 2,
        background: trackColor,
        boxShadow: "inset 0 1px 2px rgba(15,23,42,0.08), 0 10px 30px -14px rgba(15,23,42,0.35)",
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: pad,
          left: pad + active * pillWidth,
          width: pillWidth,
          height: innerH,
          borderRadius: innerH / 2,
          background: highlightColor,
          transform: `scaleX(${stretch})`,
          boxShadow: `0 8px 22px -6px ${highlightColor}, inset 0 1px 0 rgba(255,255,255,0.35)`,
        }}
      />
      {items.map((item, index) => (
        <div
          key={item}
          style={{
            position: "relative",
            width: pillWidth,
            height: innerH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: innerH * 0.46,
            fontWeight: 800,
            letterSpacing: 1.5,
            color: index === activeIndex ? activeTextColor : textColor,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};
