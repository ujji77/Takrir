import { useAuthStore } from '../store/auth';

const BASE_URL = process.env.EXPO_PUBLIC_QURAN_BASE_URL ?? 'https://api.quran.com/api/v4';
const CLIENT_ID = process.env.EXPO_PUBLIC_QURAN_CLIENT_ID ?? '';

export async function apiFetch<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'x-client-id': CLIENT_ID,
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['x-auth-token'] = token;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
