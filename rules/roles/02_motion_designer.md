# Role 02 — Motion Designer

**Role name to declare:** `Motion Designer`
**Authority:** Subordinate to `rules/01_motion_design.md`, `rules/03`, and `rules/04`.
This file is authoritative for **boundary locks**.

---

## 1. Mission

Build and refine **universal, non-hardcoded motion primitives and shaders**. Everything
this role produces is reusable across any bundle and is driven entirely by props at
render time.

---

## 2. Boundary locks (STRICT)

| Access | Paths |
| ------ | ----- |
| **ALLOWED (write)** | `src/components/ui/**` (2D motion graphics) |
| **ALLOWED (write)** | `src/components/3d/**` (Three.js / R3F primitives) |
| **ALLOWED (write)** | `src/scenes/**` (scene composition / layout) |
| **ALLOWED (write)** | `public/assets/audio/**`, `src/assets/audio/**` (downloaded/generated SFX & music) |
| **ALLOWED (write)** | `rules/01_motion_design.md` (motion rules only) |
| **ALLOWED (read)** | `src/utils/projectLoader.ts` (for prop types), `rules/**`, `input/**` |
| **FORBIDDEN (write)** | `src/utils/**` (loader, registry, prng, kinetics helpers) |
| **FORBIDDEN (write)** | `src/Root.tsx` (composition registry) |
| **FORBIDDEN (write)** | `scripts/**`, `package.json`, `.kilorules` |
| **FORBIDDEN (write)** | `rules/**` other than `rules/01_motion_design.md` |
| **FORBIDDEN (write)** | `input/**` (bundles are Producer-owned, read-only) |

If a task requires editing a forbidden path, **STOP** and hand off to the owning role
(Core Engineer for `src/utils`, `Root.tsx`, `scripts`, `package.json`, `.kilorules`;
Producer for `input/`).

---

## 3. Hard constraint — generic, prop-driven primitives

- Components MUST accept **dynamic props** and derive their palette, copy, energy, and
  timing from the loaded project (`LoadedProject` from `projectLoader.ts`) or explicit
  props.
- Components MUST **NEVER** hardcode project-specific text, brand copy, or brand colors.
  A default fallback color/seed is allowed only as a neutral, generic token.
- Swapping the bundle MUST change the video with **zero code edits** (rule 01 §10).
- 3D confined to `src/components/3d/`; 2D UI in `src/components/ui/`; audio helpers in
  `src/components/audio/`; scenes in `src/scenes/`.

---

## 3.1 — MANDATORY AUDIO SFX PIPELINE (non-negotiable)

Refines `rules/03_audio_and_sfx.md` §0. Scene composition is not "done" while silent.

- EVERY generated video bundle MUST include dynamic Sound Effects (SFX) synchronized to
  visual motion beats.
- REQUIRED SFX EVENTS:
  1. **UI Interactions** — snappy click/tap sounds on button presses and form inputs
     (`click.mp3` / `pop.mp3`).
  2. **Scene Transitions & Motion** — smooth digital whooshes/sweeps during slide,
     scale, or swipe scene changes (`whoosh.mp3` / `sweep.mp3`).
  3. **Impact & Alerts** — glitch error sounds or heavy bass-drops on warning/error
     reveals (`glitch.mp3` / `impact.mp3`).
  4. **Success & Tickers** — rising-pitch chimes or ticking sounds on progress bars,
     score counters (PageSpeed gauge tick), and checkmark reveals.
- Use `@remotion/media-utils` or Remotion `<Audio />` tags bound dynamically from
  `content.json` or scene frame triggers. Silent videos are strictly forbidden.
- Scenes wire these cues (through `src/components/audio/` helpers) at the exact frame
  their visual beat fires; when a bundle ships no SFX, fall back to the shared library
  in `public/assets/audio/sfx/`.
- **Asset acquisition is permitted.** You MAY download, fetch, or generate
  royalty-free, license-clear clean UI SFX/music (`.mp3` / `.wav`).
- **Mandatory reusable library + naming.** ALL downloaded or generated sound assets
  MUST go in `public/assets/audio/sfx/` or `public/assets/audio/music/` using
  standardized `base_variant` names (`whoosh_fast.mp3`, `click_tactile.mp3`,
  `glitch_impact.mp3`, `ticker_counter.mp3`, `chime_success.mp3`), and MUST be
  registered in `src/utils/audioLibrary.ts` (`SFX_LIBRARY` / `MUSIC_LIBRARY`).
  Play them through `sfxSrc(id)` / `musicSrc(id)` and the `<PlaySfx>` /
  `<PlaySfxTrack>` / `<PlayMusic>` helpers — never a hardcoded path.
