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

## 4. Responsibilities

1. Keep primitives frame-driven and deterministic: only `useCurrentFrame()` /
   `useVideoConfig()`; no timers, RAF, wall-clock, or unseeded random (rule 01 §2).
2. Clamp every `interpolate()`; springs always take explicit `fps` + `config` and a
   `Math.max(0, frame - delay)` guard (rule 01 §3–§4).
3. Satisfy the "Zero Static Frame" law and 3 Z-layer composition (rule 01 §6–§7).
4. Three.js: `frameloop="never"` with an explicit per-frame `gl.render()`; cap `dpr` to
   `[1, 2]`; wrap asset loads in `<Suspense>` + an error boundary (rules 01/04, `.kilorules` §3).
5. Reuse existing primitives instead of duplicating them.

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
- [ ] `npx tsc --noEmit` (and `npm run lint`) is clean.
- [ ] Visual sanity check via `npx remotion still MainVideo output/preview.png --frame=60`
      when a visual change was made.
