# 05 — AI Producer Workflow Rules

This rule defines how an **AI Producer Agent** converts raw, unstructured input
(a text brief plus loose image / audio / video files) into a **fully valid project
bundle** under `input/<project_id>/` that the renderer can consume without
modification.

Authority order: `rules/01`–`rules/04` (and this file) win over the raw brief.
The JSON schemas below are **engine-authoritative**; where another rule's example
differs, the schema here matches the actual parser in `src/utils/projectLoader.ts`.

---

## 1. Inputs the Producer receives

| Input | Form | Required |
| ----- | ---- | -------- |
| Brief | Free text (goal, tone, CTA, must-have beats, banned elements) | Yes |
| Images | Loose files: logo, product, hero, screenshots | Optional |
| Audio | Music bed, voiceover/narration, sound effects | Optional |
| Video | B-roll / clips | Optional |
| Brand hints | Brand name, colors, font, energy, 3D vibe | Optional |

Producers MUST NOT invent factual content (names, prices, claims, URLs) that is not
present in the brief or assets. Where copy is missing, use the brief verbatim or a
neutral, generic line — never fabricate specifics.

---

## 2. Output contract

For each job the Producer MUST create exactly this tree:

```
input/<project_id>/
├── prompt.txt            # normalized creative brief (see §7)
├── styleguide.json       # design tokens     (see §5)
├── content.json          # scene timeline    (see §6)
└── sources/
    ├── images/           # .png .jpg .webp .svg
    ├── video/            # .mp4 .mov .webm
    ├── audio/            # music beds + voiceover (.mp3 .wav .m4a)
    │   └── sfx/          # bundle-local sound effects (.wav .mp3)
    ├── fonts/            # optional .ttf .otf .woff2
    └── three/            # optional .glb .gltf .hdr textures
```

Rules:
- Only the three JSON/text files and `sources/` may be written. Never touch `src/`,
  `rules/`, or `Root.tsx`.
- Every asset referenced from `content.json` / `styleguide.json` MUST exist on disk.
- After writing the bundle, the Producer MUST run `npm run bundles` (regenerates the
  registry and copies `sources/` into `public/bundles/<project_id>/`) and confirm the
  bundle loads (§8).

---

## 3. Step 1 — Project id & folder normalization

Produce a predictable folder id:

```
project_<YYYY>_<MM>_<DD>_<slug>
```

- `<YYYY>_<MM>_<DD>` = job date in UTC.
- `<slug>` = short ASCII snake_case derived from the brand or title
  (`[a-z0-9]`, `_` separators, no spaces, ≤ 32 chars). Strip legal suffixes,
  emoji, and diacritics.
- Collapse repeats, trim leading/trailing `_`. Example:
  `"Aurora — Launch 2026!"` → `project_2026_10_12_aurora_launch`.
- If the folder exists, append `_2`, `_3`, … — never overwrite an existing bundle.
- The folder name **is** the bundle id; reference it in reporting.

---

## 4. Step 2 — Media intake, classification, and sanitized filenames

Classify each raw file by type and role, then copy it into its canonical folder with
a sanitized, predictable name.

### 4.1 Classification map

| Role | Detected by | Destination | Canonical name |
| ---- | ----------- | ----------- | -------------- |
| Logo | name hints `logo`, square + transparency, small | `sources/images/` | `logo.<ext>` |
| Product / hero still | high-res still, name hints `product`/`hero` | `sources/images/` | `product.<ext>` / `hero.<ext>` |
| Background | name hints `bg`/`background` | `sources/images/` | `background.<ext>` |
| Other stills | any image | `sources/images/` | `<slug>_<n>.<ext>` |
| B-roll clip | video | `sources/video/` | `broll_<n>.<ext>` |
| Music bed | audio, `music`/`bgm`/long duration | `sources/audio/` | `music.<ext>` |
| Voiceover | audio, `vo`/`voice`/`narration`/speech | `sources/audio/` | `voiceover.<ext>` |
| Sound effect | audio, `sfx`/`whoosh`/`pop`/`click`/`ding`/short | `sources/audio/sfx/` | `<sfxname>.<ext>` |
| Font | `.ttf/.otf/.woff2` | `sources/fonts/` | `<family>_<weight>.<ext>` |
| 3D asset | `.glb/.gltf/.hdr/.ktx2` | `sources/three/` | `<slug>.<ext>` |

