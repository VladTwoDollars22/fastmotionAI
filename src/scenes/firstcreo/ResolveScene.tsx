import { ArrowRight, CalendarClock, Check, Globe, MousePointerClick } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedCursor, ClickRipple } from "../../components/ui/AnimatedCursor";
import { KineticText } from "../../components/ui/KineticText";
import { ParticleBurst } from "../../components/ui/ParticleBurst";
import { LightSweep, SweepButton } from "../../components/ui/SweepButton";
import { PlaySfx, PlaySfxTrack, type SfxCue } from "../../utils/audioLibrary";
import { dampedImpulse, smoothstep } from "../../utils/kinetics";
import { progressBetween, withAlpha } from "../promo16x9/brief";
import type { FirstCreoSceneProps } from "./brief";
import { RESOLVE_T, beatClock } from "./timeline";

const MODAL = { left: 250, top: 300, width: 780, height: 462 };
const PAD = 54;
const FIELD_H = 76;
const FIELD1_Y = MODAL.top + 152;
const FIELD2_Y = FIELD1_Y + FIELD_H + 24;
const BTN_H = 88;
const BTN_Y = FIELD2_Y + FIELD_H + 28;
const BTN_W = MODAL.width - PAD * 2;
const FIELD_X = MODAL.left + PAD;
const BTN_CX = MODAL.left + MODAL.width / 2;
const BTN_CY = BTN_Y + BTN_H / 2;

const BADGE = { width: 560, height: 268 };
const BADGE_CY = 452;

interface CursorKey {
  f: number;
  x: number;
  y: number;
}

const track = (frame: number, keys: CursorKey[]): { x: number; y: number } => {
  if (frame <= keys[0].f) return { x: keys[0].x, y: keys[0].y };
  for (let i = 1; i < keys.length; i++) {
    if (frame <= keys[i].f) {
      const p = smoothstep(keys[i - 1].f, keys[i].f, frame);
      return {
        x: keys[i - 1].x + (keys[i].x - keys[i - 1].x) * p,
        y: keys[i - 1].y + (keys[i].y - keys[i - 1].y) * p,
      };
    }
  }
  const last = keys[keys.length - 1];
  return { x: last.x, y: last.y };
};

const revealText = (text: string, frame: number, start: number, end: number): string => {
  const p = progressBetween(frame, start, end);
  return text.slice(0, Math.round(text.length * p));
};

/**
 * Scene 4 — Offer & CTA. An interactive audit modal autofills via an animated
 * cursor, the button is clicked with a ripple, then the EDVANO logo is revealed
 * verbatim inside a clean white badge under a light-sweep with a glowing CTA.
 */
