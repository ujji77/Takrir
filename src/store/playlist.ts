import { create } from 'zustand';
import { audioService } from '../audio/AudioService';

export interface PlaylistItem {
  verseKey: string;
  url: string;
  textUthmani: string;
  repeatCount: number;
}

interface PlaylistState {
  items: PlaylistItem[];
  currentIndex: number;
  currentRepeat: number;
  isPlaying: boolean;
  showArabic: boolean;

  loadPlaylist: (items: PlaylistItem[]) => Promise<void>;
  advance: () => Promise<void>;
  togglePlay: () => void;
  skipTo: (index: number) => Promise<void>;
  toggleArabic: () => void;
  stopAndReset: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  items: [],
  currentIndex: 0,
  currentRepeat: 0,
  isPlaying: false,
  showArabic: true,

  loadPlaylist: async (items) => {
    if (items.length === 0) return;
    await audioService.play(items[0].url, () => usePlaylistStore.getState().advance());
    set({ items, currentIndex: 0, currentRepeat: 0, isPlaying: true });
  },

  advance: async () => {
    const { items, currentIndex, currentRepeat } = get();
    const current = items[currentIndex];
    if (!current) return;

    const playsLeft = current.repeatCount - 1 - currentRepeat;

    if (playsLeft > 0) {
      await audioService.play(current.url, () => usePlaylistStore.getState().advance());
      set({ currentRepeat: currentRepeat + 1 });
    } else {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) {
        audioService.destroy();
        set({ isPlaying: false, currentIndex: 0, currentRepeat: 0 });
        return;
      }
      await audioService.play(items[nextIndex].url, () => usePlaylistStore.getState().advance());
      set({ currentIndex: nextIndex, currentRepeat: 0, isPlaying: true });
    }
  },

  togglePlay: () => {
    const { isPlaying } = get();
    audioService.setPaused(isPlaying);
    set({ isPlaying: !isPlaying });
  },

  skipTo: async (index) => {
    const { items } = get();
    if (index < 0 || index >= items.length) return;
    await audioService.play(items[index].url, () => usePlaylistStore.getState().advance());
    set({ currentIndex: index, currentRepeat: 0, isPlaying: true });
  },

  toggleArabic: () => set((state) => ({ showArabic: !state.showArabic })),

  stopAndReset: () => {
    audioService.destroy();
    set({ isPlaying: false, currentIndex: 0, currentRepeat: 0 });
  },
}));
