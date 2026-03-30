import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import type { AudioStatus } from 'expo-audio';
import { Platform } from 'react-native';
import { createShuffledPlaylistOrder } from './audioPlaylist';

type AudioEvent = 'bgm' | 'roll' | 'move' | 'score' | 'capture' | 'win' | 'lose' | 'tray' | 'boardImpact';
type SoundEffectEvent = Exclude<AudioEvent, 'bgm' | 'roll'>;
type AudioPreferences = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
};

const AUDIO_PREFERENCES_KEY = 'ur.audio.preferences';
const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 1,
  sfxVolume: 1,
};

const clampAudioPreferenceVolume = (value: unknown, fallback = 1) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
};

const selectSfxSource = (oggSource: number, iosSource: number) => (Platform.OS === 'ios' ? iosSource : oggSource);

/* eslint-disable @typescript-eslint/no-require-imports */
const BGM_SOURCES = [
  require('../assets/audio/bgm/ancient-ambience.mp3'),
  require('../assets/audio/bgm/freepik-orbis-romanus.mp3'),
  require('../assets/audio/bgm/freepik-saltatio-in-atrio.mp3'),
  require('../assets/audio/bgm/freepik-the-persian-king.mp3'),
] as const;

const ROLL_SEQUENCE_SOURCES = [
  selectSfxSource(require('../assets/audio/sfx/dice-shake-3.ogg'), require('../assets/audio/sfx/dice-shake-3.m4a')),
  selectSfxSource(require('../assets/audio/sfx/die-throw-2.ogg'), require('../assets/audio/sfx/die-throw-2.m4a')),
] as const;

const SOUND_EFFECT_SOURCES: Record<SoundEffectEvent, number> = {
  move: selectSfxSource(require('../assets/audio/sfx/move.ogg'), require('../assets/audio/sfx/move.m4a')),
  score: selectSfxSource(require('../assets/audio/sfx/score.ogg'), require('../assets/audio/sfx/score.m4a')),
  capture: selectSfxSource(require('../assets/audio/sfx/capture.ogg'), require('../assets/audio/sfx/capture.m4a')),
  win: selectSfxSource(require('../assets/audio/sfx/win.ogg'), require('../assets/audio/sfx/win.m4a')),
  lose: selectSfxSource(require('../assets/audio/sfx/lose.ogg'), require('../assets/audio/sfx/lose.m4a')),
  tray: selectSfxSource(require('../assets/audio/sfx/drop.ogg'), require('../assets/audio/sfx/drop.m4a')),
  boardImpact: require('../assets/audio/sfx/thump.mp3'),
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
  boardImpact: 0.9,
};

const AUDIO_POLYPHONY: Record<SoundEffectEvent, number> = {
  move: 1,
  score: 1,
  capture: 1,
  win: 1,
  lose: 1,
  tray: 6,
  boardImpact: 1,
};

class GameAudio {
  private sounds: Partial<Record<AudioEvent, AudioPlayer[]>> = {};
  private soundCursor: Partial<Record<AudioEvent, number>> = {};
  private loadPromises: Partial<Record<AudioEvent, Promise<void>>> = {};
  private warned = new Set<string>();
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private preferences = DEFAULT_AUDIO_PREFERENCES;
  private preferencesLoaded = false;
  private preferencesPromise: Promise<void> | null = null;
  private rollPlaybackToken = 0;
  private bgmQueue: number[] = [];
  private bgmCurrentPlayerIndex: number | null = null;
  private bgmLastPlayerIndex: number | null = null;
  private bgmPlaybackToken = 0;

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
        musicVolume: clampAudioPreferenceVolume(parsed.musicVolume, DEFAULT_AUDIO_PREFERENCES.musicVolume),
        sfxVolume: clampAudioPreferenceVolume(parsed.sfxVolume, DEFAULT_AUDIO_PREFERENCES.sfxVolume),
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

