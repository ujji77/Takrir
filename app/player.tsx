import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Eye,
  EyeSlash,
  TextAa,
  Translate,
  Queue,
  CaretLeft,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
} from 'phosphor-react-native';
import { usePlaylistStore } from '../src/store/playlist';
import {
  useSettingsStore,
  FONT_SCALE_SIZES,
  FONT_SCALES,
  QURAN_FONTS,
  PLAYBACK_RATES,
  type FontScale,
  type QuranFont,
} from '../src/store/settings';
import { useChapters } from '../src/hooks/useChapters';

import {
  APP_PRIMARY,
  APP_PRIMARY_ACTIVE,
  APP_PRIMARY_LIGHT,
  SURFACE,
  SURFACE_SCREEN,
  SURFACE_FROSTED,
  BORDER_STRONG,
  HANDLE,
  OVERLAY,
  TEXT_HEADING,
  TEXT_PRIMARY,
  TEXT_BODY,
  TEXT_MUTED,
  TEXT_SECONDARY,
  TEXT_PLACEHOLDER,
} from '../src/theme';

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  type DrawerType = 'arabic' | 'fontSize' | 'font' | 'speed' | 'repeat';

  const [playlistVisible, setPlaylistVisible] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<DrawerType | null>(null);

  const selectDrawer = (id: DrawerType) => {
    setActiveDrawer((prev) => (prev === id ? null : id));
  };

  const items = usePlaylistStore((s) => s.items);
  const currentIndex = usePlaylistStore((s) => s.currentIndex);
  const currentRepeat = usePlaylistStore((s) => s.currentRepeat);
  const isPlaying = usePlaylistStore((s) => s.isPlaying);
  const togglePlay = usePlaylistStore((s) => s.togglePlay);
  const skipTo = usePlaylistStore((s) => s.skipTo);
  const applyPlaybackRate = usePlaylistStore((s) => s.applyPlaybackRate);
  const stopAndReset = usePlaylistStore((s) => s.stopAndReset);
  const repeatPlaylist = usePlaylistStore((s) => s.repeatPlaylist);
  const toggleRepeatPlaylist = usePlaylistStore((s) => s.toggleRepeatPlaylist);
  const setRepeatCount = usePlaylistStore((s) => s.setRepeatCount);

  const showArabic = useSettingsStore((s) => s.showArabic);
  const quranFont = useSettingsStore((s) => s.quranFont);
  const fontScale = useSettingsStore((s) => s.fontScale);
  const recitationId = useSettingsStore((s) => s.recitationId);
  const playbackRate = useSettingsStore((s) => s.playbackRate);
  const setShowArabic = useSettingsStore((s) => s.setShowArabic);
  const setQuranFont = useSettingsStore((s) => s.setQuranFont);
  const setFontScale = useSettingsStore((s) => s.setFontScale);
  const setPlaybackRate = useSettingsStore((s) => s.setPlaybackRate);
  const setRecitation = useSettingsStore((s) => s.setRecitation);

  const { data: chapters } = useChapters();

  // Waveform animation — 3-tier bar heights based on position
  const BAR_COUNT = 28;
  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0)),
  ).current;
  const barDurations = useRef(
    Array.from({ length: BAR_COUNT }, () => 200 + Math.random() * 500),
  ).current;

  const getBarTier = (i: number): 'sm' | 'md' | 'lg' => {
    if (i < 3 || i >= 25) return 'sm';
    if (i < 7 || i >= 21) return 'md';
    return 'lg';
  };
  const TIER_CONFIG = {
    sm: { minH: 10, maxH: 25, minOp: 0.35, maxOp: 1 },
    md: { minH: 15, maxH: 50, minOp: 0.35, maxOp: 1 },
    lg: { minH: 15, maxH: 70, minOp: 0.35, maxOp: 1 },
  };

  useEffect(() => {
    if (isPlaying) {
      const loops = barAnims.map((anim, i) => {
        const dur = barDurations[i];
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: dur,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: dur,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
        );
      });
      const timers: ReturnType<typeof setTimeout>[] = [];
      loops.forEach((loop, i) => {
        timers.push(setTimeout(() => loop.start(), (i % 7) * 50));
      });
      return () => {
        timers.forEach(clearTimeout);
        loops.forEach((l) => l.stop());
      };
    } else {
      barAnims.forEach((anim) =>
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: false }).start(),
      );
    }
  }, [isPlaying, currentIndex]);

  const currentItem = items[currentIndex];
  const chapterNumber = currentItem ? parseInt(currentItem.verseKey.split(':')[0], 10) : null;

  const chapter = useMemo(
    () => chapters?.find((c) => c.id === chapterNumber),
    [chapters, chapterNumber],
  );

  const arabicFontSize = FONT_SCALE_SIZES[fontScale];
  const arabicText = currentItem
    ? quranFont === 'text_indopak'
      ? (currentItem.text_indopak ?? currentItem.text_uthmani)
      : currentItem.text_uthmani
    : '';

  const handleBack = () => {
    stopAndReset();
    router.back();
  };

  if (!currentItem) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No playlist loaded.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: APP_PRIMARY }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const chapterName = chapter
    ? `Surah ${chapter.name_simple}`
    : `Surah ${currentItem.verseKey.split(':')[0]}`;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Fixed header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} hitSlop={12} style={styles.headerIconWrap}>
            <CaretLeft size={22} color={APP_PRIMARY} weight="bold" />
          </TouchableOpacity>
          <View style={styles.headerIconWrap} />
        </View>
        <Text style={styles.headerTitle}>{chapterName}</Text>
      </View>

      {/* Verse text area — fills space between header and anchored card */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.verseScroll}
      >
        <View style={styles.verseArea}>
          <Text style={styles.verseKey}>
            {currentItem.verseKey}
            <Text style={styles.verseKeyPipe}>{' | '}</Text>
            Repeat: {currentRepeat + 1}x
          </Text>
          {showArabic && (
            <Text
              style={[
                styles.arabicText,
                { fontSize: arabicFontSize, lineHeight: arabicFontSize * 2 },
                quranFont === 'text_indopak' && { fontFamily: 'pdms-saleem-quranfont' },
              ]}
            >
              {arabicText}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Waveform — above the controls card */}
      <View style={styles.waveform}>
        {barAnims.map((anim, i) => {
          const tier = getBarTier(i);
          const { minH, maxH, minOp, maxOp } = TIER_CONFIG[tier];
          return (
            <Animated.View
              key={i}
              style={[
                styles.waveformBar,
                {
                  height: anim.interpolate({ inputRange: [0, 1], outputRange: [minH, maxH] }),
                  opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [minOp, maxOp] }),
                },
              ]}
            />
          );
        })}
      </View>

      {/* Controls card — anchored to bottom */}
      <View style={[styles.card, { paddingBottom: insets.bottom + 30 }]}>

        {/* Playback controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={() => skipTo(currentIndex - 1)} disabled={currentIndex === 0} hitSlop={12}>
            <SkipBack size={26} color={APP_PRIMARY} weight="fill" style={currentIndex === 0 ? styles.dimmed : undefined} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.8}>
            {isPlaying
              ? <Pause size={36} color="#fff" weight="fill" />
              : <Play size={36} color="#fff" weight="fill" style={{ marginLeft: 4 }} />
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => skipTo(currentIndex + 1)} disabled={currentIndex === items.length - 1} hitSlop={12}>
            <SkipForward size={26} color={APP_PRIMARY} weight="fill" style={currentIndex === items.length - 1 ? styles.dimmed : undefined} />
          </TouchableOpacity>
        </View>

        {/* Icon bar */}
        <View style={styles.iconBar}>
          <View style={styles.iconBarLeft}>
            <TouchableOpacity onPress={() => selectDrawer('arabic')} hitSlop={10} style={{ opacity: activeDrawer === 'arabic' ? 1 : showArabic ? 0.6 : 0.35 }}>
              {showArabic ? <Eye size={24} color={APP_PRIMARY} /> : <EyeSlash size={24} color={APP_PRIMARY} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectDrawer('fontSize')} hitSlop={10} style={{ opacity: activeDrawer === 'fontSize' ? 1 : 0.6 }}>
              <TextAa size={24} color={APP_PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectDrawer('font')} hitSlop={10} style={{ opacity: activeDrawer === 'font' ? 1 : 0.6 }}>
              <Translate size={24} color={APP_PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectDrawer('speed')} hitSlop={10} style={styles.speedBadge}>
              <Text style={[styles.speedText, activeDrawer === 'speed' && styles.speedTextActive]}>{playbackRate}×</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectDrawer('repeat')} hitSlop={10} style={{ opacity: repeatPlaylist ? (activeDrawer === 'repeat' ? 1 : 0.6) : (activeDrawer === 'repeat' ? 0.6 : 0.35) }}>
              <Repeat size={24} color={APP_PRIMARY} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setPlaylistVisible(true)} hitSlop={10}>
            <Queue size={24} color={APP_PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings bottom sheet */}
      <Modal
        visible={activeDrawer !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveDrawer(null)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setActiveDrawer(null)}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.sheetHandle} />

          {activeDrawer === 'arabic' && (
            <>
              <Text style={styles.sheetTitle}>Display text</Text>
              <View style={styles.drawerChipRow}>
                <TouchableOpacity style={[styles.drawerChip, showArabic && styles.drawerChipActive]} onPress={() => setShowArabic(true)}>
                  <Eye size={14} color={TEXT_BODY} /><Text style={styles.drawerChipText}>Show</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.drawerChip, !showArabic && styles.drawerChipActive]} onPress={() => setShowArabic(false)}>
                  <EyeSlash size={14} color={TEXT_BODY} /><Text style={styles.drawerChipText}>Hide</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {activeDrawer === 'fontSize' && (
            <>
              <Text style={styles.sheetTitle}>Text size</Text>
              <View style={styles.drawerChipRow}>
                {(['S', 'M', 'L', 'XL'] as FontScale[]).map((scale, i) => (
                  <TouchableOpacity key={scale} style={[styles.drawerChip, fontScale === scale && styles.drawerChipActive]} onPress={() => setFontScale(scale)}>
                    <Text style={styles.drawerChipText}>{['Small', 'Medium', 'Large', 'Extra large'][i]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {activeDrawer === 'font' && (
            <>
              <Text style={styles.sheetTitle}>Script type</Text>
              <View style={styles.drawerChipRow}>
                <TouchableOpacity style={[styles.drawerChip, quranFont === 'text_uthmani' && styles.drawerChipActive]} onPress={() => setQuranFont('text_uthmani')}>
                  <Text style={styles.drawerChipText}>Uthmani</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.drawerChip, quranFont === 'text_indopak' && styles.drawerChipActive]} onPress={() => setQuranFont('text_indopak')}>
                  <Text style={styles.drawerChipText}>Indo-Pak</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {activeDrawer === 'speed' && (
            <>
              <Text style={styles.sheetTitle}>Speed</Text>
              <View style={styles.drawerChipRow}>
                {PLAYBACK_RATES.map((rate) => (
                  <TouchableOpacity key={rate} style={[styles.drawerChip, playbackRate === rate && styles.drawerChipActive]} onPress={() => { setPlaybackRate(rate); applyPlaybackRate(rate); }}>
                    <Text style={styles.drawerChipText}>{rate}×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {activeDrawer === 'repeat' && (
            <>
              <Text style={styles.sheetTitle}>Repeat playlist</Text>
              <View style={styles.drawerChipRow}>
                <TouchableOpacity style={[styles.drawerChip, repeatPlaylist && styles.drawerChipActive]} onPress={() => { if (!repeatPlaylist) toggleRepeatPlaylist(); }}>
                  <Text style={styles.drawerChipText}>On</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.drawerChip, !repeatPlaylist && styles.drawerChipActive]} onPress={() => { if (repeatPlaylist) toggleRepeatPlaylist(); }}>
                  <Text style={styles.drawerChipText}>Off</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Playlist bottom sheet */}
      <Modal
        visible={playlistVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPlaylistVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setPlaylistVisible(false)}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Playlist</Text>

          {/* Column headers */}
          <View style={styles.playlistColHeader}>
            <Text style={styles.playlistColLabel}>Verse</Text>
            <Text style={styles.playlistColLabel}>Repeats</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item, index) => (
              <View key={item.verseKey}>
                <View style={styles.playlistRow}>
                  <TouchableOpacity
                    onPress={() => { skipTo(index); setPlaylistVisible(false); }}
                    hitSlop={8}
                  >
                    <Text style={[styles.playlistVerseKey, index === currentIndex && styles.playlistVerseKeyActive]}>
                      {item.verseKey}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => setRepeatCount(item.verseKey, item.repeatCount - 1)} hitSlop={10}>
                      <Text style={styles.stepperBtn}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.stepperBadge}>
                      <Text style={styles.stepperCount}>{item.repeatCount}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setRepeatCount(item.verseKey, item.repeatCount + 1)} hitSlop={10}>
                      <Text style={styles.stepperBtn}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.playlistDivider} />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_SCREEN },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16, color: TEXT_SECONDARY },

  // Header
  header: {
    backgroundColor: SURFACE,
    paddingHorizontal: 30,
    paddingBottom: 16,
    gap: 10,
    shadowColor: APP_PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconWrap: { width: 28, alignItems: 'center' },
  headerTitle: {
    fontSize: 30,
    fontWeight: '600',
    color: TEXT_HEADING,
    textAlign: 'center',
    lineHeight: 38,
  },

  scroll: { flex: 1 },
  verseScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Verse area
  verseArea: {
    paddingHorizontal: 38,
    paddingVertical: 24,
    gap: 16,
  },
  verseKey: {
    fontSize: 18,
    color: APP_PRIMARY,
    textAlign: 'center',
  },
  verseKeyPipe: {
    color: TEXT_PLACEHOLDER,
  },
  arabicText: {
    color: TEXT_MUTED,
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
  },
  translationText: {
    fontSize: 16,
    color: TEXT_MUTED,
    lineHeight: 24,
    textAlign: 'center',
  },

  // Waveform
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    height: 70,
    paddingHorizontal: 12,
  },
  waveformBar: {
    flex: 1,
    maxWidth: 4,
    borderRadius: 2,
    backgroundColor: APP_PRIMARY,
  },

  // Controls card
  card: {
    backgroundColor: SURFACE_FROSTED,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 43,
  },
  dimmed: { opacity: 0.3 },
  playBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: APP_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Icon bar
  iconBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 44,
  },
  iconBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  speedBadge: {
    paddingHorizontal: 4,
  },
  speedText: {
    fontSize: 16,
    color: APP_PRIMARY,
    fontWeight: '600',
    opacity: 0.6,
  },
  speedTextActive: {
    opacity: 1,
  },

  // Settings drawer chips
  drawerChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  drawerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  drawerChipActive: {
    backgroundColor: APP_PRIMARY_LIGHT,
  },
  drawerChipText: {
    fontSize: 15,
    color: TEXT_BODY,
  },

  // Playlist sheet
  backdrop: { flex: 1, backgroundColor: OVERLAY },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    maxHeight: '65%',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: HANDLE,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 16,
  },
  playlistColHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playlistColLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  playlistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playlistDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER_STRONG,
  },
  playlistVerseKey: {
    fontSize: 18,
    fontWeight: '400',
    color: TEXT_PRIMARY,
  },
  playlistVerseKeyActive: {
    color: APP_PRIMARY,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    fontSize: 16,
    color: TEXT_MUTED,
    paddingHorizontal: 4,
  },
  stepperBadge: {
    borderWidth: 1,
    borderColor: APP_PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 26,
    alignItems: 'center',
    backgroundColor: SURFACE,
  },
  stepperCount: {
    fontSize: 16,
    fontWeight: '400',
    color: TEXT_PRIMARY,
  },
});
