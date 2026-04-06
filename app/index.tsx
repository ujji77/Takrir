import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, exchangeCodeAsync, makeRedirectUri } from 'expo-auth-session';
import { useAuthStore } from '../src/store/auth';
import { useSettingsStore } from '../src/store/settings';

WebBrowser.maybeCompleteAuthSession();

const AUTH_URL = process.env.EXPO_PUBLIC_QURAN_AUTH_URL ?? 'https://oauth2.quran.foundation';
const CLIENT_ID = process.env.EXPO_PUBLIC_QURAN_CLIENT_ID ?? '';

const discovery = {
  authorizationEndpoint: `${AUTH_URL}/oauth2/auth`,
  tokenEndpoint: `${AUTH_URL}/oauth2/token`,
  revocationEndpoint: `${AUTH_URL}/oauth2/revoke`,
};

const redirectUri = makeRedirectUri({ scheme: 'takrir', path: 'auth' });

export default function AuthScreen() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const setGuest = useAuthStore((s) => s.setGuest);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'offline_access'],
      redirectUri,
      usePKCE: true,
    },
    discovery,
  );

  // Handle auth response without useEffect — derive actions from response in render
  if (response?.type === 'success' && response.params.code && request?.codeVerifier) {
    exchangeCodeAsync(
      {
        clientId: CLIENT_ID,
        code: response.params.code,
        redirectUri,
        extraParams: request.codeVerifier
          ? { code_verifier: request.codeVerifier }
          : undefined,
      },
      discovery,
    )
      .then((tokens) => {
        setToken(tokens.accessToken);
        useSettingsStore.getState().loadCloudSettings().catch(() => null);
        router.replace('/home');
      })
      .catch(() => null);
  }

  const handleSignIn = () => {
    promptAsync();
  };

  const handleGuest = () => {
    setGuest();
    router.replace('/home');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold' }}>Takrir</Text>
      <Text style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>تكرير — Your Quran Playlist</Text>

      <Button
        title={request ? 'Sign in with Quran.com' : 'Loading…'}
        onPress={handleSignIn}
        disabled={!request}
      />

      {!request && <ActivityIndicator />}

      <Button title="Continue as Guest" onPress={handleGuest} />
    </View>
  );
}
