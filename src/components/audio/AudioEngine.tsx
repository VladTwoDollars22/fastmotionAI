import type { FC } from "react";
import { useMemo } from "react";
import {
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { computeMusicGain, DEFAULT_DUCK_FACTOR, type DuckWindow } from "./ducking";

export interface AudioCue {
  src: string;
  atFrame: number;
  volume?: number;
  duck?: boolean;
  duckFactor?: number;
  durationInFrames?: number;
}

export interface AudioEngineProps {
  musicSrc?: string | null;
  musicVolume?: number;
  cues?: AudioCue[];
  voiceoverSrc?: string | null;
  voiceoverAtFrame?: number;
  voiceoverDurationInFrames?: number | null;
  duckFactor?: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
}

export const AudioEngine: FC<AudioEngineProps> = ({
  musicSrc = null,
  musicVolume = 0.3,
  cues = [],
  voiceoverSrc = null,
  voiceoverAtFrame = 0,
  voiceoverDurationInFrames = null,
  duckFactor = DEFAULT_DUCK_FACTOR,
  fadeInFrames = 10,
  fadeOutFrames = 15,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const windows = useMemo<DuckWindow[]>(() => {
    const list: DuckWindow[] = [];
    if (voiceoverSrc && voiceoverDurationInFrames && voiceoverDurationInFrames > 0) {
      list.push({
        start: voiceoverAtFrame,
        end: voiceoverAtFrame + voiceoverDurationInFrames,
        factor: duckFactor,
      });
    }
    for (const cue of cues) {
      if (cue.duck) {
        list.push({
          start: cue.atFrame,
          end: cue.atFrame + (cue.durationInFrames ?? 12),
          factor: cue.duckFactor ?? duckFactor,
        });
      }
    }
    return list;
  }, [
    cues,
    duckFactor,
    voiceoverAtFrame,
    voiceoverDurationInFrames,
    voiceoverSrc,
  ]);

  const musicGain = computeMusicGain(frame, musicVolume, windows, {
    fadeInFrames,
    fadeOutFrames,
    totalFrames: durationInFrames,
  });

  return (
    <>
      {musicSrc ? (
        <Audio src={staticFile(musicSrc)} volume={musicGain} />
      ) : null}
      {voiceoverSrc ? (
        <Sequence from={voiceoverAtFrame}>
          <Audio src={staticFile(voiceoverSrc)} volume={1} />
        </Sequence>
      ) : null}
      {cues.map((cue, index) => (
        <Sequence key={`${cue.src}-${cue.atFrame}-${index}`} from={cue.atFrame}>
          <Audio src={staticFile(cue.src)} volume={cue.volume ?? 0.8} />
        </Sequence>
      ))}
    </>
  );
};
