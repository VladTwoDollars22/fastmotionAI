import type { CSSProperties, FC } from "react";

export interface CodeToken {
  text: string;
  color: string;
}

export type CodeLine = CodeToken[];

export interface CodeTyperProps {
  lines: CodeLine[];
  /** Number of characters revealed so far (across all lines). */
  chars: number;
  /** Whether the caret is in its visible blink phase. */
  caretOn?: boolean;
  caretColor?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  gutterColor?: string;
  style?: CSSProperties;
}

/** Syntax-tinted code block revealed character-by-character from a frame-driven count. */
export const CodeTyper: FC<CodeTyperProps> = ({
  lines,
  chars,
  caretOn = true,
  caretColor = "#FFFFFF",
  fontFamily = "Consolas, monospace",
  fontSize = 22,
  lineHeight = 1.6,
  gutterColor = "rgba(148, 163, 184, 0.45)",
  style,
}) => {
  let remaining = Math.max(0, Math.floor(chars));
  let caretPlaced = false;

  return (
    <div style={{ fontFamily, fontSize, lineHeight, whiteSpace: "pre", ...style }}>
      {lines.map((line, li) => {
        const lineLength = line.reduce((sum, token) => sum + token.text.length, 0);
        const visible = Math.min(lineLength, remaining);
        remaining -= visible;
        // Account for the implicit newline so typing pauses between lines.
        if (remaining > 0) remaining -= 1;
        const isCaretLine = !caretPlaced && (visible < lineLength || remaining <= 0);
        if (isCaretLine) caretPlaced = true;

        let budget = visible;
        return (
          <div key={li} style={{ display: "flex" }}>
            <span style={{ width: fontSize * 1.8, color: gutterColor, flexShrink: 0 }}>
              {li + 1}
            </span>
            <span>
              {line.map((token, ti) => {
                if (budget <= 0) return null;
                const shown = token.text.slice(0, budget);
                budget -= shown.length;
                return (
                  <span key={ti} style={{ color: token.color }}>
                    {shown}
                  </span>
                );
              })}
              {isCaretLine ? (
                <span
                  style={{
                    display: "inline-block",
                    width: fontSize * 0.55,
                    height: fontSize * 1.1,
                    marginLeft: 1,
                    verticalAlign: "middle",
                    background: caretColor,
                    opacity: caretOn ? 0.9 : 0,
                  }}
                />
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
};
