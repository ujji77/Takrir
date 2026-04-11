export interface TrackMeta {
  title: string;
  artist?: string;
}

/** Stable port interface for audio playback. Swap adapters for production vs test vs CI. */
export interface AudioPort {
  /** Start playback at the given rate. Returns false if the call was superseded by a newer play(). */
  play(url: string, rate: number, meta?: TrackMeta): Promise<boolean>;
  pause(): void;
  resume(): void;
  /** Change playback speed of the currently loaded track. */
  setRate(rate: number): void;
  /** Stop and release all resources. */
  stop(): void;
  /** Register a finish callback. Returns an unsubscribe function. */
  onFinish(cb: () => void): () => void;
}
