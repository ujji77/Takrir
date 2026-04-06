import { createPlaylistStore } from '../store/playlist';
import { MockAdapter } from '../audio/MockAdapter';
import type { PlaylistItem } from '../store/playlist';

// Flush all microtasks/promises
const nextTick = () => new Promise((resolve) => setImmediate(resolve));

const makeItem = (verseKey: string, repeatCount: number = 1): PlaylistItem => ({
  verseKey,
  url: `https://audio/${verseKey}.mp3`,
  texts: { text_uthmani: `arabic-${verseKey}` },
  translation: null,
  repeatCount,
});

jest.mock('../store/settings', () => ({
  useSettingsStore: {
    getState: () => ({ playbackRate: 1 }),
  },
}));

describe('playlist store', () => {
  let audio: MockAdapter;
  let store: ReturnType<typeof createPlaylistStore>;

  beforeEach(() => {
    audio = new MockAdapter();
    store = createPlaylistStore(audio);
  });

  it('starts empty and not playing', () => {
    const s = store.getState();
    expect(s.items).toHaveLength(0);
    expect(s.isPlaying).toBe(false);
  });

  it('loadPlaylist starts at index 0 and sets isPlaying', async () => {
    await store.getState().loadPlaylist([makeItem('2:1'), makeItem('2:2')]);
    const s = store.getState();
    expect(s.currentIndex).toBe(0);
    expect(s.isPlaying).toBe(true);
    expect(audio.calls[0]).toMatchObject({ type: 'play', url: 'https://audio/2:1.mp3' });
  });

  it('advance moves to next verse after finish', async () => {
    await store.getState().loadPlaylist([makeItem('2:1'), makeItem('2:2')]);
    audio.triggerFinish();
    await nextTick();
    expect(store.getState().currentIndex).toBe(1);
    expect(store.getState().currentRepeat).toBe(0);
  });

  it('repeats the same verse before advancing', async () => {
    await store.getState().loadPlaylist([makeItem('2:1', 2), makeItem('2:2')]);
    audio.triggerFinish();
    await nextTick();
    expect(store.getState().currentIndex).toBe(0);
    expect(store.getState().currentRepeat).toBe(1);
    audio.triggerFinish();
    await nextTick();
    expect(store.getState().currentIndex).toBe(1);
    expect(store.getState().currentRepeat).toBe(0);
  });

  it('stops and resets when last verse finishes', async () => {
    await store.getState().loadPlaylist([makeItem('2:1')]);
    audio.triggerFinish();
    await nextTick();
    const s = store.getState();
    expect(s.isPlaying).toBe(false);
    expect(s.currentIndex).toBe(0);
    expect(audio.lastCall()).toMatchObject({ type: 'stop' });
  });

  it('togglePlay pauses when playing', async () => {
    await store.getState().loadPlaylist([makeItem('2:1')]);
    store.getState().togglePlay();
    expect(store.getState().isPlaying).toBe(false);
    expect(audio.lastCall()).toMatchObject({ type: 'pause' });
  });

  it('togglePlay resumes when paused', async () => {
    await store.getState().loadPlaylist([makeItem('2:1')]);
    store.getState().togglePlay(); // pause
    store.getState().togglePlay(); // resume
    expect(store.getState().isPlaying).toBe(true);
    expect(audio.lastCall()).toMatchObject({ type: 'resume' });
  });

  it('skipTo jumps to the given index', async () => {
    await store.getState().loadPlaylist([makeItem('2:1'), makeItem('2:2'), makeItem('2:3')]);
    await store.getState().skipTo(2);
    expect(store.getState().currentIndex).toBe(2);
    expect(audio.lastCall()).toMatchObject({ type: 'play', url: 'https://audio/2:3.mp3' });
  });

  it('stopAndReset clears state and stops audio', async () => {
    await store.getState().loadPlaylist([makeItem('2:1'), makeItem('2:2')]);
    store.getState().stopAndReset();
    const s = store.getState();
    expect(s.items).toHaveLength(0);
    expect(s.isPlaying).toBe(false);
    expect(audio.lastCall()).toMatchObject({ type: 'stop' });
  });

  it('finish callbacks after stopAndReset do not advance', async () => {
    await store.getState().loadPlaylist([makeItem('2:1'), makeItem('2:2')]);
    store.getState().stopAndReset();
    // The onFinish unsubscribed — triggerFinish should be a no-op
    audio.triggerFinish();
    await nextTick();
    expect(store.getState().currentIndex).toBe(0);
    expect(store.getState().isPlaying).toBe(false);
  });
});
