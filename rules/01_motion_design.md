# 01 — Motion Design Rules (Ultra-Professional Edition)

These rules are binding for every animation in this project. Motion is a pure function
of time; a render must be byte-for-byte reproducible. They define the **minimum bar**
for studio-grade, commercial motion graphics — a static-looking frame is a **defect**.

## 1. Canvas contract (never change silently)

| Property | Value |
| -------- | ----- |
| Width | `1080` |
| Height | `1920` (9:16) |
| FPS | `30` |
| Duration | `300` frames (10 s) |

Vertical-first for Reels / Shorts / TikTok. Keep critical content inside a safe area of
`~120px` horizontal, `~180px` top, `~240px` bottom (platform UI overlay zones).

## 2. Frame-bound animation only (non-negotiable)

- Every animated value MUST derive from `useCurrentFrame()` and `useVideoConfig()`.
- **Forbidden**: CSS `transition`/`@keyframes`, `setTimeout`, `setInterval`,
  `requestAnimationFrame`, `Date.now()`, `performance.now()`, unseeded `Math.random()`.
  Use Remotion's `random()` or `@remotion/noise` (`noise2D`/`noise3D`) for organic,
  deterministic variation.
- Same `frame` ⇒ same pixels. Ambient motion is algorithmically derived from `frame`,
  never from a wall clock.

## 3. Interpolation

- Use `interpolate()` and ALWAYS clamp both ends unless an intentional overshoot is
  designed: `{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }`.
- Ascending input ranges, equal-length `outputRange`, `easing` from `remotion` where possible.

## 4. Springs — the energy presets (mandatory vocabulary)

```tsx
spring({ frame, fps, config: { damping: 12, stiffness: 220 }, from: 0, to: 1 });
```

| Intent | Config | Use |
| ------ | ------ | --- |
| **Kinetic overshoot** (default for text/UI) | `{ damping: 12, stiffness: 220 }` | per-character/word/text pop with visible overshoot |
| Snappy accent | `{ damping: 20, stiffness: 300 }` | ticks, checkmarks, micro-interactions |
| Smooth settle | `{ damping: 200 }` | large layout moves |
| Heavy weight | `{ damping: 200, mass: 2 }` | slow, massy objects |

- Prefer `styleguide.json → motionPresets` when present (`entranceBounce`,
  `smoothSettle`, `snappyAccent`); fall back to the table above.
- Stagger per unit: `Math.max(0, frame - delay - index * stagger)`.

## 5. Composing scenes in time

- One `<Sequence>` per beat; `frame` inside a Sequence is already local.
- Scene boundaries use `durationInFrames`, not hardcoded frame checks.
- Total duration ≤ composition duration (default 300). One **hero motion** per beat
  plus supporting ambient layers.

## 6. The "Zero Static Frame" Law

**No element may ever be frozen on screen.** Every visible layer MUST carry multi-axis
ambient motion every single frame, at minimum two of:

1. **Continuous rotation** — slow drift, e.g. `rot = ampDeg * Math.sin(t * w)`
   or a constant `t * deg` spin on background/large shapes.
2. **Floating sine-wave drift** — `x = ampX * Math.sin(t * wx + phase)`,
   `y = ampY * Math.cos(t * wy + phase)`.
3. **Spring breathing / pulsing** — scale/opacity oscillation driven by a slow spring or sine.
4. **Noise-driven organic wiggle** — `noise2D(seed, t * speed, channel)` per vertex/shape.
5. **Parallax drift** — depth-dependent translation (see §7).

Rules:
- Background layers: slowest, largest amplitude drift + rotation.
- Midground hero: subtle breathing (scale 1.0 ↔ 1.03) + micro-bob.
- Foreground: fastest, smallest-amplitude motion (bokeh drift, speed lines, grain).
- Idle "dead air" is a defect: if a beat holds, it still breathes.
- Ambient motion never changes readability: keep amplitudes tasteful and clamped.

## 7. Dynamic Camera Choreography & Spatial Depth

Every scene beat MUST have active camera work, all frame-driven:

- **Zoom-punches** on key reveals: a fast spring `scale` punch (e.g. 1.0 → 1.12 → 1.0,
  ~8–14 frames) on the whole scene container at each hero beat.
- **Camera roll / tilt**: small continuous or springy rotation (±0.5°–3°) of the
  scene container, plus 3D `rotation.z` on the R3F camera.
