import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderMenu from './HeaderMenu';
import { APP_PRIMARY, SURFACE, SHADOW, TEXT_HEADING, TEXT_MUTED, TEXT_BODY } from '../theme';

type Props = {
  chapterName: string;
  fromVerse: number;
  toVerse: number;
  onBack: () => void;
};

export default function PlaylistHeader({ chapterName, fromVerse, toVerse, onBack }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.iconWrap}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create your playlist</Text>

        <HeaderMenu />
      </View>

      <View style={styles.chips}>
        <Text style={styles.chipLabel}>Surah</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{chapterName}</Text>
        </View>
        <Text style={styles.chipLabel}>verse</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{fromVerse}</Text>
        </View>
        <Text style={styles.chipLabel}>to</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{toVerse}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SURFACE,
    paddingBottom: 16,
    paddingHorizontal: 30,
    gap: 10,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  topRow: {
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
    color: APP_PRIMARY,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_HEADING,
    textAlign: 'center',
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  chipLabel: {
    fontSize: 16,
    color: TEXT_MUTED,
  },
  chip: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: APP_PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 16,
    color: TEXT_BODY,
  },
});
