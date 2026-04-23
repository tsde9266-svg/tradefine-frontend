import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const API_URL: string = extra.apiUrl ?? 'http://localhost:3000';
export const SOCKET_URL: string = extra.socketUrl ?? 'ws://localhost:4000';
export const R2_PUBLIC_URL: string = extra.r2PublicUrl ?? '';

export const LOCATION_UPDATE_INTERVAL_FOREGROUND = 30_000; // 30 seconds
export const LOCATION_UPDATE_INTERVAL_BACKGROUND = 60_000; // 60 seconds
export const MAP_REFRESH_INTERVAL = 60_000;               // 60 seconds
export const NEARBY_RADIUS_KM = 10;
