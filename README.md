# Takrir — تكرير

A Quran memorisation app for iOS. Pick a surah and verse range, set how many times each verse should repeat, and let it play. Built for focused, repetition-based memorisation.

---

## Features

- **Verse range picker** — sentence-style selector with an inline grid picker
- **Per-verse repeat counts** — set different repetition counts for each verse in the playlist
- **Multiple reciters** — switch between reciters live during playback
- **Arabic script options** — Uthmani or Indo-Pak, with adjustable font size
- **Playback speed control** — 0.5×, 1×, 1.5×, 2×
- **Playlist repeat** — loop the full playlist
- **Settings sync** — preferences saved locally and synced to Quran Foundation cloud when signed in
- **Guest mode** — use the app without an account

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| Data fetching | TanStack React Query |
| Audio | react-native-track-player |
| Auth | expo-auth-session (OAuth2 PKCE) |
| Storage | expo-secure-store |
| UI | phosphor-react-native, expo-blur, expo-linear-gradient |

---

## Project Structure

```
app/
  index.tsx          # Auth screen (sign in / guest)
  home.tsx           # Surah + verse range selector
  playlist.tsx       # Per-verse repeat count editor
  player.tsx         # Playback screen
  _layout.tsx        # Root layout (TrackPlayer, QueryClient, fonts)

src/
  api/               # Quran Foundation API client + endpoint functions
  audio/             # AudioPort interface, TrackPlayerAdapter, PlaybackService
  components/        # AppHeader, PlaylistHeader, HeaderMenu, SettingsPopover
  hooks/             # useChapters, useVersesByChapter, useAudioFiles, etc.
  persistence/       # Cloud settings sync
  store/             # Zustand stores: auth, playlist, settings
  theme.ts           # Colour tokens
  types/             # API types (Chapter, Verse, etc.)
  utils/             # buildPlaylistItems, verseContent
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo`)
- EAS CLI (`npm install -g eas-cli`) — for builds
- Xcode (for iOS simulator / device)

### Install

```bash
npm install
```

### Environment

Copy the example below into a `.env` file at the repo root:

```
EXPO_PUBLIC_QURAN_CLIENT_ID=<your_client_id>
EXPO_PUBLIC_QURAN_BASE_URL=https://api.quran.com/api/v4
EXPO_PUBLIC_QURAN_AUTH_URL=https://oauth2.quran.foundation
EXPO_PUBLIC_DEFAULT_RECITATION_ID=7
```

See `QURAN_FOUNDATION_INTEGRATION.md` for pre-production and production credential details.

### Run

```bash
# Start Metro
npm start

# iOS simulator
npm run ios
```

---

## Building & Releasing

Production build with automatic TestFlight submission:

```bash
eas build --platform ios --profile production --auto-submit
```

Build number is auto-incremented by EAS (`autoIncrement: true`). Version is set manually in `app.json`.

---

## Auth Flow

Sign in uses **OAuth2 Authorization Code + PKCE** via `expo-auth-session`. The redirect URI is a Cloudflare Workers endpoint (`takrir-web.spatialuzair.workers.dev/auth/callback`) that handles the callback and deep-links back into the app. The access token is stored in a Zustand store and passed as `x-auth-token` on all authenticated API requests.

---

## API

Data is sourced from the [Quran Foundation API](https://api.quran.com/api/v4). User preferences are synced to the Quran Foundation user preferences endpoint when authenticated.
