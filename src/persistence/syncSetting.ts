import { savePreference } from '../api/preferences';
import { useAuthStore } from '../store/auth';

export async function syncSettingToCloud(
  category: string,
  name: string,
  value: string,
): Promise<void> {
  const { token } = useAuthStore.getState();
  if (!token) return;
  await savePreference({ category, name, value });
}
