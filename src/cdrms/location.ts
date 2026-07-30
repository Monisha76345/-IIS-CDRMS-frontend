/** Karnataka CDRMS field site defaults */

export const KARNATAKA = {
  state: 'Karnataka',
  country: 'India',
  /** Survey site — Devanahalli, Bengaluru Rural (assigned zone center) */
  site: {
    latitude: 13.248,
    longitude: 77.7139,
    label: 'Devanahalli Survey Site',
    village: 'Devanahalli',
    taluk: 'Devanahalli',
    district: 'Bengaluru Rural',
    zone: 'KA-BLR-R-02',
    coordsDisplay: {
      lat: "13.2480° N",
      lng: "77.7139° E",
      short: '13.25, 77.71',
    },
  },
  /** Approximate center / bounds for state overview */
  stateCenter: {
    latitude: 15.3173,
    longitude: 75.7139,
    latitudeDelta: 5.8,
    longitudeDelta: 5.2,
  },
  office: 'PWD Regional Office, Bengaluru',
  fieldZone: 'Karnataka · Bengaluru Rural',
} as const;

/**
 * Soft GPS geo-fence for UI only (site pin ± this many feet).
 * Does not hard-block Continue — engineers can proceed with a warning.
 */
export const GEO_FENCE_RADIUS_FT = 10;

const FT_PER_KM = 3280.839895;
const FT_PER_M = 3.280839895;

export const SITE_REGION = {
  latitude: KARNATAKA.site.latitude,
  longitude: KARNATAKA.site.longitude,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
} as const;

/** Great-circle distance in kilometres (Haversine). */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Great-circle distance in feet. */
export function distanceFeet(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return distanceKm(lat1, lon1, lat2, lon2) * FT_PER_KM;
}

export function metersToFeet(meters: number): number {
  return meters * FT_PER_M;
}

/** Format a distance in feet for UI. */
export function formatFeet(feet: number): string {
  if (!Number.isFinite(feet)) return '—';
  if (feet < 10) return `${feet.toFixed(1)} ft`;
  return `${Math.round(feet).toLocaleString('en-US')} ft`;
}

/** Map latitudeDelta that roughly covers `feet` of ground. */
export function feetToLatitudeDelta(feet: number): number {
  // 1° latitude ≈ 364,000 ft
  return Math.max(0.00008, (feet * 6) / 364000);
}
