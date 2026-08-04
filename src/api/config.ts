import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 3710;
/** Mac LAN IP fallback for physical-device testing. */
const DEFAULT_DEV_LAN_IP = '192.168.1.39';

/** Extracts active Metro bundler host IP dynamically when connected. */
function getAutoDetectedLanIp(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      ?.manifest2?.extra?.expoGo?.debuggerHost;

  if (typeof hostUri === 'string' && hostUri.includes(':')) {
    const ip = hostUri.split(':')[0].trim();
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return DEFAULT_DEV_LAN_IP;
}

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
 * - Physical device: EXPO_PUBLIC_API_URL or auto-detected LAN IP
 */
function resolveApiHost(): string {
  const envRaw = process.env.EXPO_PUBLIC_API_URL?.trim();
  const envHost = envRaw ? stripApiSuffix(envRaw) : null;
  const lanIp = getAutoDetectedLanIp();

  if (Platform.OS === 'android') {
    if (isSimulatorOrEmulator()) {
      if (
        !envHost ||
        envHost.includes('localhost') ||
        envHost.includes('127.0.0.1') ||
        envHost.includes('10.0.2.2')
      ) {
        return `http://10.0.2.2:${API_PORT}`;
      }
      return envHost;
    }

    // Physical Android phone
    if (envHost) return envHost;
    return `http://${lanIp}:${API_PORT}`;
  }

  if (Platform.OS === 'ios' && isSimulatorOrEmulator()) {
    if (envHost && !envHost.includes('10.0.2.2')) {
      return envHost.replace('://localhost', '://127.0.0.1');
    }
    return `http://localhost:${API_PORT}`;
  }

  // Physical iOS device or web
  if (envHost) return envHost;
  return `http://${lanIp}:${API_PORT}`;
}

export const API_BASE_URL = withApiPath(resolveApiHost());

/** Helpful for login / network error messages in dev. */
export function apiConnectionHint(): string {
  const activeIp = getAutoDetectedLanIp();
  if (Platform.OS === 'android' && !isSimulatorOrEmulator()) {
    return `Network request failed — cannot reach ${API_BASE_URL}. Ensure phone & Mac are on the same Wi-Fi network (Mac IP: ${activeIp}). Currently trying: ${API_BASE_URL}`;
  }
  if (Platform.OS === 'android' && isSimulatorOrEmulator()) {
    return `Android emulator — backend must run on Mac port ${API_PORT}. Using ${API_BASE_URL}`;
  }
  return `Backend must run on port ${API_PORT}. Currently trying ${API_BASE_URL}`;
}
