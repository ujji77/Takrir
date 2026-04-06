import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Button,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVersesByChapter } from '../src/hooks/useVersesByChapter';
import { useAudioFiles } from '../src/hooks/useAudioFiles';
import { useRecitations } from '../src/hooks/useRecitations';
import { useSettingsStore } from '../src/store/settings';
import { usePlaylistStore } from '../src/store/playlist';
import { buildPlaylistItems } from '../src/utils/buildPlaylistItems';

export default function PlaylistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chapter: string; from: string; to: string }>();
  const chapterNumber = parseInt(params.chapter, 10);
  const fromVerse = parseInt(params.from, 10);
  const toVerse = parseInt(params.to, 10);

  const recitationId = useSettingsStore((s) => s.recitationId);
  const { data: recitations } = useRecitations();
  const { data: verses, isLoading: versesLoading } = useVersesByChapter(chapterNumber);
  const { data: audioFiles, isLoading: audioLoading } = useAudioFiles(chapterNumber, recitationId);

  // Repeat counts live in local state: verseKey → count
  const [repeatCounts, setRepeatCounts] = useState<Record<string, number>>({});

  const loadPlaylist = usePlaylistStore((s) => s.loadPlaylist);

  const currentRecitation = useMemo(
    () => recitations?.find((r) => r.id === recitationId),
    [recitations, recitationId],
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

  const isLoading = versesLoading || audioLoading;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Loading verses & audio…</Text>
      </View>
    );
  }

  const totalPlays = filteredVerses.reduce(
    (sum, v) => sum + (repeatCounts[v.verse_key] ?? 1),
    0,
  );
  const allHaveAudio = filteredVerses.every((v) => audioMap.has(v.verse_key));

  return (
    <View style={styles.container}>
      <View style={styles.reciterRow}>
        <Text style={styles.reciterText}>
          {currentRecitation
            ? `${currentRecitation.reciter_name}${currentRecitation.style ? ` · ${currentRecitation.style}` : ''}`
            : `Recitation ID ${recitationId}`}
        </Text>
      </View>

      <FlatList
        data={filteredVerses}
        keyExtractor={(item) => item.verse_key}
        style={styles.list}
        renderItem={({ item }) => {
          const count = repeatCounts[item.verse_key] ?? 1;
          const hasAudio = audioMap.has(item.verse_key);
          return (
            <View style={styles.verseRow}>
              <View style={styles.verseInfo}>
                <Text style={styles.verseKey}>{item.verse_key}</Text>
                <Text style={styles.verseText} numberOfLines={2}>{item.text_uthmani}</Text>
                {!hasAudio && <Text style={styles.noAudio}>⚠ No audio</Text>}
              </View>
              <View style={styles.repeatControl}>
                <TouchableOpacity onPress={() => setRepeat(item.verse_key, -1)} style={styles.repeatBtn}>
                  <Text style={styles.repeatBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.repeatCount}>{count}×</Text>
                <TouchableOpacity onPress={() => setRepeat(item.verse_key, 1)} style={styles.repeatBtn}>
                  <Text style={styles.repeatBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <Text style={styles.footerSummary}>
          {filteredVerses.length} verse{filteredVerses.length !== 1 ? 's' : ''} · {totalPlays} total plays
        </Text>
        <Button title="Play" onPress={handlePlay} disabled={!allHaveAudio || filteredVerses.length === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 14, color: '#888' },
  reciterRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  reciterText: { fontSize: 13, color: '#555' },
  list: { flex: 1 },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  verseInfo: { flex: 1, marginRight: 12 },
  verseKey: { fontSize: 12, color: '#888', marginBottom: 2 },
  verseText: { fontSize: 16, textAlign: 'right' },
  noAudio: { fontSize: 11, color: '#e74c3c', marginTop: 2 },
  repeatControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  repeatBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatBtnText: { fontSize: 20, lineHeight: 24 },
  repeatCount: { fontSize: 16, fontWeight: '600', minWidth: 28, textAlign: 'center' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#ddd', gap: 8 },
  footerSummary: { fontSize: 13, color: '#666', textAlign: 'center' },
});
