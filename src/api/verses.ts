import { apiFetch } from './client';
import { fetchAllPages } from './pagination';
import type { VersesResponse, Verse } from '../types/api';

const ALL_FIELDS = 'text_uthmani,text_indopak';
// Saheeh International — ID 20 on api.quran.com/api/v4
export const TRANSLATION_ID = 20;

function fetchVersesPage(chapterNumber: number, page: number): Promise<VersesResponse> {
  return apiFetch<VersesResponse>(`/verses/by_chapter/${chapterNumber}`, {
    fields: ALL_FIELDS,
    translations: TRANSLATION_ID,
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
