import { CalendarClock, Check, MousePointerClick } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AnimatedCursor,
  ClickRipple,
} from "../../components/ui/AnimatedCursor";
import { KineticText } from "../../components/ui/KineticText";
import { ParticleBurst } from "../../components/ui/ParticleBurst";
import { dampedImpulse, smoothstep } from "../../utils/kinetics";
import { progressBetween, withAlpha, type PromoSceneProps } from "./brief";
import { OFFER_T, beatClock } from "./timeline";

const MODAL = { left: 500, top: 322, width: 920, height: 524 };
const PAD = 58;
const FIELD_H = 78;
const FIELD1_Y = MODAL.top + 158;
const FIELD2_Y = FIELD1_Y + FIELD_H + 26;
const BTN_H = 90;
const BTN_Y = FIELD2_Y + FIELD_H + 30;
const BTN_W = MODAL.width - PAD * 2;
const FIELD_X = MODAL.left + PAD;
const FIELD_W = MODAL.width - PAD * 2;
const BTN_CX = MODAL.left + MODAL.width / 2;
const BTN_CY = BTN_Y + BTN_H / 2;

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

const typeReveal = (text: string, frame: number, start: number, end: number): string => {
  const p = progressBetween(frame, start, end);
  return text.slice(0, Math.round(text.length * p));
};

const Field: FC<{
  label: string;
  value: string;
  focused: number;
  filled: boolean;
  palette: PromoSceneProps["brief"]["palette"];
  fontFamily: string;
  top: number;
}> = ({ label, value, focused, filled, palette, fontFamily, top }) => (
  <div
    style={{
      position: "absolute",
      left: PAD,
      top,
      width: FIELD_W,
      height: FIELD_H,
      borderRadius: 16,
      background: "#FFFFFF",
      border: `2px solid ${focused > 0.02 ? withAlpha(palette.primary, 0.35 + 0.55 * focused) : withAlpha(palette.secondary, 0.12)}`,
      boxShadow: `0 0 0 ${6 * focused}px ${withAlpha(palette.primary, 0.1 * focused)}`,
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "0 24px",
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
        fontSize: 30,
        fontWeight: 600,
      }}
    >
      {value}
    </span>
  </div>
);

/**
 * Scene 3 — Free audit offer. A light glassmorphism modal pops in, an animated
 * cursor autofills the two fields (name + site, sourced from the bundle), then
 * presses the primary action with a ripple, a check and a spark burst.
 */
