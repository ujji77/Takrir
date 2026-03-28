import { apiFetch } from './client';
import type { AudioFile, RecitationsResponse, Recitation } from '../types/api';

const AUDIO_CDN = 'https://verses.quran.com/';

interface AudioFilesPage {
  audio_files: { verse_key: string; url: string }[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

async function fetchAudioFilesPage(recitationId: number, chapterNumber: number, page: number): Promise<AudioFilesPage> {
  return apiFetch<AudioFilesPage>(
    `/recitations/${recitationId}/by_chapter/${chapterNumber}`,
    { per_page: 50, page },
  );
}

export async function fetchAudioFiles(recitationId: number, chapterNumber: number): Promise<AudioFile[]> {
  const first = await fetchAudioFilesPage(recitationId, chapterNumber, 1);
  const all = [...first.audio_files];

  const { total_pages } = first.pagination;
  if (total_pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: total_pages - 1 }, (_, i) =>
        fetchAudioFilesPage(recitationId, chapterNumber, i + 2),
      ),
    );
    rest.forEach((r) => all.push(...r.audio_files));
  }

  return all.map((f) => ({
    verse_key: f.verse_key,
    url: f.url.startsWith('http') ? f.url : `${AUDIO_CDN}${f.url}`,
  }));
}

export async function fetchRecitations(): Promise<Recitation[]> {
  const data = await apiFetch<RecitationsResponse>('/recitations');
  return data.recitations;
}
