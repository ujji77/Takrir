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
  Dimensions,
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
  OVERLAY,
  TEXT_HEADING,
  TEXT_PRIMARY,
  TEXT_BODY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_MUTED,
  TEXT_PLACEHOLDER,
} from '../src/theme';

// ─── Verse grid popover ───────────────────────────────────────────────────────

const GRID_COLS     = 6;
const CELL_GAP      = 6;
const CARD_BORDER   = 1.5;
const CARD_H_PAD    = 12; // horizontal padding inside the card (each side)
const CONTENT_H_PAD = 30; // screen content paddingHorizontal (each side)
const SCREEN_W      = Dimensions.get('window').width;
// Available width for the grid = screen − content padding − card padding − card border
const GRID_W        = SCREEN_W - CONTENT_H_PAD * 2 - CARD_H_PAD * 2 - CARD_BORDER * 2;
const CELL_SIZE     = Math.floor((GRID_W - (GRID_COLS - 1) * CELL_GAP) / GRID_COLS);
const GRID_SCROLL_H = 245; // fixed — 4.5 rows visible to hint at scrollability

type Phase = 'from' | 'to';

interface VerseGridPopoverProps {
  versesCount: number;
  fromVerse: number;
  toVerse: number;
  phase: Phase;
  onTap: (n: number) => void;
  onClose: () => void;
}

