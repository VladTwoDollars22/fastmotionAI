import { Gauge } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeTyper, type CodeLine } from "../../components/ui/CodeTyper";
import { KineticText } from "../../components/ui/KineticText";
import { RadialGauge } from "../../components/ui/RadialGauge";
import { SegmentedPills } from "../../components/ui/SegmentedPills";
import { dampedImpulse, smoothstep } from "../../utils/kinetics";
import { PlaySfx, PlaySfxTrack, buildRotatedSfxCues } from "../../utils/audioLibrary";
import {
  lerpHsl,
  progressBetween,
  withAlpha,
  type PromoSceneProps,
} from "./brief";
import { SHOWCASE_T, TRANSITION_FRAMES, beatClock } from "./timeline";

const CARD = { left: 1128, top: 208, width: 636, height: 664 };
const GAUGE_SIZE = 400;
const CHIP_TEXT = ["LCP 0.4s", "CLS 0.00", "TTFB 0.1s"];

/**
 * Scene 2 — Solution / Tech stack. A cinematic left-to-right wipe reveals the
 * Next.js 16 story: kinetic headline, language toggle pills, a live code
 * snippet, and a PageSpeed gauge that spins up from a poor red score into a
 * glowing emerald finish while shedding particle sparks.
 */
export const SolutionScene: FC<PromoSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = beatClock(beat, SHOWCASE_T.nominal);
  const { palette, springs, fontFamily, monoFamily } = brief;
  const { scene } = beat;

  const tickStart = at(SHOWCASE_T.gaugeStart);
  const tickEnd = at(SHOWCASE_T.gaugeEnd);
  const raw = progressBetween(frame, tickStart, tickEnd);
  const eased = 1 - Math.pow(1 - raw, 3);
  const value = brief.gaugeFrom + (brief.gaugeTarget - brief.gaugeFrom) * eased;
  const done = smoothstep(tickEnd - 4, tickEnd + 10, frame);
  const scoreColor = lerpHsl(palette.danger, palette.accent, raw);
  const ticking = raw > 0.02 && raw < 0.999;
  const sparks = ticking ? 0.75 + 0.25 * Math.sin(frame * 0.6) : done * 0.45;
  const punch = dampedImpulse(frame - tickEnd, 18);

  // Language pills: index advances one step per authored switch cue, looping.
  const langs = brief.languages.length > 0 ? brief.languages : ["RU", "EN", "UK"];
  const switches = SHOWCASE_T.langSwitch.map((f) => at(f));
  const passed = switches.filter((f) => frame >= f).length;
  const activeIndex = passed % langs.length;
  const activeFrom = passed > 0 ? (activeIndex - 1 + langs.length) % langs.length : 0;
  const lastSwitch = passed > 0 ? switches[passed - 1] : 0;
  const active = spring({
    frame: frame - lastSwitch,
    fps,
    config: springs.accent,
    from: activeFrom,
    to: activeIndex,
  });

  const codeStart = at(SHOWCASE_T.codeStart);
  const chars = Math.max(0, (frame - codeStart) * SHOWCASE_T.codeCharsPerFrame);
  const codeDone = chars > 0;
  const code: CodeLine[] = [
    [
      { text: "export default async function", color: palette.muted },
      { text: " Page", color: palette.primary },
      { text: "() {", color: palette.text },
    ],
    [
      { text: "  const data = await", color: palette.muted },
      { text: " getProducts", color: palette.accent },
      { text: "();", color: palette.text },
    ],
    [
      { text: "  return", color: palette.muted },
      { text: " <Hero", color: palette.primary },
      { text: " lang=", color: palette.text },
      { text: `"${(langs[activeIndex] ?? "RU").toLowerCase()}"`, color: palette.accent },
      { text: " />;", color: palette.text },
    ],
    [{ text: "}", color: palette.text }],
  ];

  const cardEnter = spring({ frame: frame - at(2), fps, config: springs.settle });
  const gaugeCardOpacity = smoothstep(at(2), at(20), frame);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* Left column: headline, body, pills, code. */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 104,
          width: 900,
          transform: `translateX(${(1 - cardEnter) * -60}px)`,
          opacity: cardEnter,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 18px",
            borderRadius: 999,
            background: withAlpha(palette.accent, 0.12),
            color: palette.accent,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 2,
            marginBottom: 26,
          }}
        >
          <Gauge size={22} strokeWidth={2.6} />
          {brief.gaugeLabel || "PageSpeed"}
        </div>
        <KineticText
          text={scene.headline}
          mode="word"
          entry="up"
          delay={at(SHOWCASE_T.rows[0])}
          stagger={3}
          damping={springs.entrance.damping}
          stiffness={springs.entrance.stiffness}
          mass={springs.entrance.mass}
          distance={60}
          motionBlur={8}
          ambient={0.01}
          seed="solution-headline"
          style={{
            color: palette.text,
            fontSize: 70,
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: -1.2,
            justifyContent: "flex-start",
          }}
        />
        <KineticText
          text={scene.body}
          mode="word"
          entry="up"
          delay={at(SHOWCASE_T.rows[1])}
          stagger={1.5}
          damping={springs.settle.damping}
          stiffness={springs.settle.stiffness}
          mass={springs.settle.mass}
          distance={26}
          ambient={0.006}
          seed="solution-body"
          style={{
            marginTop: 26,
            color: palette.muted,
            fontSize: 31,
            fontWeight: 500,
            lineHeight: 1.4,
            maxWidth: 840,
            justifyContent: "flex-start",
          }}
        />

        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 24 }}>
          <SegmentedPills
            items={langs}
            active={active}
            activeIndex={activeIndex}
            pillWidth={104}
            height={62}
            trackColor={withAlpha(palette.secondary, 0.06)}
            highlightColor={palette.primary}
            textColor={palette.secondary}
            fontFamily={fontFamily}
          />
          <span style={{ color: palette.muted, fontSize: 22, fontWeight: 600 }}>
            Мгновенное переключение
          </span>
        </div>

        <div
          style={{
            marginTop: 40,
            width: 860,
            borderRadius: 22,
            background: palette.card,
            border: `1.5px solid ${withAlpha(palette.secondary, 0.1)}`,
            boxShadow: "0 30px 60px -30px rgba(15,23,42,0.35)",
            padding: "26px 34px",
            opacity: codeDone ? 1 : 0,
            transform: `translateY(${codeDone ? 0 : 18}px)`,
          }}
        >
          <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((dot) => (
              <span
                key={dot}
                style={{ width: 12, height: 12, borderRadius: 99, background: dot }}
              />
            ))}
          </div>
          <CodeTyper
            lines={code}
            chars={chars}
            caretOn={Math.floor(frame / 15) % 2 === 0}
            caretColor={palette.primary}
            fontFamily={monoFamily}
            fontSize={24}
            lineHeight={1.7}
            gutterColor={withAlpha(palette.muted, 0.5)}
          />
        </div>
      </div>

      {/* Right column: PageSpeed gauge on a floating card. */}
      <div
        style={{
          position: "absolute",
          left: CARD.left,
          top: CARD.top,
          width: CARD.width,
          height: CARD.height,
          borderRadius: 32,
          background: palette.card,
          border: `1.5px solid ${withAlpha(palette.secondary, 0.08)}`,
          boxShadow: `0 40px 90px -40px ${withAlpha(palette.secondary, 0.55)}, 0 0 ${40 + punch * 90}px ${withAlpha(scoreColor === palette.danger ? palette.danger : palette.accent, 0.28)}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          opacity: gaugeCardOpacity,
          transform: `translateY(${(1 - gaugeCardOpacity) * 40}px) scale(${1 + 0.02 * punch})`,
        }}
      >
        <RadialGauge
          value={value}
          max={100}
          size={GAUGE_SIZE}
          stroke={28}
          color={scoreColor}
          trackColor={withAlpha(palette.secondary, 0.08)}
          textColor={palette.text}
          mutedColor={palette.muted}
          label={brief.gaugeLabel || "PageSpeed"}
          fontFamily={fontFamily}
          sparks={sparks * 0.9}
          sparkColor={scoreColor}
          glow={done}
          valueScale={1 + 0.12 * punch}
          seed={19}
        />
        <div style={{ display: "flex", gap: 12 }}>
          {CHIP_TEXT.map((chip, i) => {
            const on = smoothstep(tickStart + 10 + i * 8, tickStart + 26 + i * 8, frame);
            return (
              <span
                key={chip}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: withAlpha(palette.secondary, 0.05),
                  color: palette.secondary,
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: monoFamily,
                  opacity: on * 0.9,
                  transform: `translateY(${(1 - on) * 12}px)`,
                }}
              >
                {chip}
              </span>
            );
          })}
        </div>
      </div>

      {/* SFX: rhythmic gauge ticking + snappy language-tab clicks + score chime. */}
      <PlaySfx
        id="ticker"
        frame={tickStart}
        durationInFrames={Math.max(1, tickEnd - tickStart)}
        loop
        volume={0.5}
        pitch={-1}
      />
      <PlaySfxTrack
        cues={buildRotatedSfxCues("clicks", switches, { volume: 0.6, pitch: 4 })}
      />
      <PlaySfx id="chime" frame={tickEnd} volume={0.5} pitch={2} />
      <PlaySfx
        id="whoosh"
        frame={Math.max(0, beat.durationInFrames - TRANSITION_FRAMES)}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};
