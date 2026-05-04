import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const RECENT_KEY = 'takrir_recent_playlists';
const MAX_RECENT = 10;

export interface RecentPlaylist {
  chapterName: string;
  chapterNumber: number;
  fromVerse: number;
  toVerse: number;
}

interface RecentPlaylistsState {
  items: RecentPlaylist[];
  load: () => Promise<void>;
  add: (item: RecentPlaylist) => void;
}

export const useRecentPlaylistsStore = create<RecentPlaylistsState>((set, get) => ({
  items: [],

  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(RECENT_KEY);
      if (raw) set({ items: JSON.parse(raw) as RecentPlaylist[] });
    } catch {
      // ignore
    }
  },

  add: (item) => {
    // Deduplicate by same chapter + verse range
    const filtered = get().items.filter(
      (i) => !(i.chapterNumber === item.chapterNumber && i.fromVerse === item.fromVerse && i.toVerse === item.toVerse),
    );
    const updated = [item, ...filtered].slice(0, MAX_RECENT);
    set({ items: updated });
    SecureStore.setItemAsync(RECENT_KEY, JSON.stringify(updated)).catch(() => null);
  },
}));