  private async resetPlayer(player: AudioPlayer, warningId: string, message: string) {
    try {
      player.pause();

      if (player.currentTime > 0) {
        await player.seekTo(0);
      }
    } catch (error) {
      this.warnOnce(warningId, message, error);
    }
  }

  private getPreferenceVolume(eventKey: AudioEvent) {
    return eventKey === 'bgm' ? this.preferences.musicVolume : this.preferences.sfxVolume;
  }

  private getEffectiveVolume(eventKey: AudioEvent) {
    return AUDIO_VOLUMES[eventKey] * this.getPreferenceVolume(eventKey);
  }

  private applyVolumeToEvent(eventKey: AudioEvent) {
    const nextVolume = this.getEffectiveVolume(eventKey);
    const soundGroup = this.sounds[eventKey];
    if (!soundGroup || soundGroup.length === 0) {
      return;
    }

    soundGroup.forEach((player) => {
      player.volume = nextVolume;
    });
  }

  private async loadEventGroup(eventKey: AudioEvent) {
    if (eventKey === 'bgm') {
      const loadedBgmTracks: AudioPlayer[] = [];

      for (const [sourceIndex, source] of BGM_SOURCES.entries()) {
        const sound = await this.loadSound('bgm', source, `load-bgm-${sourceIndex}`, `bgm track ${sourceIndex + 1}`);
        if (sound) {
          const trackIndex = loadedBgmTracks.length;
          sound.addListener('playbackStatusUpdate', (status) => {
            this.handleBgmStatusUpdate(trackIndex, status);
          });
          loadedBgmTracks.push(sound);
        }
      }

      if (loadedBgmTracks.length > 0) {
        this.sounds.bgm = loadedBgmTracks;
      }
      return;
    }

    if (eventKey === 'roll') {
      const loadedRollSequence: AudioPlayer[] = [];

      for (const [index, source] of ROLL_SEQUENCE_SOURCES.entries()) {
        const sound = await this.loadSound('roll', source, `load-roll-${index}`, `roll cue ${index + 1}`);
        if (sound) {
          loadedRollSequence.push(sound);
        }
      }

      if (loadedRollSequence.length > 0) {
        this.sounds.roll = loadedRollSequence;
      }
      return;
    }

    const soundEffectEvent = eventKey as SoundEffectEvent;
    const loadedSounds: AudioPlayer[] = [];

    for (let index = 0; index < AUDIO_POLYPHONY[soundEffectEvent]; index += 1) {
      const sound = await this.loadSound(soundEffectEvent, SOUND_EFFECT_SOURCES[soundEffectEvent], `load-${soundEffectEvent}`);
      if (sound) {
        loadedSounds.push(sound);
      }
    }

    if (loadedSounds.length > 0) {
      this.sounds[soundEffectEvent] = loadedSounds;
      this.soundCursor[soundEffectEvent] = 0;
    }
  }

  private async ensureEventLoaded(eventKey: AudioEvent) {
    await this.ensureInit();

    if (this.sounds[eventKey]?.length) {
      return;
    }

    const existingLoad = this.loadPromises[eventKey];
    if (existingLoad) {
      await existingLoad;
      return;
    }

    const loadPromise = this.loadEventGroup(eventKey);
    this.loadPromises[eventKey] = loadPromise;

    try {
      await loadPromise;
    } finally {
      if (this.loadPromises[eventKey] === loadPromise) {
        delete this.loadPromises[eventKey];
      }
    }
  }

  private refillBgmQueue(trackCount: number) {
    this.bgmQueue = createShuffledPlaylistOrder(trackCount, this.bgmLastPlayerIndex);
  }

  private getNextBgmTrackIndex(trackCount: number) {
    if (this.bgmQueue.length === 0) {
      this.refillBgmQueue(trackCount);
    }

    const nextIndex = this.bgmQueue.shift();
    if (nextIndex === undefined) {
      return null;
    }

    this.bgmLastPlayerIndex = nextIndex;
    return nextIndex;
  }

