import { create } from 'zustand';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

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
  player: AudioPlayer | null;
  isPlaying: boolean;
  showArabic: boolean;

  loadPlaylist: (items: PlaylistItem[]) => Promise<void>;
  advance: () => Promise<void>;
  togglePlay: () => void;
  skipTo: (index: number) => Promise<void>;
  toggleArabic: () => void;
  stopAndReset: () => void;
}

function onStatusUpdate(status: { didJustFinish: boolean }) {
  if (status.didJustFinish) {
    usePlaylistStore.getState().advance();
  }
}

async function loadAndPlay(url: string): Promise<AudioPlayer> {
  const prev = usePlaylistStore.getState().player;
  if (prev) {
    prev.remove();
  }

  const player = createAudioPlayer({ uri: url });
  player.addListener('playbackStatusUpdate', onStatusUpdate);
  player.play();
  return player;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  items: [],
  currentIndex: 0,
  currentRepeat: 0,
  player: null,
  isPlaying: false,
  showArabic: true,

  loadPlaylist: async (items) => {
    const { player: prev } = get();
    if (prev) prev.remove();

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    if (items.length === 0) return;

    const player = await loadAndPlay(items[0].url);
    set({ items, currentIndex: 0, currentRepeat: 0, player, isPlaying: true });
  },

  advance: async () => {
    const { items, currentIndex, currentRepeat } = get();
    const current = items[currentIndex];
    if (!current) return;

    const playsLeft = current.repeatCount - 1 - currentRepeat;

    if (playsLeft > 0) {
      const player = await loadAndPlay(current.url);
      set({ player, currentRepeat: currentRepeat + 1 });
    } else {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) {
        set({ isPlaying: false, currentIndex: 0, currentRepeat: 0 });
        return;
      }
      const player = await loadAndPlay(items[nextIndex].url);
      set({ player, currentIndex: nextIndex, currentRepeat: 0, isPlaying: true });
    }
  },

  togglePlay: () => {
    const { player, isPlaying } = get();
    if (!player) return;
    if (isPlaying) {
      player.pause();
      set({ isPlaying: false });
    } else {
      player.play();
      set({ isPlaying: true });
    }
  },

  skipTo: async (index) => {
    const { items } = get();
    if (index < 0 || index >= items.length) return;
    const player = await loadAndPlay(items[index].url);
    set({ player, currentIndex: index, currentRepeat: 0, isPlaying: true });
  },

  toggleArabic: () => set((state) => ({ showArabic: !state.showArabic })),

  stopAndReset: () => {
    const { player } = get();
    if (player) player.remove();
    set({ player: null, isPlaying: false, currentIndex: 0, currentRepeat: 0 });
  },
}));
