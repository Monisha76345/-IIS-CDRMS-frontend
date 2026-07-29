import { Platform } from 'react-native';

/**
 * Base URL for CDRMS Nest API (include `/api` or host only — normalized in client).
 *
 * - iOS Simulator / Expo web: localhost
 * - Android Emulator: 10.0.2.2
 * - Physical device: set EXPO_PUBLIC_API_URL to your machine LAN IP
 */
function defaultHost(): string {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3700';
  return 'http://localhost:3700';
}

const raw = (process.env.EXPO_PUBLIC_API_URL || defaultHost()).trim();

export const API_BASE_URL = raw.endsWith('/api')
  ? raw.replace(/\/$/, '')
  : `${raw.replace(/\/$/, '')}/api`;
