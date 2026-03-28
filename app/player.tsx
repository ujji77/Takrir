import { useMemo } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlaylistStore } from '../src/store/playlist';
import { useRecitations } from '../src/hooks/useRecitations';
import { useSettingsStore } from '../src/store/settings';

export default function PlayerScreen() {
  const router = useRouter();
  const items = usePlaylistStore((s) => s.items);
  const currentIndex = usePlaylistStore((s) => s.currentIndex);
  const currentRepeat = usePlaylistStore((s) => s.currentRepeat);
  const isPlaying = usePlaylistStore((s) => s.isPlaying);
  const showArabic = usePlaylistStore((s) => s.showArabic);
  const togglePlay = usePlaylistStore((s) => s.togglePlay);
  const skipTo = usePlaylistStore((s) => s.skipTo);
  const toggleArabic = usePlaylistStore((s) => s.toggleArabic);
  const stopAndReset = usePlaylistStore((s) => s.stopAndReset);

  const recitationId = useSettingsStore((s) => s.recitationId);
  const { data: recitations } = useRecitations();

  const currentItem = items[currentIndex];

  const currentRecitation = useMemo(
    () => recitations?.find((r) => r.id === recitationId),
    [recitations, recitationId],
  );

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

      {/* Main display */}
      <View style={styles.main}>
        <Text style={styles.verseKey}>{currentItem.verseKey}</Text>

        {showArabic && (
          <Text style={styles.arabicText}>{currentItem.textUthmani}</Text>
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

      {/* Toggle Arabic */}
      <View style={styles.footer}>
        <Button
          title={showArabic ? 'Hide Arabic' : 'Show Arabic'}
          onPress={toggleArabic}
        />
        <Button title="Close" onPress={handleBack} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
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
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  verseKey: { fontSize: 18, fontWeight: '700', color: '#444' },
  arabicText: {
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 48,
    color: '#222',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
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