  private handleBgmStatusUpdate(trackIndex: number, status: AudioStatus) {
    if (!status.didJustFinish || !this.preferences.musicEnabled) {
      return;
    }

    if (this.bgmCurrentPlayerIndex !== trackIndex) {
      return;
    }

    void this.playNextBgmTrack(this.bgmPlaybackToken).catch(() => {
      // restartPlayer already logs the playback failure.
    });
  }

  private async playNextBgmTrack(playbackToken: number) {
    const soundGroup = this.sounds.bgm;
    if (!soundGroup || soundGroup.length === 0) {
      this.warnOnce('missing-bgm', 'Sound not available for bgm.');
      return;
    }

    if (!this.preferences.musicEnabled || playbackToken !== this.bgmPlaybackToken) {
      return;
    }

    const nextIndex = this.getNextBgmTrackIndex(soundGroup.length);
    if (nextIndex === null) {
      return;
    }

    const player = soundGroup[nextIndex];
    this.bgmCurrentPlayerIndex = nextIndex;

    try {
      await this.restartPlayer(player, 'bgm');
    } catch (error) {
      this.bgmCurrentPlayerIndex = null;
      throw error;
    } finally {
      if (!this.preferences.musicEnabled || playbackToken !== this.bgmPlaybackToken) {
        await this.resetPlayer(player, 'stop-bgm-track', 'Failed to stop bgm audio event.');
      }
    }
  }

  private async stopEvent(eventKey: AudioEvent) {
    if (eventKey === 'roll') {
      this.rollPlaybackToken += 1;
    }

    if (eventKey === 'bgm') {
      this.bgmPlaybackToken += 1;

      const currentTrackIndex = this.bgmCurrentPlayerIndex;
      const currentTrack = currentTrackIndex === null ? null : this.sounds.bgm?.[currentTrackIndex];
      if (currentTrackIndex !== null && currentTrack?.playing) {
        this.bgmQueue.unshift(currentTrackIndex);
      }

      this.bgmCurrentPlayerIndex = null;
    }

    const soundGroup = this.sounds[eventKey];
    if (!soundGroup || soundGroup.length === 0) {
      return;
    }

    await Promise.all(
      soundGroup.map((player) => this.resetPlayer(player, `stop-${eventKey}`, `Failed to stop ${eventKey} audio event.`)),
    );
  }

