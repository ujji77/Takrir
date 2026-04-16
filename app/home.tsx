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
  APP_PRIMARY_ACTIVE,
  SURFACE,
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

// ─── Verse grid picker ────────────────────────────────────────────────────────

const GRID_COLS = 5;
// Modal is fixed 320 wide; 20px padding each side → 280px content
// 5 cells + 4 gaps of 8 = 5*48 + 32 = 272 ≤ 280 ✓
const CELL_SIZE   = 48;
const CELL_H      = 42;
const CELL_GAP    = 8;
const MODAL_W     = 320;
const MODAL_H     = 460;
const GRID_SCROLL_H = 280;

type Phase = 'from' | 'to';

interface VerseGridPickerProps {
  visible: boolean;
  versesCount: number;
  initialFrom: number;
  initialTo: number;
  initialPhase: Phase;
  onDone: (from: number, to: number) => void;
  onClose: () => void;
}

function VerseGridPicker({
  visible,
  versesCount,
  initialFrom,
  initialTo,
  initialPhase,
  onDone,
  onClose,
}: VerseGridPickerProps) {
  const [draftFrom, setDraftFrom] = useState(initialFrom);
  const [draftTo,   setDraftTo]   = useState(initialTo);
  const [phase,     setPhase]     = useState<Phase>(initialPhase);

  // Re-initialise draft whenever the modal opens
  useEffect(() => {
    if (visible) {
      setDraftFrom(initialFrom);
      setDraftTo(initialTo);
      setPhase(initialPhase);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = (n: number) => {
    if (phase === 'from') {
      setDraftFrom(n);
      // If new start overtakes the end, push the end forward
      if (n > draftTo) setDraftTo(n);
      setPhase('to');
    } else {
      // 'to' phase
      if (n < draftFrom) {
        // Tapped before current start → new start, old start becomes end
        setDraftTo(draftFrom);
        setDraftFrom(n);
      } else {
        setDraftTo(n);
      }
      // Stay in 'to' so user can keep refining the end
    }
  };

  const numbers = useMemo(
    () => Array.from({ length: versesCount }, (_, i) => i + 1),
    [versesCount],
  );

  const isSingle = draftFrom === draftTo;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={vg.overlay}>
        {/* Backdrop tap-to-dismiss */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={vg.card}>
          {/* Header */}
          <View style={vg.header}>
            <Text style={vg.headerTitle}>Select verses</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={vg.closeBtn}>
              <Text style={vg.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Range indicator chips — tap to switch active phase */}
          <View style={vg.rangeRow}>
            <TouchableOpacity
              style={[vg.rangeChip, phase === 'from' && vg.rangeChipActive]}
              onPress={() => setPhase('from')}
              activeOpacity={0.7}
            >
              <Text style={[vg.rangeChipLabel, phase === 'from' && vg.rangeChipLabelActive]}>
                From
              </Text>
              <Text style={[vg.rangeChipVal, phase === 'from' && vg.rangeChipValActive]}>
                {draftFrom}
              </Text>
            </TouchableOpacity>

            <View style={vg.rangeArrow}>
              <Text style={vg.rangeArrowText}>→</Text>
            </View>

            <TouchableOpacity
              style={[vg.rangeChip, phase === 'to' && vg.rangeChipActive]}
              onPress={() => setPhase('to')}
              activeOpacity={0.7}
            >
              <Text style={[vg.rangeChipLabel, phase === 'to' && vg.rangeChipLabelActive]}>
                To
              </Text>
              <Text style={[vg.rangeChipVal, phase === 'to' && vg.rangeChipValActive]}>
                {draftTo}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Phase hint */}
          <Text style={vg.hint}>
            {phase === 'from' ? 'Tap a verse to set the start' : 'Tap a verse to set the end'}
          </Text>

          {/* Number grid */}
          <ScrollView
            style={vg.gridScroll}
            contentContainerStyle={vg.grid}
            showsVerticalScrollIndicator={false}
          >
            {numbers.map((n) => {
              const isFrom     = n === draftFrom;
              const isTo       = n === draftTo;
              const isEndpoint = isFrom || isTo;
              const inRange    = n > draftFrom && n < draftTo;

              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => handleTap(n)}
                  activeOpacity={0.65}
                  style={[
                    vg.cell,
                    inRange     && vg.cellInRange,
                    isEndpoint  && !isSingle && vg.cellEndpoint,
                    isSingle    && isEndpoint && vg.cellSingle,
                  ]}
                >
                  <Text
                    style={[
                      vg.cellText,
                      inRange    && vg.cellTextInRange,
                      isEndpoint && vg.cellTextSelected,
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Done */}
          <TouchableOpacity
            style={vg.doneBtn}
            onPress={() => onDone(draftFrom, draftTo)}
            activeOpacity={0.8}
          >
            <Text style={vg.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const vg = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: MODAL_W,
    height: MODAL_H,
    backgroundColor: SURFACE,
    borderRadius: 20,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
  },

  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 12,
  },
  rangeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: SURFACE_INPUT,
    gap: 2,
  },
  rangeChipActive: {
    borderColor: APP_PRIMARY,
    backgroundColor: `${APP_PRIMARY}12`,
  },
  rangeChipLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rangeChipLabelActive: {
    color: APP_PRIMARY,
  },
  rangeChipVal: {
    fontSize: 22,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  rangeChipValActive: {
    color: APP_PRIMARY,
  },
  rangeArrow: {
    paddingBottom: 2,
  },
  rangeArrowText: {
    fontSize: 18,
    color: TEXT_TERTIARY,
  },

  hint: {
    fontSize: 12,
    color: TEXT_PLACEHOLDER,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  gridScroll: {
    height: GRID_SCROLL_H,
    marginHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
    paddingVertical: 12,
  },

  cell: {
    width: CELL_SIZE,
    height: CELL_H,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE_INPUT,
  },
  cellInRange: {
    backgroundColor: `${APP_PRIMARY}20`,
  },
  cellEndpoint: {
    backgroundColor: APP_PRIMARY,
  },
  cellSingle: {
    backgroundColor: APP_PRIMARY,
  },

  cellText: {
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_BODY,
  },
  cellTextInRange: {
    color: APP_PRIMARY,
    fontWeight: '600',
  },
  cellTextSelected: {
    color: SURFACE,
    fontWeight: '700',
  },

  doneBtn: {
    marginHorizontal: 20,
    marginTop: 'auto' as any,
    marginBottom: 20,
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
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { data: chapters, isLoading, isError: chaptersError } = useChapters();

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [fromVerse, setFromVerse] = useState(0);
  const [toVerse,   setToVerse]   = useState(0);
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
    setSearch('');
  };

  const handleBack = () => {
    setSelectedChapter(null);
    setFromVerse(0);
    setToVerse(0);
    router.replace('/');
  };

  const openVersePicker = (phase: Phase) => {
    if (!selectedChapter) return;
    setVersePickerPhase(phase);
    setVersePickerVisible(true);
  };

  const handleVerseDone = (from: number, to: number) => {
    setFromVerse(from);
    setToVerse(to);
    setVersePickerVisible(false);
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
            style={[styles.versePill, !selectedChapter && styles.versePillDisabled]}
            onPress={() => openVersePicker('from')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, !fromVerse && styles.pillPlaceholder]}>
              {fromVerse > 0 ? String(fromVerse) : '–'}
            </Text>
          </TouchableOpacity>

          <View style={styles.labelWrap}>
            <Text style={styles.label}>to</Text>
          </View>

          {/* To verse pill */}
          <TouchableOpacity
            style={[styles.versePill, !selectedChapter && styles.versePillDisabled]}
            onPress={() => openVersePicker('to')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, !toVerse && styles.pillPlaceholder]}>
              {toVerse > 0 ? String(toVerse) : '–'}
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

      {/* Verse grid picker */}
      <VerseGridPicker
        visible={versePickerVisible}
        versesCount={versesCount}
        initialFrom={fromVerse > 0 ? fromVerse : 1}
        initialTo={toVerse > 0 ? toVerse : versesCount}
        initialPhase={versePickerPhase}
        onDone={handleVerseDone}
        onClose={() => setVersePickerVisible(false)}
      />

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
