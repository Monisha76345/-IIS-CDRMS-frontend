import type { MobileApplication } from '@/src/api/applications';
import { createEmptyDraft, type ProjectDraft } from '@/src/cdrms/project/types';

/** Seed a survey draft from a ZC-assigned backend application. */
export function draftFromBackendApplication(app: MobileApplication): ProjectDraft {
  const now = Date.now();
  const base = createEmptyDraft();
  const address = [app.addressArea, app.addressBlock, app.addressPincode]
    .filter(Boolean)
    .join(', ');

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
    siteDetails: app.engineerSiteDetails || '',
    compassReading: app.compass || '',
    occupancy: app.occupancy === 'Occupied' ? 'Occupied' : 'Empty',
    occupancyReason: app.occupancyReason || '',
    dimNorth: app.dimNorth ? String(app.dimNorth) : '40',
    dimSouth: app.dimSouth ? String(app.dimSouth) : '40',
    dimEast: app.dimEast ? String(app.dimEast) : '30',
    dimWest: app.dimWest ? String(app.dimWest) : '30',
    projectName: app.applicationNumber,
    khatedarName: app.createdByZcName || '',
    surveyNo: app.siteNo,
    plotNo: app.siteNo,
    dimensionArea:
      app.totalSiteArea != null
        ? String(app.totalSiteArea)
        : app.siteDimensionType === 'Odd'
          ? 'Odd shaped'
          : '',
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
    approachNotes: app.siteDimensionComment || '',
    caoRemarks: app.caoRemarks || null,
    resubmitOfId: app.status === 'returned' ? app.id : null,
  };
}
