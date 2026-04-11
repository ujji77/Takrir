import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// Landing page for the OAuth redirect URI (takrir://auth).
// Must call maybeCompleteAuthSession() here so expo-web-browser can hand the
// auth code back to the useAuthRequest hook in index.tsx.
WebBrowser.maybeCompleteAuthSession();

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, []);

  return null;
}