### 4.2 Filename sanitization (mandatory)

Apply to every copied asset name (not the `sources/` folder names):

1. Lowercase.
2. Transliterate/strip to ASCII; replace every run of non `[a-z0-9]` with `_`.
3. Collapse repeated `_`; trim leading/trailing `_`.
4. Preserve the original extension, lowercased (`.jpeg` → `.jpg`, `.PNG` → `.png`).
5. Truncate the stem to 48 chars.
6. De-duplicate with `_2`, `_3`, … if a target name already exists.

Result: names are lowercase, space-free, ASCII — safe on Windows and case-insensitive
filesystems, and reproducible.

### 4.3 SFX naming

Bundle-local SFX MUST use the shared catalog names from `rules/03` so triggers stay
reusable: `whoosh`, `pop`, `click`, `ding` (plus `riser`, `impact`, `sparkle`).
Rename a supplied effect to the closest catalog role; if none fits, keep a sanitized
descriptive name and reference it by path in `content.json`.

Resolution note (engine-authoritative): a bare SFX name in `content.json` resolves,
in order, from `sources/audio/sfx/`, then `sources/sfx/`, then `sources/audio/`;
a name containing `/` or a file extension is treated as an exact bundle-relative path.

---

## 5. Step 3 — `styleguide.json` (exact schema)

```json
{
  "brand": "Aurora",
  "themeMode": "dark",
  "colors": {
    "primary": "#7C5CFF",
    "accent": "#22D3EE",
    "background": "#070713",
    "text": "#F5F7FF",
    "muted": "#9AA3B2"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Inter"
  },
  "motion": {
    "speed": "normal",
    "transition": "slide-up"
  },
  "threePreset": "floating-cards",
  "music": {
    "src": "sources/audio/music.wav",
    "volume": 0.3
  }
}
```

Field rules (exact keys; the engine defaults any missing key, but produce them all):

| Key | Type | Allowed values / rule |
| --- | ---- | --------------------- |
| `brand` | string | Brand/title text. |
| `themeMode` | string | `"light"` or `"dark"`. Drives text/panel contrast. |
| `colors.*` | string | 6-digit hex `#RRGGBB`. `background` and `text` must have strong contrast. |
| `fonts.heading` / `fonts.body` | string | Family **names**. If a file exists in `sources/fonts/`, keep the family name consistent with it; otherwise a system fallback is used (and the engine will warn if unregistered). |
| `motion.speed` | string | Energy level: `"slow"`, `"normal"`, `"fast"` → spring presets in `rules/01`. |
| `motion.transition` | string | Default scene transition, e.g. `slide-up`, `fade`, `slide-left`. |
| `threePreset` | string | 3D theme: `"floating-cards"`, `"particles"`, `"mixed"`, or `"none"` → `rules/04` components. |
| `music.src` | string or `null` | Bundle-relative path to the bed, e.g. `sources/audio/music.wav`, or `null`. |
| `music.volume` | number | `0.0–1.0`; recommended `0.25–0.4` (`rules/03`). |

Derivation heuristics:
- Prefer colors/fonts given in the brief. Otherwise pick a cohesive palette whose
  `primary`/`accent` differ by hue and whose `background`/`text` are near-opposites.
- Map brief energy: calm→`slow`, standard→`normal`, punchy/fast→`fast`.
- Map 3D vibe: cards/product→`floating-cards`, abstract/tech→`particles`, both→`mixed`,
  flat graphic→`none`.

---

## 6. Step 4 — `content.json` (exact schema)