export const ResolveScene: FC<FirstCreoSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = beatClock(beat, RESOLVE_T.nominal);
  const { palette, springs, fontFamily } = brief;
  const { scene } = beat;

  const modalAt = at(RESOLVE_T.modal);
  const cursorAt = at(RESOLVE_T.cursorIn);
  const field1At = at(RESOLVE_T.field1);
  const type1 = at(RESOLVE_T.type1);
  const type1End = at(RESOLVE_T.type1End);
  const field2At = at(RESOLVE_T.field2);
  const type2 = at(RESOLVE_T.type2);
  const type2End = at(RESOLVE_T.type2End);
  const btnAt = at(RESOLVE_T.button);
  const pressAt = at(RESOLVE_T.press);
  const successAt = at(RESOLVE_T.success);
  const revealStart = at(RESOLVE_T.revealStart);
  const burstAt = at(RESOLVE_T.burst);
  const revealEnd = at(RESOLVE_T.revealEnd);
  const ctaAt = at(RESOLVE_T.cta);

  const modalIn = spring({ frame: frame - modalAt, fps, config: springs.entrance });
  const modalOpacity = modalIn * (1 - smoothstep(revealStart - 6, revealStart + 14, frame));

  const nameText = brief.brand;
  const siteText = brief.url;
  const typedName = revealText(nameText, frame, type1, type1End);
  const typedSite = revealText(siteText, frame, type2, type2End);

  const cursor = track(frame, [
    { f: cursorAt, x: 1720, y: 960 },
    { f: field1At, x: FIELD_X + 64, y: FIELD1_Y + FIELD_H / 2 },
    { f: field2At, x: FIELD_X + 64, y: FIELD2_Y + FIELD_H / 2 },
    { f: btnAt, x: BTN_CX, y: BTN_CY },
    { f: pressAt + 28, x: BTN_CX + 110, y: BTN_CY - 36 },
  ]);

  const focus1 = 1 - smoothstep(field2At - 6, field2At, frame);
  const focus2 = smoothstep(field2At, field2At + 6, frame) * (1 - smoothstep(btnAt - 6, btnAt, frame));
  const press = dampedImpulse(frame - pressAt, 14);
  const ripple = progressBetween(frame, pressAt, pressAt + 28);
  const success = frame >= successAt;
  const successPop = dampedImpulse(frame - successAt, 22);

  const reveal = progressBetween(frame, revealStart, revealEnd);
  const revealEase = 1 - Math.pow(1 - reveal, 3);
  const logoPop = dampedImpulse(frame - burstAt, 20);
  const heroOpacity = smoothstep(revealStart, revealStart + 14, frame);
  const ctaIn = spring({ frame: frame - ctaAt, fps, config: springs.entrance });
  const glowPulse = 0.6 + 0.4 * Math.sin((frame / fps) * 2.2);

  const typingCues: SfxCue[] = [
    { id: "type_fast_subtle_burst", frame: type1, volume: 0.5 },
    { id: "type_fast_subtle_burst", frame: type2, volume: 0.5, pitch: -2 },
  ];

  const field = (
    label: string,
    value: string,
    top: number,
    focused: number,
    filled: boolean,
  ) => (
    <div
      style={{
        position: "absolute",
        left: PAD,
        top,
        width: BTN_W,
        height: FIELD_H,
        borderRadius: 16,
        background: "#FFFFFF",
        border: `2px solid ${focused > 0.02 ? withAlpha(palette.primary, 0.35 + 0.55 * focused) : withAlpha(palette.secondary, 0.12)}`,
        boxShadow: `0 0 0 ${6 * focused}px ${withAlpha(palette.primary, 0.1 * focused)}`,
        display: "flex",
        alignItems: "center",
        padding: "0 22px",
        fontFamily,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: -13,
          left: 22,
          padding: "2px 10px",
          borderRadius: 8,
          background: "#FFFFFF",
          color: focused > 0.5 ? palette.primary : palette.muted,
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          color: filled ? palette.text : withAlpha(palette.muted, 0.7),
          fontSize: 29,
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <KineticText
        text={scene.headline}
        mode="word"
        entry="up"
        delay={at(RESOLVE_T.headline)}
        stagger={3}
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        distance={54}
        motionBlur={8}
        ambient={0.01}
        sweep={0.2}
        sweepPeriod={44}
        seed="resolve-headline"
        style={{
          position: "absolute",
          top: 84,
          left: 0,
          width: "100%",
          color: palette.text,
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: -1.2,
        }}
      />

      {/* Audit modal (visible until the hero reveal). */}
      <div
        style={{
          position: "absolute",
          left: MODAL.left,
          top: MODAL.top,
          width: MODAL.width,
          height: MODAL.height,
          borderRadius: 28,
          background: "rgba(255,255,255,0.74)",
          backdropFilter: "blur(22px) saturate(1.3)",
          WebkitBackdropFilter: "blur(22px) saturate(1.3)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow: `0 50px 110px -44px ${withAlpha(palette.secondary, 0.5)}, inset 0 1px 0 rgba(255,255,255,0.95)`,
          transform: `translateY(${(1 - modalIn) * 60}px) scale(${0.9 + 0.1 * modalIn})`,
          opacity: modalOpacity,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 34,
            left: PAD,
            right: PAD,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 25, fontWeight: 800, color: palette.text }}>
            {brief.brand} · Аудит
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: withAlpha(palette.primary, 0.1),
              color: palette.primary,
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            <CalendarClock size={20} strokeWidth={2.6} />
            {brief.auditLabel || "15 мин"}
          </span>
        </div>

        {field("Имя", typedName, FIELD1_Y - MODAL.top, focus1, typedName.length > 0)}
        {field("Сайт", typedSite, FIELD2_Y - MODAL.top, focus2, typedSite.length > 0)}

        <div
          style={{
            position: "absolute",
            left: PAD,
            top: BTN_Y - MODAL.top,
            width: BTN_W,
            height: BTN_H,
            borderRadius: BTN_H / 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            background: success
              ? palette.accent
              : `linear-gradient(180deg, ${palette.primary} 0%, ${palette.primary} 70%, rgba(0,0,0,0.14) 145%)`,
            color: "#FFFFFF",
            fontSize: 31,
            fontWeight: 800,
            boxShadow: success
              ? `0 22px 50px -18px ${withAlpha(palette.accent, 0.9)}, 0 0 ${30 + successPop * 40}px ${withAlpha(palette.accent, 0.5)}`
              : `0 22px 50px -18px ${withAlpha(palette.primary, 0.9)}, 0 0 ${24 + press * 30}px ${withAlpha(palette.primary, 0.4)}`,
            transform: `scale(${1 - press * 0.05 + successPop * 0.04})`,
          }}
        >
          {success ? <Check size={32} strokeWidth={3} /> : <MousePointerClick size={30} strokeWidth={2.6} />}
          {success ? "Заявка отправлена" : brief.actionLabel || "Записаться"}
        </div>

        <ClickRipple
          x={BTN_CX - MODAL.left}
          y={BTN_CY - MODAL.top}
          progress={ripple}
          color={palette.primary}
          radius={120}
          rings={3}
        />
      </div>

      <AnimatedCursor
        x={cursor.x}
        y={cursor.y}
        pressed={press}
        fill={palette.secondary}
        outline="#FFFFFF"
        scale={1.15}
        opacity={frame >= cursorAt - 2 ? 1 : 0}
      />

      {/* Hero reveal: logo (verbatim) on a white badge with light-sweep. */}
      <div style={{ opacity: heroOpacity, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 960 - BADGE.width / 2,
            top: BADGE_CY - BADGE.height / 2,
            width: BADGE.width,
            height: BADGE.height,
            borderRadius: 40,
            overflow: "hidden",
            background: "#FFFFFF",
            border: `2px solid ${withAlpha(palette.primary, 0.16)}`,
            boxShadow: `0 50px 90px -34px ${withAlpha(palette.secondary, 0.5)}, 0 0 ${40 + glowPulse * 50}px ${withAlpha(palette.primary, 0.3)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${0.7 + 0.3 * revealEase + 0.05 * logoPop})`,
          }}
        >
          {brief.logoSrc ? (
            <Img
              src={brief.logoSrc}
              style={{ width: BADGE.width * 0.66, height: "auto", objectFit: "contain" }}
            />
          ) : (
            <span style={{ color: palette.primary, fontSize: 84, fontWeight: 900, letterSpacing: 2 }}>
              {brief.brand.toUpperCase()}
            </span>
          )}
          <LightSweep period={52} intensity={0.5} width={30} tint="255,255,255" blend="overlay" />
        </div>

        <svg
          width={BADGE.width}
          height={BADGE.height}
          style={{
            position: "absolute",
            left: 960 - BADGE.width / 2,
            top: BADGE_CY - BADGE.height / 2,
            overflow: "visible",
          }}
        >
          <ParticleBurst
            x={BADGE.width / 2}
            y={BADGE.height / 2}
            delay={burstAt}
            durationInFrames={34}
            count={38}
            spread={420}
            color={palette.primary}
            color2={palette.accent}
            lineLength={32}
            seed={29}
            ring
            blend="multiply"
          />
        </svg>

        <div
          style={{
            position: "absolute",
            top: BADGE_CY + BADGE.height / 2 + 34,
            left: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 26px",
              borderRadius: 999,
              background: withAlpha(palette.primary, 0.1),
              border: `1.5px solid ${withAlpha(palette.primary, 0.28)}`,
              color: palette.primary,
              fontSize: 28,
              fontWeight: 800,
              opacity: smoothstep(burstAt, burstAt + 16, frame),
            }}
          >
            <Globe size={26} strokeWidth={2.6} />
            {brief.url || "edvano.xyz"}
          </div>

          <div
            style={{
              opacity: ctaIn,
              transform: `translateY(${(1 - ctaIn) * 40}px) scale(${1 + 0.04 * logoPop})`,
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
      </div>

      {/* SFX: tactile keystrokes, crisp click, success ding, premium shimmer. */}
      <PlaySfxTrack cues={typingCues} />
      <PlaySfx id="click_tactile_bubble" frame={pressAt} volume={0.85} />
      <PlaySfx id="checkmark_ding_crisp" frame={successAt} volume={0.6} pitch={2} />
      <PlaySfx id="accent_light_shimmer" frame={revealStart} volume={0.6} />
    </AbsoluteFill>
  );
};
