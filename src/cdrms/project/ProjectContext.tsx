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
  startApplicationTask,
  submitEngineerApplication,
} from '@/src/api/applications';
import { uploadMobileMedia } from '@/src/api/object-store';
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
import { validateDraft, validationSummary } from '@/src/cdrms/project/validation';

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
  startNewProject: () => void;
  updateField: (field: ProjectField, value: string) => void;
  setGps: (
    gps: GpsFix,
    address?: Partial<Pick<ProjectDraft, 'village' | 'taluk' | 'district' | 'state'>>,
  ) => void;
  setBandiVerified: (ok: boolean) => void;
  setBandiRemarks: (value: string) => void;
  setCompassReading: (value: string) => void;
  setDirection: (cardinal: Cardinal, value: string) => void;
  setApproachNotes: (value: string) => void;
  setSurroundingPhoto: (cardinal: Cardinal, asset: MediaAsset | null) => void;
  addPhoto: (asset: MediaAsset) => void;
  removePhoto: (id: string) => void;
  setVideo: (asset: MediaAsset | null) => void;
  saveDraft: () => void;
  submitApplication: () => Promise<SubmittedApplication | null>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

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

  const setApproachNotes = useCallback(
    (value: string) => {
      touch((prev) => ({ ...prev, approachNotes: value }));
    },
    [touch],
  );

  const setSurroundingPhoto = useCallback(
    (cardinal: Cardinal, asset: MediaAsset | null) => {
      touch((prev) => {
        const next = { ...prev.surroundingPhotos };
        if (asset) next[cardinal] = asset;
        else delete next[cardinal];
        return { ...prev, surroundingPhotos: next };
      });
    },
    [touch],
  );

  const addPhoto = useCallback(
    (asset: MediaAsset) => {
      touch((prev) => {
        if (prev.photos.length >= 10) return prev;
        return { ...prev, photos: [...prev.photos, asset] };
      });
    },
    [touch],
  );

  const removePhoto = useCallback(
    (id: string) => {
      touch((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p.id !== id),
      }));
    },
    [touch],
  );

  const setVideo = useCallback(
    (asset: MediaAsset | null) => {
      touch((prev) => ({ ...prev, video: asset }));
    },
    [touch],
  );

  const saveDraft = useCallback(() => {
    touch((prev) => ({ ...prev, status: 'draft' }));
  }, [touch]);

  const submitApplication = useCallback(async (): Promise<SubmittedApplication | null> => {
    const summary = validationSummary(validateDraft(draft));
    if (!summary.allOk) return null;

    // ── Backend ZC→engineer task ─────────────────────────────
    if (draft.backendApplicationId && accessToken) {
      const appId = draft.backendApplicationId;
      if (!draft.gps) throw new ApiError(400, 'GPS is required');
      if (draft.photos.length < 5) {
        throw new ApiError(400, 'Capture selfie + 4 site photos (5 images total)');
      }
      if (!draft.video) throw new ApiError(400, 'Site video is required');
      const compass =
        draft.compassReading.trim() ||
        draft.bandiRemarks.trim() ||
        'Captured on site';
      const siteDetails =
        draft.siteDetails.trim() ||
        draft.approachNotes.trim() ||
        draft.landmarks.trim() ||
        `Site ${draft.siteNo} survey`;
      const comments =
        draft.bandiRemarks.trim() ||
        draft.approachNotes.trim() ||
        siteDetails;

      const selfieUrl = await uploadMobileMedia({
        token: accessToken,
        applicationId: appId,
        refKey: 'selfie',
        uri: draft.photos[0].uri,
        kind: 'image',
      });
      const photoUrls: string[] = [];
      for (let i = 1; i <= 4; i += 1) {
        photoUrls.push(
          await uploadMobileMedia({
            token: accessToken,
            applicationId: appId,
            refKey: `photo-${i}`,
            uri: draft.photos[i].uri,
            kind: 'image',
          }),
        );
      }

      const schedulePhotoUrls: Record<string, string> = {};
      for (const key of ['N', 'S', 'E', 'W'] as const) {
        const asset = draft.surroundingPhotos[key];
        if (!asset) continue;
        schedulePhotoUrls[key] = await uploadMobileMedia({
          token: accessToken,
          applicationId: appId,
          refKey: `schedule-${key}`,
          uri: asset.uri,
          kind: 'image',
        });
      }

      const videoUrl = await uploadMobileMedia({
        token: accessToken,
        applicationId: appId,
        refKey: 'video',
        uri: draft.video.uri,
        kind: 'video',
      });

      const n = Number(draft.dimNorth);
      const s = Number(draft.dimSouth);
      const e = Number(draft.dimEast);
      const w = Number(draft.dimWest);

      await submitEngineerApplication(accessToken, appId, {
        engineerSiteDetails: siteDetails,
        compass,
        latitude: String(draft.gps.latitude),
        longitude: String(draft.gps.longitude),
        occupancy: draft.occupancy,
        occupancyReason:
          draft.occupancy === 'Occupied' ? draft.occupancyReason.trim() || 'Occupied' : undefined,
        dimNorth: String(Number.isFinite(n) && n > 0 ? n : 40),
        dimSouth: String(Number.isFinite(s) && s > 0 ? s : 40),
        dimEast: String(Number.isFinite(e) && e > 0 ? e : 30),
        dimWest: String(Number.isFinite(w) && w > 0 ? w : 30),
        totalSiteArea: String(
          avgArea(
            Number.isFinite(n) && n > 0 ? n : 40,
            Number.isFinite(s) && s > 0 ? s : 40,
            Number.isFinite(e) && e > 0 ? e : 30,
            Number.isFinite(w) && w > 0 ? w : 30,
          ),
        ),
        selfieUrl,
        photoUrls,
        schedulePhotoUrls:
          Object.keys(schedulePhotoUrls).length > 0 ? schedulePhotoUrls : undefined,
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
      startNewProject,
      updateField,
      setGps,
      setBandiVerified,
      setBandiRemarks,
      setCompassReading,
      setDirection,
      setApproachNotes,
      setSurroundingPhoto,
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
      startNewProject,
      updateField,
      setGps,
      setBandiVerified,
      setBandiRemarks,
      setCompassReading,
      setDirection,
      setApproachNotes,
      setSurroundingPhoto,
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
