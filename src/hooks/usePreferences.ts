import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPreferences, savePreference, UserPreference } from '../api/preferences';
import { useAuthStore } from '../store/auth';

export function usePreferences() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
    enabled: token !== null,
    staleTime: Infinity,
  });
}

export function useSavePreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}
