import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useSettingsStore } from '../src/store/settings';

const queryClient = new QueryClient();

useSettingsStore.getState().loadPersistedSettings();

export default function RootLayout() {
  useFonts({ 'pdms-saleem-quranfont': require('../assets/fonts/pdms-saleem-quranfont.ttf') });

  useEffect(() => {
    const interval = setInterval(() => {
      useSettingsStore.getState().flushToCloud().catch(() => null);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Takrir', headerShown: false }} />
        <Stack.Screen name="home" options={{ title: 'Choose Surah' }} />
        <Stack.Screen name="playlist" options={{ title: 'Playlist' }} />
        <Stack.Screen name="player" options={{ title: 'Player' }} />
      </Stack>
    </QueryClientProvider>
    </SafeAreaProvider>
  );
}
