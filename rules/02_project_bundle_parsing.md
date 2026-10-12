# 02 — Project Bundle Parsing Rules

Every video is generated from a self-contained **bundle** under `input/<project>/`.
The AI must treat that folder as the single source of truth and NEVER invent content
that is not present in the bundle.

## 1. Bundle layout

```
input/<project-name>/
├── prompt.txt            # free-form creative brief / instructions (highest intent)
├── styleguide.json       # brand tokens: colors, fonts, motion language, aspect
├── content.json          # ordered scene list: copy, timing, media refs, sfx refs
└── sources/              # raw assets referenced by content.json
    ├── images/           # .png, .jpg, .webp, .svg
    ├── video/            # .mp4, .mov, .webm
    ├── audio/            # .mp3, .wav, .m4a
    ├── fonts/            # .ttf, .otf, .woff2
    └── three/            # .glb, .gltf, .hdr, textures
```

Rules:
- The project folder name is the bundle id. Reference it everywhere instead of a path.
- Never write into `input/`. It is read-only input. Copy/import assets; do not mutate.
- Ignore unknown files, but log them as warnings in the generated report.

## 2. Reading order (mandatory)

1. `prompt.txt` — creative intent first, overrides defaults but NOT the rule files.
2. `styleguide.json` — design tokens; wins over any hardcoded guess.
3. `content.json` — the scene sequence that drives the timeline.
4. `sources/` — resolve every referenced file; verify existence before use.

If any of the three files is missing, fail loudly with a readable error naming the
missing file. Do not silently substitute placeholders.

## 3. `styleguide.json` contract

Expected shape (tolerate extra keys, validate required ones):

```json
{
  "brand": "Acme",
  "aspect": "9:16",
  "colors": {
    "primary": "#FF3B30",
    "secondary": "#0A84FF",
    "background": "#0B0B0F",
    "text": "#FFFFFF",
    "accent": "#34C759"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Inter",
    "mono": "JetBrains Mono"
  },
  "motion": {
    "energy": "high",
    "defaultSpring": { "damping": 20, "stiffness": 200 },
    "transition": "slide-up"
  },
  "music": { "track": "sources/audio/bgm.mp3", "volume": 0.35 }
}
```

Parsing rules:
- Colors: normalize to hex; generate Tailwind/CSS variables at the root scene.
- Fonts: register local `sources/fonts/*` via `@remotion/fonts` `loadFont()` before
  first frame; fall back to a system stack only if the file is absent (and warn).
- `motion.energy` maps to spring presets in `rules/01_motion_design.md`.
- All keys are optional but every referenced asset MUST resolve.

## 4. `content.json` contract

An ordered array of scenes; order defines timeline order unless `startFrame` is set.

```json
{
  "meta": { "title": "Launch", "fps": 30, "width": 1080, "height": 1920 },
  "scenes": [
    {
      "id": "hook",
      "type": "text",
      "durationInFrames": 90,
      "headline": "Meet the future",
      "subhead": "One tap away",
      "media": "sources/images/hero.png",
      "sfx": [{ "src": "whoosh", "atFrame": 0 }],
      "transitionOut": "slide-left"
    }
  ]
}
```

Parsing rules:
- `type` selects a scene component in `src/scenes/` (`text`, `three`, `media`, `grid`…).
  Unknown types are a hard error with a list of available types.
- `durationInFrames` drives `<Sequence>` length; sum must equal the composition
  duration (pad or trim the last scene if needed and log it).
- `media` paths are relative to the bundle root; resolve against `input/<project>/`.
- `sfx[].src` is a name resolved against `src/assets/audio/sfx/` (see rule 03).
- Copy strings are used verbatim; never rewrite, translate, or "improve" them.

## 5. `prompt.txt`

- Free text. Extract: tone, must-have beats, banned elements, CTA, and any explicit
  timing/order overrides.
- If `prompt.txt` conflicts with `styleguide.json` on visual tokens, the styleguide
  wins for tokens; `prompt.txt` wins for narrative structure.
- If it conflicts with a rule file, the rule file wins. Flag the conflict in the report.

## 6. Asset resolution & validation

- Resolve paths case-sensitively and normalize separators.
- Validate that referenced files exist and have expected extensions before render.
- For remote URLs (http/https), treat as `static` fetch targets; prefetch and cache.
- Audio/video assets imported in Remotion must use `staticFile()` or
  `@remotion/media-utils` loaders — never raw filesystem paths at render time.
- Emit a machine-readable `output/<project>/build-report.json` listing: bundle id,
  resolved assets, missing assets, scene durations, and any warnings.

## 7. Failure policy

- Missing required file, unresolvable asset, unknown scene `type`, or duration
  mismatch ⇒ stop and report; do not render a partial/best-effort video silently.
- Warnings (extra keys, orphan assets) ⇒ continue, but record them in the report.
