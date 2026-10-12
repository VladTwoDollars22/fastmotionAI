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
- Drive animation from `useCurrentFrame()`; object transforms are functions of `frame`,
  never `delta` from a continuous clock.

## 2. Camera choreography (mandatory)

Every 3D scene performs active, frame-driven camera work:

- **Zoom-punch**: spring the camera `z`/`fov` (e.g. `z: 9 → 7 → 9`) on reveals.
- **Camera roll/tilt**: continuous or springy `rotation.z` (±0.5°–3°); small `rotation.x/y`
  drift via `noise2D`.
- **Dolly through Z on morphs**: ease `z` from `9` toward `3` and back so the particle
  field rushes past the lens during a 2D→3D collapse.
- **Impact shake**: decaying noise jitter on `camera.position` on heavy beats.
- Prefer a small FOV (30–45) for a film look; keep `near`/`far` tight. Framing is
  judged on the 1080x1920 vertical crop.

## 3. Lighting & materials

- Minimal rig: 1 key + 1 fill + optional rim/HDRI. Match color temperature to
  `styleguide.json`. Shadow maps are expensive — ≤ 1 caster, `mapSize` ≤ 1024.
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
- Post-processing FX must be frame-driven (offset/intensity/darkness change per beat),
  and must not obscure the vertical safe area.

## 6. Performance budget (1080x1920, 30 fps, 300 frames)

- ≤ 60k triangles hero scenes; reuse geometry/materials; prefer `<Instances>`/`<Merged>`.
- No per-frame allocations in the render loop (no `new THREE.Vector3()` per frame).
- Cap pixel work: `dpr` ≤ 1 for full-frame composers; ≤ 2 otherwise; no MSAA + SMAA together.
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
- [ ] Post-processing frame-driven; `multisampling={0}`; `dpr` within budget (§5).
- [ ] No per-frame allocations or unseeded randomness.
- [ ] Scene fits the 1080x1920 vertical crop; Suspense + fallback present.
