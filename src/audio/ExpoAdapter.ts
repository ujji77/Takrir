import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import type { AudioPort } from './AudioPort';

export class ExpoAdapter implements AudioPort {
  private player: AudioPlayer | null = null;
  private finishCb: (() => void) | null = null;
  private playId = 0;

  async play(url: string, rate: number): Promise<void> {
    // Increment before the await so any concurrent call gets a higher id.
    const id = ++this.playId;

    // Stop current audio synchronously before yielding.
    if (this.player) {
      this.player.pause();
      this.player.remove();
      this.player = null;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    // A newer play() call started while we were awaiting — bail out.
    if (id !== this.playId) return;

    const player = createAudioPlayer({ uri: url });

    player.addListener('playbackStatusUpdate', (status: { didJustFinish: boolean }) => {
      if (status.didJustFinish) this.finishCb?.();
    });

    // Call setPlaybackRate before play() so currentRate is set on the native player.
    // play() reads currentRate and calls playImmediately(atRate: currentRate),
    // which is the correct path for rates > 1x — no isPlaying state needed.
    if (rate !== 1) {
      player.setPlaybackRate(rate);
    }
    player.play();

    this.player = player;
  }

  pause(): void {
    this.player?.pause();
  }

  setRate(rate: number): void {
    this.player?.setPlaybackRate(rate);
  }

  resume(): void {
    this.player?.play();
  }

  stop(): void {
    if (this.player) {
      this.player.pause();
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
