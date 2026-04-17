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
import { useAuthRequest, exchangeCodeAsync } from 'expo-auth-session';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useAuthStore } from '../src/store/auth';
import { APP_PRIMARY } from '../src/theme';
import { useSettingsStore } from '../src/store/settings';
import TakrirIcon from '../assets/takrir-icon-black.svg';

const AUTH_URL = process.env.EXPO_PUBLIC_QURAN_AUTH_URL ?? 'https://oauth2.quran.foundation';
const CLIENT_ID = process.env.EXPO_PUBLIC_QURAN_CLIENT_ID ?? '';

const PRIVACY_URL = 'https://takrir-web.spatialuzair.workers.dev/privacy';
const TERMS_URL  = 'https://takrir-web.spatialuzair.workers.dev/terms';

const discovery = {
  authorizationEndpoint: `${AUTH_URL}/oauth2/auth`,
  tokenEndpoint:         `${AUTH_URL}/oauth2/token`,
  revocationEndpoint:    `${AUTH_URL}/oauth2/revoke`,
};

const redirectUri = 'https://takrir-web.spatialuzair.workers.dev/auth/callback';

const bgHomeImg = require('../assets/bg-home.png');

export default function AuthScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const setToken = useAuthStore((s) => s.setToken);
  const setGuest = useAuthStore((s) => s.setGuest);
  const [signingIn, setSigningIn] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [request, response, promptAsync] = useAuthRequest(
    { clientId: CLIENT_ID, scopes: ['offline_access'], redirectUri, usePKCE: true },
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
        { clientId: CLIENT_ID, code: response.params.code, redirectUri, codeVerifier: request.codeVerifier },
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

    setSigningIn(false);
  }, [response]);

  const handleGuest = () => {
    setGuest();
    router.replace('/home');
  };

  const f400 = fontsLoaded ? { fontFamily: 'PlusJakartaSans_400Regular' }  : {};
  const f600 = fontsLoaded ? { fontFamily: 'PlusJakartaSans_600SemiBold' } : {};
  const f700 = fontsLoaded ? { fontFamily: 'PlusJakartaSans_700Bold' }     : {};

  return (
    <View style={styles.container}>
      {/* Background image — centred, aspect ratio preserved */}
      <View style={[StyleSheet.absoluteFill, styles.bgWrap]}>
        <Image source={bgHomeImg} style={styles.bgImage} resizeMode="contain" />
      </View>

      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.9)']}
        locations={[0, 0.6, 1]}
        style={styles.overlay}
      />

      {/* Content — bottom anchored */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 47 }]}>

        {/* Brand: "Takrir" text then icon */}
        <View style={styles.brand}>
          <Text style={[styles.wordmark, f700]}>Takrir</Text>
          <TakrirIcon width={46} height={61.38} />
        </View>

        <View style={{ height: 50 }} />

        {/* Sign in */}
        <TouchableOpacity
          onPress={() => { setSigningIn(true); promptAsync({ preferEphemeralSession: false }); }}
          disabled={!request || signingIn}
          hitSlop={10}
        >
          {!request || signingIn
            ? <ActivityIndicator color={APP_PRIMARY} />
            : <Text style={[styles.signInText, f600]}>Sign in</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 8 }} />

        {/* Continue as guest */}
        <TouchableOpacity onPress={handleGuest} hitSlop={10}>
          <Text style={[styles.guestText, f400]}>Continue as guest</Text>
        </TouchableOpacity>

        <View style={{ height: 49 }} />

        {/* Legal row */}
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <Text style={[styles.legalLink, f400]}>Privacy Policy</Text>
          </TouchableOpacity>
          <View style={styles.legalDivider} />
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text style={[styles.legalLink, f400]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  bgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },

  overlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    bottom: 0,
  },

  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222222',
    lineHeight: 33,
  },

  signInText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    textDecorationLine: 'underline',
    lineHeight: 23,
  },

  guestText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#222222',
    textDecorationLine: 'underline',
    lineHeight: 32,
  },

  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalLink: {
    fontSize: 14,
    fontWeight: '400',
    color: '#222222',
    textDecorationLine: 'underline',
    lineHeight: 18,
  },
  legalDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#1D1D1D',
  },
});
