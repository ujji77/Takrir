import { useQueries } from '@tanstack/react-query';
import { fetchAudioFiles } from '../api/audio';
import type { AudioFile } from '../types/api';

export function useMultipleAudioFiles(
  chapterNumber: number | null,
  recitationIds: readonly number[],
): { data: Record<number, AudioFile[]>; isLoading: boolean; isError: boolean } {
  const results = useQueries({
    queries: recitationIds.map((id) => ({
      queryKey: ['audio', id, chapterNumber],
      queryFn: () => fetchAudioFiles(id, chapterNumber!),
      enabled: chapterNumber !== null,
      staleTime: Infinity,
    })),
  });

  const data: Record<number, AudioFile[]> = {};
  results.forEach((result, i) => {
    if (result.data) data[recitationIds[i]] = result.data;
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  return { data, isLoading, isError };
}
