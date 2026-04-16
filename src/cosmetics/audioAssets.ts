import { Platform } from 'react-native';

const selectSfxSource = (oggSource: () => number, iosSource: () => number) =>
  Platform.OS === 'ios' ? iosSource() : oggSource();

export type SoundEffectPreviewSources = {
  roll: readonly AudioAssetSource[];
  move: AudioAssetSource;
  score: AudioAssetSource;
  capture: AudioAssetSource;
};

export type AudioAssetSource = number | string;

export const DEFAULT_MUSIC_TRACK_SOURCE = require('../../assets/audio/bgm/ancient-ambience.mp3') as number;
export const DEFAULT_ROLL_SEQUENCE_SOURCES = [
  selectSfxSource(
    () => require('../../assets/audio/sfx/dice-shake-3.ogg') as number,
    () => require('../../assets/audio/sfx/dice-shake-3.m4a') as number,
  ),
  selectSfxSource(
    () => require('../../assets/audio/sfx/die-throw-2.ogg') as number,
    () => require('../../assets/audio/sfx/die-throw-2.m4a') as number,
  ),
] as const;
export const DEFAULT_MOVE_SOUND_SOURCE = selectSfxSource(
  () => require('../../assets/audio/sfx/move.ogg') as number,
  () => require('../../assets/audio/sfx/move.m4a') as number,
);
export const DEFAULT_SCORE_SOUND_SOURCE = selectSfxSource(
  () => require('../../assets/audio/sfx/score.ogg') as number,
  () => require('../../assets/audio/sfx/score.m4a') as number,
);
export const DEFAULT_CAPTURE_SOUND_SOURCE = selectSfxSource(
  () => require('../../assets/audio/sfx/capture.ogg') as number,
  () => require('../../assets/audio/sfx/capture.m4a') as number,
);

const MUSIC_TRACK_SOURCES: Record<string, number> = {
  music_ancient_001: DEFAULT_MUSIC_TRACK_SOURCE,
  music_procession_001: require('../../assets/audio/bgm/freepik-the-persian-king.mp3') as number,
};

const ROLL_SEQUENCE_SOURCES: Record<string, readonly number[]> = {
  sfx_stone_001: DEFAULT_ROLL_SEQUENCE_SOURCES,
  sfx_bronze_001: DEFAULT_ROLL_SEQUENCE_SOURCES,
};

const MOVE_SOUND_SOURCES: Record<string, number> = {
  sfx_stone_001: DEFAULT_MOVE_SOUND_SOURCE,
  sfx_bronze_001: DEFAULT_MOVE_SOUND_SOURCE,
};

const SCORE_SOUND_SOURCES: Record<string, number> = {
  sfx_stone_001: DEFAULT_SCORE_SOUND_SOURCE,
  sfx_bronze_001: DEFAULT_SCORE_SOUND_SOURCE,
};

const CAPTURE_SOUND_SOURCES: Record<string, number> = {
  sfx_stone_001: DEFAULT_CAPTURE_SOUND_SOURCE,
  sfx_bronze_001: DEFAULT_CAPTURE_SOUND_SOURCE,
};

export const getMusicTrackSource = (assetKey?: string | null, trackUri?: string | null): AudioAssetSource =>
  trackUri ? trackUri : assetKey ? MUSIC_TRACK_SOURCES[assetKey] ?? DEFAULT_MUSIC_TRACK_SOURCE : DEFAULT_MUSIC_TRACK_SOURCE;

export const getSoundEffectPreviewSources = (assetKeys?: {
  rollSequenceAssetKey?: string | null;
  rollSequenceUris?: string[] | null;
  moveAssetKey?: string | null;
  moveUri?: string | null;
  scoreAssetKey?: string | null;
  scoreUri?: string | null;
  captureAssetKey?: string | null;
  captureUri?: string | null;
}): SoundEffectPreviewSources => ({
  roll: assetKeys?.rollSequenceUris?.length
    ? assetKeys.rollSequenceUris
    : assetKeys?.rollSequenceAssetKey
    ? ROLL_SEQUENCE_SOURCES[assetKeys.rollSequenceAssetKey] ?? DEFAULT_ROLL_SEQUENCE_SOURCES
    : DEFAULT_ROLL_SEQUENCE_SOURCES,
  move: assetKeys?.moveUri
    ? assetKeys.moveUri
    : assetKeys?.moveAssetKey
    ? MOVE_SOUND_SOURCES[assetKeys.moveAssetKey] ?? DEFAULT_MOVE_SOUND_SOURCE
    : DEFAULT_MOVE_SOUND_SOURCE,
  score: assetKeys?.scoreUri
    ? assetKeys.scoreUri
    : assetKeys?.scoreAssetKey
    ? SCORE_SOUND_SOURCES[assetKeys.scoreAssetKey] ?? DEFAULT_SCORE_SOUND_SOURCE
    : DEFAULT_SCORE_SOUND_SOURCE,
  capture: assetKeys?.captureUri
    ? assetKeys.captureUri
    : assetKeys?.captureAssetKey
    ? CAPTURE_SOUND_SOURCES[assetKeys.captureAssetKey] ?? DEFAULT_CAPTURE_SOUND_SOURCE
    : DEFAULT_CAPTURE_SOUND_SOURCE,
});
