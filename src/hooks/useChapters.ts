import { useQuery } from '@tanstack/react-query';
import { fetchChapters } from '../api/chapters';

export function useChapters() {
  return useQuery({
    queryKey: ['chapters'],
    queryFn: fetchChapters,
    staleTime: Infinity,
  });
}
