import Constants, { ExecutionEnvironment } from 'expo-constants';

export function googleMapsApiKey(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
}

/**
 * Native Google Maps only when:
 * - not Expo Go, AND
 * - a real Android/iOS Maps API key is present
 *
 * Release APKs with an empty key crash Activity on MapView (PROVIDER_GOOGLE),
 * which looks like “geo page redirects back / won’t open” on real devices.
 */
export function canUseNativeGoogleMaps(): boolean {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return false;
  }
  return googleMapsApiKey().length > 0;
}
