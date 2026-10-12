import { ArrowRight, Check, Globe } from "lucide-react";
import type { FC } from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedCursor, ClickRipple } from "../../components/ui/AnimatedCursor";
import { KineticText } from "../../components/ui/KineticText";
import { SweepButton } from "../../components/ui/SweepButton";
import { PlaySfx, playRotatedSfx } from "../../utils/audioLibrary";
import { dampedImpulse, sineFloat, smoothstep } from "../../utils/kinetics";
import { progressBetween, withAlpha } from "../promo16x9/brief";
import type { LaunchSceneProps } from "./brief";
import { MetricChip, StatusDot, cardSurface } from "./glass";
import { CTA_T, beatClock } from "./timeline";

const MODAL = { left: 560, top: 188, width: 800, pad: 48 };
const FIELD_W = MODAL.width - MODAL.pad * 2;
const FIELD_H = 84;
const FIELD1_Y = MODAL.top + 164;
const FIELD2_Y = FIELD1_Y + FIELD_H + 26;
const BTN_Y = FIELD2_Y + FIELD_H + 44;
const BTN_W = FIELD_W;
const BTN_H = 92;

const fieldPoint = (y: number) => ({ x: MODAL.left + MODAL.pad + 34, y: y + FIELD_H / 2 });
const buttonPoint = { x: MODAL.left + MODAL.pad + BTN_W / 2, y: BTN_Y + BTN_H / 2 };

interface Waypoint {
  at: number;
  x: number;
  y: number;
  press: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Scene 5 — Culmination: light booking modal, cursor path, module chips, logo reveal. */
export const CtaLaunchScene: FC<LaunchSceneProps> = ({ beat, brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { palette, fontFamily, springs } = brief;

  const k = beatClock(beat, CTA_T.nominal);
  const modalAt = k(CTA_T.modal);
  const cursorIn = k(CTA_T.cursorIn);
  const type1 = k(CTA_T.type1);
  const type1End = k(CTA_T.type1End);
  const type2 = k(CTA_T.type2);
  const type2End = k(CTA_T.type2End);
  const pressAt = k(CTA_T.press);
  const successAt = k(CTA_T.success);
  const logoAt = k(CTA_T.logo);
  const buttonAt = k(CTA_T.button);
  const slideOffAt = successAt + 4;

  const modalIn = spring({ frame: Math.max(0, frame - modalAt), fps, config: springs.settle });
  const modalOut = smoothstep(logoAt - 10, logoAt + 4, frame);
  const heroIn = smoothstep(logoAt, logoAt + 16, frame);
  const logoPop = spring({ frame: Math.max(0, frame - logoAt), fps, config: springs.entrance });
  const buttonIn = spring({ frame: Math.max(0, frame - buttonAt), fps, config: springs.entrance });
  const successPop = dampedImpulse(frame - successAt, 24);
  const glowPulse = 0.6 + 0.4 * Math.sin(frame / (fps * 0.45));
  const ripple = progressBetween(frame, pressAt, pressAt + 26);

  const value1 = beat.scene.body || brief.url;
  const value2 = brief.url;
  const typed1 = value1.slice(
    0,
    Math.max(0, Math.min(value1.length, Math.floor(progressBetween(frame, type1, type1End) * value1.length))),
  );
  const typed2 = value2.slice(
    0,
    Math.max(0, Math.min(value2.length, Math.floor(progressBetween(frame, type2, type2End) * value2.length))),
  );

  const p1 = fieldPoint(FIELD1_Y);
  const p2 = fieldPoint(FIELD2_Y);
  const waypoints: Waypoint[] = [
    { at: cursorIn - 8, x: 120, y: 120, press: 0 },
    { at: cursorIn, x: p1.x, y: p1.y, press: 0.45 },
    { at: type1End, x: p1.x, y: p1.y, press: 0 },
    { at: k(CTA_T.field2), x: p2.x, y: p2.y, press: 0.45 },
    { at: type2End, x: p2.x, y: p2.y, press: 0 },
    { at: pressAt, x: buttonPoint.x, y: buttonPoint.y, press: 0.95 },
    { at: successAt, x: buttonPoint.x, y: buttonPoint.y, press: 0 },
    { at: slideOffAt + 8, x: 1960, y: 250, press: 0 },
  ];

  let cursorX = waypoints[0].x;
  let cursorY = waypoints[0].y;
  let cursorPress = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (frame >= a.at && frame <= b.at) {
      const t = smoothstep(a.at, b.at, frame);
      cursorX = lerp(a.x, b.x, t);
      cursorY = lerp(a.y, b.y, t);
      cursorPress = lerp(a.press, b.press, t);
      break;
    }
    if (frame > b.at && i === waypoints.length - 2) {
      cursorX = b.x;
      cursorY = b.y;
      cursorPress = b.press;
    }
  }

  const cursorPath = waypoints.map((w, i) => `${i === 0 ? "M" : "L"} ${w.x} ${w.y}`).join(" ");

  const moduleLabels = Array.from(new Set([...brief.ecosystemNodes, ...brief.funnelNodes])).slice(0, 6);
  const moduleSlots = [
    { x: 96, y: 232 },
    { x: 1512, y: 268 },
    { x: 130, y: 700 },
    { x: 1560, y: 742 },
    { x: 96, y: 470 },
    { x: 1586, y: 520 },
  ];

  return (
    <AbsoluteFill style={{ perspective: 1200, perspectiveOrigin: "50% 48%", fontFamily }}>
      {/* Animated cursor path trail. */}
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: 0.5 * (1 - modalOut) }}>
        <path d={cursorPath} fill="none" stroke={withAlpha(palette.primary, 0.28)} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <path
          d={cursorPath}
          fill="none"
          stroke={palette.primary}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="3 12"
          strokeDashoffset={-frame * 1.4}
        />
      </svg>

