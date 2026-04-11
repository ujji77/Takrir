import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useVersesByChapter } from '../src/hooks/useVersesByChapter';
import { useMultipleAudioFiles } from '../src/hooks/useMultipleAudioFiles';
import { useSettingsStore, SUPPORTED_RECITATION_IDS } from '../src/store/settings';
import { usePlaylistStore } from '../src/store/playlist';
import { useChapters } from '../src/hooks/useChapters';
import { buildPlaylistItems } from '../src/utils/buildPlaylistItems';
import PlaylistHeader from '../src/components/PlaylistHeader';
import {
  APP_PRIMARY,
  APP_PRIMARY_ACTIVE,
  SURFACE,
  SURFACE_SCREEN,
  BORDER_STRONG,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  SHADOW,
} from '../src/theme';

const BISMILLAH_EN = 'In the Name of Allah\nthe Most Compassionate, Most Merciful';
const bismillahImg = require('../assets/bismillah.png');

export default function PlaylistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chapter: string; from: string; to: string }>();
  const chapterNumber = parseInt(params.chapter, 10);
  const fromVerse = parseInt(params.from, 10);
  const toVerse = parseInt(params.to, 10);

  const { data: chapters } = useChapters();
  const { data: verses, isLoading: versesLoading, isError: versesError } = useVersesByChapter(chapterNumber);
  const { data: audioByReciter, isLoading: audioLoading, isError: audioError } = useMultipleAudioFiles(
    chapterNumber,
    SUPPORTED_RECITATION_IDS,
  );

  const [repeatCounts, setRepeatCounts] = useState<Record<string, number>>({});
  const loadPlaylist = usePlaylistStore((s) => s.loadPlaylist);

  const chapter = useMemo(
    () => chapters?.find((c) => c.id === chapterNumber),
    [chapters, chapterNumber],
  );

  const filteredVerses = useMemo(
    () => verses?.filter((v) => v.verse_number >= fromVerse && v.verse_number <= toVerse) ?? [],
    [verses, fromVerse, toVerse],
  );

  const setRepeat = (verseKey: string, delta: number) => {
    setRepeatCounts((prev) => ({
      ...prev,
      [verseKey]: Math.max(1, (prev[verseKey] ?? 1) + delta),
    }));
  };

  const handlePlay = () => {
    const playlistItems = buildPlaylistItems(
      verses ?? [],
      audioByReciter,
      fromVerse,
      toVerse,
      repeatCounts,
      chapter?.name_simple ?? `Surah ${chapterNumber}`,
    );
    loadPlaylist(playlistItems).then(() => router.push('/player'));
  };

  const primaryAudio = Object.values(audioByReciter)[0] ?? [];
  const primaryMap = new Map(primaryAudio.map((f) => [f.verse_key, f.url]));
  const allHaveAudio = filteredVerses.every((v) => primaryMap.has(v.verse_key));
  const canPlay = allHaveAudio && filteredVerses.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <PlaylistHeader
        chapterName={chapter?.name_simple ?? `Ch. ${chapterNumber}`}
        fromVerse={fromVerse}
        toVerse={toVerse}
        onBack={() => router.back()}
      />

      {versesLoading || audioLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={APP_PRIMARY} size="large" />
          <Text style={styles.loadingText}>Loading verses & audio…</Text>
        </View>
      ) : versesError || audioError ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Failed to load. Check your connection and try again.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: APP_PRIMARY }}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredVerses}
          keyExtractor={(item) => item.verse_key}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.bismillahBlock}>
              <Image
                source={bismillahImg}
                style={styles.bismillahImage}
                resizeMode="contain"
              />
              <Text style={styles.bismillahEn}>{BISMILLAH_EN}</Text>
              <View style={[styles.divider, { marginTop: 0, marginBottom: 20, alignSelf: 'stretch' }]} />
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item }) => {
            const count = repeatCounts[item.verse_key] ?? 1;
            const translation = item.translations?.[0]?.text?.replace(/<[^>]+>/g, '') ?? '';
            return (
              <View style={styles.verseRow}>
                <Text style={styles.verseNumber}>{item.verse_key}</Text>

                <View style={styles.verseContent}>
                  <Text style={styles.arabicText}>{item.text_uthmani}</Text>
                  {translation ? (
                    <Text style={styles.translationText}>{translation}</Text>
                  ) : null}
                </View>

                <View style={styles.repeater}>
                  <TouchableOpacity
                    onPress={() => setRepeat(item.verse_key, 1)}
                    style={styles.repeaterUp}
                    hitSlop={4}
                  >
                    <Text style={styles.repeaterIcon}>+</Text>
                  </TouchableOpacity>

                  <View style={styles.repeaterMiddle}>
                    <Text style={styles.repeaterCount}>x {count}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setRepeat(item.verse_key, -1)}
                    style={styles.repeaterDown}
                    hitSlop={4}
                  >
                    <Text style={styles.repeaterIcon}>−</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.playWrap} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.playButton, !canPlay && styles.playButtonDisabled]}
          onPress={handlePlay}
          disabled={!canPlay}
          activeOpacity={0.85}
        >
          <Text style={styles.playIcon}>▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_SCREEN,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },

  // Bismillah
  bismillahBlock: {
    alignItems: 'center',
    gap: 14,
    paddingBottom: 0,
  },
  bismillahImage: {
    width: 128,
    height: 32,
    opacity: 0.9,
  },
  bismillahEn: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 120,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER_STRONG,
    marginVertical: 20,
  },

  // Verse row
  verseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  verseNumber: {
    fontSize: 14,
    color: APP_PRIMARY,
    fontWeight: '600',
    letterSpacing: 0.5,
    width: 52,
    textAlign: 'center',
  },
  verseContent: {
    flex: 1,
    gap: 12,
  },
  arabicText: {
    fontSize: 18,
    color: TEXT_MUTED,
    textAlign: 'right',
    lineHeight: 36,
  },
  translationText: {
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 22,
  },

  // Repeater
  repeater: {
    width: 35,
    alignItems: 'center',
  },
  repeaterUp: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  repeaterMiddle: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D2D2D2',
  },
  repeaterDown: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  repeaterIcon: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 20,
  },
  repeaterCount: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  // Play button
  playWrap: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: APP_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonDisabled: {
    backgroundColor: APP_PRIMARY_ACTIVE,
  },
  playIcon: {
    fontSize: 22,
    color: SURFACE,
    marginLeft: 3,
  },
});
