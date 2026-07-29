import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { KARNATAKA } from '@/src/cdrms/location';
import type { GpsFix } from '@/src/cdrms/project/types';

export type GeoAddress = {
  village: string;
  taluk: string;
  district: string;
  state: string;
};

export type LocationResult = {
  gps: GpsFix;
  address: GeoAddress;
};

export type RefreshOptions = {
  /** Skip alerts so permission dialogs don't steal TextInput focus. */
  silent?: boolean;
};

function pickAddress(parts: Location.LocationGeocodedAddress[]): GeoAddress {
  const a = parts[0];
  if (!a) {
    return {
      village: KARNATAKA.site.village,
      taluk: KARNATAKA.site.taluk,
      district: KARNATAKA.site.district,
      state: KARNATAKA.state,
    };
  }

  return {
    village: a.district || a.subregion || a.city || a.name || KARNATAKA.site.village,
    taluk: a.subregion || a.city || a.district || KARNATAKA.site.taluk,
    district: a.region || a.subregion || KARNATAKA.site.district,
    state: a.region?.toLowerCase().includes('karnataka')
      ? 'Karnataka'
      : a.region || KARNATAKA.state,
  };
}

async function reverseGeocode(latitude: number, longitude: number): Promise<GeoAddress> {
  try {
    const parts = await Location.reverseGeocodeAsync({ latitude, longitude });
    return pickAddress(parts);
  } catch {
    return {
      village: KARNATAKA.site.village,
      taluk: KARNATAKA.site.taluk,
      district: KARNATAKA.site.district,
      state: KARNATAKA.state,
    };
  }
}

export function useDeviceLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (opts?: RefreshOptions): Promise<LocationResult | null> => {
      setLoading(true);
      setError(null);

      try {
        if (Platform.OS === 'web') {
          // Browser geolocation via expo-location still works when permitted.
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          if (!opts?.silent) {
            Alert.alert(
              'Location needed',
              'Allow location access so we can auto-fill village, taluk, and site coordinates.'
            );
          }
          return null;
        }

        let position: Location.LocationObject;
        try {
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        } catch {
          // High accuracy can fail indoors / simulator — retry with balanced.
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        const gps: GpsFix = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        };

        const address = await reverseGeocode(gps.latitude, gps.longitude);
        return { gps, address };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Could not read GPS';
        setError(message);
        if (!opts?.silent) {
          Alert.alert('GPS error', message);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { refresh, loading, error };
}
