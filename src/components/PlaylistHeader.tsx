import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderMenu from './HeaderMenu';
import { APP_PRIMARY, SURFACE, TEXT_HEADING } from '../theme';

type Props = {
  chapterName: string;
  fromVerse: number;
  toVerse: number;
  onBack: () => void;
};

export default function PlaylistHeader({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.iconWrap}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <HeaderMenu />
      </View>

      <Text style={styles.title}>Create your playlist</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SURFACE,
    paddingBottom: 16,
    paddingHorizontal: 30,
    gap: 10,
    shadowColor: APP_PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
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
    fontSize: 30,
    fontWeight: '600',
    color: TEXT_HEADING,
    lineHeight: 38,
  },
});
