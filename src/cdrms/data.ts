/** Real site photos used on Applications cards (Unsplash). */
import { createEmptyDraft } from '@/src/cdrms/project/types';

export const SITE_IMAGES = {
  road: 'https://images.unsplash.com/photo-1477959858617-67f85b6b1ca5?auto=format&fit=crop&w=400&q=80',
  curve: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=400&q=80',
  bridge: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=400&q=80',
  drain: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80',
  junction: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=400&q=80',
  default: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
} as const;

export type ApplicationRecord = {
  id: string;
  project: string;
  status: 'Draft' | 'Submitted' | 'Returned' | 'Verified' | 'Rejected';
  date: string;
  village: string;
  image: string;
  khatedarName: string;
  surveyNo: string;
  plotNo: string;
  dimensionArea: string;
  roadType: string;
  landType: string;
  taluk: string;
  district: string;
  state: string;
  coords: string;
  directions: { N: string; S: string; E: string; W: string };
  photoCount: number;
  hasVideo: boolean;
  approachRoadWidth: string;
  approachRoadName: string;
  approachNotes: string;
  nearbyBuildings: string;
  nearbyRoads: string;
  landmarks: string;
  remarks?: string;
  officer?: string;
  gallery: string[];
};

export const SAMPLE_APPS: ApplicationRecord[] = [
  {
    id: 'CDR-2026-0842',
    project: 'Village Road Widening — Devanahalli',
    status: 'Submitted',
    date: '24 Jul 2026',
    village: 'Devanahalli',
    image: SITE_IMAGES.road,
    khatedarName: 'Sri Ramesh Gowda',
    surveyNo: '48/2A',
    plotNo: 'P-112',
    dimensionArea: '1,240 sqm',
    roadType: 'Approach Road',
    landType: 'Government · Panchayat',
    taluk: 'Devanahalli',
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    coords: '13.25° N, 77.71° E',
    directions: {
      N: 'Residential plot · 40ft',
      S: 'Main road · 60ft',
      E: 'Vacant land · 30ft',
      W: 'Community park · 25ft',
    },
    photoCount: 7,
    hasVideo: true,
    approachRoadWidth: '18 ft',
    approachRoadName: 'SH-74 Devanahalli Road',
    approachNotes: 'Access via SH-74 Devanahalli Road. Gate on south side. Boundary marked with white paint by revenue officer on 22 Jul.',
    nearbyBuildings: 'Govt School (80m), Health Centre (140m)',
    nearbyRoads: 'SH-74 (120m), Service Road (45m)',
    landmarks: 'Kempegowda Int. Airport Road',
    gallery: [SITE_IMAGES.road, SITE_IMAGES.curve, SITE_IMAGES.default],
  },
  {
    id: 'CDR-2026-0839',
    project: 'New Approach Road — Hoskote',
    status: 'Verified',
    date: '22 Jul 2026',
    village: 'Hoskote',
    image: SITE_IMAGES.curve,
    khatedarName: 'Smt. Lakshmi Devi',
    surveyNo: '12/4B',
    plotNo: 'P-087',
    dimensionArea: '980 sqm',
    roadType: 'Village Road',
    landType: 'Revenue · Assigned',
    taluk: 'Hoskote',
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    coords: '13.07° N, 77.80° E',
    directions: {
      N: 'Open field · 50ft',
      S: 'Existing cart track · 20ft',
      E: 'Farm house · 35ft',
      W: 'Canal bund · 45ft',
    },
    photoCount: 8,
    hasVideo: true,
    approachRoadWidth: '22 ft',
    approachRoadName: 'Hoskote–Malur Road',
    approachNotes: 'Approach from Hoskote–Malur road, turn at metro pillar 42.',
    nearbyBuildings: 'Primary Health Centre (200m)',
    nearbyRoads: 'Hoskote Main (90m)',
    landmarks: 'Hoskote Lake bund',
    gallery: [SITE_IMAGES.curve, SITE_IMAGES.road, SITE_IMAGES.junction],
  },
  {
    id: 'CDR-2026-0831',
    project: 'Culvert Reconstruction NH-44',
    status: 'Returned',
    date: '19 Jul 2026',
    village: 'Yelahanka',
    image: SITE_IMAGES.bridge,
    khatedarName: 'Sri Narayana Swamy',
    surveyNo: '91/1',
    plotNo: 'P-204',
    dimensionArea: '420 sqm',
    roadType: 'National Highway',
    landType: 'NHAI ROW',
    taluk: 'Yelahanka',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    coords: '13.10° N, 77.60° E',
    directions: {
      N: 'NH-44 carriageway · 80ft',
      S: 'Service lane · 25ft',
      E: 'Drain channel · 15ft',
      W: 'Embankment · 30ft',
    },
    photoCount: 5,
    hasVideo: true,
    approachRoadWidth: '18 ft',
    approachRoadName: 'Old Bombay Highway',
    approachNotes: 'Boundary marked with white paint by revenue officer on 22 Jul.',
    nearbyBuildings: 'Toll plaza office (300m)',
    nearbyRoads: 'NH-44, Yelahanka New Town Road',
    landmarks: 'Allalasandra Lake',
    remarks:
      'North boundary photograph is unclear. Please recapture with landmark visible. Also update road-width measurement — recorded value does not match survey record.',
    officer: 'A. Rao, CAO Karnataka · Bengaluru Rural',
    gallery: [SITE_IMAGES.bridge, SITE_IMAGES.drain, SITE_IMAGES.road],
  },
  {
    id: 'CDR-2026-0827',
    project: 'Drainage Extension Phase 2',
    status: 'Draft',
    date: '18 Jul 2026',
    village: 'Doddaballapur',
    image: SITE_IMAGES.drain,
    khatedarName: 'Sri Manjunath Reddy',
    surveyNo: '33/6C',
    plotNo: 'P-055',
    dimensionArea: '610 sqm',
    roadType: 'Internal Drain',
    landType: 'Municipal',
    taluk: 'Doddaballapur',
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    coords: '13.29° N, 77.54° E',
    directions: {
      N: 'Residential lane · 20ft',
      S: 'Open drain · 12ft',
      E: 'Compound wall · 18ft',
      W: 'Vacant plot · 25ft',
    },
    photoCount: 3,
    hasVideo: false,
    approachRoadWidth: '',
    approachRoadName: '',
    approachNotes: 'Draft — GPS and bandi still pending confirmation.',
    nearbyBuildings: 'Ward office (150m)',
    nearbyRoads: 'Doddaballapur Bus Stand Road',
    landmarks: 'Town municipal tank',
    gallery: [SITE_IMAGES.drain, SITE_IMAGES.default],
  },
  {
    id: 'CDR-2026-0820',
    project: 'Junction Improvement — Mysuru Road',
    status: 'Rejected',
    date: '14 Jul 2026',
    village: 'Kengeri',
    image: SITE_IMAGES.junction,
    khatedarName: 'Sri Basavaraju',
    surveyNo: '77/3',
    plotNo: 'P-301',
    dimensionArea: '1,050 sqm',
    roadType: 'Arterial Junction',
    landType: 'BBMP',
    taluk: 'Kengeri',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    coords: '12.90° N, 77.48° E',
    directions: {
      N: 'Mysuru Road arm · 70ft',
      S: 'Residential feeder · 40ft',
      E: 'Commercial frontage · 55ft',
      W: 'Metro pier line · 35ft',
    },
    photoCount: 6,
    hasVideo: true,
    approachRoadWidth: '40 ft',
    approachRoadName: 'Mysuru Road',
    approachNotes: 'Rejected — ROW conflict with metro pier setback.',
    nearbyBuildings: 'Kengeri Bus Terminal (250m)',
    nearbyRoads: 'Mysuru Road, Outer Ring Road connector',
    landmarks: 'Namma Metro Pillar 128',
    remarks: 'Application rejected due to insufficient clearance from Metro pier line. Resubmit after revised alignment.',
    officer: 'CAO Review Board · Bengaluru Urban',
    gallery: [SITE_IMAGES.junction, SITE_IMAGES.curve, SITE_IMAGES.road],
  },
];

