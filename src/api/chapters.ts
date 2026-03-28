import { apiFetch } from './client';
import type { ChaptersResponse, Chapter } from '../types/api';

export async function fetchChapters(): Promise<Chapter[]> {
  const data = await apiFetch<ChaptersResponse>('/chapters');
  return data.chapters;
}
