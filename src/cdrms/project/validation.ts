import type { Go, Screen } from '@/src/cdrms/types';
import { isOccupancyOk, validateOccupancyReason } from '@/src/cdrms/lib/occupancyValidation';
import { formatCoords, type ProjectDraft } from '@/src/cdrms/project/types';
import { TERMS } from '@/src/cdrms/terminology';

export type CheckKey =
  | 'project'
  | 'siteDetails'
  | 'gps'
  | 'bandi'
  | 'occupancy'
  | 'dimensions'
  | 'directions'
  | 'surroundings'
  | 'photos'
  | 'comments'
  | 'video';

export type ValidationItem = {
  key: CheckKey;
  label: string;
  ok: boolean;
  detail: string;
  fixScreen: Screen;
};

const CARDINALS = ['N', 'S', 'E', 'W'] as const;
const MIN_SITE_PHOTOS = 3;
/** Backend ZC tasks: only engineer selfie is mandatory; up to 4 extra site photos. */
const MIN_BACKEND_SELFIE = 1;
const MAX_BACKEND_PHOTOS = 5; // selfie + 4

function dimsOk(draft: ProjectDraft) {
  return [draft.dimNorth, draft.dimSouth, draft.dimEast, draft.dimWest].every(
    (v) => Number(v) > 0,
  );
}

