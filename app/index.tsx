import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthRequest, exchangeCodeAsync, makeRedirectUri } from 'expo-auth-session';
import { useAuthStore } from '../src/store/auth';
import { APP_PRIMARY, SURFACE } from '../src/theme';
import { useSettingsStore } from '../src/store/settings';

const AUTH_URL = process.env.EXPO_PUBLIC_QURAN_AUTH_URL ?? 'https://oauth2.quran.foundation';
const CLIENT_ID = process.env.EXPO_PUBLIC_QURAN_CLIENT_ID ?? '';

const PRIVACY_URL = 'https://takrir-web.spatialuzair.workers.dev/privacy';
const TERMS_URL = 'https://takrir-web.spatialuzair.workers.dev/terms';

const discovery = {
  authorizationEndpoint: `${AUTH_URL}/oauth2/auth`,
  tokenEndpoint: `${AUTH_URL}/oauth2/token`,
  revocationEndpoint: `${AUTH_URL}/oauth2/revoke`,
};

const redirectUri = makeRedirectUri({ scheme: 'takrir', path: 'auth' });

const iconImg = require('../assets/icon.png');

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setToken = useAuthStore((s) => s.setToken);
  const setGuest = useAuthStore((s) => s.setGuest);
  const [signingIn, setSigningIn] = useState(false);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'offline_access'],
      redirectUri,
      usePKCE: true,
    },
    discovery,
  );

  useEffect(() => {
    if (!response) return;

    if (response.type === 'error') {
      setSigningIn(false);
      Alert.alert(
        'Sign in failed',
        response.error?.message ?? response.params?.error_description ?? 'Something went wrong. Please try again.',
      );
      return;
    }

    if (response.type === 'success' && response.params.code && request?.codeVerifier) {
      exchangeCodeAsync(
        {
          clientId: CLIENT_ID,
          code: response.params.code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier },
        },
        discovery,
      )
        .then((tokens) => {
          setToken(tokens.accessToken);
          useSettingsStore.getState().loadCloudSettings().catch(() => null);
          router.replace('/home');
        })
        .catch((err) => {
          setSigningIn(false);
          Alert.alert('Sign in failed', err?.message ?? 'Could not complete sign in. Please try again.');
        });
      return;
    }

    // cancelled or dismissed — reset loading state
    setSigningIn(false);
  }, [response]);

  const handleGuest = () => {
    setGuest();
    router.replace('/home');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topSpacer} />

      <View style={styles.brand}>
        <Image source={iconImg} style={styles.icon} resizeMode="contain" />
        <Text style={styles.wordmark}>Takrir</Text>
      </View>

      <View style={styles.midSpacer} />

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => { setSigningIn(true); promptAsync(); }}
          disabled={!request || signingIn}
          hitSlop={10}
        >
          {!request || signingIn
            ? <ActivityIndicator color={SURFACE} />
            : <Text style={styles.actionLink}>Sign in</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGuest} hitSlop={10}>
          <Text style={styles.actionLink}>Continue as guest</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />

      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <View style={styles.legalDivider} />
        <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
          <Text style={styles.legalLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_PRIMARY,
    alignItems: 'center',
  },

  topSpacer: { flex: 2 },
  midSpacer: { height: 80 },
  bottomSpacer: { flex: 3 },

  brand: {
    alignItems: 'center',
    gap: 0,
  },
  icon: {
    width: 71,
    height: 95,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '600',
    color: SURFACE,
    marginTop: 4,
  },

  actions: {
    alignItems: 'center',
    gap: 16,
  },
  actionLink: {
    fontSize: 18,
    color: SURFACE,
    textDecorationLine: 'underline',
  },

  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalLink: {
    fontSize: 14,
    color: SURFACE,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    width: 1,
    height: 16,
    backgroundColor: SURFACE,
  },
});
