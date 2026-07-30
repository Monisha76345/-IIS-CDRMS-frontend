import type { Go, Screen } from '@/src/cdrms/types';
import { formatCoords, type ProjectDraft } from '@/src/cdrms/project/types';
import { TERMS } from '@/src/cdrms/terminology';

export type CheckKey =
  | 'project'
  | 'gps'
  | 'bandi'
  | 'directions'
  | 'surroundings'
  | 'photos'
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
const MIN_BACKEND_SITE_PHOTOS = 5; // selfie + 4 site photos for Nest submit

export function validateDraft(draft: ProjectDraft): ValidationItem[] {
  const dirsFilled = CARDINALS.filter(
    (k) => draft.directions[k].trim().length > 0 || Boolean(draft.surroundingPhotos[k])
  ).length;
  const surroundsFilled = CARDINALS.filter((k) => draft.surroundingPhotos[k]).length;
  const isBackend = Boolean(draft.backendApplicationId);
  const minPhotos = isBackend ? MIN_BACKEND_SITE_PHOTOS : MIN_SITE_PHOTOS;
  const projectOk = isBackend
    ? Boolean(draft.siteNo.trim() || draft.surveyNo.trim())
    : Boolean(draft.projectName.trim() && draft.surveyNo.trim() && draft.village.trim());

  return [
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
      label: TERMS.validation.checkBandi,
      ok: draft.bandiVerified,
      detail: draft.bandiVerified
        ? draft.compassReading
          ? `Verified · compass ${draft.compassReading}`
          : 'On-site Bandi verification confirmed'
        : 'Confirm physical site verification (Check Bandi)',
      fixScreen: 'bandi',
    },
    {
      key: 'directions',
      label: TERMS.validation.directionsBoundaries,
      ok: dirsFilled === 4,
      detail: `${dirsFilled}/4 boundary sides recorded`,
      fixScreen: 'bandi',
    },
    {
      key: 'surroundings',
      label: TERMS.validation.surroundingPhotos,
      ok: surroundsFilled >= 2,
      detail: `${surroundsFilled}/4 directional photographs`,
      fixScreen: 'surroundings',
    },
    {
      key: 'photos',
      label: isBackend
        ? 'Selfie + 4 site photos (5)'
        : `${TERMS.validation.sitePhotos} (min ${MIN_SITE_PHOTOS})`,
      ok: draft.photos.length >= minPhotos,
      detail: isBackend
        ? `${draft.photos.length}/5 (1st=selfie, next 4=site)`
        : `${draft.photos.length}/${MIN_SITE_PHOTOS} photographs`,
      fixScreen: 'photos',
    },
    {
      key: 'video',
      label: TERMS.validation.walkthroughVideo,
      ok: Boolean(draft.video),
      detail: draft.video ? 'Inspection video captured' : 'Record or attach site inspection video',
      fixScreen: 'video',
    },
  ];
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
