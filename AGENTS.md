# AGENTS.md — Motion Designer Pipeline

Automated vertical-video generation pipeline built on **Remotion + Three.js (R3F) + Tailwind CSS**.

## Rules (authoritative — read before coding)

All agent passes MUST follow the modular rules in `rules/`:

- `rules/01_motion_design.md`
- `rules/02_project_bundle_parsing.md`
- `rules/03_audio_and_sfx.md`
- `rules/04_threejs_standards.md`
- `rules/05_ai_producer_workflow.md`

Rules win over ad-hoc templates. Flag conflicts rather than silently ignoring a rule.

## Project map

| Path | Purpose |
| ---- | ------- |
| `input/<project>/` | Read-only project bundles (`prompt.txt`, `styleguide.json`, `content.json`, `sources/`) |
| `output/` | Rendered MP4s and build reports |
| `rules/` | Modular AI instruction markdown files |
| `src/Root.tsx` | Composition registry (`MainVideo`: 1080x1920, 30 FPS, 300 frames) |
| `src/scenes/` | Modular video scenes |
| `src/components/ui/` | 2D motion-graphics components |
| `src/components/3d/` | Three.js / React Three Fiber components |
| `src/components/audio/` | Audio manager & ducking helpers |
| `src/assets/audio/sfx/` | Shared sound effects |
| `src/assets/audio/music/` | Background music |
| `scripts/` | Automation & watcher scripts |

## Commands

- Preview studio: `npx remotion studio` (or `npm run dev`)
- Lint / typecheck: `npm run lint` (`eslint src && tsc`)
- Render: `npx remotion render MainVideo output/<name>.mp4`
- Bundle: `npm run build`

## Stack

Remotion 4 (TypeScript, Tailwind v4), three, @react-three/fiber, @react-three/drei,
gsap, framer-motion, lucide-react, @remotion/media-utils, ts-node.

## Constraints

- Deterministic, frame-driven animation only (no timers/RAF/wall-clock/unseeded random).
- `input/` is read-only; never invent content absent from a bundle.
- Canvas is 1080x1920 @ 30 FPS, default 300 frames.
- Zero TypeScript/eslint errors before completion.

> Note: `node_modules` is hosted on the `D:` drive via a directory junction
> (`C:\...\MotionDesignerClaude\node_modules` → `D:\MotionDesignerClaude\node_modules`)
> because the `C:` drive is nearly full. The npm cache is redirected to
> `D:\MotionDesignerClaude\npm-cache` via `.npmrc`. Do not delete the junction.
