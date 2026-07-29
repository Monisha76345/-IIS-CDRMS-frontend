import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type CompassReading = {
  heading: number;
  accuracy: number;
  available: boolean;
};

/** Live magnetic heading via expo-location (works in Expo Go). */
export function useCompass(enabled = true) {
  const [reading, setReading] = useState<CompassReading>({
    heading: 0,
    accuracy: -1,
    available: false,
  });

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') {
      return;
    }

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        subscription = await Location.watchHeadingAsync((data) => {
          if (cancelled) return;
          const heading =
            data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
          setReading({
            heading: ((heading % 360) + 360) % 360,
            accuracy: data.accuracy,
            available: true,
          });
        });
      } catch {
        if (!cancelled) {
          setReading((prev) => ({ ...prev, available: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        subscription?.remove();
      } catch {
        // ignore dispose races
      }
    };
  }, [enabled]);

  return reading;
}

export function cardinalFromHeading(heading: number): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
  if (!Number.isFinite(heading)) return 'N';
  const index = Math.round(heading / 45) % 8;
  return dirs[index];
}
