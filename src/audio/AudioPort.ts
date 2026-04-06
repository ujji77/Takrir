/** Stable port interface for audio playback. Swap adapters for production vs test vs CI. */
export interface AudioPort {
  /** Start playback at the given rate. Each call invalidates any previous onFinish listener. */
  play(url: string, rate: number): Promise<void>;
  pause(): void;
  resume(): void;
  /** Stop and release all resources. */
  stop(): void;
  /** Register a finish callback. Returns an unsubscribe function. */
  onFinish(cb: () => void): () => void;
}
