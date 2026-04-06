import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaylistStore } from '../src/store/playlist';
import { useSettingsStore, FONT_SCALE_SIZES } from '../src/store/settings';
import { useChapters } from '../src/hooks/useChapters';
import SettingsPopover from '../src/components/SettingsPopover';

const TEAL = '#00cbbf';
const TEAL_ACTIVE = '#a0eae5';

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const items = usePlaylistStore((s) => s.items);
  const currentIndex = usePlaylistStore((s) => s.currentIndex);
  const isPlaying = usePlaylistStore((s) => s.isPlaying);
  const togglePlay = usePlaylistStore((s) => s.togglePlay);
  const skipTo = usePlaylistStore((s) => s.skipTo);
  const stopAndReset = usePlaylistStore((s) => s.stopAndReset);

  const showArabic = useSettingsStore((s) => s.showArabic);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const quranFont = useSettingsStore((s) => s.quranFont);
  const fontScale = useSettingsStore((s) => s.fontScale);

  const { data: chapters } = useChapters();

  const currentItem = items[currentIndex];

  const chapterNumber = currentItem
    ? parseInt(currentItem.verseKey.split(':')[0], 10)
    : null;

  const chapter = useMemo(
    () => chapters?.find((c) => c.id === chapterNumber),
    [chapters, chapterNumber],
  );

  const arabicFontSize = FONT_SCALE_SIZES[fontScale];
  const arabicText = currentItem
    ? (currentItem.texts[quranFont] ?? currentItem.texts.text_uthmani)
    : '';

  const handleBack = () => {
    stopAndReset();
    router.back();
  };

  if (!currentItem) {
    return (
      <View style={styles.center}>
        <Text>No playlist loaded.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: TEAL }}>Back</Text>
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

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} hitSlop={12} style={styles.iconWrap}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{chapterName}</Text>
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            hitSlop={12}
            style={styles.iconWrap}
          >
            <Text style={styles.iconText}>···</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Arabic + Translation */}
      <View style={styles.main}>
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
        {showTranslation && currentItem.translation && (
          <Text style={styles.translationText}>{currentItem.translation}</Text>
        )}
      </View>

      {/* Verse chip strip */}
      <ScrollView
        contentContainerStyle={styles.chipStrip}
        style={styles.chipScroll}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.verseKey}
            onPress={() => skipTo(index)}
            style={[styles.chip, index === currentIndex && styles.chipActive]}
          >
            <Text style={styles.chipText}>
              {item.verseKey} (x{item.repeatCount})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={() => skipTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          hitSlop={12}
        >
          <Text style={[styles.skipIcon, currentIndex === 0 && styles.iconDisabled]}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={togglePlay} activeOpacity={0.8}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => skipTo(currentIndex + 1)}
          disabled={currentIndex === items.length - 1}
          hitSlop={12}
        >
          <Text
            style={[
              styles.skipIcon,
              currentIndex === items.length - 1 && styles.iconDisabled,
            ]}
          >
            ⏭
          </Text>
        </TouchableOpacity>
      </View>

      <SettingsPopover visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
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
    gap: 16,
  },

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
  iconWrap: {
    minWidth: 28,
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    color: TEAL,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },

  // Main content
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 38,
    gap: 24,
  },
  arabicText: {
    color: '#333',
    textAlign: 'right',
    fontWeight: '500',
    width: '100%',
  },
  translationText: {
    fontSize: 16,
    color: '#3b3b3b',
    lineHeight: 24,
    textAlign: 'left',
    width: '100%',
  },

  // Chip strip
  chipScroll: {
    maxHeight: 110,
    flexGrow: 0,
  },
  chipStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 38,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    width: 90,
    height: 31,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cdcdcd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  chipActive: {
    backgroundColor: TEAL_ACTIVE,
  },
  chipText: {
    fontSize: 13,
    color: '#222',
  },

  // Controls
  controls: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 43,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 203, 191, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 32,
    color: '#fff',
    marginLeft: 4,
  },
  skipIcon: {
    fontSize: 24,
    color: TEAL,
  },
  iconDisabled: {
    opacity: 0.3,
  },
});
