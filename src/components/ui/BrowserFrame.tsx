import type { CSSProperties, FC, ReactNode } from "react";

export interface BrowserFrameProps {
  width: number;
  height: number;
  /** Address-bar text; when empty a neutral skeleton bar is drawn instead. */
  url?: string;
  /** 0..1 page-load progress bar under the chrome (hidden when undefined). */
  progress?: number;
  chromeColor?: string;
  surfaceColor?: string;
  borderColor?: string;
  textColor?: string;
  mutedColor?: string;
  progressColor?: string;
  fontFamily?: string;
  /** Extra node rendered at the right of the address bar (badges, timers). */
  addon?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
}

const CHROME_HEIGHT = 58;

/** Minimal, theme-agnostic browser window used to stage UI demos. */
export const BrowserFrame: FC<BrowserFrameProps> = ({
  width,
  height,
  url = "",
  progress,
  chromeColor = "#F1F5F9",
  surfaceColor = "#FFFFFF",
  borderColor = "rgba(15, 23, 42, 0.10)",
  textColor = "#0F172A",
  mutedColor = "#94A3B8",
  progressColor = "#6366F1",
  fontFamily,
  addon,
  children,
  style,
}) => {
  const dots = ["#FF5F57", "#FEBC2E", "#28C840"];
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 22,
        overflow: "hidden",
        background: surfaceColor,
        border: `1.5px solid ${borderColor}`,
        boxShadow:
          "0 40px 80px -30px rgba(15, 23, 42, 0.35), 0 12px 28px -12px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
        fontFamily,
        ...style,
      }}
    >
      <div
        style={{
          height: CHROME_HEIGHT,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 20px",
          background: chromeColor,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {dots.map((dot) => (
            <span
              key={dot}
              style={{ width: 13, height: 13, borderRadius: 99, background: dot }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            height: 34,
            borderRadius: 10,
            background: surfaceColor,
            border: `1px solid ${borderColor}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            overflow: "hidden",
          }}
        >
          <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
            <rect x="1" y="6" width="11" height="8" rx="2" fill={mutedColor} />
            <path d="M3.5 6V4.2a3 3 0 0 1 6 0V6" stroke={mutedColor} strokeWidth="1.6" />
          </svg>
          {url ? (
            <span
              style={{
                color: textColor,
                fontSize: 17,
                fontWeight: 500,
                letterSpacing: 0.2,
                whiteSpace: "nowrap",
              }}
            >
              {url}
            </span>
          ) : (
            <span
              style={{ width: "46%", height: 10, borderRadius: 6, background: `${mutedColor}55` }}
            />
          )}
        </div>
        {addon}
      </div>
      {progress !== undefined ? (
        <div
          style={{
            position: "absolute",
            top: CHROME_HEIGHT - 2,
            left: 0,
            height: 4,
            width: `${Math.min(1, Math.max(0, progress)) * 100}%`,
            background: progressColor,
            boxShadow: `0 0 12px ${progressColor}`,
            borderRadius: "0 4px 4px 0",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          top: CHROME_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const BROWSER_CHROME_HEIGHT = CHROME_HEIGHT;