export const OfferScene: FC<PromoSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = beatClock(beat, OFFER_T.nominal);
  const { palette, springs, fontFamily } = brief;
  const { scene } = beat;

  const modalIn = spring({ frame: frame - at(OFFER_T.modal), fps, config: springs.entrance });
  const modalInScale = 0.86 + 0.14 * modalIn;

  const cursorAt = at(OFFER_T.cursorIn);
  const field1At = at(OFFER_T.field1);
  const type1 = at(OFFER_T.type1);
  const type1End = at(OFFER_T.type1End);
  const field2At = at(OFFER_T.field2);
  const type2 = at(OFFER_T.type2);
  const type2End = at(OFFER_T.type2End);
  const btnAt = at(OFFER_T.button);
  const pressAt = at(OFFER_T.press);
  const successAt = at(OFFER_T.success);

  const nameText = brief.brand;
  const siteText = brief.url;
  const typedName = typeReveal(nameText, frame, type1, type1End);
  const typedSite = typeReveal(siteText, frame, type2, type2End);

  const cursor = track(frame, [
    { f: cursorAt, x: 1720, y: 980 },
    { f: field1At, x: FIELD_X + 66, y: FIELD1_Y + FIELD_H / 2 },
    { f: field2At, x: FIELD_X + 66, y: FIELD2_Y + FIELD_H / 2 },
    { f: btnAt, x: BTN_CX, y: BTN_CY },
    { f: pressAt + 30, x: BTN_CX + 120, y: BTN_CY - 40 },
  ]);

  const focus1 = 1 - smoothstep(field2At - 6, field2At, frame);
  const focus2 =
    smoothstep(field2At, field2At + 6, frame) * (1 - smoothstep(btnAt - 6, btnAt, frame));
  const press = dampedImpulse(frame - pressAt, 14);
  const ripple = progressBetween(frame, pressAt, pressAt + 28);
  const success = frame >= successAt;
  const successPop = dampedImpulse(frame - successAt, 22);
  const cursorVisible = frame >= cursorAt - 2;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* Headline + body above the modal. */}
      <KineticText
        text={scene.headline}
        mode="word"
        entry="up"
        delay={at(OFFER_T.headline)}
        stagger={3}
        damping={springs.entrance.damping}
        stiffness={springs.entrance.stiffness}
        mass={springs.entrance.mass}
        distance={54}
        motionBlur={8}
        ambient={0.01}
        sweep={0.85}
        sweepPeriod={46}
        seed="offer-headline"
        style={{
          position: "absolute",
          top: 118,
          left: 0,
          width: "100%",
          color: palette.text,
          fontSize: 74,
          fontWeight: 800,
          letterSpacing: -1.2,
        }}
      />
      <KineticText
        text={scene.body}
        mode="word"
        entry="up"
        delay={at(OFFER_T.body)}
        stagger={1.5}
        damping={springs.settle.damping}
        stiffness={springs.settle.stiffness}
        mass={springs.settle.mass}
        distance={22}
        sweep={0}
        seed="offer-body"
        style={{
          position: "absolute",
          top: 224,
          left: 0,
          width: "100%",
          color: palette.muted,
          fontSize: 31,
          fontWeight: 500,
        }}
      />

      {/* Glass modal. */}
      <div
        style={{
          position: "absolute",
          left: MODAL.left,
          top: MODAL.top,
          width: MODAL.width,
          height: MODAL.height,
          borderRadius: 30,
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(22px) saturate(1.3)",
          WebkitBackdropFilter: "blur(22px) saturate(1.3)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow:
            "0 50px 110px -40px rgba(15,23,42,0.45), inset 0 1px 0 rgba(255,255,255,0.95)",
          transform: `translateY(${(1 - modalIn) * 60}px) scale(${modalInScale})`,
          opacity: modalIn,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 36,
            left: PAD,
            right: PAD,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 800, color: palette.text }}>
            {brief.brand} · Заявка
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
            {brief.offerDurationLabel || "15 мин"}
          </span>
        </div>

        <Field
          label="Имя"
          value={typedName}
          focused={focus1}
          filled={typedName.length > 0}
          palette={palette}
          fontFamily={fontFamily}
          top={FIELD1_Y - MODAL.top}
        />
        <Field
          label="Сайт"
          value={typedSite}
          focused={focus2}
          filled={typedSite.length > 0}
          palette={palette}
          fontFamily={fontFamily}
          top={FIELD2_Y - MODAL.top}
        />

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
            fontSize: 32,
            fontWeight: 800,
            boxShadow: success
              ? `0 22px 50px -18px ${withAlpha(palette.accent, 0.9)}, 0 0 ${30 + successPop * 40}px ${withAlpha(palette.accent, 0.5)}`
              : `0 22px 50px -18px ${withAlpha(palette.primary, 0.9)}, 0 0 ${24 + press * 30}px ${withAlpha(palette.primary, 0.4)}`,
            transform: `scale(${1 - press * 0.05 + successPop * 0.04})`,
          }}
        >
          {success ? (
            <Check size={32} strokeWidth={3} />
          ) : (
            <MousePointerClick size={30} strokeWidth={2.6} />
          )}
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

        <svg
          style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
          width={MODAL.width}
          height={MODAL.height}
        >
          <ParticleBurst
            x={BTN_CX - MODAL.left}
            y={BTN_CY - MODAL.top}
            delay={pressAt}
            durationInFrames={30}
            count={34}
            spread={280}
            color={palette.primary}
            color2={palette.accent}
            lineLength={30}
            seed={7}
            blend="multiply"
          />
        </svg>
      </div>

      <AnimatedCursor
        x={cursor.x}
        y={cursor.y}
        pressed={press}
        fill={palette.secondary}
        outline="#FFFFFF"
        scale={1.15}
        opacity={cursorVisible ? 1 : 0}
      />
    </AbsoluteFill>
  );
};
