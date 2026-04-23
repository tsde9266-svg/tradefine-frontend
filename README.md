# TradeFind — Mobile App

React Native + Expo app for iOS and Android. Connects customers with local tradespeople in real time.

## Stack

| Layer | Tech |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router v3 (file-based) |
| State | Zustand |
| Forms | react-hook-form + Zod |
| Maps | react-native-maps (Google Maps on Android, Apple Maps on iOS) |
| Location | expo-location (foreground + background) |
| Real-time | Native WebSocket → tradefind-location service |
| Push notifications | expo-notifications + FCM |
| HTTP | Axios with JWT refresh interceptor |
| Images | expo-image (remote), React Native Image (local assets) |

## Project structure

```
app/                  Screen files (Expo Router)
  (auth)/             Welcome, register/login, location permission
  (customer)/         Home, map, search, saved, profile, worker profile, tracking
  (worker)/           Dashboard, edit profile, reviews, notifications, preview
components/
  ui/                 Button, Input, Card, Badge, Avatar, StarRating, Toast, Skeleton
  worker/             WorkerCard, WorkerCardLarge, AvailabilityToggle, ReviewCard
  map/                WorkerMapPin, TrackingPulse, MapBottomSheet
  layout/             ScreenHeader, KeyboardView
stores/               Zustand stores (auth, location, worker, tracking, notifications)
services/             API calls (Axios) + WebSocket client
hooks/                useLocation, useNearbyWorkers, useWorkerTracking, useNotifications
constants/            colors, spacing, typography, radius, shadows, config, trades
types/                TypeScript interfaces
utils/                formatters, validators (Zod), storage (SecureStore)
```

## Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- The backend running (see `tradefind-backend/`)
- For Android emulator: Android Studio
- For iOS simulator: Xcode (Mac only)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Point the app at your running backend
#    Edit app.json → expo.extra:
#      "apiUrl":    "http://YOUR_SERVER_IP:3000"
#      "socketUrl": "ws://YOUR_SERVER_IP:4000"
#
#    For local dev on the same machine use your LAN IP, NOT localhost
#    (the phone/emulator cannot reach your PC's localhost)
```

## Run

```bash
# Option A — Expo Go (fastest, scan QR with phone)
npx expo start

# Option B — Android emulator (needs Android Studio)
npx expo run:android

# Option C — iOS simulator (needs Xcode, Mac only)
npx expo run:ios

# Option D — Physical device via USB
npx expo run:android --device   # or --ios
```

> **Note:** Push notifications and background location do **not** work inside Expo Go.
> Use a development build (`npx expo run:android`) for full feature testing.

## Google Maps API key (Android)

Replace `YOUR_GOOGLE_MAPS_API_KEY` in `app.json` with a real key:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps SDK for Android**
3. Create an API key and paste it into `app.json → expo.android.config.googleMaps.apiKey`

## Build for stores (EAS)

```bash
npm install -g eas-cli
eas login

# Android APK/AAB
eas build --platform android --profile production

# iOS IPA
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

Update `eas.json` with your Apple Developer and Google Play credentials before submitting.

## Environment variables summary

All config lives in `app.json → expo.extra` and is read via `constants/config.ts`.

| Key | Default (dev) | Production |
|---|---|---|
| `apiUrl` | `http://localhost:3000` | `https://api.yourdomain.com` |
| `socketUrl` | `ws://localhost:4000` | `wss://ws.yourdomain.com` |
| `r2PublicUrl` | `` | `https://pub-XXX.r2.dev` |

## TypeScript check

```bash
npx tsc --noEmit
```

Should produce zero errors.
