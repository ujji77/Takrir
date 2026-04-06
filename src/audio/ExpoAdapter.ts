import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import type { AudioPort } from './AudioPort';

export class ExpoAdapter implements AudioPort {
  private player: AudioPlayer | null = null;
  private finishCb: (() => void) | null = null;

  async play(url: string, rate: number): Promise<void> {
    this.stop();

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    const player = createAudioPlayer({ uri: url });

    player.addListener('playbackStatusUpdate', (status: { didJustFinish: boolean }) => {
      if (status.didJustFinish) this.finishCb?.();
    });

    player.play();

    if (rate !== 1) {
      player.setPlaybackRate(rate);
    }
    this.player = player;
  }

  pause(): void {
    this.player?.pause();
  }

  resume(): void {
    this.player?.play();
  }

  stop(): void {
    if (this.player) {
      this.player.remove();
      this.player = null;
    }
    this.finishCb = null;
  }

  onFinish(cb: () => void): () => void {
    this.finishCb = cb;
    return () => {
      this.finishCb = null;
    };
  }
}