- **Continuous parallax**: translate layers by depth — background ~±6px, midground
  ~±14px, foreground ~±26px, driven by the same noise/sine source so layers feel connected.
- **Impact screen shake (damped spring only)**: on heavy beats, use a
  critically-damped spring impulse envelope — `spring({ frame, fps, damping: 30, stiffness: 90 })`
  or the equivalent analytic falloff (`dampedImpulse` in `src/utils/kinetics.ts`) — driving a
  **low-frequency** noise offset (`noise2D(seed, frame * 0.2, c)`). FORBIDDEN: raw high-frequency
  noise jitter (`frame * 0.9+`), quadratic/linear falloff, or unclamped amplitudes — these read as
  8–20 FPS "frame-jitter" and are a defect. Shake amplitude is a tasteful accent (≤ ~18px), never
  a sustained vibration.
- **3D dolly through Z**: on morph transitions, ease the R3F camera toward/through the
  particle field (see §8).

**Mandatory 3 Z-layers in every scene:**

| Layer | Content | Treatment |
| ----- | ------- | --------- |
| Foreground | bokeh blobs, speed lines, grain, micro-sparks | heaviest blur, fastest small motion |
| Midground | hero card / typography / product | sharp, in focus, breathing |
| Background | grid, ambient particle field, vignette | dark, slow, large drift |

## 8. Fluid 2D→3D Morphing & Particle Collapses

Transitions MUST NOT be simple fades or slides. Use at least one of:

- **Flat→Particle collapse**: sample a 2D shape's points, flag them out as a 3D point
  cloud (`<points>` in R3F), and re-form them into the next element. Drive with
  `frame`; the camera moves through Z while the cloud disperses and re-gathers.
- **Camera-through-Z**: during a morph, push the R3F camera from `z = 9` to `z = 3`
  and back (eased), so the field rushes past the lens.
- **Metaball blending**: connected/amoeba shapes MUST use a real liquid-merge filter
  (`feGaussianBlur` + `feColorMatrix` alpha threshold + `feComposite`) or overlapping
  R3F shader meshes — never dry overlapping circles. Converge colors as shapes merge.
- Every scene-to-scene handoff uses one of the above; a plain crossfade is a defect.

## 9. Ultra-Kinetic Typography & Micro-Interactions

- Text NEVER just fades in. Use:
  - staggered per-character/word spring overshoot `{ damping: 12, stiffness: 220 }`,
  - kinetic **scale-punch** on the whole line at its beat,
  - **motion-blur emulation**: `filter: blur(k * (1 - progress))` during fast motion.
- **FORBIDDEN on text: moving gradient sweeps / light-glints across glyphs** (§17).
  Text must be crisp and solid. Light-sweep is reserved for containers, badges and
  buttons — never letters.
- Type scales: headline `~96–200px`, subhead `~36–48px`, label `~26–34px`; keep within
  the 1080 safe area and wrap rather than overflow.
- **Micro-interactions on every UI card/icon** (at least two):
  - burst rings on reveal/impact,
  - speed lines radiating on emphasis,
  - geometric sparks / particle ticks,
  - drop-shadow depth + inner highlight (elevated, tactile),
  - light sweep + subtle border shimmer.

## 10. Applying the laws from a bundle (automation)

- Read `styleguide.json`: `colors` (+ optional `palette`), `motion.speed`
  (`slow|normal|fast` → amplitude/velocity multiplier), `motionPresets`.
- Read `content.json`: per-scene `headline`/`body` drive the kinetic copy; `sfx`
  drive audio; `durationInFrames` drive beat lengths.
- Never hardcode brand color or copy that exists in the bundle. Components take their
  palette/energy/copy as props derived from the loaded project so the pipeline stays
  **100% automated** — swapping the bundle must change the video with zero code edits.

## 11. Determinism + energy checklist