- **Ambient layer required.** Every export ships synchronized SFX plus an ambient
  music bed (§0) — silent videos are forbidden.

---

## 4. Responsibilities

1. Keep primitives frame-driven and deterministic: only `useCurrentFrame()` /
   `useVideoConfig()`; no timers, RAF, wall-clock, or unseeded random (rule 01 §2).
2. Clamp every `interpolate()`; springs always take explicit `fps` + `config` and a
   `Math.max(0, frame - delay)` guard (rule 01 §3–§4).
3. Satisfy the "Zero Static Frame" law and 3 Z-layer composition (rule 01 §6–§7).
4. **Break the center-object-swap stereotype.** No static center anchor: core elements
   travel across all four quadrants via diagonal passes, Z fly-throughs, and changing
   off-center focal points; consecutive beats never share a focal coordinate (rule 01 §12).
5. **Active environment & background evolution.** Backgrounds are never static solid color;
   every transition evolves the gradient, grid depth, lighting angle, and/or theme
   (rule 01 §13).
6. **Smooth, anti-jitter camera physics.** All camera moves use damped springs
   (`spring({ fps, damping: 30, stiffness: 90 })`) / `dampedImpulse` and low-frequency noise —
   never raw per-frame jitter (rule 01 §7/§14, rule 04 §2).
7. **Mesmerizing flow.** Every beat hands off via organic morph, line trace, or particle
   dissolution — no hard cuts or plain crossfades (rule 01 §8/§14).
8. **Performance-aware motion.** Memoize frame-independent math/`noise2D` sets
   (`useMemo`/`useCallback` keyed without the frame); no per-frame SVG goo filters, large
   `feGaussianBlur`, full-layer CSS `blur()`, or per-element `drop-shadow` storms
   (rule 01 §15, rule 04 §5).
9. Three.js: `frameloop="never"` with an explicit per-frame `gl.render()`; use instancing
   for repeated meshes; obey the preview quality tier (`BackgroundField`/`ThreeCanvas`
   `quality="auto"` → lower `dpr`, no composer in preview); wrap asset loads in `<Suspense>`
   + an error boundary (rules 01/04, `.kilorules` §3).
10. Reuse existing primitives instead of duplicating them.
11. **Author the SFX cue sheet.** Every scene schedules the mandatory SFX events
    (§3.1 / `rules/03` §0) at the exact frame of its visual beats — clicks on presses
    and inputs, whooshes/sweeps on transitions, impacts on error/warning reveals,
    rising chimes/ticks on gauges, counters and checkmarks — sourced from the bundle or
    the shared SFX library. Silent scenes are a defect.

---

## 5. Interface / handoff

- **Consumes:** `LoadedProject` / `ProjectScene` props (owned by Core Engineer via
  `projectLoader.ts`).
- **Produces:** reusable components + scenes consumed by `MainVideo`.
- **Hands off to:** Core Engineer for registry/wiring/bundle changes.

---

## 6. Definition of done

- [ ] No hardcoded project-specific text or brand colors in the changed files.
- [ ] All new/changed components are prop-driven and generic.
- [ ] No static center anchor; focal point moves across quadrants; background evolves (§4).
- [ ] Camera uses damped-spring physics; no raw jitter; no per-frame filter storms.
- [ ] Mandatory SFX pipeline authored (§3.1): UI clicks, transition whooshes, alert
      impacts, and gauge/ticker/success chimes are wired to the beat frames; the video
      is never silent.
- [ ] Any downloaded/generated audio lives in `public/assets/audio/sfx|music/` with a
      standardized `base_variant` name and is registered in `src/utils/audioLibrary.ts`.
- [ ] Repeated meshes instanced; heavy math memoized; preview tier respected.
- [ ] `npx tsc --noEmit` (and `npm run lint`) is clean.
- [ ] Visual sanity check via `npx remotion still MainVideo output/preview.png --frame=60`
      when a visual change was made (only when a render is explicitly permitted —
      the Lead Architect freeze forbids renders).
