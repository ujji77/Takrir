import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Image, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import TrackPlayer, { Capability } from 'react-native-track-player';
import { PlaybackService } from '../src/audio/PlaybackService';
import { useSettingsStore } from '../src/store/settings';

const queryClient = new QueryClient();
const bgImg = require('../assets/bg.png');

useSettingsStore.getState().loadPersistedSettings();
TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
  const pathname = usePathname();
  const isLogin = pathname === '/';

  useFonts({ 'pdms-saleem-quranfont': require('../assets/fonts/pdms-saleem-quranfont.ttf') });

  useEffect(() => {
    TrackPlayer.setupPlayer({ autoHandleInterruptions: true })
      .then(() =>
        TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
          ],
          compactCapabilities: [Capability.SkipToPrevious, Capability.Play, Capability.Pause, Capability.SkipToNext],
        }),
      )
      .catch(() => null);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      useSettingsStore.getState().flushToCloud().catch(() => null);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {/* Non-login screens: bg.png covers full screen with blur 84 */}
        {!isLogin && (
          <>
            <Image source={bgImg} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <BlurView intensity={84} tint="light" style={StyleSheet.absoluteFill} />
          </>
        )}

        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen name="playlist" options={{ headerShown: false }} />
            <Stack.Screen name="player" options={{ headerShown: false }} />
          </Stack>
        </QueryClientProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5ece3' },
});
