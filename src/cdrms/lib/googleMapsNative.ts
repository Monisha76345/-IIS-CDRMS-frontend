import Constants, { ExecutionEnvironment } from 'expo-constants';

/** True in dev-client / standalone builds; false in Expo Go. */
export function canUseNativeGoogleMaps(): boolean {
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

export function googleMapsApiKey(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
}
