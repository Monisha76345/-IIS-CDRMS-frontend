import type { MobileApplication } from '@/src/api/applications';
import { siteDimensionToFormDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import {
  createEmptyDraft,
  type MediaAsset,
  type ProjectDraft,
} from '@/src/cdrms/project/types';

function remoteAsset(
  uri: string,
  type: 'image' | 'video',
  id: string,
  now: number,
): MediaAsset {
  return { id, uri, type, createdAt: now };
}

const EMPTY_DIMS = { N: '', S: '', E: '', W: '' } as const;

function sameAsZcSiteDimension(
  dims: { N: string; S: string; E: string; W: string },
  siteDimension: string | null | undefined,
): boolean {
  const zc = siteDimensionToFormDims(siteDimension);
  if (!zc) return false;
  return (
    dims.N === zc.north &&
    dims.S === zc.south &&
    dims.E === zc.east &&
    dims.W === zc.west
  );
}

/**
 * Engineer N/S/E/W only.
 * Never seed from ZC siteDimension, legacy dim*, or accidental copies of ZC values.
 */
function engineerDimsFromApp(app: MobileApplication): {
  N: string;
  S: string;
  E: string;
  W: string;
} {
  const eng = app.engineerDimensions;
  if (!eng || !(eng.N || eng.S || eng.E || eng.W)) {
    return { ...EMPTY_DIMS };
  }
  const dims = {
    N: String(eng.N || '').trim(),
    S: String(eng.S || '').trim(),
    E: String(eng.E || '').trim(),
    W: String(eng.W || '').trim(),
  };
  // Old mobile builds used to copy ZC siteDimension into engineerDimensions — ignore those.
  if (sameAsZcSiteDimension(dims, app.siteDimension)) {
    return { ...EMPTY_DIMS };
  }
  return dims;
}

/** Seed a survey draft from a ZC-assigned backend application (incl. saved draft media). */
export function draftFromBackendApplication(app: MobileApplication): ProjectDraft {
  const now = Date.now();
  const base = createEmptyDraft();
  const address = [app.addressArea, app.addressBlock, app.addressPincode]
    .filter(Boolean)
    .join(', ');

  let selfie: MediaAsset | null = null;
  if (app.selfieUrl) {
    selfie = remoteAsset(app.selfieUrl, 'image', `selfie-${app.id}`, now);
  }

  const photos: MediaAsset[] = [];
  for (let i = 0; i < (app.photoUrls?.length ?? 0) && i < 4; i += 1) {
    const url = app.photoUrls![i];
    if (url) photos.push(remoteAsset(url, 'image', `photo-${app.id}-${i}`, now));
  }

  const surroundingPhotos: ProjectDraft['surroundingPhotos'] = {};
  for (const k of ['N', 'S', 'E', 'W'] as const) {
    const url = app.schedulePhotoUrls?.[k];
    if (url) {
      surroundingPhotos[k] = remoteAsset(url, 'image', `sched-${k}-${app.id}`, now);
    }
  }

  return {
    ...base,
    id: `BE-${app.id.slice(0, 8)}`,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    applicationId: app.applicationNumber,
    backendApplicationId: app.id,
    applicationNumber: app.applicationNumber,
    eOfficeNumber: app.eOfficeNumber?.trim() || '',
    siteNo: app.siteNo,
    addressArea: app.addressArea,
    addressBlock: app.addressBlock,
    addressPincode: app.addressPincode,
    zoneCode: app.zoneCode,
    createdByZcName: app.createdByZcName || '',
    siteDimensionType: app.siteDimensionType === 'Odd' ? 'Odd' : 'Even',
    siteDimensionMaster: app.siteDimension || '',
    siteDimensionComment: app.siteDimensionComment || '',
    siteDetails: app.engineerSiteDetails || '',
    compassReading: app.compass || '',
    occupancy: app.occupancy === 'Occupied' ? 'Occupied' : 'Empty',
    occupancyReason: app.occupancyReason || '',
    engineerComments: app.engineerComments || '',
    ...((() => {
      const d = engineerDimsFromApp(app);
      return {
        dimNorth: d.N,
        dimSouth: d.S,
        dimEast: d.E,
        dimWest: d.W,
      };
    })()),
    projectName: app.applicationNumber,
    khatedarName: app.createdByZcName || '',
    surveyNo: app.siteNo,
    plotNo: app.siteNo,
    // Do NOT copy ZC siteDimension into dimensionArea — that used to prefill Step 3.
    dimensionArea: '',
    village: app.addressArea || '',
    taluk: app.addressBlock || '',
    district: address,
    state: 'Karnataka',
    gps:
      app.latitude && app.longitude
        ? {
            latitude: Number(app.latitude),
            longitude: Number(app.longitude),
            accuracy:
              typeof app.engineerGeoAddress?.accuracy === 'number'
                ? app.engineerGeoAddress.accuracy
                : null,
            altitude: null,
            timestamp: now,
          }
        : null,
    geoAddress: app.engineerGeoAddress
      ? {
          displayName: app.engineerGeoAddress.displayName || '',
          village: app.engineerGeoAddress.village || app.addressArea || '',
          taluk: app.engineerGeoAddress.taluk || app.addressBlock || '',
          district: app.engineerGeoAddress.district || '',
          state: app.engineerGeoAddress.state || 'Karnataka',
          street: app.engineerGeoAddress.street,
          name: app.engineerGeoAddress.name,
          layoutName: app.engineerGeoAddress.layoutName,
          area: app.engineerGeoAddress.area,
          block: app.engineerGeoAddress.block,
          postalCode: app.engineerGeoAddress.postalCode,
          country: app.engineerGeoAddress.country,
          accuracy:
            typeof app.engineerGeoAddress.accuracy === 'number'
              ? app.engineerGeoAddress.accuracy
              : null,
        }
      : null,
    directions: {
      N: app.engineerScheduleNotes?.N || '',
      S: app.engineerScheduleNotes?.S || '',
      E: app.engineerScheduleNotes?.E || '',
      W: app.engineerScheduleNotes?.W || '',
    },
    zcDirections: {
      N: app.scheduleNorth || '',
      S: app.scheduleSouth || '',
      E: app.scheduleEast || '',
      W: app.scheduleWest || '',
    },
    roadFlags: {
      N: Boolean(app.scheduleRoadFlags?.N),
      S: Boolean(app.scheduleRoadFlags?.S),
      E: Boolean(app.scheduleRoadFlags?.E),
      W: Boolean(app.scheduleRoadFlags?.W),
    },
    surroundingPhotos,
    photos,
    selfie,
    video: app.videoUrl
      ? remoteAsset(app.videoUrl, 'video', `video-${app.id}`, now)
      : null,
    approachNotes: app.siteDimensionComment || '',
    resubmitOfId: null,
  };
}
