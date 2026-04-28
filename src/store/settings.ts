import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { fetchPreferences } from '../api/preferences';
import { syncSettingsToCloud } from '../persistence/syncSetting';
import type { QuranFont } from '../types/api';

export type { QuranFont };
export type FontScale = 'S' | 'M' | 'L' | 'XL';

export const FONT_SCALE_VALUES: Record<FontScale, number> = { S: 2, M: 4, L: 7, XL: 10 };
export const FONT_SCALE_SIZES: Record<FontScale, number> = { S: 22, M: 28, L: 36, XL: 44 };
export const FONT_SCALES: FontScale[] = ['S', 'M', 'L', 'XL'];
export const QURAN_FONTS: QuranFont[] = ['text_uthmani', 'text_indopak'];
export const PLAYBACK_RATES = [0.5, 1, 1.5, 2] as const;

/** Curated reciter IDs pre-fetched so the user can switch live during playback. */
export const SUPPORTED_RECITATION_IDS = [1, 3, 7, 10] as const;

export const PREF_CATEGORY = 'takrir';

const KEYS = {
  recitationId: 'takrir_recitation_id',
  quranFont: 'takrir_quran_font',
  fontScale: 'takrir_font_scale',
  playbackRate: 'takrir_playback_rate',
  enableAutoScrolling: 'takrir_enable_auto_scrolling',
  showArabic: 'takrir_show_arabic',
  showTranslation: 'takrir_show_translation',
};

/** Settings synced to cloud (preferences API). */
type CloudSettings = {
  recitationId: number;
  quranFont: QuranFont;
  fontScale: FontScale;
  enableAutoScrolling: boolean;
};

/** Settings stored locally only. */
type LocalSettings = {
  playbackRate: number;
  showArabic: boolean;
  showTranslation: boolean;
};

interface SettingsState extends CloudSettings, LocalSettings {
  /** True when cloud settings have changed since last flush. Observable by subscribers. */
  cloudDirty: boolean;

  setRecitation: (id: number) => void;
  setQuranFont: (font: QuranFont) => void;
  setFontScale: (scale: FontScale) => void;
  setPlaybackRate: (rate: number) => void;
  setEnableAutoScrolling: (enabled: boolean) => void;
  setShowArabic: (show: boolean) => void;
  setShowTranslation: (show: boolean) => void;
  loadPersistedSettings: () => Promise<void>;
  loadCloudSettings: () => Promise<void>;
  flushToCloud: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  recitationId: 1,
  quranFont: 'text_uthmani',
  fontScale: 'M',
  playbackRate: 1,
  enableAutoScrolling: true,
  showArabic: true,
  showTranslation: false,
  cloudDirty: false,

  setRecitation: (id) => {
    set({ recitationId: id, cloudDirty: true });
    SecureStore.setItemAsync(KEYS.recitationId, String(id)).catch(() => null);
  },

  setQuranFont: (font) => {
    set({ quranFont: font, cloudDirty: true });
    SecureStore.setItemAsync(KEYS.quranFont, font).catch(() => null);
  },

  setFontScale: (scale) => {
    set({ fontScale: scale, cloudDirty: true });
    SecureStore.setItemAsync(KEYS.fontScale, scale).catch(() => null);
  },

  setPlaybackRate: (rate) => {
    set({ playbackRate: rate });
    SecureStore.setItemAsync(KEYS.playbackRate, String(rate)).catch(() => null);
  },

  setEnableAutoScrolling: (enabled) => {
    set({ enableAutoScrolling: enabled, cloudDirty: true });
    SecureStore.setItemAsync(KEYS.enableAutoScrolling, String(enabled)).catch(() => null);
  },

  setShowArabic: (show) => {
    set({ showArabic: show });
    SecureStore.setItemAsync(KEYS.showArabic, String(show)).catch(() => null);
  },

  setShowTranslation: (show) => {
    set({ showTranslation: show });
    SecureStore.setItemAsync(KEYS.showTranslation, String(show)).catch(() => null);
  },

  loadPersistedSettings: async () => {
    const [recitationId, quranFont, fontScale, playbackRate, enableAutoScrolling, showArabic, showTranslation] =
      await Promise.all([
        SecureStore.getItemAsync(KEYS.recitationId),
        SecureStore.getItemAsync(KEYS.quranFont),
        SecureStore.getItemAsync(KEYS.fontScale),
        SecureStore.getItemAsync(KEYS.playbackRate),
        SecureStore.getItemAsync(KEYS.enableAutoScrolling),
        SecureStore.getItemAsync(KEYS.showArabic),
        SecureStore.getItemAsync(KEYS.showTranslation),
      ]);

    const updates: Partial<SettingsState> = {};
    if (recitationId && (SUPPORTED_RECITATION_IDS as readonly number[]).includes(Number(recitationId))) updates.recitationId = Number(recitationId);
    if (quranFont && QURAN_FONTS.includes(quranFont as QuranFont)) updates.quranFont = quranFont as QuranFont;
    if (fontScale && FONT_SCALES.includes(fontScale as FontScale)) updates.fontScale = fontScale as FontScale;
    if (playbackRate) updates.playbackRate = Number(playbackRate);
    if (enableAutoScrolling !== null) updates.enableAutoScrolling = enableAutoScrolling === 'true';
    if (showArabic !== null) updates.showArabic = showArabic === 'true';
    if (showTranslation !== null) updates.showTranslation = showTranslation === 'true';

    if (Object.keys(updates).length > 0) set(updates);
  },

  loadCloudSettings: async () => {
    const prefs = await fetchPreferences();
    const get_pref = (name: string) =>
      prefs.find((p) => p.category === PREF_CATEGORY && p.name === name)?.value;

    const recitationId = get_pref('reciter');
    const quranFont = get_pref('quran_font');
    const fontScale = get_pref('font_scale');
    const enableAutoScrolling = get_pref('enable_auto_scrolling');

    const updates: Partial<SettingsState> = {};
    if (recitationId && (SUPPORTED_RECITATION_IDS as readonly number[]).includes(Number(recitationId))) updates.recitationId = Number(recitationId);
    if (quranFont && QURAN_FONTS.includes(quranFont as QuranFont)) updates.quranFont = quranFont as QuranFont;
    if (fontScale && FONT_SCALES.includes(fontScale as FontScale)) updates.fontScale = fontScale as FontScale;
    if (enableAutoScrolling !== undefined) updates.enableAutoScrolling = enableAutoScrolling === 'true';

    if (Object.keys(updates).length > 0) set(updates);

    // Persist cloud values locally
    const s = get();
    await Promise.all([
      SecureStore.setItemAsync(KEYS.recitationId, String(s.recitationId)),
      SecureStore.setItemAsync(KEYS.quranFont, s.quranFont),
      SecureStore.setItemAsync(KEYS.fontScale, s.fontScale),
      SecureStore.setItemAsync(KEYS.enableAutoScrolling, String(s.enableAutoScrolling)),
    ]).catch(() => null);
  },

  flushToCloud: async () => {
    if (!get().cloudDirty) return;
    const s = get();
    await syncSettingsToCloud([
      { category: PREF_CATEGORY, name: 'reciter', value: String(s.recitationId) },
      { category: PREF_CATEGORY, name: 'quran_font', value: s.quranFont },
      { category: PREF_CATEGORY, name: 'font_scale', value: s.fontScale },
      { category: PREF_CATEGORY, name: 'enable_auto_scrolling', value: String(s.enableAutoScrolling) },
    ]);
    set({ cloudDirty: false });
  },
}));