export const NOTIFS = [
  {
    id: 1,
    type: 'success' as const,
    title: 'Application Approved',
    body: 'CDR-2026-0839 verified by CAO Karnataka.',
    time: '2h',
    unread: true,
  },
  {
    id: 2,
    type: 'warning' as const,
    title: 'Application Returned',
    body: 'CAO added remarks on CDR-2026-0831.',
    time: '1d',
    unread: true,
  },
  {
    id: 3,
    type: 'info' as const,
    title: 'New Assignment',
    body: 'Survey #48/2A assigned in Bengaluru Rural.',
    time: '2d',
    unread: false,
  },
  {
    id: 4,
    type: 'info' as const,
    title: 'Submission Received',
    body: 'CDR-2026-0842 submitted to CAO Karnataka.',
    time: '3d',
    unread: false,
  },
];

export function imageForProject(_project: string, fallback?: string | null): string | null {
  if (fallback?.trim()) return fallback.trim();
  return null;
}

export function findSampleApp(id: string) {
  return SAMPLE_APPS.find((a) => a.id === id) ?? null;
}

function parseCoords(coords: string): { latitude: number; longitude: number } | null {
  const m = coords.match(/([\d.]+)\s*°\s*([NS]).*?([\d.]+)\s*°\s*([EW])/i);
  if (!m) return null;
  let latitude = parseFloat(m[1]);
  let longitude = parseFloat(m[3]);
  if (m[2].toUpperCase() === 'S') latitude = -latitude;
  if (m[4].toUpperCase() === 'W') longitude = -longitude;
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  return { latitude, longitude };
}

