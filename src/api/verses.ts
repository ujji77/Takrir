import { apiFetch } from './client';
import type { VersesResponse, Verse } from '../types/api';

async function fetchVersesPage(chapterNumber: number, page: number): Promise<VersesResponse> {
  return apiFetch<VersesResponse>(`/verses/by_chapter/${chapterNumber}`, {
    fields: 'text_uthmani',
    per_page: 50,
    page,
  });
}

export async function fetchAllVersesByChapter(chapterNumber: number): Promise<Verse[]> {
  const first = await fetchVersesPage(chapterNumber, 1);
  const allVerses: Verse[] = [...first.verses];

  const { total_pages } = first.pagination;
  const remaining = Array.from({ length: total_pages - 1 }, (_, i) => i + 2);
  const pages = await Promise.all(remaining.map((p) => fetchVersesPage(chapterNumber, p)));
  pages.forEach((r) => allVerses.push(...r.verses));

  return allVerses;
}