```json
{
  "meta": { "title": "Aurora Launch", "fps": 30, "width": 1080, "height": 1920 },
  "scenes": [
    {
      "id": "hook",
      "type": "three",
      "durationInFrames": 110,
      "headline": "Aurora",
      "body": "Design that moves with you.",
      "media": "sources/images/logo.png",
      "sfx": [{ "src": "whoosh", "atFrame": 0, "volume": 0.8, "duck": true }],
      "transitionOut": "slide-up"
    },
    {
      "id": "feature",
      "type": "text",
      "durationInFrames": 110,
      "headline": "Built for Motion",
      "body": "Frame-accurate, deterministic, stunning.",
      "media": "sources/images/product.jpg",
      "sfx": [{ "src": "pop", "atFrame": 12, "volume": 0.8, "duck": true }],
      "transitionOut": "fade"
    },
    {
      "id": "cta",
      "type": "text",
      "durationInFrames": 80,
      "headline": "Get Started",
      "body": "Aurora — available now.",
      "media": null,
      "sfx": [{ "src": "ding", "atFrame": 10, "volume": 0.85, "duck": true }],
      "transitionOut": "fade"
    }
  ],
  "cta": "Try Aurora today",
  "voiceover": {
    "src": "sources/audio/voiceover.wav",
    "atFrame": 20,
    "durationInFrames": 120
  }
}
```

### 6.1 `meta`
- `title` string; `fps` MUST be `30`; `width` `1080`; `height` `1920` (rules 01/04).

### 6.2 `scenes[]` (ordered; order = timeline order)
| Key | Type | Rule |
| --- | ---- | ---- |
| `id` | string | Unique snake_case id. |
| `type` | string | Scene component key. Supported contract (rule 02 §4): `text`, `three`, `media`, `grid`. Unknown types are a hard error. Today `text`/`three` render via the standard overlay; use `text` for copy beats and `three` for 3D-hero beats. |
| `durationInFrames` | integer | ≥ 1. **Sum across scenes MUST equal the composition duration (default `300`)**. |
| `headline` | string | Short kinetic line (word-mode). Keep ≤ ~5 words for legibility at 1080px. |
| `body` | string | Supporting line. **The engine reads `body`; `subhead` is a legacy alias and is ignored.** |
| `media` | string or `null` | Bundle-relative path, e.g. `sources/images/logo.png`. Must resolve. |
| `sfx[]` | array | `{ src, atFrame, volume, duck }`. See §6.3. |
| `transitionOut` | string | Same vocabulary as `motion.transition`. |

### 6.3 `sfx[]` triggers
- `src` string: a catalog **name** (`whoosh`/`pop`/`click`/`ding`) or an exact
  bundle-relative path.
- `atFrame` integer: **scene-relative** frame at 30fps (the engine adds the scene
  start offset). Integer only — snap mid-frame values (rule 03).
- `volume` number `0.7–0.9`.
- `duck` boolean: `true` makes this trigger duck the music bed (`rules/03` §4).
- Max one loud transient per 4–6 frames; do not stack duplicates.

### 6.4 `cta` and `voiceover`
- `cta` string: closing call to action (used as the persistent pill). May be `""`.
- `voiceover` object or `null`: `{ src, atFrame, durationInFrames }` where `atFrame`
  is **composition-relative** (global), and `durationInFrames` = audio length in
  frames (`round(seconds × 30)`). Music ducks under this window automatically.

### 6.5 Timing rules
- Total timeline = 300 frames (10s) unless the composition duration is explicitly
  changed and documented. Producers MUST NOT edit `Root.tsx`; fit the brief to 300.
- Natural beat shape: hook (~90–120), 1–3 feature beats (~60–110 each), CTA (~60–90).
- Every `sfx.atFrame` MUST be `< durationInFrames` of its scene; the CTA `ding`
  typically lands 6–14 frames after the CTA scene starts.

---

## 7. Step 5 — `prompt.txt` extraction

