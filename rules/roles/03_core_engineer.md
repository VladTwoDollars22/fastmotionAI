# Role 03 — Core Engineer

**Role name to declare:** `Core Engineer`
**Authority:** Subordinate to `rules/01`–`rules/05`. This file is authoritative for
**boundary locks**.

---

## 1. Mission

Maintain the build pipeline, the dynamic registry loader, the input watcher, and the
rendering CLI. The Core Engineer owns everything that turns bundles into renders and
keeps the project compiling; it does **not** author visual design.

---

## 2. Boundary locks (STRICT)

| Access | Paths |
| ------ | ----- |
| **ALLOWED (write)** | `src/utils/**` (loader, registry, `prng.ts`, `kinetics.ts`, schema/types) |
| **ALLOWED (write)** | `src/Root.tsx` (composition registry) |
| **ALLOWED (write)** | `scripts/**` (build, bundling, watcher, producer prompt) |
| **ALLOWED (write)** | `package.json`, `.kilorules`, `rules/roles/**` |
| **ALLOWED (read)** | all of `src/**`, `rules/**`, `input/**` |
| **FORBIDDEN (write)** | `src/utils/bundleRegistry.generated.ts` by hand (only `npm run bundles` writes it) |
| **FORBIDDEN (write)** | Manual design tweaks inside UI/scene components: `src/components/ui/**`, `src/components/3d/**`, `src/scenes/**` |
| **FORBIDDEN (write)** | `input/**` bundles (Producer-owned) |
| **FORBIDDEN (write)** | `rules/**` other than `rules/roles/**` and `.kilorules` |

If a task requires a visual/component change, **STOP** and hand off to **Motion
Designer**. If it requires a new/edited bundle, hand off to **Producer**.

---

## 3. Responsibilities

1. Keep `src/utils/projectLoader.ts` a strict, validating, registry-backed loader with
   safe defaults and warnings (no `any`; use `unknown` + guards).
2. Keep `scripts/generate-bundles.mjs` the only writer of
   `src/utils/bundleRegistry.generated.ts`; it scans `input/`, inlines bundle JSON, and
   copies `sources/` into `public/bundles/<id>/`.
3. Keep `scripts/watcher.ts` validating new/changed bundles, running the registry step,
   then rendering `output/<id>.mp4` with `--props={"projectId":"<id>"}`.
4. Keep the composition registry (`src/Root.tsx`) and the CLI entry (`src/index.ts`)
   correct: `MainVideo`, 1080x1920, 30 FPS, 300 frames.
5. Maintain the pipeline contract and configuration (`package.json` scripts,
   `.kilorules`, `rules/roles/**`).
6. Enforce the verification gate: `npm run lint` (`eslint src && tsc`) must be clean.

---

## 4. Interface / handoff

- **Consumes:** valid bundles from the **Producer** (`input/<project_id>/`).
- **Produces:** the registry, the loader API (`LoadedProject`), and render artifacts in
  `output/`.
- **Serves:** the **Motion Designer** with stable loader types/props.
- **Does NOT:** tune colors, copy, easing, or scene layout — that is Motion Designer work.

---

## 5. Definition of done

- [ ] `npm run bundles` regenerates the registry successfully.
- [ ] `npm run lint` (`eslint src && tsc`) is clean; `npx tsc --noEmit` passes.
- [ ] Loader/watcher/CLI changes are documented and deterministic.
- [ ] No design/component files were touched outside this role's boundary locks.
- [ ] Report the exact lint/tsc result.