function uriToAsset(uri: string, type: 'image' | 'video', index: number) {
  return {
    id: `loaded-${type}-${index}-${Date.now()}`,
    uri,
    type,
    createdAt: Date.now(),
  };
}

/** Convert a catalog / sample application into an editable draft for fix & resubmit. */
export function draftFromApplicationRecord(app: ApplicationRecord) {
  const now = Date.now();
  const parsed = parseCoords(app.coords);
  const gallery = app.gallery.length ? app.gallery : [app.image];
  const photos = gallery.slice(0, 6).map((uri, i) => uriToAsset(uri, 'image', i));

  const surroundingPhotos: Partial<Record<'N' | 'S' | 'E' | 'W', ReturnType<typeof uriToAsset>>> =
    {};
  if (gallery[0]) surroundingPhotos.N = uriToAsset(gallery[0], 'image', 10);
  if (gallery[1]) surroundingPhotos.S = uriToAsset(gallery[1], 'image', 11);
  if (gallery[2]) surroundingPhotos.E = uriToAsset(gallery[2], 'image', 12);
  // Leave West empty so field officer can add a fresh capture if needed.

  return {
    ...createEmptyDraft(),
    id: `RESUB-${app.id}`,
    createdAt: now,
    updatedAt: now,
    status: 'draft' as const,
    applicationId: app.id,
    submittedAt: null,
    backendApplicationId: null,
    projectName: app.project,
    khatedarName: app.khatedarName,
    surveyNo: app.surveyNo,
    plotNo: app.plotNo,
    dimensionArea: app.dimensionArea,
    roadType: app.roadType,
    landType: app.landType,
    village: app.village,
    taluk: app.taluk,
    district: app.district,
    state: app.state,
    gps: parsed
      ? {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          accuracy: 5,
          altitude: null,
          timestamp: now,
        }
      : null,
    bandiVerified: true,
    bandiRemarks: '',
    directions: { ...app.directions },
    approachRoadWidth: app.approachRoadWidth,
    approachRoadName: app.approachRoadName,
    approachNotes: app.approachNotes,
    surroundingPhotos,
    nearbyBuildings: app.nearbyBuildings,
    nearbyRoads: app.nearbyRoads,
    landmarks: app.landmarks,
    photos,
    video: app.hasVideo
      ? uriToAsset(
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          'video',
          99
        )
      : null,
    resubmitOfId: app.id,
  };
}

