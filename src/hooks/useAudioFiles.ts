import { useQuery } from '@tanstack/react-query';
import { fetchAudioFiles } from '../api/audio';

export function useAudioFiles(chapterNumber: number | null, recitationId: number) {
  return useQuery({
    queryKey: ['audio', recitationId, chapterNumber],
    queryFn: () => fetchAudioFiles(recitationId, chapterNumber!),
    enabled: chapterNumber !== null,
    staleTime: Infinity,
  });
}
