import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Button,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChapters } from '../src/hooks/useChapters';
import { useRecitations } from '../src/hooks/useRecitations';
import { useSettingsStore } from '../src/store/settings';
import type { Chapter } from '../src/types/api';

export default function HomeScreen() {
  const router = useRouter();
  const { data: chapters, isLoading, isError, error, refetch } = useChapters();
  const { data: recitations } = useRecitations();
  const recitationId = useSettingsStore((s) => s.recitationId);

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [fromVerse, setFromVerse] = useState('1');
  const [toVerse, setToVerse] = useState('');

  const currentRecitation = useMemo(
    () => recitations?.find((r) => r.id === recitationId),
    [recitations, recitationId],
  );

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setFromVerse('1');
    setToVerse(String(chapter.verses_count));
  };

  const handleBuildPlaylist = () => {
    if (!selectedChapter) return;
    const from = parseInt(fromVerse, 10);
    const to = parseInt(toVerse, 10);
    if (isNaN(from) || isNaN(to) || from < 1 || to > selectedChapter.verses_count || from > to) return;
    router.push({ pathname: '/playlist', params: { chapter: selectedChapter.id, from, to } });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Loading surahs…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load surahs</Text>
        <Text style={styles.errorDetail}>{(error as Error)?.message ?? 'Unknown error'}</Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Reciter selector */}
      <TouchableOpacity style={styles.reciterRow} onPress={() => router.push('/reciter-picker')}>
        <Text style={styles.reciterLabel}>Reciter</Text>
        <Text style={styles.reciterValue}>
          {currentRecitation
            ? `${currentRecitation.reciter_name}${currentRecitation.style ? ` · ${currentRecitation.style}` : ''}`
            : `ID ${recitationId}`}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Chapter list */}
      <FlatList
        data={chapters}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No surahs found</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chapterRow, selectedChapter?.id === item.id && styles.chapterRowSelected]}
            onPress={() => handleChapterSelect(item)}
          >
            <Text style={styles.chapterIndex}>{item.id}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.chapterName}>{item.name_simple}</Text>
              <Text style={styles.chapterSub}>{item.translated_name.name} · {item.verses_count} verses</Text>
            </View>
            <Text style={styles.chapterArabic}>{item.name_arabic}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Verse range selector */}
      {selectedChapter && (
        <View style={styles.rangeContainer}>
          <Text style={styles.rangeTitle}>
            {selectedChapter.name_simple} (1–{selectedChapter.verses_count})
          </Text>
          <View style={styles.rangeInputs}>
            <TextInput
              style={styles.input}
              value={fromVerse}
              onChangeText={setFromVerse}
              keyboardType="number-pad"
              placeholder="From"
            />
            <Text style={{ alignSelf: 'center' }}>–</Text>
            <TextInput
              style={styles.input}
              value={toVerse}
              onChangeText={setToVerse}
              keyboardType="number-pad"
              placeholder="To"
            />
          </View>
          <Button title="Build Playlist" onPress={handleBuildPlaylist} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 24 },
  loadingText: { fontSize: 14, color: '#888', marginTop: 8 },
  errorText: { fontSize: 16, fontWeight: '600', color: '#e74c3c' },
  errorDetail: { fontSize: 13, color: '#888', textAlign: 'center' },
  emptyText: { padding: 24, textAlign: 'center', color: '#888' },
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  reciterLabel: { fontSize: 13, color: '#888', marginRight: 8 },
  reciterValue: { flex: 1, fontSize: 15, fontWeight: '500' },
  chevron: { fontSize: 20, color: '#999' },
  list: { flex: 1 },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  chapterRowSelected: { backgroundColor: '#e8f4fd' },
  chapterIndex: { width: 32, fontSize: 13, color: '#999' },
  chapterName: { fontSize: 15, fontWeight: '500' },
  chapterSub: { fontSize: 12, color: '#888' },
  chapterArabic: { fontSize: 18, color: '#333', marginLeft: 8 },
  rangeContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    gap: 8,
  },
  rangeTitle: { fontSize: 15, fontWeight: '600' },
  rangeInputs: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
  },
});
