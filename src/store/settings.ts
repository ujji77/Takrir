import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { syncSettingToCloud } from '../persistence/syncSetting';

const DEFAULT_RECITATION_ID = Number(process.env.EXPO_PUBLIC_DEFAULT_RECITATION_ID ?? 7);
const STORE_KEY = 'takrir_recitation_id';

export const PREF_CATEGORY = 'takrir';
export const PREF_RECITATION_KEY = 'recitation_id';

interface SettingsState {
  recitationId: number;
  setRecitation: (id: number) => Promise<void>;
  loadPersistedSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  recitationId: DEFAULT_RECITATION_ID,

  setRecitation: async (id) => {
    set({ recitationId: id });
    SecureStore.setItemAsync(STORE_KEY, String(id)).catch(() => null);
    syncSettingToCloud(PREF_CATEGORY, PREF_RECITATION_KEY, String(id)).catch(() => null);
  },

  loadPersistedSettings: async () => {
    const stored = await SecureStore.getItemAsync(STORE_KEY);
    if (stored) {
      set({ recitationId: Number(stored) });
    }
  },
}));
