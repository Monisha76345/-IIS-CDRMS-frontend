import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/src/auth/AuthContext';
import { ApiError } from '@/src/api/client';
import {
  fetchApplication,
  saveEngineerDraft,
  startApplicationTask,
  submitEngineerApplication,
  type EngineerDraftInput,
} from '@/src/api/applications';
import { deleteMobileMedia, uploadMobileMedia } from '@/src/api/object-store';
import {
  createEmptyDraft,
  makeApplicationId,
  type Cardinal,
  type GpsFix,
  type MediaAsset,
  type ProjectDraft,
  type SubmittedApplication,
} from '@/src/cdrms/project/types';
import { draftFromBackendApplication } from '@/src/cdrms/project/backend-draft';
import { draftFromApplicationRecord, findSampleApp } from '@/src/cdrms/data';
import { siteDimensionToFormDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import { validateDraft, validationSummary } from '@/src/cdrms/project/validation';

export type BackendDraftStep =
  | 'site'
  | 'compass'
  | 'dimensions'
  | 'media'
  | 'schedules';

type ProjectField = Exclude<
  keyof ProjectDraft,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'applicationId'
  | 'submittedAt'
  | 'gps'
  | 'bandiVerified'
  | 'bandiRemarks'
  | 'directions'
  | 'surroundingPhotos'
  | 'photos'
  | 'video'
  | 'resubmitOfId'
  | 'caoRemarks'
  | 'backendApplicationId'
  | 'applicationNumber'
>;

type ProjectContextValue = {
  draft: ProjectDraft;
  applications: SubmittedApplication[];
  lastSubmitted: SubmittedApplication | null;
  selectedApplicationId: string | null;
  /** Overrides sample-app status after fix & resubmit (e.g. Returned → Submitted). */
  statusOverrides: Record<string, string>;
  openApplication: (id: string) => void;
  clearSelectedApplication: () => void;
  /** Load returned/rejected app data into draft for editing and resubmit. */
  loadApplicationForEdit: (id: string) => boolean;
  /** Open a ZC-assigned backend task (fetch + start + seed draft). */
  openBackendTask: (id: string) => Promise<void>;
  /** Re-fetch GET /applications/:id and reseed local draft. */
  reloadBackendDraft: () => Promise<void>;
  /** Persist current step (or schedules) via PATCH /applications/:id/draft. */
  persistBackendStep: (step: BackendDraftStep) => Promise<void>;
  startNewProject: () => void;
  updateField: (field: ProjectField, value: string) => void;
  /** Even sites keep opposite sides equal (web Step 3 parity). */
  setDimSide: (side: 'N' | 'S' | 'E' | 'W', value: string) => void;
  setGps: (
    gps: GpsFix,
    address?: Partial<Pick<ProjectDraft, 'village' | 'taluk' | 'district' | 'state'>>,
  ) => void;
  setBandiVerified: (ok: boolean) => void;
  setBandiRemarks: (value: string) => void;
  setCompassReading: (value: string) => void;
  setDirection: (cardinal: Cardinal, value: string) => void;
  setRoadFlag: (cardinal: Cardinal, value: boolean) => void;
  setApproachNotes: (value: string) => void;
  setSurroundingPhoto: (
    cardinal: Cardinal,
    asset: MediaAsset | null,
  ) => Promise<void>;
  /** Clear local schedule photo + object-store + draft URL (web MediaUploadField parity). */
  clearSurroundingPhoto: (cardinal: Cardinal) => Promise<void>;
  addPhoto: (asset: MediaAsset) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  setVideo: (asset: MediaAsset | null) => Promise<void>;
  saveDraft: () => Promise<void>;
  submitApplication: () => Promise<SubmittedApplication | null>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

function isRemoteUri(uri: string) {
  return /^https?:\/\//i.test(uri);
}

async function resolveMediaUrl(opts: {
  token: string;
  applicationId: string;
  refKey: string;
  asset: MediaAsset | null | undefined;
  kind: 'image' | 'video';
}): Promise<string | undefined> {
  if (!opts.asset?.uri) return undefined;
  if (isRemoteUri(opts.asset.uri)) return opts.asset.uri;
  return uploadMobileMedia({
    token: opts.token,
    applicationId: opts.applicationId,
    refKey: opts.refKey,
    uri: opts.asset.uri,
    kind: opts.kind,
  });
}

function toSubmitted(draft: ProjectDraft, applicationId: string): SubmittedApplication {
  const directionsFilled = (['N', 'S', 'E', 'W'] as const).filter((k) =>
    draft.directions[k].trim() || draft.surroundingPhotos[k],
  ).length;

  const coverImage =
    draft.photos[0]?.uri ||
    draft.surroundingPhotos.N?.uri ||
    draft.surroundingPhotos.S?.uri ||
    draft.surroundingPhotos.E?.uri ||
    draft.surroundingPhotos.W?.uri ||
    null;

  return {
    id: draft.id,
    applicationId,
    projectName: draft.projectName.trim() || draft.applicationNumber || 'Untitled project',
    khatedarName: draft.khatedarName.trim() || draft.createdByZcName || '—',
    surveyNo: draft.surveyNo.trim() || draft.siteNo || '—',
    plotNo: draft.plotNo.trim() || '—',
    village: draft.village.trim() || draft.addressArea || '—',
    district: draft.district.trim() || '—',
    state: draft.state.trim() || 'Karnataka',
    dimensionArea: draft.dimensionArea.trim() || '—',
    roadType: draft.roadType.trim() || '—',
    photoCount: draft.photos.length,
    hasVideo: Boolean(draft.video),
    directionsFilled,
    submittedAt: Date.now(),
    status: 'Submitted',
    coverImage,
  };
}

function avgArea(n: number, s: number, e: number, w: number) {
  return Number((((n + s) / 2) * ((e + w) / 2)).toFixed(2));
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { accessToken, user } = useAuth();
  const [draft, setDraft] = useState<ProjectDraft>(createEmptyDraft);
  const [applications, setApplications] = useState<SubmittedApplication[]>([]);
  const [lastSubmitted, setLastSubmitted] = useState<SubmittedApplication | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [submitSeq, setSubmitSeq] = useState(840);

  const touch = useCallback((updater: (prev: ProjectDraft) => ProjectDraft) => {
    setDraft((prev) => ({ ...updater(prev), updatedAt: Date.now() }));
  }, []);

  const openApplication = useCallback((id: string) => {
    setSelectedApplicationId(id);
  }, []);

  const clearSelectedApplication = useCallback(() => {
    setSelectedApplicationId(null);
  }, []);

  const loadApplicationForEdit = useCallback(
    (id: string) => {
      const sample = findSampleApp(id);
      if (sample) {
        setDraft(draftFromApplicationRecord(sample));
        setSelectedApplicationId(null);
        return true;
      }

      const submitted = applications.find((a) => a.applicationId === id || a.id === id);
      if (submitted) {
        const now = Date.now();
        setDraft({
          ...createEmptyDraft(),
          id: `RESUB-${submitted.applicationId}`,
          createdAt: now,
          updatedAt: now,
          status: 'draft',
          applicationId: submitted.applicationId,
          projectName: submitted.projectName,
          khatedarName: submitted.khatedarName === '—' ? '' : submitted.khatedarName,
          surveyNo: submitted.surveyNo,
          plotNo: submitted.plotNo,
          dimensionArea: submitted.dimensionArea,
          roadType: submitted.roadType,
          village: submitted.village,
          district: submitted.district,
          state: submitted.state,
          bandiVerified: true,
          photos: submitted.coverImage
            ? [
                {
                  id: `cover-${now}`,
                  uri: submitted.coverImage,
                  type: 'image',
                  createdAt: now,
                },
              ]
            : [],
          resubmitOfId: submitted.applicationId,
          caoRemarks: null,
        });
        setSelectedApplicationId(null);
        return true;
      }

      return false;
    },
    [applications],
  );

  const openBackendTask = useCallback(
    async (id: string) => {
      if (!accessToken) {
        throw new ApiError(401, 'Please log in as site engineer');
      }
      const role = `${user?.userType || ''} ${user?.role || ''}`.toLowerCase();
      if (role && !role.includes('engineer') && !role.includes('super_admin')) {
        throw new ApiError(403, 'Only the assigned site engineer can open this task');
      }

      let app = await fetchApplication(accessToken, id);
      if (app.assignedEngineerUserId && user?.id && app.assignedEngineerUserId !== user.id) {
        throw new ApiError(403, 'This task is assigned to another engineer');
      }
      if (app.status === 'submitted' || app.status === 'verified' || app.status === 'rejected') {
        throw new ApiError(
          400,
          app.status === 'submitted'
            ? 'Task already submitted — waiting for CAO review'
            : `Task is ${app.status}`,
        );
      }

      if (app.status === 'assigned' || app.status === 'returned') {
        try {
          app = await startApplicationTask(accessToken, id);
        } catch {
          // start is best-effort; draft still loads
        }
      }

      setSelectedApplicationId(null);
      setDraft(draftFromBackendApplication(app));
    },
    [accessToken, user],
  );

  const reloadBackendDraft = useCallback(async () => {
    if (!accessToken || !draft.backendApplicationId) return;
    const app = await fetchApplication(accessToken, draft.backendApplicationId);
    setDraft(draftFromBackendApplication(app));
  }, [accessToken, draft.backendApplicationId]);

  const persistBackendStep = useCallback(
    async (step: BackendDraftStep) => {
      if (!accessToken || !draft.backendApplicationId) return;
      const appId = draft.backendApplicationId;
      const body: EngineerDraftInput = {};

      if (step === 'site') {
        body.engineerSiteDetails = draft.siteDetails.trim();
      }

      if (step === 'schedules' || step === 'compass') {
        body.engineerScheduleNotes = {
          N: draft.directions.N.trim(),
          S: draft.directions.S.trim(),
          E: draft.directions.E.trim(),
          W: draft.directions.W.trim(),
        };
        body.scheduleRoadFlags = {
          N: Boolean(draft.roadFlags?.N),
          S: Boolean(draft.roadFlags?.S),
          E: Boolean(draft.roadFlags?.E),
          W: Boolean(draft.roadFlags?.W),
        };
      }

      if (step === 'compass') {
        body.compass = draft.compassReading.trim();
        if (draft.gps) {
          body.latitude = String(draft.gps.latitude);
          body.longitude = String(draft.gps.longitude);
        }
        body.occupancy = draft.occupancy;
        body.occupancyReason =
          draft.occupancy === 'Occupied' ? draft.occupancyReason.trim() : '';
        const schedulePhotoUrls: NonNullable<EngineerDraftInput['schedulePhotoUrls']> = {};
        const nextSurrounding = { ...draft.surroundingPhotos };
        for (const key of ['N', 'S', 'E', 'W'] as const) {
          const url = await resolveMediaUrl({
            token: accessToken,
            applicationId: appId,
            refKey: `schedule-${key}`,
            asset: draft.surroundingPhotos[key],
            kind: 'image',
          });
          if (url) {
            schedulePhotoUrls[key] = url;
            // Keep local surrounding URIs for on-device preview.
          }
        }
        if (Object.keys(schedulePhotoUrls).length > 0) {
          body.schedulePhotoUrls = schedulePhotoUrls;
        }
        await saveEngineerDraft(accessToken, appId, body);
        setDraft((d) => ({
          ...d,
          surroundingPhotos: nextSurrounding,
          status: 'draft',
          updatedAt: Date.now(),
        }));
        return;
      }

      if (step === 'dimensions') {
        body.engineerDimensions = {
          N: draft.dimNorth.trim(),
          S: draft.dimSouth.trim(),
          E: draft.dimEast.trim(),
          W: draft.dimWest.trim(),
        };
        body.dimNorth = draft.dimNorth.trim();
        body.dimSouth = draft.dimSouth.trim();
        body.dimEast = draft.dimEast.trim();
        body.dimWest = draft.dimWest.trim();
        const n = Number(draft.dimNorth);
        const s = Number(draft.dimSouth);
        const e = Number(draft.dimEast);
        const w = Number(draft.dimWest);
        if ([n, s, e, w].every((v) => Number.isFinite(v) && v > 0)) {
          body.totalSiteArea = String(avgArea(n, s, e, w));
        }
      }

      if (step === 'media') {
        const nextPhotos = [...draft.photos];
        let nextVideo = draft.video;

        if (nextPhotos[0]) {
          const selfieUrl = await resolveMediaUrl({
            token: accessToken,
            applicationId: appId,
            refKey: 'selfie',
            asset: nextPhotos[0],
            kind: 'image',
          });
          if (selfieUrl) {
            body.selfieUrl = selfieUrl;
            // Keep local URI in draft for preview — do not swap to MinIO host.
          }
        }

        const photoUrls: string[] = [];
        for (let i = 1; i < nextPhotos.length && photoUrls.length < 4; i += 1) {
          const url = await resolveMediaUrl({
            token: accessToken,
            applicationId: appId,
            refKey: `photo-${photoUrls.length + 1}`,
            asset: nextPhotos[i],
            kind: 'image',
          });
          if (url) {
            photoUrls.push(url);
          }
        }
        body.photoUrls = photoUrls;

        if (nextVideo) {
          const videoUrl = await resolveMediaUrl({
            token: accessToken,
            applicationId: appId,
            refKey: 'video',
            asset: nextVideo,
            kind: 'video',
          });
          if (videoUrl) {
            body.videoUrl = videoUrl;
          }
        }

        if (draft.engineerComments.trim()) {
          body.engineerComments = draft.engineerComments.trim();
        }

        await saveEngineerDraft(accessToken, appId, body);
        // Prefer on-device local URIs so selfie / video previews keep working.
        setDraft((d) => ({
          ...d,
          photos: nextPhotos.length > 0 ? nextPhotos : d.photos,
          video: nextVideo ?? d.video,
          status: 'draft',
          updatedAt: Date.now(),
        }));
        return;
      }

      await saveEngineerDraft(accessToken, appId, body);
      touch((prev) => ({ ...prev, status: 'draft' }));
    },
    [accessToken, draft, touch],
  );

  const startNewProject = useCallback(() => {
    setSelectedApplicationId(null);
    setDraft(createEmptyDraft());
  }, []);

  const updateField = useCallback(
    (field: ProjectField, value: string) => {
      touch((prev) => ({ ...prev, [field]: value }));
    },
    [touch],
  );

  const setDimSide = useCallback(
    (side: 'N' | 'S' | 'E' | 'W', value: string) => {
      touch((prev) => {
        if (side === 'N') return { ...prev, dimNorth: value };
        if (side === 'S') return { ...prev, dimSouth: value };
        if (side === 'E') return { ...prev, dimEast: value };
        return { ...prev, dimWest: value };
      });
    },
    [touch],
  );

  const setGps = useCallback(
    (
      gps: GpsFix,
      address?: Partial<Pick<ProjectDraft, 'village' | 'taluk' | 'district' | 'state'>>,
    ) => {
      touch((prev) => ({
        ...prev,
        gps,
        village: address?.village ?? prev.village,
        taluk: address?.taluk ?? prev.taluk,
        district: address?.district ?? prev.district,
        state: address?.state ?? prev.state,
      }));
    },
    [touch],
  );

  const setBandiVerified = useCallback(
    (ok: boolean) => {
      touch((prev) => ({ ...prev, bandiVerified: ok }));
    },
    [touch],
  );

  const setBandiRemarks = useCallback(
    (value: string) => {
      touch((prev) => ({ ...prev, bandiRemarks: value }));
    },
    [touch],
  );

  const setCompassReading = useCallback(
    (value: string) => {
      touch((prev) => ({ ...prev, compassReading: value }));
    },
    [touch],
  );

  const setDirection = useCallback(
    (cardinal: Cardinal, value: string) => {
      touch((prev) => ({
        ...prev,
        directions: { ...prev.directions, [cardinal]: value },
      }));
    },
    [touch],
  );

  const setRoadFlag = useCallback(
    (cardinal: Cardinal, value: boolean) => {
      touch((prev) => ({
        ...prev,
        roadFlags: {
          ...(prev.roadFlags ?? { N: false, S: false, E: false, W: false }),
          [cardinal]: value,
        },
      }));
    },
    [touch],
  );

  const setApproachNotes = useCallback(
    (value: string) => {
      touch((prev) => ({ ...prev, approachNotes: value }));
    },
    [touch],
  );

  const setSurroundingPhoto = useCallback(
    async (cardinal: Cardinal, asset: MediaAsset | null) => {
      if (!asset) {
        touch((prev) => {
          const next = { ...prev.surroundingPhotos };
          delete next[cardinal];
          return { ...prev, surroundingPhotos: next };
        });
        return;
      }

      // Optimistic local preview while uploading
      touch((prev) => ({
        ...prev,
        surroundingPhotos: { ...prev.surroundingPhotos, [cardinal]: asset },
      }));

      if (!accessToken || !draft.backendApplicationId) return;

      const appId = draft.backendApplicationId;
      const url = await resolveMediaUrl({
        token: accessToken,
        applicationId: appId,
        refKey: `schedule-${cardinal}`,
        asset,
        kind: 'image',
      });
      if (!url) return;

      await saveEngineerDraft(accessToken, appId, {
        schedulePhotoUrls: { [cardinal]: url },
      });

      // Keep the local file for on-device preview. Remote MinIO URLs use
      // 127.0.0.1 which phones cannot open directly; proxy loads on reload.
      touch((prev) => ({
        ...prev,
        surroundingPhotos: {
          ...prev.surroundingPhotos,
          [cardinal]: asset,
        },
      }));
    },
    [accessToken, draft.backendApplicationId, touch],
  );

  const clearSurroundingPhoto = useCallback(
    async (cardinal: Cardinal) => {
      const prevUri = draft.surroundingPhotos[cardinal]?.uri;
      await setSurroundingPhoto(cardinal, null);
      if (!accessToken || !draft.backendApplicationId) return;
      const appId = draft.backendApplicationId;
      const refId = `${appId}:schedule-${cardinal}`;
      try {
        await deleteMobileMedia({
          token: accessToken,
          url: prevUri && isRemoteUri(prevUri) ? prevUri : undefined,
          refId,
        });
      } catch {
        /* ignore storage delete errors — still clear draft URL */
      }
      await saveEngineerDraft(accessToken, appId, {
        schedulePhotoUrls: { [cardinal]: '' },
      });
    },
    [
      accessToken,
      draft.backendApplicationId,
      draft.surroundingPhotos,
      setSurroundingPhoto,
    ],
  );

  const addPhoto = useCallback(
    async (asset: MediaAsset) => {
      let slotIndex = -1;
      touch((prev) => {
        const max = prev.backendApplicationId ? 5 : 10;
        if (prev.photos.length >= max) return prev;
        slotIndex = prev.photos.length;
        return { ...prev, photos: [...prev.photos, asset] };
      });
      if (slotIndex < 0) return;
      if (!accessToken || !draft.backendApplicationId) return;

      const appId = draft.backendApplicationId;
      const refKey = slotIndex === 0 ? 'selfie' : `photo-${slotIndex}`;
      const url = await resolveMediaUrl({
        token: accessToken,
        applicationId: appId,
        refKey,
        asset,
        kind: 'image',
      });
      if (!url) return;

      if (slotIndex === 0) {
        await saveEngineerDraft(accessToken, appId, { selfieUrl: url });
      } else {
        const remoteExtras = draft.photos
          .slice(1)
          .map((p) => p.uri)
          .filter((u) => isRemoteUri(u));
        remoteExtras.push(url);
        await saveEngineerDraft(accessToken, appId, {
          photoUrls: remoteExtras.slice(0, 4),
        });
      }

      // Keep local file:// for on-device preview (MinIO URLs use 127.0.0.1).
    },
    [accessToken, draft.backendApplicationId, draft.photos, touch],
  );

  const removePhoto = useCallback(
    async (id: string) => {
      const idx = draft.photos.findIndex((p) => p.id === id);
      const removed = idx >= 0 ? draft.photos[idx] : null;
      const nextPhotos = draft.photos.filter((p) => p.id !== id);

      touch((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p.id !== id),
      }));

      if (!accessToken || !draft.backendApplicationId || !removed) return;
      const appId = draft.backendApplicationId;

      try {
        const refKey = idx === 0 ? 'selfie' : `photo-${idx}`;
        await deleteMobileMedia({
          token: accessToken,
          url: isRemoteUri(removed.uri) ? removed.uri : undefined,
          refId: `${appId}:${refKey}`,
        });
      } catch {
        /* ignore */
      }

      const selfieUrl = nextPhotos[0]?.uri && isRemoteUri(nextPhotos[0].uri)
        ? nextPhotos[0].uri
        : '';
      const photoUrls = nextPhotos
        .slice(1)
        .map((p) => p.uri)
        .filter((u) => isRemoteUri(u))
        .slice(0, 4);

      await saveEngineerDraft(accessToken, appId, {
        selfieUrl,
        photoUrls,
      });
    },
    [accessToken, draft.backendApplicationId, draft.photos, touch],
  );

  const setVideo = useCallback(
    async (asset: MediaAsset | null) => {
      touch((prev) => ({ ...prev, video: asset }));
      if (!accessToken || !draft.backendApplicationId) return;
      const appId = draft.backendApplicationId;

      if (!asset) {
        const prevUri = draft.video?.uri;
        try {
          await deleteMobileMedia({
            token: accessToken,
            url: prevUri && isRemoteUri(prevUri) ? prevUri : undefined,
            refId: `${appId}:video`,
          });
        } catch {
          /* ignore */
        }
        await saveEngineerDraft(accessToken, appId, { videoUrl: '' });
        return;
      }

      const url = await resolveMediaUrl({
        token: accessToken,
        applicationId: appId,
        refKey: 'video',
        asset,
        kind: 'video',
      });
      if (!url) return;

      await saveEngineerDraft(accessToken, appId, { videoUrl: url });
      // Keep local file for playback; remote MinIO host is not reachable from phone.
    },
    [accessToken, draft.backendApplicationId, draft.video?.uri, touch],
  );

  const saveDraft = useCallback(async () => {
    touch((prev) => ({ ...prev, status: 'draft' }));
    if (!draft.backendApplicationId || !accessToken) return;
    // Snapshot whatever is filled so the Save button also hits the DB.
    await persistBackendStep('site');
    if (draft.compassReading.trim() || draft.gps) {
      await persistBackendStep('compass');
    }
    // Only persist dimensions the engineer typed — never ZC siteDimension copies.
    const zc = siteDimensionToFormDims(draft.siteDimensionMaster);
    const dimsAreZcCopy =
      Boolean(zc) &&
      draft.dimNorth.trim() === zc!.north &&
      draft.dimSouth.trim() === zc!.south &&
      draft.dimEast.trim() === zc!.east &&
      draft.dimWest.trim() === zc!.west;
    if (
      !dimsAreZcCopy &&
      [draft.dimNorth, draft.dimSouth, draft.dimEast, draft.dimWest].some((v) => Number(v) > 0)
    ) {
      await persistBackendStep('dimensions');
    }
    if (draft.photos.length > 0 || draft.video || draft.engineerComments.trim()) {
      await persistBackendStep('media');
    }
    await persistBackendStep('schedules');
  }, [accessToken, draft, persistBackendStep, touch]);

  const submitApplication = useCallback(async (): Promise<SubmittedApplication | null> => {
    const summary = validationSummary(validateDraft(draft));
    if (!summary.allOk) return null;

    // ── Backend ZC→engineer task ─────────────────────────────
    if (draft.backendApplicationId && accessToken) {
      const appId = draft.backendApplicationId;
      if (!draft.gps) throw new ApiError(400, 'GPS is required');
      if (draft.occupancy === 'Occupied' && !draft.occupancyReason.trim()) {
        throw new ApiError(400, 'Occupancy reason is required');
      }
      if (!draft.engineerComments.trim()) {
        throw new ApiError(400, 'Engineer comments are required');
      }
      if (draft.photos.length < 1) {
        throw new ApiError(400, 'Engineer selfie is required');
      }
      if (!draft.video) throw new ApiError(400, 'Site video is required');
      const missingSchedule = (['N', 'S', 'E', 'W'] as const).filter(
        (k) => !draft.surroundingPhotos[k],
      );
      if (missingSchedule.length > 0) {
        throw new ApiError(
          400,
          `Schedule photos required for: ${missingSchedule.join(', ')}`,
        );
      }
      const compass =
        draft.compassReading.trim() ||
        (draft.bandiVerified ? 'Verified on site' : '42° NE');
      const siteDetails = draft.siteDetails.trim();
      const comments = draft.engineerComments.trim();

      const selfieUrl = await resolveMediaUrl({
        token: accessToken,
        applicationId: appId,
        refKey: 'selfie',
        asset: draft.photos[0],
        kind: 'image',
      });
      if (!selfieUrl) throw new ApiError(400, 'Engineer selfie is required');
      // Extra site photos (after selfie) are optional — upload up to 4.
      const photoUrls: string[] = [];
      for (let i = 1; i < draft.photos.length && photoUrls.length < 4; i += 1) {
        const url = await resolveMediaUrl({
          token: accessToken,
          applicationId: appId,
          refKey: `photo-${photoUrls.length + 1}`,
          asset: draft.photos[i],
          kind: 'image',
        });
        if (url) photoUrls.push(url);
      }

      const schedulePhotoUrls: Record<'N' | 'S' | 'E' | 'W', string> = {
        N: '',
        S: '',
        E: '',
        W: '',
      };
      for (const key of ['N', 'S', 'E', 'W'] as const) {
        const url = await resolveMediaUrl({
          token: accessToken,
          applicationId: appId,
          refKey: `schedule-${key}`,
          asset: draft.surroundingPhotos[key],
          kind: 'image',
        });
        if (!url) {
          throw new ApiError(400, `Schedule photo required for ${key}`);
        }
        schedulePhotoUrls[key] = url;
      }

      const videoUrl = await resolveMediaUrl({
        token: accessToken,
        applicationId: appId,
        refKey: 'video',
        asset: draft.video,
        kind: 'video',
      });
      if (!videoUrl) throw new ApiError(400, 'Site video is required');

      const n = Number(draft.dimNorth) || 0;
      const s = Number(draft.dimSouth) || 0;
      const e = Number(draft.dimEast) || 0;
      const w = Number(draft.dimWest) || 0;
      if (!(n > 0 && s > 0 && e > 0 && w > 0)) {
        throw new ApiError(
          400,
          'Enter site dimensions North / South / East / West before submit',
        );
      }

      await submitEngineerApplication(accessToken, appId, {
        engineerSiteDetails: siteDetails,
        compass,
        latitude: String(draft.gps.latitude),
        longitude: String(draft.gps.longitude),
        occupancy: draft.occupancy,
        occupancyReason:
          draft.occupancy === 'Occupied' ? draft.occupancyReason.trim() || 'Occupied' : undefined,
        dimNorth: String(n),
        dimSouth: String(s),
        dimEast: String(e),
        dimWest: String(w),
        engineerDimensions: {
          N: String(n),
          S: String(s),
          E: String(e),
          W: String(w),
        },
        totalSiteArea: String(avgArea(n, s, e, w)),
        selfieUrl,
        photoUrls,
        schedulePhotoUrls,
        engineerScheduleNotes: {
          N: draft.directions.N.trim(),
          S: draft.directions.S.trim(),
          E: draft.directions.E.trim(),
          W: draft.directions.W.trim(),
        },
        scheduleRoadFlags: {
          N: Boolean(draft.roadFlags?.N),
          S: Boolean(draft.roadFlags?.S),
          E: Boolean(draft.roadFlags?.E),
          W: Boolean(draft.roadFlags?.W),
        },
        videoUrl,
        engineerComments: comments,
      });

      const applicationId = draft.applicationNumber || draft.applicationId || appId;
      const submitted = toSubmitted(draft, applicationId);
      setApplications((prev) => {
        const withoutDup = prev.filter((a) => a.applicationId !== applicationId);
        return [submitted, ...withoutDup];
      });
      setLastSubmitted(submitted);
      setDraft((prev) => ({
        ...prev,
        status: 'submitted',
        applicationId,
        submittedAt: submitted.submittedAt,
        updatedAt: Date.now(),
        resubmitOfId: null,
      }));
      return submitted;
    }

    // ── Local sample / offline draft (unchanged) ─────────────
    await new Promise((r) => setTimeout(r, 650));

    const resubmitId = draft.resubmitOfId;
    const nextSeq = submitSeq + 1;
    const applicationId = resubmitId || makeApplicationId(nextSeq);
    const submitted = toSubmitted(draft, applicationId);

    if (!resubmitId) {
      setSubmitSeq(nextSeq);
    } else {
      setStatusOverrides((prev) => ({ ...prev, [resubmitId]: 'Submitted' }));
    }

    setApplications((prev) => {
      const withoutDup = prev.filter((a) => a.applicationId !== applicationId);
      return [submitted, ...withoutDup];
    });
    setLastSubmitted(submitted);
    setDraft((prev) => ({
      ...prev,
      status: 'submitted',
      applicationId,
      submittedAt: submitted.submittedAt,
      updatedAt: Date.now(),
      resubmitOfId: null,
      caoRemarks: null,
    }));

    return submitted;
  }, [draft, submitSeq, accessToken]);

  const value = useMemo(
    () => ({
      draft,
      applications,
      lastSubmitted,
      selectedApplicationId,
      statusOverrides,
      openApplication,
      clearSelectedApplication,
      loadApplicationForEdit,
      openBackendTask,
      reloadBackendDraft,
      persistBackendStep,
      startNewProject,
      updateField,
      setDimSide,
      setGps,
      setBandiVerified,
      setBandiRemarks,
      setCompassReading,
      setDirection,
      setRoadFlag,
      setApproachNotes,
      setSurroundingPhoto,
      clearSurroundingPhoto,
      addPhoto,
      removePhoto,
      setVideo,
      saveDraft,
      submitApplication,
    }),
    [
      draft,
      applications,
      lastSubmitted,
      selectedApplicationId,
      statusOverrides,
      openApplication,
      clearSelectedApplication,
      loadApplicationForEdit,
      openBackendTask,
      reloadBackendDraft,
      persistBackendStep,
      startNewProject,
      updateField,
      setDimSide,
      setGps,
      setBandiVerified,
      setBandiRemarks,
      setCompassReading,
      setDirection,
      setRoadFlag,
      setApproachNotes,
      setSurroundingPhoto,
      clearSurroundingPhoto,
      addPhoto,
      removePhoto,
      setVideo,
      saveDraft,
      submitApplication,
    ],
  );

  return <ProjectContext value={value}>{children}</ProjectContext>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