function VerseGridPopover({ versesCount, fromVerse, toVerse, phase, onTap, onClose }: VerseGridPopoverProps) {
  const numbers = useMemo(
    () => Array.from({ length: versesCount }, (_, i) => i + 1),
    [versesCount],
  );
  const isSingle = fromVerse === toVerse;

  return (
    <View style={pop.card}>
      <View style={pop.header}>
        <Text style={pop.hint}>
          {phase === 'from' ? 'Tap to set the start verse' : 'Tap to set the end verse'}
        </Text>
        <TouchableOpacity onPress={onClose} hitSlop={10} style={pop.closeBtn}>
          <Text style={pop.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={pop.gridScroll}
        contentContainerStyle={pop.grid}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {numbers.map((n) => {
          const isFrom     = n === fromVerse;
          const isTo       = n === toVerse;
          const isEndpoint = isFrom || isTo;
          const inRange    = n > fromVerse && n < toVerse;

          return (
            <TouchableOpacity
              key={n}
              onPress={() => onTap(n)}
              activeOpacity={0.65}
              style={[
                pop.cell,
                inRange    && pop.cellInRange,
                isEndpoint && !isSingle && pop.cellEndpoint,
                isSingle   && isEndpoint && pop.cellSingle,
              ]}
            >
              <Text
                style={[
                  pop.cellText,
                  inRange    && pop.cellTextInRange,
                  isEndpoint && pop.cellTextSelected,
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const pop = StyleSheet.create({
  card: {
    marginTop: 14,
    backgroundColor: SURFACE_SCREEN,
    borderRadius: 18,
    borderWidth: CARD_BORDER,
    borderColor: APP_PRIMARY,
    shadowColor: APP_PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CARD_H_PAD,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${APP_PRIMARY}40`,
  },

  hint: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: APP_PRIMARY,
    letterSpacing: 0.2,
  },

  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${APP_PRIMARY}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_PRIMARY,
  },

  gridScroll: {
    height: GRID_SCROLL_H,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
    paddingHorizontal: CARD_H_PAD,
    paddingTop: 10,
    paddingBottom: 14,
  },

  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cellInRange: {
    backgroundColor: `${APP_PRIMARY}18`,
  },
  cellEndpoint: {
    backgroundColor: APP_PRIMARY,
  },
  cellSingle: {
    backgroundColor: APP_PRIMARY,
  },

  cellText: {
    fontSize: 14,
    fontWeight: '400',
    color: TEXT_MUTED,
  },
  cellTextInRange: {
    color: APP_PRIMARY,
    fontWeight: '600',
  },
  cellTextSelected: {
    color: SURFACE,
    fontWeight: '700',
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { data: chapters, isLoading, isError: chaptersError } = useChapters();

  const [selectedChapter,    setSelectedChapter]    = useState<Chapter | null>(null);
  const [fromVerse,          setFromVerse]          = useState(0);
  const [toVerse,            setToVerse]            = useState(0);
  const [surahModalVisible,  setSurahModalVisible]  = useState(false);
  const [versePickerVisible, setVersePickerVisible] = useState(false);
  const [versePickerPhase,   setVersePickerPhase]   = useState<Phase>('from');
  const [search,             setSearch]             = useState('');
  const [headerHeight,       setHeaderHeight]       = useState(0);

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
    setVersePickerVisible(false);
    setSearch('');
  };

  const handleBack = () => {
    setSelectedChapter(null);
    setFromVerse(0);
    setToVerse(0);
    setVersePickerVisible(false);
    router.replace('/');
  };

  const openVersePicker = (phase: Phase) => {
    if (!selectedChapter) return;
    // Tapping the already-active pill closes the picker (values already saved live)
    if (versePickerVisible && versePickerPhase === phase) {
      setVersePickerVisible(false);
      return;
    }
    setVersePickerPhase(phase);
    setVersePickerVisible(true);
  };

  const handleGridTap = (n: number) => {
    if (versePickerPhase === 'from') {
      setFromVerse(n);
      if (n > toVerse) setToVerse(n);
      setVersePickerPhase('to');
    } else {
      if (n < fromVerse) {
        // Tapped before current start → new start, old start becomes end
        setToVerse(fromVerse);
        setFromVerse(n);
      } else {
        setToVerse(n);
      }
    }
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

  const versesCount     = selectedChapter?.verses_count ?? 1;
  const fromPillActive  = versePickerVisible && versePickerPhase === 'from';
  const toPillActive    = versePickerVisible && versePickerPhase === 'to';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Backdrop — closes verse picker when tapping outside */}
      {versePickerVisible && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setVersePickerVisible(false)}
        />
      )}
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <AppHeader title="" onBack={handleBack} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>What do you want{'\n'}to memorise?</Text>

        <View style={styles.sentenceRow}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>I am learning surah</Text>
          </View>

          {/* Surah pill */}
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
            style={[
              styles.versePill,
              !selectedChapter  && styles.versePillDisabled,
              fromPillActive    && styles.versePillActive,
            ]}
            onPress={() => openVersePicker('from')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, fromPillActive && styles.pillTextActive, !fromVerse && styles.pillPlaceholder]}>
              {fromVerse > 0 ? String(fromVerse) : '–'}
            </Text>
          </TouchableOpacity>

          <View style={styles.labelWrap}>
            <Text style={styles.label}>to</Text>
          </View>

          {/* To verse pill */}
          <TouchableOpacity
            style={[
              styles.versePill,
              !selectedChapter && styles.versePillDisabled,
              toPillActive     && styles.versePillActive,
            ]}
            onPress={() => openVersePicker('to')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, toPillActive && styles.pillTextActive, !toVerse && styles.pillPlaceholder]}>
              {toVerse > 0 ? String(toVerse) : '–'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inline verse grid popover */}
        {versePickerVisible && selectedChapter && (
          <VerseGridPopover
            versesCount={versesCount}
            fromVerse={fromVerse}
            toVerse={toVerse}
            phase={versePickerPhase}
            onTap={handleGridTap}
            onClose={() => setVersePickerVisible(false)}
          />
        )}
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
    paddingHorizontal: CONTENT_H_PAD,
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

  versePillActive: {
    backgroundColor: APP_PRIMARY,
    borderColor: APP_PRIMARY,
  },

  versePillDisabled: {
    opacity: 0.4,
  },

  pillText: {
    fontSize: 20,
    color: TEXT_BODY,
    textAlign: 'center',
  },

  pillTextActive: {
    color: SURFACE,
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