Normalize the raw brief into `prompt.txt` with these sections (plain text, short):

```
Title: <title>
Goal: <one sentence>
Tone: <adjectives>
Energy: <calm|normal|punchy> -> motion.speed <slow|normal|fast>
Must-have beats:
- <beat 1>
- <beat 2>
CTA: <exact CTA copy>
Banned: <elements to avoid, or "none">
Notes: <any explicit order/timing overrides>
```

Rules:
- Copy CTA and headline strings **verbatim** from the brief; never rewrite or translate
  copy that the user supplied.
- Keep only the original intent. Do not add facts.
- `prompt.txt` is optional to the engine (a missing file yields a warning), but the
  Producer MUST always write it.

---

## 8. Step 6 — Validate, register, and report

Producers MUST complete this checklist before reporting success:

- [ ] Folder id matches `project_<YYYY>_<MM>_<DD>_<slug>` and is new.
- [ ] Only `prompt.txt`, `styleguide.json`, `content.json`, `sources/**` were written.
- [ ] All asset filenames are sanitized (lowercase, ASCII, `_`, predictable).
- [ ] Every `media`, `music.src`, `voiceover.src`, and SFX reference resolves on disk.
- [ ] `styleguide.json` validates against §5 (all keys, allowed enums, hex colors).
- [ ] `content.json` validates against §6; `fps`=30, `1080×1920`.
- [ ] Σ `durationInFrames` == composition duration (default 300).
- [ ] All `sfx.atFrame` are integers `< scene duration`; volumes in range.
- [ ] Moment content is deterministic; nothing depends on wall-clock/random (rule 01).
- [ ] `npm run bundles` succeeds and the bundle appears in the registry.
- [ ] Optionally `npx remotion still MainVideo output/<id>-preview.png --frame=60`.

Then report: bundle id, asset counts per folder, total frames, scene list, SFX cues,
and any warned/ignored files.

---

## 9. Failure policy & conflict resolution

- Missing/invalid brief ⇒ stop and ask; do not fabricate a video.
- Unresolvable asset, unknown scene `type`, non-integer `atFrame`, or duration sum
  ≠ 300 ⇒ **fail loudly** naming the offending field; never emit a partial bundle.
- Conflicts resolve in this order: `rules/01`–`rules/05` → `styleguide.json`
  (tokens) → `prompt.txt` (narrative) → defaults. Flag any conflict in the report.
- Extra/unknown files in `sources/` are allowed but must be reported as orphans.

---

## 10. Alignment with rules 01–04

| Source rule | How rule 05 complies |
| ----------- | -------------------- |
| 01 — Motion Design | Fixed 30 FPS / 1080×1920 / 300 frames enforced in §6; `motion.speed` maps to spring energy; no timers/random (deterministic bundle only). |
| 02 — Bundle Parsing | Same folder contract (§2/§3/§4); schemas here are engine-authoritative and note the `body` vs legacy `subhead` field. |
| 03 — Audio & SFX | SFX catalog names + integer scene-relative triggers + `duck` (§6.3); music volume 0.25–0.4 and voiceover ducking (§5/§6.4). |
| 04 — Three.js Standards | `threePreset` selects `floating-cards`/`particles`/`mixed`/`none`; 3D assets routed to `sources/three/`; vertical 9:16 framing assumed throughout. |

---

## 11. Worked example (minimal bundle)

```
input/project_2026_10_12_aurora/
├── prompt.txt
├── styleguide.json            # §5 example
├── content.json               # §6 example (sums to 300)
└── sources/
    ├── images/logo.png
    ├── images/product.jpg
    ├── audio/music.wav
    ├── audio/voiceover.wav
    └── audio/sfx/{whoosh,pop,ding}.wav
```

`110 + 110 + 80 = 300` frames; `whoosh@0` (scene `hook`), `pop@12` (scene `feature`),
`ding@10` (scene `cta`); voiceover at global frame 20 for 120 frames (music ducks
20→140). This is the canonical, engine-valid shape.
