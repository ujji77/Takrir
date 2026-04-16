# Quran Foundation API Integration — Takrir App

## Overview

Takrir is a React Native (Expo) iOS app that allows users to create Quran verse playlists with per-verse repetition for memorisation. We integrate with the Quran Foundation's OAuth2 server for user authentication and the Quran.com API for verse/audio data and user preferences sync.

We are currently getting an **"Access Blocked"** error during the OAuth2 sign-in flow and need help resolving it.

---

## App Details

| Field | Value |
|---|---|
| App name | Takrir |
| Bundle ID | `com.spatialuzair.takrir` |
| Platform | iOS (Expo / React Native) |
| Expo SDK | 54 |
| React Native | 0.81.5 |
| Auth library | `expo-auth-session` v7.0.10 |

---

## Environments

### Pre-Production (currently active)
| Field | Value |
|---|---|
| Client ID | `ad079f69-a0b2-4c44-a162-6c178317cee0` |
| Auth endpoint | `https://prelive-oauth2.quran.foundation` |

### Production
| Field | Value |
|---|---|
| Client ID | `e3b36758-5c9b-47dc-a150-09d8c6fd7299` |
| Auth endpoint | `https://oauth2.quran.foundation` |

---

## OAuth2 Flow

We use **Authorization Code flow with PKCE** (`usePKCE: true`), implemented via `expo-auth-session`.

### Endpoints constructed

```
Authorization: https://prelive-oauth2.quran.foundation/oauth2/auth
Token:         https://prelive-oauth2.quran.foundation/oauth2/token
Revocation:    https://prelive-oauth2.quran.foundation/oauth2/revoke
```

### Scopes requested

```
offline_access
```

### Redirect URI

```
https://takrir-web.spatialuzair.workers.dev/auth/callback
```

This is a Cloudflare Workers endpoint that handles the OAuth callback and deep-links back into the app.

---

## Auth Implementation (`app/index.tsx`)

```ts
const discovery = {
  authorizationEndpoint: `${AUTH_URL}/oauth2/auth`,
  tokenEndpoint:         `${AUTH_URL}/oauth2/token`,
  revocationEndpoint:    `${AUTH_URL}/oauth2/revoke`,
};

const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: CLIENT_ID,
    scopes: ['offline_access'],
    redirectUri,
    usePKCE: true,
  },
  discovery,
);
```

On successful auth response, we call `exchangeCodeAsync`:

```ts
exchangeCodeAsync(
  {
    clientId: CLIENT_ID,
    code: response.params.code,
    redirectUri,
    codeVerifier: request.codeVerifier,
  },
  discovery,
)
```

The returned `accessToken` is stored in a Zustand store (`useAuthStore`) and used for all subsequent API requests.

---

## API Client (`src/api/client.ts`)

All API requests include the following headers:

```ts
{
  'x-client-id': CLIENT_ID,       // Quran Foundation client ID
  'Content-Type': 'application/json',
  'x-auth-token': accessToken,    // Only when authenticated (not guest)
}
```

Base URL for Quran data API:
```
https://api.quran.com/api/v4
```

---

## Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /chapters` | Fetch all 114 surahs |
| `GET /verses/by_chapter/{id}` | Fetch all verses for a surah |
| `GET /recitations/{id}/by_chapter/{id}` | Fetch audio file URLs |
| `GET /resources/recitations` | Fetch available reciters |
| `GET /preferences` | Sync user settings (authenticated only) |
| `POST /preferences` | Save a user preference |
| `POST /preferences/bulk` | Bulk save preferences |

---

## Environment Variables (`.env`)

```
# Pre-Production: client_id=ad079f69-a0b2-4c44-a162-6c178317cee0  endpoint=https://prelive-oauth2.quran.foundation
# Production:     client_id=e3b36758-5c9b-47dc-a150-09d8c6fd7299  endpoint=https://oauth2.quran.foundation

EXPO_PUBLIC_QURAN_CLIENT_ID=ad079f69-a0b2-4c44-a162-6c178317cee0
EXPO_PUBLIC_QURAN_BASE_URL=https://api.quran.com/api/v4
EXPO_PUBLIC_QURAN_AUTH_URL=https://prelive-oauth2.quran.foundation
EXPO_PUBLIC_DEFAULT_RECITATION_ID=7
```

---

## Issue: Access Blocked

We are receiving an **"Access Blocked"** error when the user taps "Sign in" and the OAuth2 authorization flow is triggered. The error occurs at the authorization step before the user can enter credentials.

### What we need help with

1. Is the redirect URI `https://takrir-web.spatialuzair.workers.dev/auth/callback` registered against our client IDs in both pre-production and production?
2. Are there any restrictions on the client IDs that would block a mobile app using PKCE flow?
3. Is there anything specific about how `expo-auth-session` initiates the authorization request that may be incompatible with the Quran Foundation OAuth2 server?
4. Are there any IP, origin, or platform restrictions applied to the pre-production client that differ from production?
