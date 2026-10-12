# 04 — Three.js / React Three Fiber Standards

3D lives in `src/components/3d/`. Everything must render deterministically inside
Remotion's frame loop and stay performance-safe for headless rendering.

## 1. Renderer & scene setup

- Use `@react-three/fiber` (`<Canvas>`) + `@react-three/drei` helpers. Do not create
  a raw `WebGLRenderer`/`THREE.Scene` by hand unless a drei helper can't do it.
- Set the renderer explicitly for headless Chrome:
  - `gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}`
  - `dpr={[1, 2]}` (cap device pixel ratio; never `window.devicePixelRatio`).
  - `frameloop="never"` and drive renders from Remotion's frame, OR call
    `invalidate()` / use `useThree(state => state.invalidate)` — the scene must NOT
    run its own `requestAnimationFrame` loop independent of the timeline.
- Drive animation from `useCurrentFrame()` exactly like 2D (rule 01). Rotate/scale/
  move objects as a function of `frame`, not `delta` from a continuous clock.

```tsx
const frame = useCurrentFrame();
const t = frame / fps;
group.current.rotation.y = t * Math.PI * 0.5;
```

## 2. Cameras

- Default: `<PerspectiveCamera makeDefault fov={35} position={[0, 0, 6]} />`.
- Prefer a small FOV (30–45) for a "product/film" look; avoid wide distortion.
- Camera moves must be frame-bound and eased (use `interpolate`/`spring` outputs to
  set position/rotation), never mouse- or scroll-driven.
- Use `<OrthographicCamera>` only for flat/isometric graphic looks; document why.
- Always set `near`/`far` tightly (e.g. `near: 0.1, far: 100`) to protect depth precision.
- Reference framing: the target is 1080x1920; ensure the subject stays centered for a
  9:16 crop. Test the vertical fit, not just a 16:9 monitor view.

## 3. Lighting

- Keep the light rig minimal and intentional (1 key + 1 fill + optional rim/HDRI).
- Prefer `drei` helpers: `<Environment preset="city" />` (or a local `.hdr` from
  `sources/three/`) for realistic reflections; `<ContactShadows>` for grounded looks.
- Shadow maps are expensive in headless renders. If used:
  - One shadow-casting light only; `shadow-mapSize={[1024, 1024]}` max.
  - Set `shadow-camera` bounds tightly around the subject.
- Match light color/temperature to `styleguide.json` colors for brand cohesion.
- No animated light flicker unless frame-bound and clamped.

## 4. Materials & assets

- Prefer `MeshStandardMaterial` / `MeshPhysicalMaterial`; use `drei`'s
  `useGLTF`/`useTexture`/`useCubeTexture` for assets in `sources/three/`.
- `useGLTF` and `useTexture` must be given paths via `staticFile()`/absolute public
  URLs so headless rendering can fetch them.
- Preload: `useGLTF.preload(url)`, `useTexture.preload(url)` for assets used early.
- Keep texture sizes ≤ 2048²; generate mipmaps; use `.basis`/`.ktx2` only if the
  loader is configured.
- Draco/meshopt-compressed `.glb` must have the matching decoder configured once at
  the scene root.

## 5. Performance budget (1080x1920, 30 fps, 300 frames)

- Target ≤ 60k triangles for hero scenes, ≤ 8 draw calls where practical.
- Reuse geometries/materials across instances; use `drei`'s `<Instances>`/`<Merged>`
  rather than N separate meshes.
- Avoid per-frame allocations: no `new THREE.Vector3()` inside the render loop; hoist
  and `.set()` instead.
- Limit post-processing (`@react-three/postprocessing`) to 1 effect pass if used;
  `EffectComposer` is optional, not default.
- No physics engines unless required; if used, step a FIXED timestep derived from
  `frame`, never variable `delta`, so output is reproducible.
- Cap total pixel work: `dpr` ≤ 2, no `SMAAPass` + high `MSAA` together.

## 6. Integration with Remotion

- Mount `<Canvas>` inside `AbsoluteFill`; give it explicit width/height or `100%`.
- The 3D layer may be composited with 2D `src/components/ui/` overlays.
- Freeze time at `frame` before rendering: since Remotion renders a still per frame,
  avoid continuous animations not tied to `frame`.
- Provide a `Suspense` boundary + a frame-stable fallback (e.g. background color) so a
  slow asset load never produces a mismatched frame.
- Dispose of resources on unmount (`useEffect` cleanup) to avoid leaks across many
  rendered frames, especially in the Studio preview.

## 7. Determinism & QA

- [ ] No independent RAF loop; timeline drives all motion.
- [ ] `frameloop="never"` (or explicit `invalidate()` per frame).
- [ ] All asset URLs resolved via `staticFile()`/public paths.
- [ ] Lights/shadow map sizes within budget; ≤ 1 shadow caster.
- [ ] No per-frame allocations or unseeded randomness.
- [ ] Scene fits the 1080x1920 vertical crop.
- [ ] Suspense boundary + frame-stable fallback present.
