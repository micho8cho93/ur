import { Audio } from 'expo-av';
import { Platform } from 'react-native';

type AudioEvent = 'bgm' | 'roll' | 'move' | 'score' | 'capture' | 'win' | 'lose' | 'tray';

const selectSfxSource = (oggSource: number, iosSource: number) => (Platform.OS === 'ios' ? iosSource : oggSource);

/* eslint-disable @typescript-eslint/no-require-imports */
const AUDIO_SOURCES: Record<AudioEvent, number> = {
  bgm: require('../assets/audio/bgm/ancient-ambience.mp3'),
  // Keep the provided OGG cues on platforms that handle them directly.
  // iOS uses AAC transcodes because Expo AV on AVFoundation is more reliable with m4a.
  roll: selectSfxSource(require('../assets/audio/sfx/roll.ogg'), require('../assets/audio/sfx/roll.m4a')),
  move: selectSfxSource(require('../assets/audio/sfx/move.ogg'), require('../assets/audio/sfx/move.m4a')),
  score: selectSfxSource(require('../assets/audio/sfx/score.ogg'), require('../assets/audio/sfx/score.m4a')),
  capture: selectSfxSource(require('../assets/audio/sfx/capture.ogg'), require('../assets/audio/sfx/capture.m4a')),
  win: selectSfxSource(require('../assets/audio/sfx/win.ogg'), require('../assets/audio/sfx/win.m4a')),
  lose: selectSfxSource(require('../assets/audio/sfx/lose.ogg'), require('../assets/audio/sfx/lose.m4a')),
  tray: selectSfxSource(require('../assets/audio/sfx/drop.ogg'), require('../assets/audio/sfx/drop.m4a')),
};
/* eslint-enable @typescript-eslint/no-require-imports */

const AUDIO_VOLUMES: Record<AudioEvent, number> = {
  bgm: 0.45,
  roll: 0.85,
  move: 0.7,
  score: 0.8,
  capture: 0.84,
  win: 0.88,
  lose: 0.86,
  tray: 0.5,
};

const AUDIO_POLYPHONY: Record<AudioEvent, number> = {
  bgm: 1,
  roll: 1,
  move: 1,
  score: 1,
  capture: 1,
  win: 1,
  lose: 1,
  tray: 6,
};

class GameAudio {
  private sounds: Partial<Record<AudioEvent, Audio.Sound[]>> = {};
  private soundCursor: Partial<Record<AudioEvent, number>> = {};
  private warned = new Set<string>();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private warnOnce(id: string, message: string, error?: unknown) {
    if (this.warned.has(id)) return;
    this.warned.add(id);

    if (error) {
      console.warn(`[audio] ${message}`, error);
      return;
    }

    console.warn(`[audio] ${message}`);
  }

  private async ensureInit() {
    if (this.initialized) return;

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    await this.initPromise;
  }

  private async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      this.warnOnce('audio-mode', 'Audio mode initialization failed. Continuing without guaranteed playback mode.', error);
    }

    await Promise.all(
      (Object.keys(AUDIO_SOURCES) as AudioEvent[]).map(async (eventKey) => {
        const loadedSounds: Audio.Sound[] = [];

        for (let index = 0; index < AUDIO_POLYPHONY[eventKey]; index += 1) {
          const sound = new Audio.Sound();

          try {
            await sound.loadAsync(
              AUDIO_SOURCES[eventKey],
              {
                isLooping: eventKey === 'bgm',
                shouldPlay: false,
                volume: AUDIO_VOLUMES[eventKey],
              },
              false,
            );
            loadedSounds.push(sound);
          } catch (error) {
            this.warnOnce(
              `load-${eventKey}`,
              `Could not load ${eventKey} audio. Gameplay will continue without this sound.`,
              error,
            );
          }
        }

        if (loadedSounds.length > 0) {
          this.sounds[eventKey] = loadedSounds;
          this.soundCursor[eventKey] = 0;
        }
      }),
    );

    this.initialized = true;
  }

  async start() {
    await this.ensureInit();
    await this.play('bgm');
  }

  async play(eventKey: AudioEvent) {
    await this.ensureInit();

    const soundGroup = this.sounds[eventKey];
    if (!soundGroup || soundGroup.length === 0) {
      this.warnOnce(`missing-${eventKey}`, `Sound not available for ${eventKey}.`);
      return;
    }

    try {
      if (eventKey === 'bgm') {
        const sound = soundGroup[0];
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          return;
        }

        await sound.playAsync();
        return;
      }

      const cursor = this.soundCursor[eventKey] ?? 0;
      const sound = soundGroup[cursor % soundGroup.length];
      this.soundCursor[eventKey] = (cursor + 1) % soundGroup.length;
      await sound.replayAsync();
    } catch (error) {
      this.warnOnce(`play-${eventKey}`, `Failed to play ${eventKey} audio event.`, error);
    }
  }

  async stopAll() {
    const soundList = Object.values(this.sounds)
      .flat()
      .filter((sound): sound is Audio.Sound => !!sound);

    await Promise.all(
      soundList.map(async (sound) => {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.stopAsync();
          }
          await sound.unloadAsync();
        } catch (error) {
          this.warnOnce('stop-unload', 'Error while unloading audio resources. Resources may stay allocated.', error);
        }
      }),
    );

    this.sounds = {};
    this.soundCursor = {};
    this.initialized = false;
    this.initPromise = null;
  }
}

export const gameAudio = new GameAudio();
