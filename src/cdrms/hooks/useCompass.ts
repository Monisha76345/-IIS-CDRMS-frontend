import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export const COMPASS_CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type CompassCardinal = (typeof COMPASS_CARDINALS)[number];

const CARDINAL_NAMES: Record<CompassCardinal, string> = {
  N: 'North',
  NE: 'Northeast',
  E: 'East',
  SE: 'Southeast',
  S: 'South',
  SW: 'Southwest',
  W: 'West',
  NW: 'Northwest',
};

/** Fixed degrees for each cardinal (for parse/display helpers). */
export const CARDINAL_DEGREES: Record<CompassCardinal, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

/** Hardcoded facing used only on iOS Simulator / Android Emulator (no magnetometer). */
export const SIMULATOR_COMPASS_HEADING = CARDINAL_DEGREES.N;
export const SIMULATOR_COMPASS_FACE: CompassCardinal = 'N';

export type CompassReading = {
  /** Degrees clockwise from north (0–359). */
  heading: number;
  accuracy: number;
  available: boolean;
  status: 'live' | 'calibrating' | 'permission' | 'unavailable' | 'idle';
  source: 'location' | 'magnetometer' | 'simulator' | 'none';
};

function normalizeHeading(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  return ((deg % 360) + 360) % 360;
}

export function cardinalFromHeading(heading: number): CompassCardinal {
  if (!Number.isFinite(heading)) return 'N';
  const index = Math.round(normalizeHeading(heading) / 45) % 8;
  return COMPASS_CARDINALS[index];
}

export function cardinalNameFromHeading(heading: number): string {
  return CARDINAL_NAMES[cardinalFromHeading(heading)];
}

export function cardinalFullName(face: CompassCardinal): string {
  return CARDINAL_NAMES[face];
}

export function formatCardinalReading(face: CompassCardinal): string {
  return `${CARDINAL_DEGREES[face]}° ${face}`;
}

export function formatLiveReading(heading: number): string {
  const h = Math.round(normalizeHeading(heading));
  return `${h}° ${cardinalFromHeading(h)}`;
}

/** Parse saved values like `312° NW`, `90 E`, or `NE`. */
export function parseCompassReading(
  raw: string,
): { heading: number; face: CompassCardinal } | null {
  const t = raw.trim().toUpperCase();
  if (!t) return null;

  if ((COMPASS_CARDINALS as readonly string[]).includes(t)) {
    const face = t as CompassCardinal;
    return { heading: CARDINAL_DEGREES[face], face };
  }

  const m = t.match(/(\d{1,3})\s*°?\s*([NSEW]{1,2})?/);
  if (!m) return null;
  const heading = normalizeHeading(Number(m[1]));
  const faceRaw = m[2] as CompassCardinal | undefined;
  if (faceRaw && (COMPASS_CARDINALS as readonly string[]).includes(faceRaw)) {
    return { heading: CARDINAL_DEGREES[faceRaw], face: faceRaw };
  }
  return { heading, face: cardinalFromHeading(heading) };
}

function magnetometerToHeading(x: number, y: number): number {
  // atan2(y, x) → degrees; convert so 0° = North when phone is flat.
  let angle = (Math.atan2(y, x) * 180) / Math.PI;
  angle = 90 - angle; // align with typical phone flat orientation
  return normalizeHeading(angle);
}

/** iOS Simulator + Android Emulator — no usable compass hardware. */
export function isSimulatorOrEmulator(): boolean {
  if (Constants.isDevice === false) return true;
  const iosPlat = Constants.platform?.ios as { simulator?: boolean; model?: string | null } | undefined;
  if (iosPlat?.simulator === true) return true;
  if (Platform.OS === 'ios') {
    const model = String(iosPlat?.model ?? '');
    if (/simulator/i.test(model)) return true;
    // Apple Silicon sims often report arm64; Expo still sets isDevice=false — handled above.
  }
  if (Platform.OS === 'android') {
    const c = Platform.constants as {
      Brand?: string;
      Model?: string;
      Fingerprint?: string;
    };
    return /sdk|emulator|gphone|generic/i.test(
      `${c.Brand ?? ''} ${c.Model ?? ''} ${c.Fingerprint ?? ''}`,
    );
  }
  return false;
}

