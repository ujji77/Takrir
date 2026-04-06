import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEAL = '#00cbbf';

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

        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>···</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
    color: TEAL,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
});
