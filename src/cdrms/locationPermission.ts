import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

import { showAppDialog } from '@/src/cdrms/components/AppDialog';

/** True when foreground location is already allowed. */
export async function hasForegroundLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Ensure device Location Services are on (critical on Android for map + GPS).
 * Returns true when services appear enabled.
 */
export async function ensureLocationServicesEnabled(
  silent = false,
): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return true;

    let servicesOn = await Location.hasServicesEnabledAsync();
    if (servicesOn) return true;

    // Android: system dialog to turn on location / network provider.
    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // User dismissed or not supported
      }
      servicesOn = await Location.hasServicesEnabledAsync();
      if (servicesOn) return true;
    }

    if (!silent) {
      showAppDialog({
        variant: 'warning',
        title: 'Turn on Location',
        message:
          Platform.OS === 'android'
            ? 'Enable Location in Android Settings (High accuracy / GPS), then return to CDRMS so the map can show your position.'
            : 'Turn on Location Services in Settings, then try again.',
        cancelLabel: 'Not now',
        confirmLabel: 'Open Settings',
        onConfirm: () => {
          void Linking.openSettings().catch(() => undefined);
        },
      });
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Request foreground location if needed (iOS + Android).
 * On Android also prompts to enable system Location so the map works.
 * Returns true when permission is granted and services are on.
 */
export async function ensureForegroundLocationPermission(
  silent = false,
): Promise<boolean> {
  try {
    const servicesOk = await ensureLocationServicesEnabled(silent);
    if (!servicesOk) return false;

    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === 'granted') return true;

    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.status === 'granted') return true;

    if (!silent) {
      showAppDialog({
        variant: 'warning',
        title: 'Location permission needed',
        message:
          Platform.OS === 'android'
            ? 'Allow Location for CDRMS (Precise / Fine) so GPS and the map can work.'
            : 'Allow location access so we can verify your field survey.',
        cancelLabel: 'Not now',
        confirmLabel: 'Open Settings',
        onConfirm: () => {
          void Linking.openSettings().catch(() => undefined);
        },
      });
    }
    return false;
  } catch {
    return false;
  }
}
