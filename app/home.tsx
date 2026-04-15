import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ScrollView,
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
  HANDLE,
  OVERLAY,
  TEXT_HEADING,
  TEXT_PRIMARY,
  TEXT_BODY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_MUTED,
  TEXT_PLACEHOLDER,
} from '../src/theme';

// ─── Wheel picker ────────────────────────────────────────────────────────────

const ITEM_H = 44;
const VISIBLE = 5; // must be odd

interface WheelPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}

function WheelPicker({ min, max, value, onChange }: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const numbers = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max],
  );
  const initIndex = Math.max(0, Math.min(value - min, numbers.length - 1));

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: initIndex * ITEM_H, animated: false });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={wp.container}>
      <View style={wp.highlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={wp.listContent}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const clamped = Math.max(0, Math.min(idx, numbers.length - 1));
          onChange(numbers[clamped]);
        }}
      >
        {numbers.map((n) => (
          <View key={n} style={wp.item}>
            <Text style={wp.itemText}>{n}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const HALF = Math.floor(VISIBLE / 2);

const wp = StyleSheet.create({
  container: {
    height: ITEM_H * VISIBLE,
    flex: 1,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_H * HALF,
    left: 8,
    right: 8,
    height: ITEM_H,
    backgroundColor: `${APP_PRIMARY}18`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_PRIMARY,
    zIndex: 1,
  },
  listContent: {
    paddingVertical: ITEM_H * HALF,
  },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 20,
    color: TEXT_PRIMARY,
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { data: chapters, isLoading, isError: chaptersError } = useChapters();

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [fromVerse, setFromVerse] = useState(0);
  const [toVerse, setToVerse] = useState(0);
  const [surahModalVisible, setSurahModalVisible] = useState(false);
  const [versePickerVisible, setVersePickerVisible] = useState(false);
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
    setFromVerse(1);
    setToVerse(chapter.verses_count);
    setSurahModalVisible(false);
    setSearch('');
  };

  const handleBack = () => {
    setSelectedChapter(null);
    setFromVerse(0);
    setToVerse(0);
    router.replace('/');
  };

  const handleFromChange = (v: number) => {
    setFromVerse(v);
    if (v > toVerse) setToVerse(v);
  };

  const handleAddDetail = () => {
    if (!selectedChapter || fromVerse < 1 || toVerse < fromVerse) return;
    router.push({ pathname: '/playlist', params: { chapter: selectedChapter.id, from: fromVerse, to: toVerse } });
  };

  const canProceed = !!selectedChapter && fromVerse > 0 && toVerse >= fromVerse;

  useEffect(() => {
    if (canProceed) {
      Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [canProceed]);

  const animatedShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });

  const versesCount = selectedChapter?.verses_count ?? 1;

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
            onPress={() => setSurahModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              {selectedChapter ? selectedChapter.name_simple : 'Select'}
            </Text>
          </TouchableOpacity>

          <View style={styles.labelWrap}>
            <Text style={styles.label}>verses</Text>
          </View>

          {/* From verse pill */}
          <TouchableOpacity
            style={[styles.versePill, !selectedChapter && styles.versePillDisabled]}
            onPress={() => selectedChapter && setVersePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, !fromVerse && styles.pillPlaceholder]}>
              {fromVerse > 0 ? String(fromVerse) : '1'}
            </Text>
          </TouchableOpacity>

          <View style={styles.labelWrap}>
            <Text style={styles.label}>to</Text>
          </View>

          {/* To verse pill */}
          <TouchableOpacity
            style={[styles.versePill, !selectedChapter && styles.versePillDisabled]}
            onPress={() => selectedChapter && setVersePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, !toVerse && styles.pillPlaceholder]}>
              {toVerse > 0 ? String(toVerse) : '…'}
            </Text>
          </TouchableOpacity>
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

      {/* Verse range picker — bottom sheet */}
      <Modal
        visible={versePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVersePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setVersePickerVisible(false)}
        />
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Verse range</Text>

          <View style={styles.pickerRow}>
            {/* From column */}
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>From</Text>
              <WheelPicker
                min={1}
                max={versesCount}
                value={fromVerse > 0 ? fromVerse : 1}
                onChange={handleFromChange}
              />
            </View>

            <View style={styles.pickerDivider} />

            {/* To column — key resets when fromVerse changes so min is always respected */}
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>To</Text>
              <WheelPicker
                key={fromVerse}
                min={fromVerse > 0 ? fromVerse : 1}
                max={versesCount}
                value={toVerse > 0 ? Math.max(toVerse, fromVerse) : versesCount}
                onChange={setToVerse}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => setVersePickerVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Surah picker modal */}
      <Modal
        visible={surahModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSurahModalVisible(false)}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setSurahModalVisible(false)}
        />
        <View style={[styles.modalSheet, { marginTop: headerHeight }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Surah</Text>
            <TouchableOpacity onPress={() => setSurahModalVisible(false)} hitSlop={8}>
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
    minWidth: 54,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  versePillDisabled: {
    opacity: 0.4,
  },

  pillText: {
    fontSize: 20,
    color: TEXT_BODY,
    textAlign: 'center',
  },

  pillPlaceholder: {
    color: TEXT_PLACEHOLDER,
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

  // Verse range picker sheet
  backdrop: {
    flex: 1,
    backgroundColor: OVERLAY,
  },
  pickerSheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: HANDLE,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  pickerCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pickerDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
  doneBtn: {
    marginTop: 24,
    backgroundColor: APP_PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: SURFACE,
  },

  // Surah modal
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
