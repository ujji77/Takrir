import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Linking,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DotsThree, ArrowSquareOut } from 'phosphor-react-native';
import { useAuthStore } from '../store/auth';
import { APP_PRIMARY, SURFACE, SHADOW, TEXT_PRIMARY, TEXT_PLACEHOLDER, BORDER_STRONG } from '../theme';

const PRIVACY_POLICY_URL = 'https://takrir-web.spatialuzair.workers.dev/privacy';
const TERMS_URL = 'https://takrir-web.spatialuzair.workers.dev/terms';
const CONTACT_URL = 'https://takrir-web.spatialuzair.workers.dev/contact';

export default function HeaderMenu() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const isLoggedIn = !!token;

  const handleLogout = () => {
    setVisible(false);
    clearAuth();
    router.replace('/');
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} hitSlop={12} style={styles.dotsBtn}>
        <DotsThree size={24} color="#222222" weight="bold" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.menu} onStartShouldSetResponder={() => true}>
            {isLoggedIn && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
                  <Text style={styles.menuItemText}>Logout</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setVisible(false); Linking.openURL(PRIVACY_POLICY_URL); }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Privacy Policy</Text>
              <ArrowSquareOut size={15} color={TEXT_PLACEHOLDER} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setVisible(false); Linking.openURL(TERMS_URL); }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Terms of Service</Text>
              <ArrowSquareOut size={15} color={TEXT_PLACEHOLDER} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setVisible(false); Linking.openURL(CONTACT_URL); }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Contact</Text>
              <ArrowSquareOut size={15} color={TEXT_PLACEHOLDER} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsBtn: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 107,
    right: 16,
    width: 185,
    borderRadius: 10,
    backgroundColor: SURFACE,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER_STRONG,
  },
});
