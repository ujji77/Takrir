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
import { useAudioFiles } from '../src/hooks/useAudioFiles';
import { useSettingsStore } from '../src/store/settings';
import { usePlaylistStore } from '../src/store/playlist';
import { useChapters } from '../src/hooks/useChapters';
import { buildPlaylistItems } from '../src/utils/buildPlaylistItems';
import PlaylistHeader from '../src/components/PlaylistHeader';

const TEAL = '#00cbbf';
const BISMILLAH_EN = 'In the Name of Allah\nthe Most Compassionate, Most Merciful';
const bismillahImg = require('../assets/bismillah.png');

export default function PlaylistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chapter: string; from: string; to: string }>();
  const chapterNumber = parseInt(params.chapter, 10);
  const fromVerse = parseInt(params.from, 10);
  const toVerse = parseInt(params.to, 10);

  const recitationId = useSettingsStore((s) => s.recitationId);
  const { data: chapters } = useChapters();
  const { data: verses, isLoading: versesLoading } = useVersesByChapter(chapterNumber);
  const { data: audioFiles, isLoading: audioLoading } = useAudioFiles(chapterNumber, recitationId);

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

  const audioMap = useMemo(() => {
    const map = new Map<string, string>();
    audioFiles?.forEach((f) => map.set(f.verse_key, f.url));
    return map;
  }, [audioFiles]);

  const setRepeat = (verseKey: string, delta: number) => {
    setRepeatCounts((prev) => ({
      ...prev,
      [verseKey]: Math.max(1, (prev[verseKey] ?? 1) + delta),
    }));
  };

  const handlePlay = () => {
    const playlistItems = buildPlaylistItems(
      verses ?? [],
      audioFiles ?? [],
      fromVerse,
      toVerse,
      repeatCounts,
    );
    loadPlaylist(playlistItems).then(() => router.push('/player'));
  };

  const allHaveAudio = filteredVerses.every((v) => audioMap.has(v.verse_key));
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
          <ActivityIndicator color={TEAL} size="large" />
          <Text style={styles.loadingText}>Loading verses & audio…</Text>
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
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item }) => {
            const count = repeatCounts[item.verse_key] ?? 1;
            const translation = item.translations?.[0]?.text?.replace(/<[^>]+>/g, '') ?? '';
            return (
              <View style={styles.verseRow}>
                {/* Col 1: verse number */}
                <Text style={styles.verseNumber}>{item.verse_key}</Text>

                {/* Col 2: Arabic + translation */}
                <View style={styles.verseContent}>
                  <Text style={styles.arabicText}>{item.text_uthmani}</Text>
                  {translation ? (
                    <Text style={styles.translationText}>{translation}</Text>
                  ) : null}
                </View>

                {/* Col 3: repeat counter */}
                <View style={styles.repeater}>
                  <TouchableOpacity
                    onPress={() => setRepeat(item.verse_key, 1)}
                    hitSlop={10}
                    style={styles.arrowBtn}
                  >
                    <Text style={styles.arrowText}>↑</Text>
                  </TouchableOpacity>
                  <Text style={styles.repeatCount}>x {count}</Text>
                  <TouchableOpacity
                    onPress={() => setRepeat(item.verse_key, -1)}
                    hitSlop={10}
                    style={styles.arrowBtn}
                  >
                    <Text style={styles.arrowText}>↓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Floating play button */}
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
    backgroundColor: '#fafafa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },

  // Bismillah
  bismillahBlock: {
    alignItems: 'center',
    gap: 14,
    paddingBottom: 24,
  },
  bismillahImage: {
    width: 128,
    height: 32,
    opacity: 0.9,
  },
  bismillahEn: {
    fontSize: 12,
    color: '#333',
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
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },

  // Verse row
  verseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verseNumber: {
    fontSize: 14,
    color: TEAL,
    fontWeight: '600',
    letterSpacing: 0.5,
    width: 36,
    textAlign: 'center',
  },
  verseContent: {
    flex: 1,
    gap: 12,
  },
  arabicText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'right',
    lineHeight: 36,
  },
  translationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },

  // Repeater
  repeater: {
    width: 45,
    alignItems: 'center',
    gap: 5,
  },
  arrowBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: TEAL,
  },
  repeatCount: {
    fontSize: 14,
    color: '#3a3a3a',
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
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonDisabled: {
    backgroundColor: '#a0e8e4',
  },
  playIcon: {
    fontSize: 22,
    color: '#fff',
    marginLeft: 3,
  },
});
