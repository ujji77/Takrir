import type { AudioPort } from './AudioPort';

export type AudioCall =
  | { type: 'play'; url: string; rate: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' };

/** Test adapter. Records calls and lets tests drive finish events via triggerFinish(). */
export class MockAdapter implements AudioPort {
  calls: AudioCall[] = [];
  private finishCb: (() => void) | null = null;

  async play(url: string, rate: number): Promise<boolean> {
    this.calls.push({ type: 'play', url, rate });
    this.finishCb = null;
    return true;
  }

  pause(): void {
    this.calls.push({ type: 'pause' });
  }

  resume(): void {
    this.calls.push({ type: 'resume' });
  }

  stop(): void {
    this.calls.push({ type: 'stop' });
    this.finishCb = null;
  }

  onFinish(cb: () => void): () => void {
    this.finishCb = cb;
    return () => {
      this.finishCb = null;
    };
  }

  /** Simulate a track finishing — drives the playlist state machine in tests. */
  triggerFinish(): void {
    this.finishCb?.();
  }

  lastCall(): AudioCall | undefined {
    return this.calls[this.calls.length - 1];
  }

  reset(): void {
    this.calls = [];
    this.finishCb = null;
  }
}
