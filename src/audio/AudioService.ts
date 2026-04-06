import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

export interface AudioService {
  play(url: string, onFinish: () => void): Promise<void>;
  setPaused(paused: boolean): void;
  destroy(): void;
}

class ExpoAudioService implements AudioService {
  private player: AudioPlayer | null = null;

  async play(url: string, onFinish: () => void): Promise<void> {
    this.destroy();

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    const player = createAudioPlayer({ uri: url });
    player.addListener('playbackStatusUpdate', (status: { didJustFinish: boolean }) => {
      if (status.didJustFinish) onFinish();
    });
    player.play();
    this.player = player;
  }

  setPaused(paused: boolean): void {
    if (!this.player) return;
    if (paused) {
      this.player.pause();
    } else {
      this.player.play();
    }
  }

  destroy(): void {
    if (this.player) {
      this.player.remove();
      this.player = null;
    }
  }
}

export const audioService: AudioService = new ExpoAudioService();
