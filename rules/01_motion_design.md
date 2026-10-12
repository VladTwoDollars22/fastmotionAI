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
- **Impact screen shake**: on heavy beats, decaying noise jitter
  (`amp * noise2D(seed, frame * k, c)` with quadratic falloff) on the container.
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
  - **light-sweep**: a moving highlight gradient across the glyphs,
  - **motion-blur emulation**: `filter: blur(k * (1 - progress))` during fast motion.
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
