# 03 — Audio & SFX Rules (Cinematic Edition)

Audio must be frame-accurate, stable across renders, and **cinematic** — a layered
sound design, never an afterthought. Never use the host audio clock, timers, or the
Web Audio API's real-time scheduling.

## 0. MANDATORY AUDIO SFX PIPELINE (non-negotiable)

Every generated video bundle MUST ship **dynamic Sound Effects (SFX) synchronized to
visual motion beats**. Silent videos are strictly forbidden.

REQUIRED SFX EVENTS:

1. **UI Interactions** — snappy click/tap sounds on button presses and form inputs
   (`click.mp3` / `pop.mp3`).
2. **Scene Transitions & Motion** — smooth digital whooshes/sweeps during slide, scale,
   or swipe scene changes (`whoosh.mp3` / `sweep.mp3`).
3. **Impact & Alerts** — glitch error sounds or heavy bass-drops on warning/error
   reveals (`glitch.mp3` / `impact.mp3`).
4. **Success & Tickers** — rising-pitch chimes or ticking sounds on progress bars, score
   counters (PageSpeed gauge tick), and checkmark reveals.

Implementation:
- Bind SFX with `@remotion/media-utils` or Remotion `<Audio />` tags, driven
  **dynamically** from `content.json` (`sfx[].atFrame`) or from scene frame triggers —
  never hardcoded seconds.
- When a bundle declares no SFX assets, fall back to the shared SFX library
  (`public/assets/audio/sfx/`, see §0.1/§1/§3) so every render still carries a
  beat-locked soundtrack. Missing coverage is a build failure, not a silent render.

## 0.1 — Reusable Sound Library, Naming & Asset Acquisition

**Asset acquisition is permitted.** Agents MAY download, fetch, or generate
**royalty-free, license-clear** clean UI SFX and ambient music (`.mp3` / `.wav`)
whenever a bundle needs them.

- **Mandatory location.** ALL downloaded or generated sound assets MUST be placed in
  the shared reusable library:
  - SFX → `public/assets/audio/sfx/`
  - Music → `public/assets/audio/music/`
- **Standardized naming.** `<base>_<variant>.<ext>` in lowercase snake_case, e.g.
  `whoosh_fast.mp3`, `click_tactile.mp3`, `glitch_impact.mp3`, `ticker_counter.mp3`,
  `chime_success.mp3`. Validate with `isStandardAudioName()` (see §0.1 registry).
- **Registry.** Every asset is registered by a stable id in
  `src/utils/audioLibrary.ts` (`SFX_LIBRARY` / `MUSIC_LIBRARY`); scenes reference it
  through `sfxSrc(id)` / `musicSrc(id)` and the `<PlaySfx>` / `<PlaySfxTrack>` /
  `<PlayMusic>` helpers — never a hardcoded path.
- **Licensing.** Only royalty-free / CC0 / self-generated audio. Record the source
  and license alongside the asset so provenance is auditable.
- **Silent videos are forbidden.** Every exported video MUST feature synchronized SFX
  and an ambient audio layer (§0, §6).

## 1. Loading audio

- Use Remotion primitives only: `<Audio>`, `<Video>`'s audio, and `staticFile()`.
- Local/generated/downloaded assets are referenced via `staticFile()`; bundle-local
  SFX live in `sources/audio/sfx/`, while the **shared reusable library** lives in
  `public/assets/audio/sfx/` (SFX) and `public/assets/audio/music/` (music) and is
  accessed through the registry in `src/utils/audioLibrary.ts`.
- Analyze waveform/beat info with `@remotion/media-utils` (`getAudioData`,
  `getAudioDurationInSeconds`, `useAudioData`) — deterministic during rendering.

## 2. Frame-accurate SFX triggers

- Position SFX with `<Sequence from={int}>` wrapping `<Audio>`; Remotion converts
  frames→seconds using `fps` (30). Never hardcode seconds.
- Trigger frames are integers; snap mid-frame values and log the delta.
- Volume fades are frame-driven (`interpolate` with clamped ends).
- `sfx[].src` resolves (in order) from `sources/audio/sfx/`, `sources/sfx/`,
  `sources/audio/`; a name containing `/` or an extension is an exact path.

