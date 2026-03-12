import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

type AudioEvent = 'bgm' | 'roll' | 'move' | 'score' | 'capture' | 'win' | 'lose' | 'tray';
type StandardAudioEvent = Exclude<AudioEvent, 'roll'>;
type AudioPreferences = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
};

const AUDIO_PREFERENCES_KEY = 'ur.audio.preferences';
const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  musicEnabled: true,
  sfxEnabled: true,
};

const selectSfxSource = (oggSource: number, iosSource: number) => (Platform.OS === 'ios' ? iosSource : oggSource);

/* eslint-disable @typescript-eslint/no-require-imports */
const ROLL_SEQUENCE_SOURCES = [
  selectSfxSource(require('../assets/audio/sfx/dice-shake-3.ogg'), require('../assets/audio/sfx/dice-shake-3.m4a')),
  selectSfxSource(require('../assets/audio/sfx/die-throw-2.ogg'), require('../assets/audio/sfx/die-throw-2.m4a')),
] as const;

const AUDIO_SOURCES: Record<StandardAudioEvent, number> = {
  bgm: require('../assets/audio/bgm/ancient-ambience.mp3'),
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

const AUDIO_POLYPHONY: Record<StandardAudioEvent, number> = {
  bgm: 1,
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
  private preferences = DEFAULT_AUDIO_PREFERENCES;
  private preferencesLoaded = false;
  private preferencesPromise: Promise<void> | null = null;
  private rollPlaybackToken = 0;

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

  private async ensurePreferences() {
    if (this.preferencesLoaded) {
      return;
    }

    if (!this.preferencesPromise) {
      this.preferencesPromise = this.loadPreferences();
    }

    await this.preferencesPromise;
  }

  private async loadPreferences() {
    try {
      const rawPreferences = await AsyncStorage.getItem(AUDIO_PREFERENCES_KEY);
      if (!rawPreferences) {
        this.preferences = DEFAULT_AUDIO_PREFERENCES;
        return;
      }

      const parsed = JSON.parse(rawPreferences) as Partial<AudioPreferences>;
      this.preferences = {
        musicEnabled: parsed.musicEnabled ?? DEFAULT_AUDIO_PREFERENCES.musicEnabled,
        sfxEnabled: parsed.sfxEnabled ?? DEFAULT_AUDIO_PREFERENCES.sfxEnabled,
      };
    } catch (error) {
      this.preferences = DEFAULT_AUDIO_PREFERENCES;
      this.warnOnce('audio-preferences-load', 'Could not load saved audio settings. Using defaults instead.', error);
    } finally {
      this.preferencesLoaded = true;
      this.preferencesPromise = null;
    }
  }

  private async persistPreferences() {
    try {
      await AsyncStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      this.warnOnce('audio-preferences-save', 'Could not save audio settings.', error);
    }
  }

  private async stopEvent(eventKey: AudioEvent) {
    if (eventKey === 'roll') {
      this.rollPlaybackToken += 1;
    }

    const soundGroup = this.sounds[eventKey];
    if (!soundGroup || soundGroup.length === 0) {
      return;
    }

    await Promise.all(
      soundGroup.map(async (sound) => {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.stopAsync();
          }
        } catch (error) {
          this.warnOnce(`stop-${eventKey}`, `Failed to stop ${eventKey} audio event.`, error);
        }
      }),
    );
  }

  private async loadSound(eventKey: AudioEvent, source: number, warningId: string, label?: string) {
    const sound = new Audio.Sound();

    try {
      await sound.loadAsync(
        source,
        {
          isLooping: eventKey === 'bgm',
          shouldPlay: false,
          volume: AUDIO_VOLUMES[eventKey],
        },
        false,
      );

      return sound;
    } catch (error) {
      this.warnOnce(
        warningId,
        `Could not load ${label ?? eventKey} audio. Gameplay will continue without this sound.`,
        error,
      );
      return null;
    }
  }

  private async replayAndWait(sound: Audio.Sound, eventKey: AudioEvent, playbackToken: number) {
    return new Promise<boolean>((resolve) => {
      let settled = false;

      const finish = (result: boolean) => {
        if (settled) {
          return;
        }

        settled = true;
        sound.setOnPlaybackStatusUpdate(null);
        resolve(result);
      };

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          finish(false);
          return;
        }

        if (playbackToken !== this.rollPlaybackToken) {
          finish(false);
          return;
        }

        if (status.didJustFinish) {
          finish(true);
        }
      });

      void sound.replayAsync().catch((error) => {
        this.warnOnce(`play-${eventKey}`, `Failed to play ${eventKey} audio event.`, error);
        finish(false);
      });
    });
  }

  private async playRollSequence() {
    const soundGroup = this.sounds.roll;
    if (!soundGroup || soundGroup.length === 0) {
      this.warnOnce('missing-roll', 'Sound not available for roll.');
      return;
    }

    this.rollPlaybackToken += 1;
    const playbackToken = this.rollPlaybackToken;

    await Promise.all(
      soundGroup.map(async (sound) => {
        try {
          const status = await sound.getStatusAsync();
          if (!status.isLoaded) {
            return;
          }

          if (status.isPlaying) {
            await sound.stopAsync();
          }

          await sound.setPositionAsync(0);
        } catch (error) {
          this.warnOnce('stop-roll', 'Failed to reset roll audio event.', error);
        }
      }),
    );

    for (const sound of soundGroup) {
      if (playbackToken !== this.rollPlaybackToken) {
        return;
      }

      const completed = await this.replayAndWait(sound, 'roll', playbackToken);
      if (!completed) {
        return;
      }
    }
  }

  private async initialize() {
    await this.ensurePreferences();

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

    await Promise.all([
      ...(Object.keys(AUDIO_SOURCES) as StandardAudioEvent[]).map(async (eventKey) => {
        const loadedSounds: Audio.Sound[] = [];

        for (let index = 0; index < AUDIO_POLYPHONY[eventKey]; index += 1) {
          const sound = await this.loadSound(eventKey, AUDIO_SOURCES[eventKey], `load-${eventKey}`);
          if (sound) {
            loadedSounds.push(sound);
          }
        }

        if (loadedSounds.length > 0) {
          this.sounds[eventKey] = loadedSounds;
          this.soundCursor[eventKey] = 0;
        }
      }),
      (async () => {
        const loadedRollSequence: Audio.Sound[] = [];

        for (const [index, source] of ROLL_SEQUENCE_SOURCES.entries()) {
          const sound = await this.loadSound('roll', source, `load-roll-${index}`, `roll cue ${index + 1}`);
          if (sound) {
            loadedRollSequence.push(sound);
          }
        }

        if (loadedRollSequence.length > 0) {
          this.sounds.roll = loadedRollSequence;
        }
      })(),
    ]);

    this.initialized = true;
  }

  async start() {
    await this.ensureInit();
    if (this.preferences.musicEnabled) {
      await this.play('bgm');
    }
  }

  async play(eventKey: AudioEvent) {
    await this.ensureInit();

    if (eventKey === 'bgm' && !this.preferences.musicEnabled) {
      return;
    }

    if (eventKey !== 'bgm' && !this.preferences.sfxEnabled) {
      return;
    }

    if (eventKey === 'roll') {
      await this.playRollSequence();
      return;
    }

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

  async getPreferences(): Promise<AudioPreferences> {
    await this.ensurePreferences();
    return { ...this.preferences };
  }

  async setMusicEnabled(enabled: boolean) {
    await this.ensurePreferences();
    this.preferences = { ...this.preferences, musicEnabled: enabled };
    await this.persistPreferences();

    if (!this.initialized) {
      return;
    }

    if (enabled) {
      await this.play('bgm');
      return;
    }

    await this.stopEvent('bgm');
  }

  async setSfxEnabled(enabled: boolean) {
    await this.ensurePreferences();
    this.preferences = { ...this.preferences, sfxEnabled: enabled };
    await this.persistPreferences();
  }

  async stopAll() {
    this.rollPlaybackToken += 1;

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
