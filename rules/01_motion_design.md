# 01 — Motion Design Rules

These rules are binding for every animation built in this project. Motion is a pure
function of time; a render must be byte-for-byte reproducible.

## 1. Canvas contract (never change silently)

| Property   | Value                |
| ---------- | -------------------- |
| Width      | `1080`               |
| Height     | `1920` (9:16)        |
| FPS        | `30`                 |
| Duration   | `300` frames (10 s)  |

Vertical-first design for Reels / Shorts / TikTok. Keep critical content inside a
safe area of `~120px` horizontal and `~180px` top / `~240px` bottom (platform UI
overlay zones).

## 2. Frame-bound animation only

- Every animated value MUST be derived from `useCurrentFrame()` and, when needed,
  `useVideoConfig()`.
- **Forbidden** in any component: CSS `transition`, CSS `@keyframes`, `setTimeout`,
  `setInterval`, `requestAnimationFrame`, `Date.now()`, `performance.now()`, and
  `Math.random()` (use `random()` from `remotion` for deterministic values).
- Animation must be a pure function: same `frame` ⇒ same output.

```tsx
import { useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";

const frame = useCurrentFrame();
const { fps, durationInFrames, width, height } = useVideoConfig();
```

## 3. Interpolation

- Use `interpolate()` and ALWAYS clamp both ends unless an intentional overshoot is
  designed:
  ```tsx
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  ```
- For multi-stop curves, list input range ascending and keep `outputRange` the same
  length. Use `easing` (from `remotion`) rather than hand-rolled math where possible.

## 4. Springs (organic motion)

Prefer `spring()` over linear tweens for anything that enters, pops, or settles.

```tsx
import { spring } from "remotion";

const scale = spring({
  frame,
  fps,
  config: { damping: 200 },   // smooth, no overshoot
  from: 0.8,
  to: 1,
});
```

Physics presets:

| Intent                | Config                                   |
| --------------------- | ---------------------------------------- |
| Smooth UI settle      | `{ damping: 200 }`                       |
| Playful pop / overshoot | `{ damping: 12, stiffness: 180 }`       |
| Heavy / weighty       | `{ damping: 200, mass: 2 }`              |
| Snappy accent         | `{ damping: 20, stiffness: 300 }`        |

Use `delay` in the spring config for staggered reveals rather than shifting frames.

## 5. Composing scenes in time

- One `<Sequence>` per visual beat. Nesting is encouraged; `frame` inside a
  `Sequence` is already relative to its `from`.
- Prefer `<TransitionSeries>` / `<TransitionSeries.Transition>` for cross-scene
  transitions. Do not fake transitions with overlaid absolute timing math.
- Scene boundaries use `durationInFrames` props, not hardcoded frame checks.
- Register every `<Sequence>`/clip duration so the total never exceeds 300 frames
  unless the composition duration is explicitly changed and documented.

## 6. Easing & motion quality bar

- Default feel: `easeOut` for entrances, `easeIn` for exits, `easeInOut` for moves.
- Entrance duration ≈ 12–24 frames; exits ≈ 10–18 frames; ambient loops use full cycles.
- Stagger siblings by 2–6 frames so motion reads as a cascade, not a single block.
- Keep one "hero" motion per beat; avoid animating everything at once.
- Respect a "camera" language: consistent direction of travel, consistent scale.

## 7. Layout & styling

- Tailwind (v4) utility classes for static layout. Never put animation in classes.
- Use `AbsoluteFill` from `remotion` as the layout primitive for full-frame overlays.
- Center vertical content with flex; keep type legible at `@1080px` width (min body
  size `~36px`, headline `~72px+`).
- Import reusable 2D components from `src/components/ui/`; never inline one-off
  primitives that already exist there.

## 8. Determinism checklist before committing a scene

- [ ] No wall-clock, timer, RAF, or unseeded random usage.
- [ ] All values driven by `frame` / `fps`.
- [ ] `interpolate` endpoints clamped (unless intentional).
- [ ] Springs use explicit `config` + `fps`.
- [ ] Total duration ≤ composition duration.
- [ ] Component is exported and mounted through a `<Sequence>` in the scene.
