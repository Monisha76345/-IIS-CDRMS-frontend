import * as Location from 'expo-location';

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
 * Request foreground location if needed.
 * Returns true when permission is granted.
 */
export async function ensureForegroundLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === 'granted') return true;
    const requested = await Location.requestForegroundPermissionsAsync();
    return requested.status === 'granted';
  } catch {
    return false;
  }
}
