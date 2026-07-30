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

/** Seed a survey draft from a ZC-assigned backend application (incl. saved draft media). */
export function draftFromBackendApplication(app: MobileApplication): ProjectDraft {
  const now = Date.now();
  const base = createEmptyDraft();
  const address = [app.addressArea, app.addressBlock, app.addressPincode]
    .filter(Boolean)
    .join(', ');
  const fromSite = siteDimensionToFormDims(app.siteDimension);

  const photos: MediaAsset[] = [];
  if (app.selfieUrl) {
    photos.push(remoteAsset(app.selfieUrl, 'image', `selfie-${app.id}`, now));
  }
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
    dimNorth: app.dimNorth ? String(app.dimNorth) : fromSite?.north || '',
    dimSouth: app.dimSouth ? String(app.dimSouth) : fromSite?.south || '',
    dimEast: app.dimEast ? String(app.dimEast) : fromSite?.east || '',
    dimWest: app.dimWest ? String(app.dimWest) : fromSite?.west || '',
    projectName: app.applicationNumber,
    khatedarName: app.createdByZcName || '',
    surveyNo: app.siteNo,
    plotNo: app.siteNo,
    dimensionArea: app.siteDimension || '',
    village: app.addressArea || '',
    taluk: app.addressBlock || '',
    district: address,
    state: 'Karnataka',
    gps:
      app.latitude && app.longitude
        ? {
            latitude: Number(app.latitude),
            longitude: Number(app.longitude),
            accuracy: null,
            altitude: null,
            timestamp: now,
          }
        : null,
    directions: {
      N: app.scheduleNorth || '',
      S: app.scheduleSouth || '',
      E: app.scheduleEast || '',
      W: app.scheduleWest || '',
    },
    surroundingPhotos,
    photos,
    video: app.videoUrl
      ? remoteAsset(app.videoUrl, 'video', `video-${app.id}`, now)
      : null,
    approachNotes: app.siteDimensionComment || '',
    caoRemarks: app.caoRemarks || null,
    resubmitOfId: app.status === 'returned' ? app.id : null,
  };
}
