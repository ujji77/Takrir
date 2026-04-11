import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretRight } from 'phosphor-react-native';
import { Stack, useRouter } from 'expo-router';
import { useChapters } from '../src/hooks/useChapters';
import AppHeader from '../src/components/AppHeader';
import type { Chapter } from '../src/types/api';
import {
  APP_PRIMARY,
  SURFACE,
  SURFACE_SCREEN,
  SURFACE_INPUT,
  BORDER,
  TEXT_HEADING,
  TEXT_PRIMARY,
  TEXT_BODY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_MUTED,
  TEXT_PLACEHOLDER,
} from '../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { data: chapters, isLoading } = useChapters();

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [fromVerse, setFromVerse] = useState('');
  const [toVerse, setToVerse] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredChapters =
    chapters?.filter(
      (c) =>
        c.name_simple.toLowerCase().includes(search.toLowerCase()) ||
        c.name_arabic.includes(search) ||
        String(c.id).startsWith(search),
    ) ?? [];

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setFromVerse('1');
    setToVerse(String(chapter.verses_count));
    setModalVisible(false);
    setSearch('');
  };

  const handleAddDetail = () => {
    if (!selectedChapter) return;
    const from = parseInt(fromVerse, 10);
    const to = parseInt(toVerse, 10);
    if (
      isNaN(from) ||
      isNaN(to) ||
      from < 1 ||
      to > selectedChapter.verses_count ||
      from > to
    )
      return;
    router.push({ pathname: '/playlist', params: { chapter: selectedChapter.id, from, to } });
  };

  const canProceed =
    !!selectedChapter &&
    fromVerse.length > 0 &&
    toVerse.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Welcome to Takrir" />
      <View style={styles.card}>
        <View style={styles.sentenceRow}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>I am learning surah</Text>
          </View>

          <TouchableOpacity
            style={styles.surahBox}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.boxText} numberOfLines={1}>
              {selectedChapter ? selectedChapter.name_simple : 'Select'}
            </Text>
          </TouchableOpacity>

          <View style={styles.labelWrap}>
            <Text style={styles.label}>verses</Text>
          </View>

          <View style={styles.verseBox}>
            <TextInput
              style={styles.verseInput}
              value={fromVerse}
              onChangeText={setFromVerse}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={TEXT_PLACEHOLDER}
              editable={!!selectedChapter}
              textAlign="center"
            />
          </View>

          <View style={styles.labelWrap}>
            <Text style={styles.label}>to</Text>
          </View>

          <View style={styles.verseBox}>
            <TextInput
              style={styles.verseInput}
              value={toVerse}
              onChangeText={setToVerse}
              keyboardType="number-pad"
              placeholder="…"
              placeholderTextColor={TEXT_PLACEHOLDER}
              editable={!!selectedChapter}
              textAlign="center"
            />
          </View>
        </View>

        {selectedChapter && (
          <View style={styles.continueRow}>
            <TouchableOpacity
              style={[styles.continueBtn, !canProceed && styles.continueBtnDisabled]}
              onPress={handleAddDetail}
              disabled={!canProceed}
              activeOpacity={0.8}
            >
              <CaretRight size={22} color={SURFACE} weight="bold" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Surah</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={8}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or number…"
              placeholderTextColor={TEXT_PLACEHOLDER}
              value={search}
              onChangeText={setSearch}
              autoFocus
              returnKeyType="search"
            />
          </View>

          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={APP_PRIMARY} />
          ) : (
            <FlatList
              data={filteredChapters}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chapterRow}
                  onPress={() => handleChapterSelect(item)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.chapterNum}>{item.id}.</Text>
                  <View style={styles.chapterInfo}>
                    <Text style={styles.chapterName}>{item.name_simple}</Text>
                    <Text style={styles.chapterSub}>
                      {item.translated_name.name} · {item.verses_count} verses
                    </Text>
                  </View>
                  <Text style={styles.chapterArabic}>{item.name_arabic}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_SCREEN,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 16,
  },
  sentenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 10,
    maxWidth: 340,
    width: '100%',
  },
  labelWrap: {
    paddingVertical: 10,
  },
  label: {
    fontSize: 20,
    fontWeight: '500',
    color: TEXT_HEADING,
  },
  surahBox: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: APP_PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: {
    fontSize: 20,
    color: TEXT_BODY,
    textAlign: 'center',
  },
  verseBox: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: APP_PRIMARY,
    borderRadius: 8,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseInput: {
    fontSize: 20,
    color: TEXT_BODY,
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '100%',
    textAlign: 'center',
  },
  continueRow: {
    alignItems: 'flex-end',
    alignSelf: 'center',
    maxWidth: 340,
    width: '100%',
    paddingRight: 4,
  },
  continueBtn: {
    width: 50,
    height: 50,
    borderRadius: 60,
    backgroundColor: APP_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  modalClose: {
    fontSize: 18,
    color: TEXT_SECONDARY,
    paddingHorizontal: 4,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  searchInput: {
    backgroundColor: SURFACE_INPUT,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: TEXT_BODY,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  chapterNum: {
    width: 36,
    fontSize: 13,
    color: TEXT_TERTIARY,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterName: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_PRIMARY,
  },
  chapterSub: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  chapterArabic: {
    fontSize: 20,
    color: TEXT_MUTED,
    marginLeft: 8,
  },
});
