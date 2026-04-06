import { apiFetch } from './client';
import { fetchAllPages } from './pagination';
import type { VersesResponse, Verse } from '../types/api';

// Always fetch all font variants so the player can switch fonts without rebuilding the playlist.
const ALL_FIELDS = 'text_uthmani,text_indopak,text_imlaei,code_v1,code_v2';
// Saheeh International — default English translation
const TRANSLATION_ID = 131;

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
