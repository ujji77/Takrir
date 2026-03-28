import { useQuery } from '@tanstack/react-query';
import { fetchRecitations } from '../api/audio';

export function useRecitations() {
  return useQuery({
    queryKey: ['recitations'],
    queryFn: fetchRecitations,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
