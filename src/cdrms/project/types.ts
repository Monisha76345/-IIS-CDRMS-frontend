export type Cardinal = 'N' | 'S' | 'E' | 'W';

export type GpsFix = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
};

export type MediaAsset = {
  id: string;
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  durationMs?: number | null;
  createdAt: number;
};

export type ApplicationStatus = 'draft' | 'submitted';

export type ProjectDraft = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: ApplicationStatus;
  applicationId: string | null;
  submittedAt: number | null;
  /** Backend applications.id — when set, submit goes to Nest API */
  backendApplicationId: string | null;
  applicationNumber: string | null;
  siteNo: string;
  addressArea: string;
  addressBlock: string;
  addressPincode: string;
  zoneCode: string;
  createdByZcName: string;
  /** Even | Odd — drives opposite-side dimension sync (web parity). */
  siteDimensionType: 'Even' | 'Odd';
  /** ZC master site dimension string e.g. 20*30 */
  siteDimensionMaster: string;
  siteDimensionComment: string;
  siteDetails: string;
  compassReading: string;
  occupancy: 'Empty' | 'Occupied';
  occupancyReason: string;
  /** Engineer remarks (web Step 4 comments) */
  engineerComments: string;
  dimNorth: string;
  dimSouth: string;
  dimEast: string;
  dimWest: string;
  projectName: string;
  khatedarName: string;
  surveyNo: string;
  plotNo: string;
  dimensionArea: string;
  roadType: string;
  landType: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  gps: GpsFix | null;
  bandiVerified: boolean;
  bandiRemarks: string;
  /** Engineer-entered schedule notes (empty until engineer fills). */
  directions: Record<Cardinal, string>;
  /** ZC-provided schedule text — shown only on Step 1. */
  zcDirections: Record<Cardinal, string>;
  /** Per-side Road checkbox (true when checked). */
  roadFlags: Record<Cardinal, boolean>;
  approachRoadWidth: string;
  approachRoadName: string;
  approachNotes: string;
  surroundingPhotos: Partial<Record<Cardinal, MediaAsset>>;
  nearbyBuildings: string;
  nearbyRoads: string;
  landmarks: string;
  photos: MediaAsset[];
  selfie: MediaAsset | null;
  video: MediaAsset | null;
  /** When editing a returned app for resubmit. */
  resubmitOfId: string | null;
};

/** Snapshot kept after submit for history / success screens. */
export type SubmittedApplication = {
  id: string;
  applicationId: string;
  projectName: string;
  khatedarName: string;
  surveyNo: string;
  plotNo: string;
  village: string;
  district: string;
  state: string;
  dimensionArea: string;
  roadType: string;
  photoCount: number;
  hasVideo: boolean;
  directionsFilled: number;
  submittedAt: number;
  status: 'Submitted';
  coverImage: string | null;
};

export const DIRECTION_META: Record<
  Cardinal,
  { label: string; color: string; soft: string; typeColor: string; placeholder: string }
> = {
  N: {
    label: 'North',
    color: '#2563EB',
    soft: '#E0F2FE',
    typeColor: '#0E7490',
    placeholder: 'e.g. Residential plot · 40ft',
  },
  S: {
    label: 'South',
    color: '#2563EB',
    soft: '#F3E8FF',
    typeColor: '#2563EB',
    placeholder: 'e.g. Main road · 60ft',
  },
  E: {
    label: 'East',
    color: '#0D9488',
    soft: '#CCFBF1',
    typeColor: '#0D9488',
    placeholder: 'e.g. Vacant land · 30ft',
  },
  W: {
    label: 'West',
    color: '#059669',
    soft: '#D1FAE5',
    typeColor: '#059669',
    placeholder: 'e.g. Community park · 25ft',
  },
};

export function createEmptyDraft(): ProjectDraft {
  const now = Date.now();
  return {
    id: `APP-${now.toString(36).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    applicationId: null,
    submittedAt: null,
    backendApplicationId: null,
    applicationNumber: null,
    siteNo: '',
    addressArea: '',
    addressBlock: '',
    addressPincode: '',
    zoneCode: '',
    createdByZcName: '',
    siteDimensionType: 'Even',
    siteDimensionMaster: '',
    siteDimensionComment: '',
    siteDetails: '',
    compassReading: '',
    occupancy: 'Empty',
    occupancyReason: '',
    engineerComments: '',
    dimNorth: '',
    dimSouth: '',
    dimEast: '',
    dimWest: '',
    projectName: '',
    khatedarName: '',
    surveyNo: '',
    plotNo: '',
    dimensionArea: '',
    roadType: '',
    landType: '',
    village: '',
    taluk: '',
    district: '',
    state: 'Karnataka',
    gps: null,
    bandiVerified: false,
    bandiRemarks: '',
    directions: { N: '', S: '', E: '', W: '' },
    zcDirections: { N: '', S: '', E: '', W: '' },
    roadFlags: { N: false, S: false, E: false, W: false },
    approachRoadWidth: '',
    approachRoadName: '',
    approachNotes: '',
    surroundingPhotos: {},
    nearbyBuildings: '',
    nearbyRoads: '',
    landmarks: '',
    photos: [],
    selfie: null,
    video: null,
    resubmitOfId: null,
  };
}

export function makeApplicationId(seq: number) {
  const year = new Date().getFullYear();
  return `CDR-${year}-${String(seq).padStart(4, '0')}`;
}

export function formatCoords(lat: number, lng: number) {
  const latHem = lat >= 0 ? 'N' : 'S';
  const lngHem = lng >= 0 ? 'E' : 'W';
  return {
    lat: `${Math.abs(lat).toFixed(4)}° ${latHem}`,
    lng: `${Math.abs(lng).toFixed(4)}° ${lngHem}`,
    short: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
  };
}
