import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:3000';
export const SOCKET_URL: string =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? extra.socketUrl ?? 'ws://localhost:4000';
export const R2_PUBLIC_URL: string = extra.r2PublicUrl ?? '';

// ─── Google OAuth Client IDs ───────────────────────────────────────────────────
// Set these up at: https://console.cloud.google.com → APIs & Services → Credentials
// Create OAuth 2.0 Client IDs for:
//   Android → package: com.tradefind.app + SHA-1 from: eas credentials
//   iOS     → bundle: com.tradefind.app
//   Web     → used for Expo Go proxy; add https://auth.expo.io as authorised origin
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
export const GOOGLE_IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     ?? '';
export const GOOGLE_WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     ?? '';

export const LOCATION_UPDATE_INTERVAL_FOREGROUND = 30_000; // 30 seconds
export const LOCATION_UPDATE_INTERVAL_BACKGROUND = 60_000; // 60 seconds
export const MAP_REFRESH_INTERVAL = 60_000;               // 60 seconds
export const NEARBY_RADIUS_KM = 10;
