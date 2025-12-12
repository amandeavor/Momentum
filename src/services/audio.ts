/**
 * Audio Service for Momentum
 * 
 * Handles white noise playback, background audio, and audio session management.
 * Supports custom user-uploaded audio files stored locally or in Supabase.
 */
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Paths, Directory, File } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUDIO_STORAGE_KEY = '@momentum_audio_settings';

// Get audio directory lazily to avoid early initialization issues
const getAudioDir = () => new Directory(Paths.document, 'audio');

// Default white noise options
export type WhiteNoiseType = 'rain' | 'ocean' | 'forest' | 'cafe' | 'fan' | 'custom';

interface AudioSettings {
  enabled: boolean;
  volume: number; // 0-1
  selectedType: WhiteNoiseType;
  customFilePath?: string;
  fadeInDuration: number; // ms
  fadeOutDuration: number; // ms
}

const defaultSettings: AudioSettings = {
  enabled: false,
  volume: 0.5,
  selectedType: 'rain',
  fadeInDuration: 2000,
  fadeOutDuration: 1000,
};

class AudioService {
  private sound: Audio.Sound | null = null;
  private settings: AudioSettings = defaultSettings;
  private isLoaded: boolean = false;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize audio session and load settings
   */
  private async init() {
    try {
      // Configure audio session for background playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load saved settings
      await this.loadSettings();

      // Ensure audio directory exists
      const audioDir = getAudioDir();
      if (!audioDir.exists) {
        audioDir.create();
      }
    } catch (error) {
      console.error('[AudioService] Init error:', error);
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(AUDIO_STORAGE_KEY);
      if (stored) {
        this.settings = { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[AudioService] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings() {
    try {
      await AsyncStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[AudioService] Failed to save settings:', error);
    }
  }

  /**
   * Get audio source for a white noise type
   */
  private getAudioSource(type: WhiteNoiseType): any {
    // In production, these would be bundled audio assets
    // For now, return placeholder - actual implementation needs audio files
    switch (type) {
      case 'rain':
        return require('@/assets/audio/white-noise.mp3');
      case 'ocean':
        return require('@/assets/audio/white-noise.mp3');
      case 'forest':
        return require('@/assets/audio/white-noise.mp3');
      case 'cafe':
        return require('@/assets/audio/white-noise.mp3');
      case 'fan':
        return require('@/assets/audio/white-noise.mp3');
      case 'custom':
        if (this.settings.customFilePath) {
          return { uri: this.settings.customFilePath };
        }
        return require('@/assets/audio/white-noise.mp3');
      default:
        return require('@/assets/audio/white-noise.mp3');
    }
  }

  /**
   * Load and prepare audio for playback
   */
  async load(type?: WhiteNoiseType): Promise<boolean> {
    try {
      // Unload existing sound
      if (this.sound) {
        await this.unload();
      }

      const source = this.getAudioSource(type || this.settings.selectedType);
      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          isLooping: true,
          volume: 0, // Start silent for fade in
          shouldPlay: false,
        }
      );

      this.sound = sound;
      this.isLoaded = true;

      // Set up status listener
      sound.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate.bind(this));

      return true;
    } catch (error) {
      console.error('[AudioService] Failed to load audio:', error);
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Handle playback status updates
   */
  private onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('[AudioService] Playback error:', status.error);
      }
    }
  }

  /**
   * Start playback with fade in
   */
  async play(): Promise<void> {
    if (!this.sound || !this.isLoaded) {
      const loaded = await this.load();
      if (!loaded) return;
    }

    try {
      // Start at zero volume
      await this.sound!.setVolumeAsync(0);
      await this.sound!.playAsync();

      // Fade in
      this.fadeVolume(0, this.settings.volume, this.settings.fadeInDuration);
    } catch (error) {
      console.error('[AudioService] Play error:', error);
    }
  }

  /**
   * Stop playback with fade out
   */
  async stop(): Promise<void> {
    if (!this.sound) return;

    try {
      // Fade out
      await this.fadeVolume(this.settings.volume, 0, this.settings.fadeOutDuration);
      
      await this.sound.stopAsync();
    } catch (error) {
      console.error('[AudioService] Stop error:', error);
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (!this.sound) return;

    try {
      await this.sound.pauseAsync();
    } catch (error) {
      console.error('[AudioService] Pause error:', error);
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (!this.sound) return;

    try {
      await this.sound.playAsync();
    } catch (error) {
      console.error('[AudioService] Resume error:', error);
    }
  }

  /**
   * Unload audio
   */
  async unload(): Promise<void> {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('[AudioService] Unload error:', error);
      }
      this.sound = null;
      this.isLoaded = false;
    }
  }

  /**
   * Set volume with optional fade
   */
  async setVolume(volume: number, fade: boolean = false): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (fade && this.sound) {
      await this.fadeVolume(this.settings.volume, clampedVolume, 500);
    } else if (this.sound) {
      await this.sound.setVolumeAsync(clampedVolume);
    }
    
    this.settings.volume = clampedVolume;
    await this.saveSettings();
  }

  /**
   * Fade volume from start to end over duration
   */
  private async fadeVolume(from: number, to: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
      }

      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = (to - from) / steps;
      let currentStep = 0;
      let currentVolume = from;

      this.fadeInterval = setInterval(async () => {
        currentStep++;
        currentVolume += volumeStep;

        if (this.sound) {
          await this.sound.setVolumeAsync(Math.max(0, Math.min(1, currentVolume)));
        }

        if (currentStep >= steps) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Change white noise type
   */
  async setNoiseType(type: WhiteNoiseType): Promise<void> {
    const wasPlaying = this.sound ? (await this.sound.getStatusAsync()).isLoaded && 
      (await this.sound.getStatusAsync() as any).isPlaying : false;
    
    this.settings.selectedType = type;
    await this.saveSettings();

    if (wasPlaying) {
      await this.stop();
      await this.load(type);
      await this.play();
    }
  }

  /**
   * Import custom audio file
   */
  async importCustomAudio(sourceUri: string, filename: string): Promise<string | null> {
    try {
      const audioDir = getAudioDir();
      if (!audioDir.exists) {
        audioDir.create();
      }
      
      const destFile = new File(audioDir, filename);
      // Copy source to destination using the new API
      const sourceFile = new File(sourceUri);
      const content = await sourceFile.text();
      destFile.write(content);
      
      this.settings.customFilePath = destFile.uri;
      await this.saveSettings();
      
      return destFile.uri;
    } catch (error) {
      console.error('[AudioService] Failed to import audio:', error);
      return null;
    }
  }

  /**
   * Get current settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  async updateSettings(updates: Partial<AudioSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();
  }

  /**
   * Check if audio is currently playing
   */
  async isPlaying(): Promise<boolean> {
    if (!this.sound) return false;
    try {
      const status = await this.sound.getStatusAsync();
      return status.isLoaded && (status as any).isPlaying;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const audioService = new AudioService();
export default audioService;
