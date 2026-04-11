import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderMenu from './HeaderMenu';
import { APP_PRIMARY, SURFACE, TEXT_HEADING } from '../theme';

type Props = {
  title: string;
  onBack?: () => void;
};

export default function AppHeader({ title, onBack }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} hitSlop={12}>
              <Text style={styles.iconText}>←</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.title}>{title}</Text>

        <HeaderMenu />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SURFACE,
    paddingBottom: 16,
    paddingHorizontal: 30,
    shadowColor: APP_PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  row: {
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
});