- [ ] No wall-clock/timer/RAF/unseeded random.
- [ ] Zero static frames: every layer has ≥2 ambient motions (§6).
- [ ] Camera work present: zoom-punch + roll/tilt + parallax + impact shake (§7).
- [ ] 3 Z-layers composed (foreground/midground/background) (§7).
- [ ] At least one fluid morph per scene transition (§8).
- [ ] Text uses per-unit overshoot + punch + light sweep / motion blur (§9).
- [ ] ≥2 micro-interactions per card/icon (§9).
- [ ] Palette/energy/copy come from the bundle, not hardcoded (§10).
- [ ] `interpolate` clamped; springs use explicit `fps` + `config`.
- [ ] Total duration ≤ composition duration.
- [ ] No static center anchor / center-object swap; focal point moves across quadrants (§12).
- [ ] Background evolves on every transition (gradient / grid / lighting / theme) (§13).
- [ ] Camera shake is damped-spring + low-frequency, never raw jitter (§7, §14).
- [ ] Every beat flows into the next via a morph/trace/dissolution (§14).
- [ ] Preview stays smooth: no per-frame SVG/CSS filter storms; heavy math memoized (§15).
- [ ] Rich layering: supporting ambient/UI objects + micro-animations beyond the brief (§18).
- [ ] Non-intrusive harmony: secondary elements enrich without clutter; hierarchy preserved (§18).

---

## 12. Break the "center object swap" stereotype (mandatory)

The single most common failure of AI-generated motion is a **static object parked in the
center that is merely replaced, beat by beat**. Ban it.

- **No static anchors.** A hero element may not sit at a fixed center coordinate across
  multiple beats while only its contents change. That is a defect, not a composition.
- **Dynamic spatial choreography.** Core elements MUST travel across **all four quadrants**
  of the 9:16 frame over the course of the piece:
  - continuous **diagonal passes** (enter top-left → exit bottom-right, then re-enter from a
    new edge),
  - **Z-space fly-throughs** (element scales from off-frame foreground to deep background),
  - **dynamic off-center focal points** (rule-of-thirds / golden-ratio anchors that change
    every beat).
- **Eye travel.** Consecutive beats MUST NOT share the same focal coordinate; the focal
  point moves so the viewer's eye is led around the frame.
- **Anchor legibility.** Keep critical content inside the safe area (rule 01 §1) even while
  it travels; never let a moving hero clip the platform UI zones.

## 13. Active environment & background evolution (mandatory)

A background may **never** remain a static solid color. Every scene and every transition
must show the environment changing:

- **Dynamic color gradients** — animate a multi-stop gradient's hue/position across the
  beat (interpolate color stops from the bundle palette, frame-driven).
- **Shifting 3D grid depths** — move/scale/perspective-shift a grid or floor plane so
  depth reads as alive.
- **Moving lighting angles** — sweep key/rim light direction and color temperature across
  the beat; the light itself is a character.
- **Thematic environment morphing** — the "world" (field density, palette, atmosphere)
  visibly transforms at transitions instead of cutting.

The background is a **Z-layer with its own choreography** (rule 01 §7), not wallpaper.

## 14. Smoothness & mesmerizing visual flow (mandatory)

- **Continuous fluid motion curves.** Every animated value uses easing (spring or
  ease-in-out) — no linear snaps, no hard stops, no step changes.
- **Damped-spring camera physics.** All camera moves (pan, roll, dolly, shake) use damped
  springs (`damping: 30, stiffness: 90`) or critically-damped envelopes with smooth
  ease-in-out interpolation vectors. Never drive the camera with raw per-frame random noise.
- **Seamless handoffs.** Every beat flows into the next via **organic morphing**, **line
  tracing**, or **3D particle dissolution** — the outgoing element's points/form become the
  incoming element's. A hard cut or plain crossfade is a defect (rule 01 §8).
- **No jitter.** If motion vibrates frame-to-frame, it is a bug: lower the frequency, add
  damping, and clamp amplitude.

## 15. Performance-aware motion (preview must stay smooth)

Mesmerizing motion that drops the Studio preview to 8–20 FPS is a defect. Motion is
designed to the frame budget (rule 04 §6):

- **Memoize** expensive math and `noise2D` sample sets with `useMemo`/`useCallback` keyed by
  inputs that do **not** include the frame; per-frame work should be cheap interpolation.
- **Never** run chained SVG goo filters, large `feGaussianBlur`, or full-layer CSS `blur()`
  every frame. Prefer gradient falloff, overlap compositing, Canvas 2D, or WebGL (rule 04 §5).
- Avoid per-frame allocation (arrays, vectors, geometry) and per-element `drop-shadow`
  storms over many paths.
- Per-beat element counts (particles, lines, satellites) are capped to the budget and
  scaled down automatically during preview.

