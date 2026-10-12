import { ArrowRight, Globe } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/ui/KineticText";
import { ParticleBurst } from "../../components/ui/ParticleBurst";
import { LightSweep, SweepButton } from "../../components/ui/SweepButton";
import { dampedImpulse, smoothstep } from "../../utils/kinetics";
import { PlaySfx } from "../../utils/audioLibrary";
import { progressBetween, withAlpha, type PromoSceneProps } from "./brief";
import { CTA_T, beatClock } from "./timeline";

const BADGE = { width: 560, height: 268 };
const BADGE_CX = 960;
const BADGE_CY = 286;

/**
 * Scene 4 — Call to action. The EDVANO mark lands on a clean white badge with a
 * light sweep, a particle burst sells the reveal, and a primary indigo button
 * carries a continuous moving highlight under the brand headline and URL.
 */
export const CtaScene: FC<PromoSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = beatClock(beat, CTA_T.nominal);
  const { palette, springs, fontFamily } = brief;
  const { scene } = beat;

  const revealStart = at(CTA_T.revealStart);
  const revealEnd = at(CTA_T.revealEnd);
  const reveal = progressBetween(frame, revealStart, revealEnd);
  const revealEase = 1 - Math.pow(1 - reveal, 3);
  const pop = dampedImpulse(frame - revealEnd, 20);
  const badgeIn = spring({ frame: frame - at(CTA_T.badge), fps, config: springs.entrance });
  const logoScale = 0.4 + 0.6 * revealEase + 0.06 * pop;
  const logoRotate = (1 - revealEase) * -12;
  const glowPulse = 0.6 + 0.4 * Math.sin((frame / fps) * 2.2);

  const burstAt = at(CTA_T.burst);
  const buttonIn = spring({ frame: frame - at(CTA_T.button), fps, config: springs.entrance });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* Radial hero glow behind the badge. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(38% 42% at 50% 30%, ${withAlpha(palette.primary, 0.16 + 0.12 * revealEase)} 0%, ${withAlpha(palette.primary, 0)} 68%)`,
        }}
      />

      {/* Hero logo badge. */}
      <div
        style={{
          position: "absolute",
          left: BADGE_CX - BADGE.width / 2,
          top: BADGE_CY - BADGE.height / 2,
          width: BADGE.width,
          height: BADGE.height,
          borderRadius: 40,
          overflow: "hidden",
          background: "#FFFFFF",
          border: `2px solid ${withAlpha(palette.primary, 0.18)}`,
          boxShadow: `0 50px 90px -34px ${withAlpha(palette.secondary, 0.5)}, 0 0 ${40 + glowPulse * 50}px ${withAlpha(palette.primary, 0.35)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${0.92 + 0.08 * badgeIn})`,
          opacity: badgeIn,
        }}
      >
        <div
          style={{
            transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
            opacity: Math.min(1, badgeIn * (0.3 + revealEase)),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {brief.logoSrc ? (
            <Img
              src={brief.logoSrc}
              style={{ width: BADGE.width * 0.76, height: "auto", objectFit: "contain" }}
            />
          ) : (
            <span style={{ color: palette.primary, fontSize: 84, fontWeight: 900, letterSpacing: 2 }}>
              {brief.brand.toUpperCase()}
            </span>
          )}
        </div>
        <LightSweep period={52} intensity={0.5} width={30} tint="255,255,255" blend="overlay" />
        <svg
          style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
          width={BADGE.width}
          height={BADGE.height}
        >
          <ParticleBurst
            x={BADGE.width / 2}
            y={BADGE.height / 2}
            delay={burstAt}
            durationInFrames={34}
            count={40}
            spread={420}
            color={palette.primary}
            color2={palette.accent}
            lineLength={34}
            seed={23}
            ring
            blend="multiply"
          />
        </svg>
      </div>

      {/* Headline, subtext, URL, CTA. */}
      <div
        style={{
          position: "absolute",
          top: 466,
          left: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        <KineticText
          text={scene.headline}
          mode="letter"
          entry="scale"
          delay={at(CTA_T.revealStart)}
          stagger={2.4}
          damping={springs.entrance.damping}
          stiffness={springs.entrance.stiffness}
          mass={springs.entrance.mass}
          distance={20}
          rotate={8}
          motionBlur={9}
          ambient={0.012}
          sweep={0.95}
          sweepPeriod={42}
          seed="cta-headline"
          style={{
            color: palette.secondary,
            fontSize: 128,
            fontWeight: 900,
            letterSpacing: 6,
          }}
        />

        <KineticText
          text={scene.body}
          mode="word"
          entry="up"
          delay={at(CTA_T.body)}
          stagger={1.6}
          damping={springs.settle.damping}
          stiffness={springs.settle.stiffness}
          mass={springs.settle.mass}
          distance={22}
          sweep={0}
          seed="cta-body"
          style={{ color: palette.muted, fontSize: 32, fontWeight: 500 }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 28px",
            borderRadius: 999,
            background: withAlpha(palette.primary, 0.1),
            border: `1.5px solid ${withAlpha(palette.primary, 0.28)}`,
            color: palette.primary,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: 1,
            opacity: smoothstep(at(CTA_T.body) + 6, at(CTA_T.body) + 24, frame),
            transform: `translateY(${(1 - smoothstep(at(CTA_T.body) + 6, at(CTA_T.body) + 24, frame)) * 14}px)`,
          }}
        >
          <Globe size={28} strokeWidth={2.6} />
          {brief.url || "edvano.xyz"}
        </div>

        <div
          style={{
            marginTop: 12,
            opacity: buttonIn,
            transform: `translateY(${(1 - buttonIn) * 40}px) scale(${1 + 0.04 * pop})`,
          }}
        >
          <SweepButton
            label={`Перейти на ${brief.url || "edvano.xyz"}`}
            trailingIcon={<ArrowRight size={34} strokeWidth={3} />}
            color={palette.primary}
            height={104}
            fontSize={36}
            glow={0.7 + 0.2 * glowPulse}
            sweepPeriod={46}
            fontFamily={fontFamily}
          />
        </div>
      </div>

      {/* SFX: energy sweep on the logo reveal + shimmer chimes on the button sweep. */}
      <PlaySfx id="whoosh" frame={revealStart} volume={0.8} pitch={3} />
      <PlaySfx id="chime" frame={burstAt} volume={0.5} pitch={5} />
      <PlaySfx
        id="chime"
        frame={at(CTA_T.button)}
        extraFrames={[at(CTA_T.button) + 46, at(CTA_T.button) + 92]}
        volume={0.42}
        pitch={7}
      />
    </AbsoluteFill>
  );
};
