import { bulkSavePreferences } from '../api/preferences';
import { useAuthStore } from '../store/auth';
import type { UserPreference } from '../api/preferences';

export async function syncSettingsToCloud(prefs: UserPreference[]): Promise<void> {
  const { token } = useAuthStore.getState();
  if (!token || prefs.length === 0) return;
  await bulkSavePreferences(prefs);
}