export function validateDraft(draft: ProjectDraft): ValidationItem[] {
  const dirsFilled = CARDINALS.filter(
    (k) => draft.directions[k].trim().length > 0 || Boolean(draft.surroundingPhotos[k]),
  ).length;
  const surroundsFilled = CARDINALS.filter((k) => draft.surroundingPhotos[k]).length;
  const isBackend = Boolean(draft.backendApplicationId);
  const minPhotos = isBackend ? MIN_BACKEND_SELFIE : MIN_SITE_PHOTOS;
  const projectOk = isBackend
    ? Boolean(draft.siteNo.trim() || draft.surveyNo.trim())
    : Boolean(draft.projectName.trim() && draft.surveyNo.trim() && draft.village.trim());
  const optionalSiteCount = Math.max(0, draft.photos.length - 1);
  const occupancyOk = isOccupancyOk(draft.occupancy, draft.occupancyReason);
  const occupancyReasonError = validateOccupancyReason(
    draft.occupancy,
    draft.occupancyReason,
  );
  const commentsOk = isBackend
    ? draft.engineerComments.trim().length > 0
    : true;

  const items: ValidationItem[] = [
    {
      key: 'project',
      label: TERMS.validation.projectDetails,
      ok: projectOk,
      detail: isBackend
        ? projectOk
          ? `${draft.applicationNumber || draft.projectName} · Site ${draft.siteNo || draft.surveyNo}`
          : 'Assigned site details missing'
        : projectOk
          ? `${draft.projectName.trim()} · Survey ${draft.surveyNo.trim()}`
          : 'Work name, survey no. and village required',
      fixScreen: 'project',
    },
  ];

  items.push(
    {
      key: 'gps',
      label: TERMS.validation.gpsCoordinates,
      ok: Boolean(draft.gps),
      detail: draft.gps
        ? formatCoords(draft.gps.latitude, draft.gps.longitude).short
        : 'Capture live GPS on site particulars or Check Bandi step',
      fixScreen: 'project',
    },
    {
      key: 'bandi',
      label: isBackend ? 'Compass / site verification' : TERMS.validation.checkBandi,
      ok: isBackend
        ? Boolean(draft.compassReading.trim() || draft.bandiVerified)
        : draft.bandiVerified,
      detail: isBackend
        ? draft.compassReading.trim() || draft.bandiVerified
          ? draft.compassReading
            ? `Compass ${draft.compassReading}`
            : 'On-site verification confirmed'
          : 'Confirm compass / physical verification'
        : draft.bandiVerified
          ? draft.compassReading
            ? `Verified · compass ${draft.compassReading}`
            : 'On-site Bandi verification confirmed'
          : 'Confirm physical site verification (Check Bandi)',
      fixScreen: 'bandi',
    },
  );

  if (isBackend) {
    items.push({
      key: 'occupancy',
      label: 'Occupancy',
      ok: occupancyOk,
      detail: occupancyOk
        ? draft.occupancy === 'Occupied'
          ? `Occupied · ${draft.occupancyReason.trim()}`
          : 'Empty'
        : occupancyReasonError || 'Reason required when site is Occupied',
      fixScreen: 'bandi',
    });
    items.push({
      key: 'dimensions',
      label: 'Site dimensions N/S/E/W',
      ok: dimsOk(draft),
      detail: dimsOk(draft)
        ? `${draft.dimNorth}*${draft.dimEast}*${draft.dimSouth}*${draft.dimWest}`
        : 'Enter all four side lengths',
      fixScreen: 'dimensions',
    });
  }

  items.push({
    key: 'directions',
    label: TERMS.validation.directionsBoundaries,
    ok: isBackend ? true : dirsFilled === 4,
    detail: isBackend
      ? `${dirsFilled}/4 schedules (optional to edit)`
      : `${dirsFilled}/4 boundary sides recorded`,
    fixScreen: 'bandi',
  });

  if (!isBackend) {
    items.push({
      key: 'surroundings',
      label: TERMS.validation.surroundingPhotos,
      ok: surroundsFilled >= 2,
      detail: `${surroundsFilled}/4 directional photographs`,
      fixScreen: 'surroundings',
    });
  } else {
    items.push({
      key: 'surroundings',
      label: 'Schedule photos (N/S/E/W)',
      ok: surroundsFilled === 4,
      detail:
        surroundsFilled === 4
          ? 'All 4 schedule photos captured'
          : `${surroundsFilled}/4 schedule photos — all mandatory`,
      fixScreen: 'bandi',
    });
  }

  items.push({
    key: 'photos',
    label: isBackend
      ? 'Engineer selfie'
      : `${TERMS.validation.sitePhotos} (min ${MIN_SITE_PHOTOS})`,
    ok: isBackend ? Boolean(draft.selfie) : draft.photos.length >= minPhotos,
    detail: isBackend
      ? draft.selfie
        ? draft.photos.length > 0
          ? `Selfie OK · ${draft.photos.length} optional site photo(s) (max 4)`
          : 'Selfie captured (extra site photos optional, max 4)'
        : 'Selfie required — extra site photos are optional'
      : `${draft.photos.length}/${MIN_SITE_PHOTOS} photographs`,
    fixScreen: 'photos',
  });

  if (isBackend) {
    items.push({
      key: 'comments',
      label: 'Engineer comments',
      ok: commentsOk,
      detail: commentsOk ? 'Comments recorded' : 'Comments required before submit',
      fixScreen: 'photos',
    });
  }

  items.push({
    key: 'video',
    label: isBackend ? 'Site video (mandatory)' : TERMS.validation.walkthroughVideo,
    ok: Boolean(draft.video),
    detail: draft.video
      ? 'Inspection video captured'
      : 'Video is mandatory — record or attach site inspection video',
    fixScreen: isBackend ? 'photos' : 'video',
  });

  return items;
}

export function maxPhotosForDraft(draft: ProjectDraft) {
  return draft.backendApplicationId ? MAX_BACKEND_PHOTOS : 10;
}

export function validationSummary(items: ValidationItem[]) {
  const passed = items.filter((i) => i.ok).length;
  const total = items.length;
  const percent = total === 0 ? 0 : Math.round((passed / total) * 100);
  return {
    passed,
    total,
    percent,
    allOk: passed === total,
    failed: items.filter((i) => !i.ok),
  };
}

export function goToFix(go: Go, screen: Screen) {
  go(screen);
}
