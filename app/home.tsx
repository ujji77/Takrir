import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useChapters } from '../src/hooks/useChapters';
import AppHeader from '../src/components/AppHeader';
import type { Chapter } from '../src/types/api';
import {
  APP_PRIMARY,
  SURFACE,
  SURFACE_SCREEN,
  SURFACE_FROSTED,
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
  const { data: chapters, isLoading, isError: chaptersError } = useChapters();

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [fromVerse, setFromVerse] = useState('');
  const [toVerse, setToVerse] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);

  const glowAnim = useRef(new Animated.Value(0)).current;

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

  const handleBack = () => {
    setSelectedChapter(null);
    setFromVerse('');
    setToVerse('');
    router.replace('/');
  };

  const handleAddDetail = () => {
    if (!selectedChapter) return;
    const from = parseInt(fromVerse, 10);
    const to = parseInt(toVerse, 10);
    if (isNaN(from) || isNaN(to) || from < 1 || to > selectedChapter.verses_count || from > to)
      return;
    router.push({ pathname: '/playlist', params: { chapter: selectedChapter.id, from, to } });
  };

  const canProceed =
    !!selectedChapter &&
    fromVerse.length > 0 &&
    toVerse.length > 0;

  useEffect(() => {
    if (canProceed) {
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [canProceed]);

  const animatedShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <AppHeader title="" onBack={handleBack} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>What do you want{'\n'}to memorise?</Text>

        <View style={styles.sentenceRow}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>I am learning surah</Text>
          </View>

          <TouchableOpacity
            style={styles.surahPill}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              {selectedChapter ? selectedChapter.name_simple : 'Select'}
            </Text>
          </TouchableOpacity>

          <View style={styles.labelWrap}>
            <Text style={styles.label}>verses</Text>
          </View>

          <View style={styles.versePill}>
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

          <View style={styles.versePill}>
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
      </View>

      {/* Create playlist button — pinned to bottom */}
      <View style={styles.ctaWrap}>
        <Animated.View
          style={[
            styles.ctaButton,
            {
              shadowOpacity: animatedShadowOpacity,
              borderColor: canProceed ? APP_PRIMARY : 'transparent',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.ctaInner}
            onPress={handleAddDetail}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaText, !canProceed && styles.ctaTextDisabled]}>
              Create playlist
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Surah picker modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />
        <View style={[styles.modalSheet, { marginTop: headerHeight }]}>
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
          ) : chaptersError ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={{ color: TEXT_SECONDARY, fontSize: 14 }}>Failed to load surahs.</Text>
              <Text style={{ color: TEXT_SECONDARY, fontSize: 14 }}>Check your connection and try again.</Text>
            </View>
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
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_SCREEN,
  },

  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 36,
  },

  heading: {
    fontSize: 30,
    fontWeight: '600',
    color: TEXT_HEADING,
    marginBottom: 40,
    lineHeight: 38,
  },

  sentenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },

  labelWrap: {
    paddingVertical: 10,
  },

  label: {
    fontSize: 20,
    fontWeight: '500',
    color: TEXT_BODY,
  },

  surahPill: {
    backgroundColor: SURFACE_FROSTED,
    borderWidth: 0.5,
    borderColor: APP_PRIMARY,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },

  versePill: {
    backgroundColor: SURFACE_FROSTED,
    borderWidth: 0.5,
    borderColor: APP_PRIMARY,
    borderRadius: 28,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pillText: {
    fontSize: 20,
    color: TEXT_BODY,
    textAlign: 'center',
  },

  verseInput: {
    fontSize: 20,
    color: TEXT_BODY,
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
    textAlign: 'center',
  },

  // CTA button
  ctaWrap: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 30,
  },

  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 30,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    shadowColor: APP_PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 6,
  },

  ctaInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaText: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_BODY,
  },

  ctaTextDisabled: {
    color: TEXT_PLACEHOLDER,
  },

  // Modal
  modalSheet: {
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
