# 03 — Audio & SFX Rules (Cinematic Edition)

Audio must be frame-accurate, stable across renders, and **cinematic** — a layered
sound design, never an afterthought. Never use the host audio clock, timers, or the
Web Audio API's real-time scheduling.

## 1. Loading audio

- Use Remotion primitives only: `<Audio>`, `<Video>`'s audio, and `staticFile()`.
- Local/generated/downloaded assets are referenced via `staticFile()`; bundle-local
  SFX live in `sources/audio/sfx/` (shared library: `src/assets/audio/sfx/`,
  music: `src/assets/audio/music/`).
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
Cinematic additions used by the producer: `glitch_rumble` (sub-bass impact),
`hush_reverse` (pre-drop mute), `shimmer_merge` (fluid merge payoff),
`click_chime` (resolution chime), `tick` (typing/typo cascade), `sub_drop`.

Keep a typed manifest in `src/assets/audio/sfx/index.ts` (name → file + default gain).

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
schedule (as the bundle's assets allow):

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
- [ ] Cinematic layers present: sub-bass on cuts, tick/pop cascades on text,
      riser into reveals, chime on resolution (§6).
- [ ] Music does not exceed clip length; fade-in ~10 frames, fade-out ~15 frames.
- [ ] Duck release completes before the composition ends.