## 16. Ultra-dynamic motion & fluid transitions (mandatory)

Static holds are a defect. Every scene MUST feel alive for its entire duration:

- **Continuous micro-interactions.** No element is ever fully at rest while on screen:
  ambient breathing, subtle drift, hover lifts, underline draws, icon ticks, glow pulses,
  and counter/gauge motion keep focal elements alive. Layer these under the hero motion,
  never instead of it.
- **Scale-punches on impact.** Every meaningful reveal, cut, click, and value change lands
  with a damped scale-punch (`dampedImpulse` / snappy spring, ~1.02–1.08 peak) that decays
  smoothly — never a flat appearance.
- **Fluid morphing / sliding.** Elements transition by morph (shape/position/scale) or a
  continuous slide along a path; lists reflow with spring-staggered layout, cards glide
  between states, containers liquid-morph rather than swapping instantly (rule 01 §8/§14).
- **Spring-driven staggered entries.** Multi-element entrances use explicit `fps` + `config`
  springs with a small stagger (rule 01 §4); no simultaneous pops, no linear fades-in.
- **Living depth & parallax.** Foreground/midground/background layers move at different
  rates (parallax), and layouts reflow dynamically during transitions instead of holding a
  fixed composition (rule 01 §7/§13).

Scope note: a per-brief camera constraint (e.g. "impact-only shake on specific frames")
overrides the ambient-camera reading of this rule, but the micro-interaction, punch,
morph/slide, and stagger requirements still apply in full.

## 17. Micro-motion, liquid morphing & motor typography (mandatory)

- **15-frame micro-motion mandate.** No static screen holds. Every scene must sustain
  continuous micro-activity (floating badges, progress fills, particle oscillation,
  scale-pulses) on roughly a **12–15 frame (0.5s)** cadence for its whole duration.
- **Liquid element morphing.** Prefer morphing/containment over plain slide-outs: an
  element from Scene N should scale, reshape, or merge into a **container of Scene N+1**
  (rule 01 §8/§16), so transitions read as continuous transformation.
- **Staggered motor typography.** Headlines enter **word-by-word** with a **2–3 frame**
  stagger, animating `scale: 1.25 → 1.0` and `opacity: 0 → 1` on snappy springs
  (`damping: 12, stiffness: 220`). **FORBIDDEN:** moving gradient sweeps or light-glints
  across text letters — text stays crisp and solid (§9).
- **Prompt-driven 3D depth.** Fully support 3D perspective (`perspective`, `rotateX`,
  `rotateY`, `translateZ`), but activate 3D physics **only when the prompt explicitly
  requests it**. Default mode is ultra-sleek 2D spring mechanics.

## 18. Rich layering & atmospheric micro-activity (mandatory)

A scene is a **living environment**, not a slide with one object on it. Compositions must
carry more supporting ambient/UI objects and micro-animations than the basic brief lists.

- **Density mandate.** Beyond the hero/focal element, every scene SHOULD layer supporting
  micro-content, e.g. floating metric chips, subtle grid pulses, particle drifts,
  background connection rays, status dots, breathing gauges, orbiting satellites, ambient
  scan lines, and idle progress ticks.
- **Continuous micro-activity.** Secondary elements stay alive on the §17 ~12–15 frame
  cadence (drift, pulse, flicker, count), never freezing while the hero performs.
- **Non-intrusive harmony (the bound).** Secondary elements MUST enrich the composition and
  feel, and **never** clutter the viewport or distract from the primary kinetic text and
  focal UI cards. When in doubt, dial opacity/scale/amplitude down rather than adding more.
- **Hierarchy discipline.** Keep a clear perceptual order — focal > supporting > ambient —
  with supporting layers at lower contrast/opacity and smaller amplitude than the hero, and
  ambient layers lowest. Density must never flatten the hierarchy.
- **Legibility is inviolable.** Text and focal cards stay crisp and uncluttered inside the
  safe area (rule 01 §1); ambient layers never cross or compete with a focal reading zone.
- **Performance-aware.** Layering respects the frame budget (§15) and per-beat element
  caps; add richness via cheap, memoized, frame-driven motion — not per-frame filter storms.

Checklist additions (see §11):
- [ ] Scene layers supporting ambient/UI objects + micro-animations beyond the brief.
- [ ] Secondary elements enrich without clutter (non-intrusive harmony; clear hierarchy).
