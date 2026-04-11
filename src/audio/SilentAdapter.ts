import type { AudioPort } from './AudioPort';

/** No-op adapter for CI / headless environments. */
export class SilentAdapter implements AudioPort {
  async play(_url: string, _rate: number): Promise<boolean> { return true; }
  pause(): void {}
  resume(): void {}
  stop(): void {}
  onFinish(_cb: () => void): () => void {
    return () => {};
  }
}
