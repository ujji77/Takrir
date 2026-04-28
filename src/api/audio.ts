import { apiFetch } from './client';
import { fetchAllPages } from './pagination';
import type { AudioFile, Pagination, RecitationsResponse, Recitation } from '../types/api';

const AUDIO_CDN = 'https://verses.quran.com/';

interface AudioFilesPage {
  audio_files: { verse_key: string; url: string }[];
  pagination: Pagination;
}

function fetchAudioFilesPage(recitationId: number, chapterNumber: number, page: number): Promise<AudioFilesPage> {
  return apiFetch<AudioFilesPage>(
    `/recitations/${recitationId}/by_chapter/${chapterNumber}`,
    { per_page: 50, page },
  );
}

export async function fetchAudioFiles(recitationId: number, chapterNumber: number): Promise<AudioFile[]> {
  const raw = await fetchAllPages(
    (page) => fetchAudioFilesPage(recitationId, chapterNumber, page),
    (r) => r.audio_files,
  );
  return raw.map((f) => ({
    verse_key: f.verse_key,
    url: f.url.startsWith('http') ? f.url : `${AUDIO_CDN}${f.url}`,
  }));
}

export async function fetchRecitations(): Promise<Recitation[]> {
  const data = await apiFetch<RecitationsResponse>('/resources/recitations');
  return data.recitations;
}
