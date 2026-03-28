import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettingsStore } from '../src/store/settings';

const queryClient = new QueryClient();

// Load persisted settings once at app start — called as a side-effect of module init,
// not inside a component, so no useEffect needed.
useSettingsStore.getState().loadPersistedSettings();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Takrir', headerShown: false }} />
        <Stack.Screen name="home" options={{ title: 'Choose Surah' }} />
        <Stack.Screen name="playlist" options={{ title: 'Playlist' }} />
        <Stack.Screen name="player" options={{ title: 'Player' }} />
        <Stack.Screen name="reciter-picker" options={{ title: 'Choose Reciter', presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
