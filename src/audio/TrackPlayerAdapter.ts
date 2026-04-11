import TrackPlayer, { Event } from 'react-native-track-player';
import type { AudioPort, TrackMeta } from './AudioPort';

export class TrackPlayerAdapter implements AudioPort {
  private finishCb: (() => void) | null = null;
  private playId = 0;

  constructor() {
    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      this.finishCb?.();
    });
  }

  async play(url: string, rate: number, meta?: TrackMeta): Promise<boolean> {
    const id = ++this.playId;
    // Clear before reset so a queued PlaybackQueueEnded can't fire the old callback.
    this.finishCb = null;

    await TrackPlayer.reset();
    if (id !== this.playId) return false;

    await TrackPlayer.add({
      url,
      title: meta?.title ?? 'Quran',
      artist: meta?.artist ?? 'Quran',
    });
    if (id !== this.playId) {
      TrackPlayer.reset();
      return false;
    }

    if (rate !== 1) {
      await TrackPlayer.setRate(rate);
    }

    await TrackPlayer.play();
    return id === this.playId;
  }

  pause(): void {
    TrackPlayer.pause();
  }

  resume(): void {
    TrackPlayer.play();
  }

  stop(): void {
    this.finishCb = null;
    TrackPlayer.reset();
  }

  setRate(rate: number): void {
    TrackPlayer.setRate(rate);
  }

  onFinish(cb: () => void): () => void {
    this.finishCb = cb;
    return () => {
      if (this.finishCb === cb) this.finishCb = null;
    };
  }
}
