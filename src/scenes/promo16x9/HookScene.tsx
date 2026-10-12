import { noise2D } from "@remotion/noise";
import { TriangleAlert } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../../components/ui/BrowserFrame";
import { KineticText } from "../../components/ui/KineticText";
import { ParticleBurst } from "../../components/ui/ParticleBurst";
import { dampedImpulse } from "../../utils/kinetics";
import { PlaySfx } from "../../utils/audioLibrary";
import { mixHex, progressBetween, withAlpha, type PromoSceneProps } from "./brief";
import { HOOK_T, TRANSITION_FRAMES, beatClock } from "./timeline";

const BROWSER = { left: 130, top: 236, width: 860, height: 600 };
const SPINNER = { x: 430, y: 250, size: 132 };

/**
 * Stuttering spinner angle: each 8-frame segment spends most of its time stuck
 * near the ends of an ease-in-out curve, so the rotation reads as "lagging"
 * while the render itself stays a perfectly smooth 30 FPS.
 */
const laggyAngle = (frame: number): number => {
  const segment = 8;
  const step = Math.floor(frame / segment);
  const local = (frame % segment) / segment;
  const eased = local < 0.5 ? 16 * Math.pow(local, 5) : 1 - Math.pow(-2 * local + 2, 5) / 2;
  const stall = random(`stall-${step}`) < 0.3 ? 0.25 : 1;
  return step * 62 + eased * 62 * stall;
};