/**
 * Live device compass.
 * Real phone: Location.watchHeadingAsync + Magnetometer fallback.
 * Simulator/emulator: fixed North so Continue works in QA — never used on hardware.
 */
export function useCompass(enabled = true): CompassReading {
  const sim = isSimulatorOrEmulator();
  const [reading, setReading] = useState<CompassReading>(() =>
    sim
      ? {
          heading: SIMULATOR_COMPASS_HEADING,
          accuracy: -1,
          available: true,
          status: 'live',
          source: 'simulator',
        }
      : {
          heading: 0,
          accuracy: -1,
          available: false,
          status: 'idle',
          source: 'none',
        },
  );
  const lastGood = useRef(0);
  const sourceRef = useRef<'location' | 'magnetometer' | 'simulator' | 'none'>(
    sim ? 'simulator' : 'none',
  );

  useEffect(() => {
    if (!enabled) return;

    // Simulators have no magnetometer / heading — seed one fixed facing for QA only.
    if (isSimulatorOrEmulator()) {
      setReading({
        heading: SIMULATOR_COMPASS_HEADING,
        accuracy: -1,
        available: true,
        status: 'live',
        source: 'simulator',
      });
      return;
    }

    let cancelled = false;
    let headingSub: Location.LocationSubscription | null = null;
    let magSub: { remove: () => void } | null = null;
    let magTimer: ReturnType<typeof setTimeout> | null = null;

    const apply = (
      heading: number,
      accuracy: number,
      source: 'location' | 'magnetometer',
    ) => {
      if (cancelled || !Number.isFinite(heading)) return;
      // Prefer location heading once it has delivered at least one sample.
      if (source === 'magnetometer' && sourceRef.current === 'location') return;
      sourceRef.current = source;
      lastGood.current = Date.now();
      setReading({
        heading: normalizeHeading(heading),
        accuracy,
        available: true,
        status: 'live',
        source,
      });
    };

    const start = async () => {
      setReading((prev) => ({
        ...prev,
        status: 'calibrating',
        available: false,
        source: 'none',
      }));
      sourceRef.current = 'none';

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          setReading({
            heading: 0,
            accuracy: -1,
            available: false,
            status: 'permission',
            source: 'none',
          });
        } else {
          headingSub = await Location.watchHeadingAsync((event) => {
            // trueHeading preferred; fall back to magHeading
            const h =
              event.trueHeading >= 0 ? event.trueHeading : event.magHeading;
            if (h < 0 || !Number.isFinite(h)) return;
            apply(h, event.accuracy ?? -1, 'location');
          });
        }
      } catch {
        // Heading may be unsupported — magnetometer fallback below.
      }

      // Magnetometer fallback / backup (always try on real devices).
      try {
        const magAvailable = await Magnetometer.isAvailableAsync();
        if (!magAvailable || cancelled) {
          if (!headingSub) {
            setReading({
              heading: 0,
              accuracy: -1,
              available: false,
              status: 'unavailable',
              source: 'none',
            });
          }
          return;
        }

        Magnetometer.setUpdateInterval(120);
        magSub = Magnetometer.addListener(({ x, y }) => {
          apply(magnetometerToHeading(x, y), -1, 'magnetometer');
        });

        // If neither source produces data, mark unavailable.
        magTimer = setTimeout(() => {
          if (cancelled) return;
          if (Date.now() - lastGood.current > 2500 && sourceRef.current === 'none') {
            setReading({
              heading: 0,
              accuracy: -1,
              available: false,
              status: 'unavailable',
              source: 'none',
            });
          }
        }, 2800);
      } catch {
        if (!headingSub && !cancelled) {
          setReading({
            heading: 0,
            accuracy: -1,
            available: false,
            status: 'unavailable',
            source: 'none',
          });
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      headingSub?.remove();
      magSub?.remove();
      if (magTimer) clearTimeout(magTimer);
    };
  }, [enabled]);

  return reading;
}
