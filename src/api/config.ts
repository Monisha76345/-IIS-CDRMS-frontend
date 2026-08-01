import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 3700;
/** Mac LAN IP for physical-device testing (update when your network IP changes). */
const DEFAULT_DEV_LAN_IP = '172.27.6.89';

/** True for Android/iOS simulators and emulators — false on physical hardware. */
function isSimulatorOrEmulator(): boolean {
  return Constants.isDevice === false;
}

function stripApiSuffix(url: string) {
  return url.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

function withApiPath(host: string) {
  const base = stripApiSuffix(host);
  return `${base}/api`;
}

/**
 * Base URL for CDRMS Nest API.
 *
 * - iOS Simulator / Expo web: localhost
 * - Android Emulator: 10.0.2.2 (maps to Mac localhost)
 * - Physical device: EXPO_PUBLIC_API_URL = http://<your-mac-lan-ip>:3700
 */
function resolveApiHost(): string {
  const envRaw = process.env.EXPO_PUBLIC_API_URL?.trim();
  const envHost = envRaw ? stripApiSuffix(envRaw) : null;

  if (Platform.OS === 'android') {
    if (isSimulatorOrEmulator()) {
      // Emulator cannot use Mac LAN IP reliably — always use the host loopback alias.
      if (
        !envHost ||
        envHost.includes('localhost') ||
        envHost.includes('127.0.0.1') ||
        envHost.includes('10.0.2.2')
      ) {
        return `http://10.0.2.2:${API_PORT}`;
      }
      // Custom env URL on emulator (e.g. staging) — honour it.
      return envHost;
    }

    // Physical Android phone — 10.0.2.2 never works; must use Mac LAN IP
    if (envHost) return envHost;
    return `http://${DEFAULT_DEV_LAN_IP}:${API_PORT}`;
  }

  if (Platform.OS === 'ios' && isSimulatorOrEmulator()) {
    if (envHost && !envHost.includes('10.0.2.2')) {
      return envHost.replace('://localhost', '://127.0.0.1');
    }
    return `http://localhost:${API_PORT}`;
  }

  // Physical iOS device or web
  if (envHost) return envHost;
  return `http://${DEFAULT_DEV_LAN_IP}:${API_PORT}`;
}

export const API_BASE_URL = withApiPath(resolveApiHost());

/** Helpful for login / network error messages in dev. */
export function apiConnectionHint(): string {
  if (Platform.OS === 'android' && !isSimulatorOrEmulator()) {
    return `Physical device — set EXPO_PUBLIC_API_URL=http://${DEFAULT_DEV_LAN_IP}:${API_PORT} in .env, then restart Metro (npx expo start -c). Currently: ${API_BASE_URL}`;
  }
  if (Platform.OS === 'android' && isSimulatorOrEmulator()) {
    return `Android emulator — backend must run on Mac port ${API_PORT}. Using ${API_BASE_URL}`;
  }
  return `Backend must run on port ${API_PORT}. Using ${API_BASE_URL}`;
}
