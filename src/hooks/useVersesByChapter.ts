import { useQuery } from '@tanstack/react-query';
import { fetchAllVersesByChapter, TRANSLATION_ID } from '../api/verses';

export function useVersesByChapter(chapterNumber: number | null) {
  return useQuery({
    queryKey: ['verses', chapterNumber, TRANSLATION_ID],
    queryFn: () => fetchAllVersesByChapter(chapterNumber!),
    enabled: chapterNumber !== null,
    staleTime: Infinity,
  });
}