      {/* Booking modal. */}
      <div
        style={{
          position: "absolute",
          left: MODAL.left,
          top: MODAL.top,
          width: MODAL.width,
          padding: MODAL.pad,
          transform: `translate3d(0px, ${(1 - modalIn) * 34}px, ${
            (1 - modalIn) * -200 - modalOut * 220
          }px) rotateX(${(1 - modalIn) * 9 - modalOut * 5}deg) scale(${0.86 + 0.14 * modalIn})`,
          opacity: modalIn * (1 - modalOut),
          ...cardSurface({ palette, glow: palette.primary, glowStrength: 0.5 }),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: palette.text, fontSize: 31, fontWeight: 800 }}>Бесплатный аудит архитектуры</span>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: palette.primary, fontSize: 20, fontWeight: 700 }}>
            <Globe size={22} strokeWidth={2.6} />
            {brief.url}
          </span>
        </div>

        {[
          { y: FIELD1_Y, label: "Проект", typed: typed1, active: frame >= cursorIn && frame < k(CTA_T.field2) },
          { y: FIELD2_Y, label: "Контакт", typed: typed2, active: frame >= k(CTA_T.field2) && frame < pressAt },
        ].map((field) => {
          const focused = field.active;
          return (
            <div
              key={field.label}
              style={{
                position: "absolute",
                left: MODAL.pad,
                top: field.y - MODAL.top,
                width: FIELD_W,
                height: FIELD_H,
                borderRadius: 16,
                border: `2px solid ${focused || field.typed.length > 0 ? withAlpha(palette.primary, 0.65) : palette.border}`,
                background: "#FFFFFF",
                boxShadow: focused ? `0 0 0 6px ${withAlpha(palette.primary, 0.12)}` : "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 22px",
              }}
            >
              <span style={{ color: palette.muted, fontSize: 19, fontWeight: 700, minWidth: 130 }}>{field.label}</span>
              <span style={{ color: palette.text, fontSize: 23, fontWeight: 600 }}>
                {field.typed}
                {focused ? (
                  <span
                    style={{
                      display: "inline-block",
                      width: 3,
                      height: 25,
                      marginLeft: 3,
                      background: palette.primary,
                      opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0.15,
                      verticalAlign: "middle",
                    }}
                  />
                ) : null}
              </span>
            </div>
          );
        })}

        <div style={{ position: "absolute", left: MODAL.pad, top: BTN_Y - MODAL.top, width: BTN_W }}>
          <div
            style={{
              position: "relative",
              height: BTN_H,
              borderRadius: BTN_H / 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              background: `linear-gradient(180deg, ${palette.primary}, ${withAlpha(palette.primary, 0.86)})`,
              color: "#FFFFFF",
              fontSize: 33,
              fontWeight: 800,
              boxShadow: `0 16px 38px -16px ${palette.primary}, 0 0 34px ${withAlpha(palette.primary, 0.4)}`,
              transform: `scale(${0.98 + 0.06 * dampedImpulse(frame - pressAt, 20)})`,
            }}
          >
            {brief.actionLabel}
            <ArrowRight size={30} strokeWidth={3} />
          </div>
          <ClickRipple x={BTN_W / 2} y={BTN_H / 2} progress={ripple} color={palette.primary} radius={180} rings={3} />
        </div>
      </div>

      {/* Success check that pops on press. */}
      {frame >= successAt ? (
        <div
          style={{
            position: "absolute",
            left: MODAL.left + MODAL.width / 2 - 44,
            top: BTN_Y + 146,
            width: 88,
            height: 88,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: withAlpha(palette.accent, 0.14),
            border: `2px solid ${withAlpha(palette.accent, 0.6)}`,
            color: palette.accent,
            transform: `scale(${0.4 + 0.6 * successPop + successPop * 0.1})`,
            opacity: successPop * (1 - modalOut),
          }}
        >
          <Check size={44} strokeWidth={3.2} />
        </div>
      ) : null}

      {/* Animated autofill cursor (fades out after the press). */}
      <AnimatedCursor
        x={cursorX}
        y={cursorY}
        pressed={cursorPress}
        fill={palette.text}
        outline="#FFFFFF"
        scale={1.5}
        opacity={smoothstep(cursorIn, cursorIn + 6, frame) * (1 - smoothstep(slideOffAt, slideOffAt + 12, frame))}
      />

      {/* Hero reveal: badge + logo + headline + CTA. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          opacity: heroIn,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 860,
            height: 860,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${withAlpha(palette.primary, 0.28)} 0%, ${withAlpha(
              palette.accent,
              0.12,
            )} 42%, rgba(255,255,255,0) 70%)`,
            transform: `scale(${0.82 + 0.18 * logoPop + glowPulse * 0.05})`,
            opacity: heroIn * (0.55 + 0.45 * glowPulse),
          }}
        />

        <div style={{ position: "relative", transform: `scale(${0.62 + 0.38 * logoPop})`, opacity: logoPop }}>
          <div
            style={{
              padding: "32px 52px",
              borderRadius: 32,
              background: "#FFFFFF",
              border: `2px solid ${withAlpha(palette.primary, 0.35)}`,
              boxShadow: `0 30px 70px -30px rgba(15,23,42,0.35), 0 0 60px ${withAlpha(palette.primary, 0.4)}`,
            }}
          >
            {brief.logoSrc ? (
              <Img src={brief.logoSrc} style={{ width: 500, height: "auto", display: "block" }} />
            ) : (
              <span style={{ color: palette.text, fontSize: 92, fontWeight: 900, letterSpacing: 6 }}>EDVANO</span>
            )}
          </div>
        </div>

        <KineticText
          text={beat.scene.headline}
          mode="word"
          entry="scale"
          delay={logoAt + 8}
          stagger={2}
          damping={springs.entrance.damping}
          stiffness={springs.entrance.stiffness}
          mass={springs.entrance.mass}
          distance={20}
          seed="cta-launch-headline"
          style={{
            color: palette.text,
            fontSize: 54,
            fontWeight: 900,
            letterSpacing: 1,
            textShadow: `0 8px 26px ${withAlpha(palette.primary, 0.16)}`,
          }}
        />

        {beat.scene.body ? (
          <KineticText
            text={beat.scene.body}
            mode="word"
            entry="up"
            delay={logoAt + 18}
            stagger={1.6}
            damping={springs.settle.damping}
            stiffness={springs.settle.stiffness}
            mass={springs.settle.mass}
            distance={18}
            seed="cta-launch-body"
            style={{ color: palette.muted, fontSize: 29, fontWeight: 600 }}
          />
        ) : null}

        <div
          style={{
            marginTop: 6,
            transform: `translateY(${(1 - buttonIn) * 26}px) scale(${0.9 + 0.1 * buttonIn})`,
            opacity: buttonIn,
          }}
        >
          <SweepButton
            label={`Перейти на ${brief.url}`}
            trailingIcon={<ArrowRight size={32} strokeWidth={3} />}
            color={palette.primary}
            height={94}
            fontSize={33}
            glow={0.6 + 0.2 * glowPulse}
            sweepPeriod={46}
            fontFamily={fontFamily}
          />
        </div>
      </div>

      {/* Floating Edvano module chips. */}
      {moduleLabels.map((label, i) => {
        const slot = moduleSlots[i % moduleSlots.length];
        const float = sineFloat(frame, `module-${i}`, 11, 10, 150);
        const tone = i % 2 === 0 ? palette.primary : palette.accent;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: slot.x,
              top: slot.y,
              transform: `translate3d(${float.x}px, ${float.y}px, 120px)`,
              opacity: 0.5 + 0.5 * heroIn,
            }}
          >
            <MetricChip label={label} palette={palette} tone={tone} fontFamily={fontFamily} />
          </div>
        );
      })}

      {/* Status indicators. */}
      <div style={{ position: "absolute", left: 96, top: 966, display: "flex", alignItems: "center", gap: 10 }}>
        <StatusDot color={palette.accent} pulse={0.5 + 0.5 * Math.sin(frame * 0.07)} />
        <span style={{ color: palette.muted, fontSize: 18, fontWeight: 700 }}>Все системы активны</span>
      </div>

      {/* SFX: zoom whoosh, autofill clicks, press click, success ding, reveal shimmer. */}
      <PlaySfx {...playRotatedSfx("whoosh", { frame: modalAt, volume: 0.6 })} />
      <PlaySfx {...playRotatedSfx("clicks", { frame: k(CTA_T.field1), volume: 0.6 })} />
      <PlaySfx {...playRotatedSfx("pops", { frame: k(CTA_T.field2), volume: 0.5 })} />
      <PlaySfx {...playRotatedSfx("clicks", { frame: pressAt, volume: 0.75 })} />
      <PlaySfx {...playRotatedSfx("counters", { id: "checkmark_ding_crisp", frame: successAt, volume: 0.6 })} />
      <PlaySfx {...playRotatedSfx("impacts", { id: "accent_light_shimmer", frame: logoAt, volume: 0.5 })} />
    </AbsoluteFill>
  );
};
