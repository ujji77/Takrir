import { create } from 'zustand';
import type { UseBoundStore, StoreApi } from 'zustand';
import { ExpoAdapter } from '../audio/ExpoAdapter';
import type { AudioPort } from '../audio/AudioPort';
import { useSettingsStore } from './settings';

export interface PlaylistItem {
  verseKey: string;
  /** Audio URLs keyed by recitation ID — pre-fetched for all supported reciters. */
  audioUrls: Record<number, string>;
  text_uthmani: string;
  text_indopak: string | null;
  /** Always populated from the API — display controlled by showTranslation setting. */
  translation: string | null;
  repeatCount: number;
}

interface PlaylistState {
  items: PlaylistItem[];
  currentIndex: number;
  currentRepeat: number;
  isPlaying: boolean;
  repeatPlaylist: boolean;

  loadPlaylist: (items: PlaylistItem[]) => Promise<void>;
  advance: () => Promise<void>;
  togglePlay: () => void;
  skipTo: (index: number) => Promise<void>;
  applyPlaybackRate: (rate: number) => void;
  toggleRepeatPlaylist: () => void;
  stopAndReset: () => void;
}

function resolveUrl(item: PlaylistItem): string {
  const reciterId = useSettingsStore.getState().recitationId;
  return item.audioUrls[reciterId] ?? Object.values(item.audioUrls)[0] ?? '';
}

export function createPlaylistStore(audio: AudioPort): UseBoundStore<StoreApi<PlaylistState>> {
  const store = create<PlaylistState>((set, get) => {
    let unsubFinish: (() => void) | null = null;

    function subscribeFinish() {
      unsubFinish?.();
      unsubFinish = audio.onFinish(() => {
        get().advance();
      });
    }

    // Live reciter switching — restart current verse with new URL when reciter changes.
    useSettingsStore.subscribe(async (state, prevState) => {
      if (state.recitationId === prevState.recitationId) return;
      const { items, currentIndex, isPlaying } = get();
      if (!isPlaying || items.length === 0) return;
      const url = resolveUrl(items[currentIndex]);
      if (!url) return;
      const rate = useSettingsStore.getState().playbackRate;
      const played = await audio.play(url, rate);
      if (!played) return;
      subscribeFinish();
    });

    return {
      items: [],
      currentIndex: 0,
      currentRepeat: 0,
      isPlaying: false,
      repeatPlaylist: false,

      loadPlaylist: async (items) => {
        if (items.length === 0) return;
        const rate = useSettingsStore.getState().playbackRate;
        const played = await audio.play(resolveUrl(items[0]), rate);
        if (!played) return;
        subscribeFinish();
        set({ items, currentIndex: 0, currentRepeat: 0, isPlaying: true });
      },

      advance: async () => {
        const { items, currentIndex, currentRepeat } = get();
        const current = items[currentIndex];
        if (!current) return;

        const rate = useSettingsStore.getState().playbackRate;
        const playsLeft = current.repeatCount - 1 - currentRepeat;

        if (playsLeft > 0) {
          const played = await audio.play(resolveUrl(current), rate);
          if (!played) return;
          subscribeFinish();
          set({ currentRepeat: currentRepeat + 1 });
        } else {
          const nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) {
            if (get().repeatPlaylist && items.length > 0) {
              const firstUrl = resolveUrl(items[0]);
              if (!firstUrl) return;
              const played = await audio.play(firstUrl, rate);
              if (!played) return;
              subscribeFinish();
              set({ currentIndex: 0, currentRepeat: 0, isPlaying: true });
            } else {
              audio.stop();
              unsubFinish?.();
              unsubFinish = null;
              set({ isPlaying: false, currentIndex: 0, currentRepeat: 0 });
            }
            return;
          }
          const played = await audio.play(resolveUrl(items[nextIndex]), rate);
          if (!played) return;
          subscribeFinish();
          set({ currentIndex: nextIndex, currentRepeat: 0, isPlaying: true });
        }
      },

      togglePlay: () => {
        const { isPlaying } = get();
        if (isPlaying) {
          audio.pause();
        } else {
          audio.resume();
        }
        set({ isPlaying: !isPlaying });
      },

      skipTo: async (index) => {
        const { items } = get();
        if (index < 0 || index >= items.length) return;
        // Unsubscribe finish listener first to prevent advance() racing with this skip.
        unsubFinish?.();
        unsubFinish = null;
        const rate = useSettingsStore.getState().playbackRate;
        const played = await audio.play(resolveUrl(items[index]), rate);
        if (!played) return;
        subscribeFinish();
        set({ currentIndex: index, currentRepeat: 0, isPlaying: true });
      },

      applyPlaybackRate: (rate) => {
        audio.setRate(rate);
      },

      toggleRepeatPlaylist: () => {
        set((s) => ({ repeatPlaylist: !s.repeatPlaylist }));
      },

      stopAndReset: () => {
        audio.stop();
        unsubFinish?.();
        unsubFinish = null;
        set({ items: [], isPlaying: false, currentIndex: 0, currentRepeat: 0 });
      },
    };
  });

  return store;
}

const defaultStore = createPlaylistStore(new ExpoAdapter());
export const usePlaylistStore = defaultStore;
