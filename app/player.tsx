import { useState } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { usePlaylistStore } from '../src/store/playlist';
import { useSettingsStore, FONT_SCALE_SIZES } from '../src/store/settings';
import SettingsPopover from '../src/components/SettingsPopover';

export default function PlayerScreen() {
  const router = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const items = usePlaylistStore((s) => s.items);
  const currentIndex = usePlaylistStore((s) => s.currentIndex);
  const currentRepeat = usePlaylistStore((s) => s.currentRepeat);
  const isPlaying = usePlaylistStore((s) => s.isPlaying);
  const togglePlay = usePlaylistStore((s) => s.togglePlay);
  const skipTo = usePlaylistStore((s) => s.skipTo);
  const stopAndReset = usePlaylistStore((s) => s.stopAndReset);

  const showArabic = useSettingsStore((s) => s.showArabic);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const quranFont = useSettingsStore((s) => s.quranFont);
  const fontScale = useSettingsStore((s) => s.fontScale);

  const currentItem = items[currentIndex];
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
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: currentItem.verseKey,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} hitSlop={8}>
              <Text style={styles.headerBtn}>Close</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => setSettingsVisible(true)} hitSlop={8}>
              <Text style={styles.headerBtn}>Settings</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Main display */}
      <View style={styles.main}>
        {showArabic && (
          <Text style={[styles.arabicText, { fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.6 }]}>
            {arabicText}
          </Text>
        )}
        {showTranslation && currentItem.translation && (
          <Text style={styles.translationText}>{currentItem.translation}</Text>
        )}

        <Text style={styles.repeatInfo}>
          Repeat {currentRepeat + 1} of {currentItem.repeatCount}
        </Text>

        <Text style={styles.progress}>
          Verse {currentIndex + 1} of {items.length}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, currentIndex === 0 && styles.controlBtnDisabled]}
          onPress={() => skipTo(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <Text style={styles.controlBtnText}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, styles.playBtn]} onPress={togglePlay}>
          <Text style={[styles.controlBtnText, { fontSize: 32 }]}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, currentIndex === items.length - 1 && styles.controlBtnDisabled]}
          onPress={() => skipTo(currentIndex + 1)}
          disabled={currentIndex === items.length - 1}
        >
          <Text style={styles.controlBtnText}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Playlist mini-list */}
      <View style={styles.miniList}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.verseKey}
            onPress={() => skipTo(index)}
            style={[styles.miniItem, index === currentIndex && styles.miniItemActive]}
          >
            <Text style={[styles.miniKey, index === currentIndex && styles.miniKeyActive]}>
              {item.verseKey}
            </Text>
            <Text style={styles.miniRepeat}>{item.repeatCount}×</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SettingsPopover visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  headerBtn: { fontSize: 16, color: '#007AFF' },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  arabicText: {
    textAlign: 'center',
    color: '#222',
  },
  translationText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  repeatInfo: { fontSize: 14, color: '#888' },
  progress: { fontSize: 13, color: '#aaa' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#007AFF',
  },
  controlBtnDisabled: { opacity: 0.3 },
  controlBtnText: { fontSize: 24 },
  miniList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  miniItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  miniItemActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  miniKey: { fontSize: 13, color: '#444' },
  miniKeyActive: { color: '#fff' },
  miniRepeat: { fontSize: 11, color: '#888' },
});