## 3. SFX catalog (extend, don't duplicate)

Core: `whoosh` (transitions), `pop` (UI), `click`, `ding`, `riser`, `impact`, `sparkle`.
Pipeline-required minimum set (§0): `click`/`pop` (UI), `whoosh`/`sweep` (transitions),
`glitch`/`impact` (alerts), and a rising `ding`/`tick` (tickers, gauges, checkmarks).
Cinematic additions used by the producer: `glitch_rumble` (sub-bass impact),
`hush_reverse` (pre-drop mute), `shimmer_merge` (fluid merge payoff),
`click_chime` (resolution chime), `tick` (typing/typo cascade), `sub_drop`.

Keep a typed manifest in `src/utils/audioLibrary.ts` (`SFX_LIBRARY` / `MUSIC_LIBRARY`:
id → standardized file + default gain), plus the `<PlaySfx>` helper for frame-locked
placement with pitch modulation.

## 4. Audio ducking (music under narration/SFX)

- Music is a full-length `<Audio>` at the composition root; base volume from
  `styleguide.json` (`0.25–0.4`).
- Build a per-frame gain envelope: attack ~4–8 frames, hold, release ~10–20 frames,
  taking the **minimum** across all active duck windows; clamp to `[0, musicBase]`.
- Duck windows come from `content.json` (`sfx[].atFrame` + duration, `duck: true`) and
  from the voiceover track. Round all frames to integers.
- Release must finish before the music ends, or fade the music out over the last ~15 frames.

## 5. Mixing levels (starting point)

| Bus | Level |
| --- | ----- |
| Music base | 0.30 |
| Music duck | 0.08 (≈27%) |
| SFX | 0.70–0.90 |
| Sub-bass impact | 0.85–0.95 |
| Narration | 1.00 |

- Normalize loud SFX to ~−6 dBFS; never clip by stacking.
- Max one loud transient per 4–6 frames; cull duplicates.

## 6. Cinematic Audio Architecture (MANDATORY layering)

Sound design is a **layer stack** aligned to the visual beat sheet. Every scene MUST
schedule the following layers — using the bundle's own SFX assets, or the shared SFX
library fallback (§0) when the bundle supplies none:

1. **Sub-bass impact sweep on scene cuts** — a low `impact`/`glitch_rumble`/`sub_drop`
   on every hard cut, morph, and explosion; place exactly on the cut frame.
2. **High-frequency UI tick/pop cascade on kinetic text** — one `tick`/`pop` per
   character or word entrance (stagger matches the visual stagger, e.g. every 2–4 frames),
   volume tapering across the cascade; a `ding`/`click_chime` on the resolved word.
3. **Ambient tension risers** — a `riser`/`hush_reverse` leading into each hero reveal,
   peaking on the impact frame (reverse-swell = silence-then-hit).
4. **Crystal-clear chime resolutions** — `click_chime`/`shimmer_merge` on the payoff
   (checkmark, merge complete, final headline).

Layering rules:
- Align every layer to integer frames; derive them from `content.json` beats so the
  design stays automated (no hand-placed timings that drift when the bundle changes).
- Keep the low/mid/high bands from masking: duck music under impacts and narration.
- The final frame must resolve (chime/release), never cut mid-riser.

## 7. Determinism & QA

- [ ] No real-time audio scheduling, timers, or `AudioContext`.
- [ ] All triggers via `<Sequence from={int}>` at 30 fps.
- [ ] Volume envelopes `interpolate`-based and clamped.
- [ ] Every `sfx` reference resolves; missing files fail the build.
- [ ] Mandatory SFX pipeline satisfied (§0): UI clicks, transition whooshes, alert
      impacts, and ticker/success chimes are present; the render is never silent.
- [ ] Shared library honored (§0.1): downloaded/generated audio lives in
      `public/assets/audio/sfx|music/` with standardized `base_variant` names, is
      registered in `src/utils/audioLibrary.ts`, and is royalty-free/license-clear.
- [ ] Cinematic layers present: sub-bass on cuts, tick/pop cascades on text,
      riser into reveals, chime on resolution (§6).
- [ ] Music does not exceed clip length; fade-in ~10 frames, fade-out ~15 frames.
- [ ] Duck release completes before the composition ends.