export const HookScene: FC<PromoSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = beatClock(beat, HOOK_T.nominal);
  const { palette, springs, fontFamily, monoFamily } = brief;
  const { scene } = beat;

  const glitchAt = at(HOOK_T.glitch);
  const glitchLen = Math.max(6, at(HOOK_T.glitchLen));
  const glitched = frame >= glitchAt;
  const sinceGlitch = Math.max(0, frame - glitchAt);

  const enter = spring({ frame, fps, config: springs.settle });
  const snap = spring({ frame: sinceGlitch, fps, config: springs.accent });
  const glitch = glitched ? dampedImpulse(sinceGlitch, glitchLen) : 0;

  // Lag timer: crawls toward the headline's N seconds, decelerating as it stalls.
  const lagT = progressBetween(frame, 0, glitchAt);
  const seconds = brief.lagSeconds * (1 - Math.pow(1 - lagT, 1.35));
  const danger = glitched ? 1 : Math.pow(lagT, 3);
  const timerColor = mixHex(palette.muted, palette.danger, danger);

  // Page-load bar: quick start, then a stalled crawl (classic slow-site feel).
  const loadBar = glitched
    ? 0.36
    : 0.04 + 0.2 * (1 - Math.pow(1 - Math.min(1, frame / 18), 2)) + 0.12 * lagT;

  // Camera-stable composition: no drift, no time-based tilt.
  const tilt = 9;

  const shimmerX = ((frame * 14) % 1400) - 400;
  const spinnerScale = glitched ? Math.max(0, 1 - snap * 1.4) : 1;
  const warningScale = glitched ? snap : 0;
  const alarmPulse = glitched ? 0.5 + 0.5 * Math.sin((sinceGlitch / fps) * Math.PI * 3) : 0;

  const sliceOffsets = Array.from({ length: 6 }, (_, i) => ({
    top: random(`slice-top-${i}-${Math.floor(frame / 2)}`) * BROWSER.height,
    height: 10 + random(`slice-h-${i}-${Math.floor(frame / 2)}`) * 42,
    dx: noise2D(`slice-${i}`, frame * 0.35, i) * 60 * glitch,
  }));

  const headlinePunch = 1 + 0.045 * (glitched ? dampedImpulse(sinceGlitch, 18) : 0);
  const underline = glitched ? snap : 0;

  const timerText = `${seconds.toFixed(1).replace(".", ",")} ${brief.secondsUnit}`;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* Midground hero: the lagging browser. */}
      <div
        style={{
          position: "absolute",
          left: BROWSER.left,
          top: BROWSER.top,
          transform: `translate(${(1 - enter) * -120}px, ${(1 - enter) * 60}px) perspective(1600px) rotateY(${tilt}deg) rotateX(3deg) scale(${0.9 + 0.1 * enter})`,
          opacity: enter,
        }}
      >
        {glitch > 0.02 ? (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 22,
                border: `3px solid ${withAlpha(palette.danger, 0.75)}`,
                transform: `translate(${-14 * glitch}px, ${3 * glitch}px)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 22,
                border: `3px solid ${withAlpha(palette.primary, 0.6)}`,
                transform: `translate(${14 * glitch}px, ${-3 * glitch}px)`,
              }}
            />
          </>
        ) : null}
        <BrowserFrame
          width={BROWSER.width}
          height={BROWSER.height}
          progress={loadBar}
          progressColor={glitched ? palette.danger : palette.muted}
          borderColor={glitched ? withAlpha(palette.danger, 0.5 + 0.4 * alarmPulse) : undefined}
          fontFamily={fontFamily}
          addon={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 10,
                background: withAlpha(timerColor.startsWith("#") ? timerColor : palette.danger, 0.1),
                color: timerColor,
                fontFamily: monoFamily,
                fontSize: 20,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                transform: `scale(${1 + 0.12 * (glitched ? dampedImpulse(sinceGlitch, 14) : 0)})`,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 9,
                  background: timerColor,
                  opacity: 0.4 + 0.6 * (glitched ? alarmPulse : 0.5 + 0.5 * Math.sin(frame / 3)),
                }}
              />
              {timerText}
            </div>
          }
        >
          {/* Skeleton page with shimmer — it never finishes loading. */}
          <div style={{ position: "absolute", inset: 0, padding: "36px 44px" }}>
            {[
              { w: "58%", h: 34, mt: 0 },
              { w: "82%", h: 14, mt: 22 },
              { w: "70%", h: 14, mt: 12 },
            ].map((bar, i) => (
              <div
                key={i}
                style={{
                  width: bar.w,
                  height: bar.h,
                  marginTop: bar.mt,
                  borderRadius: 8,
                  background: `linear-gradient(90deg, #E2E8F0 0%, #F1F5F9 50%, #E2E8F0 100%)`,
                  backgroundSize: "400px 100%",
                  backgroundPosition: `${shimmerX}px 0`,
                }}
              />
            ))}
            <div style={{ display: "flex", gap: 22, marginTop: 250 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 120,
                    borderRadius: 16,
                    background: `linear-gradient(90deg, #EEF2F7 0%, #F8FAFC 50%, #EEF2F7 100%)`,
                    backgroundSize: "400px 100%",
                    backgroundPosition: `${shimmerX - i * 120}px 0`,
                  }}
                />
              ))}
            </div>
          </div>

          {glitched ? (
            <AbsoluteFill
              style={{ background: withAlpha(palette.danger, 0.05 + 0.05 * alarmPulse) }}
            />
          ) : null}

          {/* Lagging spinner → snaps into the crimson warning. */}
          <div
            style={{
              position: "absolute",
              left: SPINNER.x - SPINNER.size / 2,
              top: SPINNER.y - SPINNER.size / 2,
              width: SPINNER.size,
              height: SPINNER.size,
              transform: `rotate(${laggyAngle(frame)}deg) scale(${spinnerScale})`,
            }}
          >
            <svg width={SPINNER.size} height={SPINNER.size} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="9" fill="none" />
              <path
                d="M50 10 A40 40 0 0 1 90 50"
                stroke={mixHex(palette.primary, palette.danger, danger)}
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {glitched ? (
            <div
              style={{
                position: "absolute",
                left: SPINNER.x - 90,
                top: SPINNER.y - 90,
                width: 180,
                height: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {[0, 1].map((ring) => {
                const p = ((sinceGlitch + ring * 12) % 24) / 24;
                return (
                  <div
                    key={ring}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: `3px solid ${palette.danger}`,
                      transform: `scale(${0.6 + p * 0.8})`,
                      opacity: (1 - p) * 0.6 * warningScale,
                    }}
                  />
                );
              })}
              <div
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: "50%",
                  background: palette.danger,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${warningScale * (1 + 0.05 * alarmPulse)})`,
                  boxShadow: `0 18px 44px -10px ${withAlpha(palette.danger, 0.75)}, 0 0 ${30 + 30 * alarmPulse}px ${withAlpha(palette.danger, 0.45)}`,
                }}
              >
                <TriangleAlert size={66} color="#FFFFFF" strokeWidth={2.4} />
              </div>
            </div>
          ) : null}

          <svg
            width={BROWSER.width}
            height={BROWSER.height}
            style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
          >
            <ParticleBurst
              x={SPINNER.x}
              y={SPINNER.y}
              delay={glitchAt}
              durationInFrames={26}
              count={30}
              spread={300}
              color={palette.danger}
              color2={palette.text}
              lineLength={30}
              seed={11}
              blend="normal"
            />
          </svg>
        </BrowserFrame>

        {/* Glitch slices: horizontal displacement bands (cheap, filter-free). */}
        {glitch > 0.02
          ? sliceOffsets.map((slice, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  width: BROWSER.width,
                  top: slice.top,
                  height: slice.height,
                  transform: `translateX(${slice.dx}px)`,
                  background:
                    i % 2 === 0
                      ? withAlpha(palette.danger, 0.22 * glitch)
                      : withAlpha(palette.primary, 0.14 * glitch),
                  mixBlendMode: "multiply",
                }}
              />
            ))
          : null}
      </div>

      {/* Copy column (right third). */}
      <div
        style={{
          position: "absolute",
          left: 1080,
          top: 300,
          width: 730,
          transform: `scale(${headlinePunch})`,
          transformOrigin: "0% 50%",
        }}
      >
        <KineticText
          text={scene.headline}
          mode="word"
          entry="up"
          delay={at(HOOK_T.headline)}
          stagger={4}
          damping={springs.entrance.damping}
          stiffness={springs.entrance.stiffness}
          mass={springs.entrance.mass}
          distance={70}
          motionBlur={8}
          ambient={0.012}
          seed="hook-headline"
          style={{
            color: palette.text,
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: -1.5,
            justifyContent: "flex-start",
          }}
        />
        <div
          style={{
            marginTop: 26,
            height: 9,
            width: 340 * underline,
            borderRadius: 9,
            background: `linear-gradient(90deg, ${palette.danger}, ${withAlpha(palette.danger, 0.2)})`,
            boxShadow: `0 6px 22px ${withAlpha(palette.danger, 0.5)}`,
          }}
        />
        {scene.body ? (
          <KineticText
            text={scene.body}
            mode="word"
            entry="up"
            delay={at(HOOK_T.body)}
            stagger={2}
            damping={springs.settle.damping}
            stiffness={springs.settle.stiffness}
            mass={springs.settle.mass}
            distance={24}
            ambient={0.006}
            seed="hook-body"
            style={{
              marginTop: 30,
              color: palette.muted,
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.35,
              justifyContent: "flex-start",
            }}
          />
        ) : null}
      </div>

      {/* SFX: error glitch at the warning burst + whoosh on the swipe out. */}
      <PlaySfx id="glitch" frame={glitchAt} volume={0.9} />
      <PlaySfx
        id="whoosh"
        frame={Math.max(0, beat.durationInFrames - TRANSITION_FRAMES)}
        volume={0.7}
        pitch={-2}
      />
    </AbsoluteFill>
  );
};
