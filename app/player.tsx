import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Eye,
  EyeSlash,
  ArrowFatLinesUp,
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
  SUPPORTED_RECITATION_IDS,
  type FontScale,
  type QuranFont,
} from '../src/store/settings';
import { useChapters } from '../src/hooks/useChapters';
import { useRecitations } from '../src/hooks/useRecitations';

import { APP_PRIMARY, APP_PRIMARY_ACTIVE } from '../src/theme';
const bismillahImg = require('../assets/bismillah.png');

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [playlistVisible, setPlaylistVisible] = useState(false);

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
  const { data: recitations } = useRecitations();

  const currentItem = items[currentIndex];
  const chapterNumber = currentItem ? parseInt(currentItem.verseKey.split(':')[0], 10) : null;

  const chapter = useMemo(
    () => chapters?.find((c) => c.id === chapterNumber),
    [chapters, chapterNumber],
  );

  const supportedRecitations = useMemo(
    () =>
      recitations?.filter((r) =>
        (SUPPORTED_RECITATION_IDS as readonly number[]).includes(r.id),
      ) ?? [],
    [recitations],
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
          <Text style={styles.headerTitle}>{chapterName}</Text>
          <View style={styles.headerIconWrap} />
        </View>
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
              ]}
            >
              {arabicText}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Controls card — anchored to bottom */}
      <View style={[styles.card, { paddingBottom: insets.bottom + 30 }]}>
          {/* Playback controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={() => skipTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              hitSlop={12}
            >
              <SkipBack
                size={26}
                color={APP_PRIMARY}
                weight="fill"
                style={currentIndex === 0 ? styles.dimmed : undefined}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.8}>
              {isPlaying
                ? <Pause size={36} color="#fff" weight="fill" />
                : <Play size={36} color="#fff" weight="fill" style={{ marginLeft: 4 }} />
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => skipTo(currentIndex + 1)}
              disabled={currentIndex === items.length - 1}
              hitSlop={12}
            >
              <SkipForward
                size={26}
                color={APP_PRIMARY}
                weight="fill"
                style={currentIndex === items.length - 1 ? styles.dimmed : undefined}
              />
            </TouchableOpacity>
          </View>

          {/* Icon bar */}
          <View style={styles.iconBar}>
            <View style={styles.iconBarLeft}>
              <TouchableOpacity onPress={() => setShowArabic(!showArabic)} hitSlop={10}>
                {showArabic
                  ? <Eye size={24} color={APP_PRIMARY} />
                  : <EyeSlash size={24} color={APP_PRIMARY} opacity={0.35} />
                }
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const idx = FONT_SCALES.indexOf(fontScale);
                  setFontScale(FONT_SCALES[(idx + 1) % FONT_SCALES.length] as FontScale);
                }}
                hitSlop={10}
              >
                <ArrowFatLinesUp size={24} color={APP_PRIMARY} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const idx = QURAN_FONTS.indexOf(quranFont);
                  setQuranFont(QURAN_FONTS[(idx + 1) % QURAN_FONTS.length] as QuranFont);
                }}
                hitSlop={10}
              >
                <Translate size={24} color={APP_PRIMARY} />
              </TouchableOpacity>

              {/* Speed toggle */}
              <TouchableOpacity
                onPress={() => {
                  const idx = PLAYBACK_RATES.indexOf(playbackRate as typeof PLAYBACK_RATES[number]);
                  const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
                  setPlaybackRate(next);
                  applyPlaybackRate(next);
                }}
                hitSlop={10}
                style={styles.speedBadge}
              >
                <Text style={styles.speedText}>{playbackRate}×</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleRepeatPlaylist} hitSlop={10}>
                <Repeat size={24} color={APP_PRIMARY} opacity={repeatPlaylist ? 1 : 0.35} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setPlaylistVisible(true)} hitSlop={10}>
              <Queue size={24} color={APP_PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Reciter section — commented out
          <View style={styles.reciterSection}>
            <Text style={styles.sectionTitle}>Reciter</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reciterList}
              nestedScrollEnabled
            >
              {supportedRecitations.map((reciter) => {
                const active = reciter.id === recitationId;
                return (
                  <TouchableOpacity
                    key={reciter.id}
                    style={[styles.reciterCard, active && styles.reciterCardActive]}
                    onPress={() => setRecitation(reciter.id)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={bismillahImg}
                      style={styles.reciterImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.reciterName} numberOfLines={2}>
                      {reciter.reciter_name}
                      {reciter.style ? `\n${reciter.style}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          */}
        </View>

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
          <ScrollView
            contentContainerStyle={styles.chipGrid}
            keyboardShouldPersistTaps="handled"
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.verseKey}
                onPress={() => {
                  skipTo(index);
                  setPlaylistVisible(false);
                }}
                style={[styles.chip, index === currentIndex && styles.chipActive]}
              >
                <Text style={styles.chipText}>
                  {item.verseKey} (x{item.repeatCount})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16, color: '#888' },

  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconWrap: { width: 28, alignItems: 'center' },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
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
    color: '#bbb',
  },
  arabicText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
  },
  translationText: {
    fontSize: 16,
    color: '#3b3b3b',
    lineHeight: 24,
    textAlign: 'center',
  },

  // Controls card
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    gap: 30,
    shadowColor: '#000',
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
    backgroundColor: 'rgba(0, 203, 191, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Icon bar
  iconBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },

  // Reciter section — inside the card
  reciterSection: {
    backgroundColor: '#fafafa',
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  reciterList: { gap: 12, paddingRight: 4 },
  reciterCard: {
    width: 100,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#efefef',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 10,
  },
  reciterCardActive: {
    borderWidth: 2,
    borderColor: APP_PRIMARY,
  },
  reciterImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.12,
  },
  reciterName: {
    fontSize: 12,
    color: '#000',
    lineHeight: 18,
  },

  // Playlist sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    height: 31,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cdcdcd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  chipActive: { backgroundColor: APP_PRIMARY_ACTIVE },
  chipText: { fontSize: 13, color: '#222' },
});
