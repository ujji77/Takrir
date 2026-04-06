import { create } from 'zustand';
import type { UseBoundStore, StoreApi } from 'zustand';
import { ExpoAdapter } from '../audio/ExpoAdapter';
import type { AudioPort } from '../audio/AudioPort';
import { useSettingsStore } from './settings';

export interface PlaylistItem {
  verseKey: string;
  url: string;
  /** All available font text variants. Player picks based on current font setting. */
  texts: {
    text_uthmani: string;
    text_indopak?: string;
    text_imlaei?: string;
    code_v1?: string;
    code_v2?: string;
  };
  /** Always populated from the API — display is controlled by showTranslation setting. */
  translation: string | null;
  repeatCount: number;
}

interface PlaylistState {
  items: PlaylistItem[];
  currentIndex: number;
  currentRepeat: number;
  isPlaying: boolean;

  loadPlaylist: (items: PlaylistItem[]) => Promise<void>;
  advance: () => Promise<void>;
  togglePlay: () => void;
  skipTo: (index: number) => Promise<void>;
  stopAndReset: () => void;
}

export function createPlaylistStore(audio: AudioPort): UseBoundStore<StoreApi<PlaylistState>> {
  return create<PlaylistState>((set, get) => {
    let unsubFinish: (() => void) | null = null;

    function subscribeFinish() {
      unsubFinish?.();
      unsubFinish = audio.onFinish(() => {
        get().advance();
      });
    }

    return {
      items: [],
      currentIndex: 0,
      currentRepeat: 0,
      isPlaying: false,

      loadPlaylist: async (items) => {
        if (items.length === 0) return;
        const rate = useSettingsStore.getState().playbackRate;
        await audio.play(items[0].url, rate);
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
          await audio.play(current.url, rate);
          subscribeFinish();
          set({ currentRepeat: currentRepeat + 1 });
        } else {
          const nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) {
            audio.stop();
            unsubFinish?.();
            unsubFinish = null;
            set({ isPlaying: false, currentIndex: 0, currentRepeat: 0 });
            return;
          }
          await audio.play(items[nextIndex].url, rate);
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
        const rate = useSettingsStore.getState().playbackRate;
        await audio.play(items[index].url, rate);
        subscribeFinish();
        set({ currentIndex: index, currentRepeat: 0, isPlaying: true });
      },

      stopAndReset: () => {
        audio.stop();
        unsubFinish?.();
        unsubFinish = null;
        set({ items: [], isPlaying: false, currentIndex: 0, currentRepeat: 0 });
      },
    };
  });
}

const defaultStore = createPlaylistStore(new ExpoAdapter());

export const usePlaylistStore = defaultStore;
