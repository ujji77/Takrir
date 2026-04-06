import { apiFetch } from './client';
import { fetchAllPages } from './pagination';
import type { VersesResponse, Verse } from '../types/api';

function fetchVersesPage(chapterNumber: number, page: number): Promise<VersesResponse> {
  return apiFetch<VersesResponse>(`/verses/by_chapter/${chapterNumber}`, {
    fields: 'text_uthmani',
    per_page: 50,
    page,
  });
}

export function fetchAllVersesByChapter(chapterNumber: number): Promise<Verse[]> {
  return fetchAllPages(
    (page) => fetchVersesPage(chapterNumber, page),
    (r) => r.verses,
  );
}