  private waitForLoad(player: AudioPlayer) {
    if (player.isLoaded) {
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let subscription: { remove: () => void } | null = null;

      const finish = (result: boolean) => {
        if (settled) {
          return;
        }

        settled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        subscription?.remove();
        resolve(result);
      };

      timeoutId = setTimeout(() => finish(player.isLoaded), 4_000);
      subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded) {
          finish(true);
        }
      });
    });
  }

  private async loadSound(eventKey: AudioEvent, source: number, warningId: string, label?: string) {
    let player: AudioPlayer | null = null;

    try {
      player = createAudioPlayer(source, { downloadFirst: true, updateInterval: 120 });
      player.loop = false;
      player.volume = this.getEffectiveVolume(eventKey);

      const isLoaded = await this.waitForLoad(player);
      if (isLoaded) {
        return player;
      }

      this.warnOnce(
        warningId,
        `Could not load ${label ?? eventKey} audio. Gameplay will continue without this sound.`,
      );
      player.remove();
      return null;
    } catch (error) {
      this.warnOnce(
        warningId,
        `Could not load ${label ?? eventKey} audio. Gameplay will continue without this sound.`,
        error,
      );

      if (player) {
        try {
          player.remove();
        } catch {
          // Best effort cleanup.
        }
      }

      return null;
    }
  }

  private async restartPlayer(player: AudioPlayer, eventKey: AudioEvent) {
    try {
      if (player.playing) {
        player.pause();
      }

      if (player.currentTime > 0) {
        await player.seekTo(0);
      }

      player.play();
    } catch (error) {
      this.warnOnce(`play-${eventKey}`, `Failed to play ${eventKey} audio event.`, error);
      throw error;
    }
  }

  private async replayAndWait(player: AudioPlayer, eventKey: AudioEvent, playbackToken: number) {
    return new Promise<boolean>((resolve) => {
      let settled = false;

      const finish = (result: boolean) => {
        if (settled) {
          return;
        }

        settled = true;
        subscription.remove();
        resolve(result);
      };

      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (playbackToken !== this.rollPlaybackToken) {
          finish(false);
          return;
        }

        if (status.didJustFinish) {
          finish(true);
        }
      });

      void this.restartPlayer(player, eventKey).catch(() => {
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
      soundGroup.map((player) => this.resetPlayer(player, 'stop-roll', 'Failed to reset roll audio event.')),
    );

    for (const player of soundGroup) {
      if (playbackToken !== this.rollPlaybackToken) {
        return;
      }

      const completed = await this.replayAndWait(player, 'roll', playbackToken);
      if (!completed) {
        return;
      }
    }
  }

  private async initialize() {
    await this.ensurePreferences();

    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });
      await setIsAudioActiveAsync(true);
    } catch (error) {
      this.warnOnce('audio-mode', 'Audio mode initialization failed. Continuing without guaranteed playback mode.', error);
    }

    this.initialized = true;
  }

  async start() {
    await this.ensureInit();
    if (this.preferences.musicEnabled) {
      await this.play('bgm');
    }
  }

  async play(eventKey: AudioEvent) {
    await this.ensureEventLoaded(eventKey);

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
        if (this.bgmCurrentPlayerIndex !== null || soundGroup.some((player) => player.playing)) {
          return;
        }

        this.bgmPlaybackToken += 1;
        await this.playNextBgmTrack(this.bgmPlaybackToken);
        return;
      }

      const cursor = this.soundCursor[eventKey] ?? 0;
      const player = soundGroup[cursor % soundGroup.length];
      this.soundCursor[eventKey] = (cursor + 1) % soundGroup.length;
      await this.restartPlayer(player, eventKey);
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

  async setMusicVolume(volume: number) {
    await this.ensurePreferences();
    this.preferences = { ...this.preferences, musicVolume: clampAudioPreferenceVolume(volume) };
    await this.persistPreferences();

    if (!this.initialized) {
      return;
    }

    this.applyVolumeToEvent('bgm');
  }

  async setSfxVolume(volume: number) {
    await this.ensurePreferences();
    this.preferences = { ...this.preferences, sfxVolume: clampAudioPreferenceVolume(volume) };
    await this.persistPreferences();

    if (!this.initialized) {
      return;
    }

    (Object.keys(AUDIO_VOLUMES) as AudioEvent[])
      .filter((eventKey) => eventKey !== 'bgm')
      .forEach((eventKey) => {
        this.applyVolumeToEvent(eventKey);
      });
  }

  async stopAll() {
    this.rollPlaybackToken += 1;
    this.bgmPlaybackToken += 1;

    const soundList = Object.values(this.sounds)
      .flat()
      .filter((player): player is AudioPlayer => !!player);

    await Promise.all(
      soundList.map(async (player) => {
        try {
          player.pause();
          if (player.currentTime > 0) {
            await player.seekTo(0);
          }
          player.remove();
        } catch (error) {
          this.warnOnce('stop-unload', 'Error while unloading audio resources. Resources may stay allocated.', error);
        }
      }),
    );

    try {
      await setIsAudioActiveAsync(false);
    } catch (error) {
      this.warnOnce('audio-deactivate', 'Audio session deactivation failed after stopping all sounds.', error);
    }

    this.sounds = {};
    this.soundCursor = {};
    this.loadPromises = {};
    this.bgmQueue = [];
    this.bgmCurrentPlayerIndex = null;
    this.bgmLastPlayerIndex = null;
    this.initialized = false;
    this.initPromise = null;
  }
}

export const gameAudio = new GameAudio();
