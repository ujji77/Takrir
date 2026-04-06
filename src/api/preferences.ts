import { userApiFetch } from './client';

export interface UserPreference {
  category: string;
  name: string;
  value: string;
}

interface PreferencesResponse {
  preferences: UserPreference[];
}

export async function fetchPreferences(): Promise<UserPreference[]> {
  const data = await userApiFetch<PreferencesResponse>('/preferences');
  return data.preferences;
}

export async function savePreference(preference: UserPreference): Promise<void> {
  await userApiFetch<unknown>('/preferences', {
    method: 'POST',
    body: { preference },
  });
}

export async function bulkSavePreferences(preferences: UserPreference[]): Promise<void> {
  await userApiFetch<unknown>('/preferences/bulk', {
    method: 'POST',
    body: { preferences },
  });
}
