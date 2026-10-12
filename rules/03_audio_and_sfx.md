# 03 — Audio & SFX Rules

Audio must be frame-accurate and stable across renders. Never rely on the host
audio clock, timers, or the Web Audio API's real-time scheduling.

## 1. Loading audio

- Use Remotion primitives only: `<Audio>`, `<Video>`'s audio, and `staticFile()`.
- Local, generated, or downloaded assets must be referenced with `staticFile()`
  (place shared SFX in `src/assets/audio/sfx/`, music in `src/assets/audio/music/`).
- Analyze waveform/beat info with `@remotion/media-utils`
  (`getAudioData`, `getAudioDurationInSeconds`, `useAudioData`) — these run
  deterministically during rendering.
- Local fonts/assets under `public/` are addressed through `staticFile()`; do not use
  OS file paths.

## 2. Frame-accurate SFX triggers

- SFX are positioned with `<Sequence from={frame}>` wrapping an `<Audio>`; Remotion
  converts frames→seconds using the composition `fps` (30). Never hardcode seconds.
- Trigger frames must be integers. If an event lands mid-frame, snap it to the
  nearest frame and log the delta.
- Volume fades are frame-driven:

```tsx
const frame = useCurrentFrame();
const gain = interpolate(frame, [from, from + 6], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
<Sequence from={from}>
  <Audio src={staticFile("audio/sfx/whoosh.mp3")} volume={gain} />
</Sequence>
```

- `sfx[].src` names in `content.json` resolve to files in `src/assets/audio/sfx/`
  (extension optional; prefer `.wav` for sharp transients, `.mp3` for beds).
- Common triggers: `whoosh` (transitions), `pop` (UI), `click`, `riser`, `impact`,
  `sparkle`. Reuse the shared library; do not add one-off duplicates.

## 3. SFX catalog

Keep a manifest `src/assets/audio/sfx/index.ts` exporting a typed map of name → file
and recommended default gain, so scenes reference names, not paths.

## 4. Audio ducking (music under narration/SFX)

Ducking lowers the music bed while a voice/SFX bus is active. Implement it
deterministically, in frames — never with real-time audio nodes.

Rules:
- Music is a full-length `<Audio>` at the composition root with a base
  `volume` from `styleguide.json` (typically `0.25–0.4`).
- Build a per-frame gain envelope for the music:
  1. Start at `musicBase`.
  2. For each duck window, ramp down to `musicBase * duckFactor`
     (`duckFactor ≈ 0.25–0.4`) over an attack of ~4–8 frames.
  3. Hold while the voice/SFX is active.
  4. Release back to `musicBase` over ~10–20 frames.
- Prefer `interpolate`/`interpolateColors`-style envelopes built from arrays of duck
  windows, or sum contributions from each window, then clamp to `[0, musicBase]`.

```tsx
// src/components/audio/useDucking.ts  (shared helper)
export const musicGain = (frame: number, base: number, windows: DuckWindow[]) => {
  let gain = base;
  for (const w of windows) {
    const env = interpolate(
      frame,
      [w.start - 6, w.start, w.end, w.end + 14],
      [base, base * w.factor, base * w.factor, base],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    gain = Math.min(gain, env); // duck to the deepest active window
  }
  return gain;
};
```

- Duck windows come from `content.json` (`sfx[].atFrame` + duration) and from any
  narration track. Round all frames to integers.
- Never exceed total clip length; duck release must finish before the music ends or
  fade the music out over the last ~15 frames.

## 5. Mixing levels (starting point)

| Bus        | Level          |
| ---------- | -------------- |
| Music base | 0.30           |
| Music duck | 0.08 (≈27%)    |
| SFX        | 0.70–0.90      |
| Narration  | 1.00           |

- Normalize loud SFX to ~−6 dBFS-sourced assets; don't clip by stacking.
- One loud transient per 4–6 frames maximum; cull duplicate triggers within that window.

## 6. Determinism & QA

- [ ] No real-time audio scheduling, timers, or `AudioContext`.
- [ ] All triggers via `<Sequence from={int}>` at 30 fps.
- [ ] Volume envelopes are `interpolate`-based and clamped.
- [ ] Every `sfx` reference resolves in the catalog; missing files fail the build.
- [ ] Music does not exceed clip length; fade-in ~10 frames, fade-out ~15 frames.
- [ ] Duck release completes before the composition ends.
