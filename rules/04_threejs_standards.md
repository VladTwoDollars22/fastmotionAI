# 04 — Three.js / React Three Fiber Standards (Studio Edition)

3D lives in `src/components/3d/`. Everything renders deterministically inside Remotion's
frame loop and stays performance-safe for headless rendering — while delivering
cinematic camera work and fluid morphs. Read with `rules/01` §7–§8.

## 1. Renderer & scene setup

- Use `@react-three/fiber` (`<Canvas>`) + `@react-three/drei` helpers.
- Headless-safe renderer config:
  - `gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}`
    (post-processing handles AA; see §5).
  - `dpr={1}` for full-frame field canvases (cap ≤ 2 for small hero canvases).
  - `frameloop="never"` + explicit per-frame `gl.render()` for plain scenes; use
    `frameloop="always"` **only** when an `EffectComposer` is present (the composer
    renders via its own `useFrame`). Either way, all *state* is driven by `frame`.
- **Preview performance tiers (mandatory).** Derive quality from
  `getRemotionEnvironment()`: treat `isRendering` as the final-render tier and degrade
  gracefully in Studio preview (`isStudio`). In preview: `dpr` ≤ 1 (use `0.75` for
  full-frame background fields), no MSAA, roughly half the particle count, and **no
  `EffectComposer`**. Preview must stay smooth; it must never lower the final render quality.
  `BackgroundField` and `ThreeCanvas` expose `quality: "auto" | "preview" | "high"` for this.
- Drive animation from `useCurrentFrame()`; object transforms are functions of `frame`,
  never `delta` from a continuous clock.

## 2. Camera choreography (mandatory)

Every 3D scene performs active, frame-driven camera work:

- **Zoom-punch**: spring the camera `z`/`fov` (e.g. `z: 9 → 7 → 9`) on reveals.
- **Camera roll/tilt**: continuous or springy `rotation.z` (±0.5°–3°); small `rotation.x/y`
  drift via `noise2D`.
- **Dolly through Z on morphs**: ease `z` from `9` toward `3` and back so the particle
  field rushes past the lens during a 2D→3D collapse.
- **Damped-spring camera only**: every camera move (pan, roll, dolly, impact) uses damped
  springs (`spring({ fps, damping: 30, stiffness: 90 })` or the `dampedImpulse` envelope in
  `src/utils/kinetics.ts`) plus smooth ease-in-out vectors.
- **Impact shake**: a damped-spring impulse envelope driving **low-frequency** noise
  (`noise2D(seed, frame * 0.2, c)`), amplitude ≤ ~18px. FORBIDDEN: raw high-frequency noise
  jitter, quadratic falloff, or sustained vibration — these are the cause of preview
  frame-jitter (8–20 FPS) and are a defect.
- Prefer a small FOV (30–45) for a film look; keep `near`/`far` tight. Framing is
  judged on the 1080x1920 vertical crop.

## 3. Lighting & materials

- **Light budget: ≤ 3–4 lights** (1 key + 1 ambient/hemisphere + optional fill/rim), no
  dynamic point-light spam. Match color temperature to `styleguide.json`.
- **Shadows off by default.** Shadow maps are expensive; enable at most one caster with
  `mapSize ≤ 1024` only when a shadow is actually visible in the 9:16 crop.
- Prefer cheap materials in preview: `meshStandardMaterial` over `meshPhysicalMaterial`
  `clearcoat`/`transmission` (transmission is banned outright; rule 04 §3).
- Prefer `MeshStandardMaterial`/`MeshPhysicalMaterial`; avoid `transmission` (extra
  full-res pass). Emulate glass with `transparent` + low `roughness` + `clearcoat` + `emissive`.
- Assets (`sources/three/`) load via `useGLTF`/`useTexture` with `staticFile()` URLs and
  `.preload()`.

## 4. Fluid 2D→3D morphing & particle systems

