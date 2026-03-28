import { useQuery } from '@tanstack/react-query';
import { fetchAllVersesByChapter } from '../api/verses';

export function useVersesByChapter(chapterNumber: number | null) {
  return useQuery({
    queryKey: ['verses', chapterNumber],
    queryFn: () => fetchAllVersesByChapter(chapterNumber!),
    enabled: chapterNumber !== null,
    staleTime: Infinity,
  });
}
