/** Karnataka CDRMS field site defaults */

export const KARNATAKA = {
  state: 'Karnataka',
  country: 'India',
  /** Survey site — Devanahalli, Bengaluru Rural */
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

export const SITE_REGION = {
  latitude: KARNATAKA.site.latitude,
  longitude: KARNATAKA.site.longitude,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
} as const;