- **Flat→particle collapse**: represent the outgoing 2D element as sampled points in a
  `<points>` cloud; disperse, then re-gather into the next element's targets. Interpolate
  positions by `frame` with easing; no per-frame allocations (hoist buffers, `.set()`).
- **Metaball blending** (2D): use a real goo filter (`feGaussianBlur` + `feColorMatrix`
  alpha threshold + `feComposite`); converge all shape colors as they merge so the result
  reads as one liquid body (see `src/components/ui/Metaballs.tsx`).
- **Ambient particle fields**: additive `<points>` with `sizeAttenuation`, seeded
  (`mulberry32`) positions, frame-driven group rotation + sine drift. Never static.
- Use `THREE.AdditiveBlending` for glows/sparks; `depthWrite={false}` for particles.

## 5. Post-processing pipeline (default when a hero 3D layer exists)

Use `@react-three/postprocessing` with an `EffectComposer`:

- `Bloom` (`mipmapBlur`, adaptive `intensity`, high `luminanceThreshold`) — glow/energy.
- `ChromaticAberration` (`radialModulation`) — impact/science-fiction edge, animate the
  offset with shake strength.
- `Noise` (low `opacity`, `OVERLAY`) and `Vignette` — filmic texture and depth.
- Set `multisampling={0}` (cheap), keep `dpr={1}`, and enable only the passes needed.
- **The composer is a final-render feature.** Omit it entirely during Studio preview
  (rule 04 §1 quality tier) and drive the canvas with an explicit per-frame `gl.render()`
  instead. A 4-pass composer (`Bloom` + `ChromaticAberration` + `Noise` + `Vignette`)
  running every RAF is a primary cause of preview lag.
- Post-processing FX must be frame-driven (offset/intensity/darkness change per beat),
  and must not obscure the vertical safe area.

## 6. Performance budget (1080x1920, 30 fps, 300 frames)

- ≤ 60k triangles hero scenes; reuse geometry/materials.
- **Instancing is mandatory for repeated meshes.** Any field of ≥ ~8 identical elements
  (particles, tiles, cards, glyphs, bars) MUST use `instancedMesh` / drei `<Instances>` /
  a single `<points>` buffer — never N sibling meshes.
- No per-frame allocations in the render loop (no `new THREE.Vector3()` per frame); memoize
  any array/geometry/args object that does not change with `frame`.
- Cap pixel work: `dpr` ≤ 1 for full-frame composers; ≤ 2 otherwise; `dpr = 0.75` (or 1) in
  Studio preview; no MSAA + SMAA together.
- Physics: only if required, fixed timestep derived from `frame`, never variable `delta`.

## 7. Integration with Remotion

- Mount `<Canvas>` in `AbsoluteFill`; give it explicit size or `100%`.
- Wrap asset-loading subtrees in `<Suspense>` with a **frame-stable fallback**
  (background color) and an error boundary, so a slow/failed load never yields a blank frame.
- Dispose resources on unmount. Composite 3D with 2D `src/components/ui/` overlays;
  the 3D field normally sits in the **background Z-layer** (rule 01 §7).

## 8. Determinism & QA

- [ ] Timeline drives all motion; no independent RAF loop (except the composer's required loop).
- [ ] Camera choreography present: zoom-punch + roll/tilt + dolly through Z + shake (§2).
- [ ] ≥ 1 fluid morph (particle collapse or metaball) per transition (§4).
- [ ] Ambient particle field is never static (group rotation + drift) (§4).
- [ ] Camera moves use damped springs / low-frequency noise, never raw jitter (§2).
- [ ] ≤ 3–4 lights; shadows off unless visible; no `transmission` (§3).
- [ ] Repeated meshes use instancing; geometry/materials reused (§6).
- [ ] Post-processing frame-driven; `multisampling={0}`; `dpr` within budget (§5).
- [ ] Preview tier active: no composer, `dpr` reduced, particle counts scaled (§1, §5).
- [ ] No per-frame allocations or unseeded randomness.
- [ ] Scene fits the 1080x1920 vertical crop; Suspense + fallback present.
