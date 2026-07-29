import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  createEmptyDraft,
  makeApplicationId,
  type Cardinal,
  type GpsFix,
  type MediaAsset,
  type ProjectDraft,
  type SubmittedApplication,
} from '@/src/cdrms/project/types';
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
  startNewProject: () => void;
  updateField: (field: ProjectField, value: string) => void;
  setGps: (
    gps: GpsFix,
    address?: Partial<Pick<ProjectDraft, 'village' | 'taluk' | 'district' | 'state'>>
  ) => void;
  setBandiVerified: (ok: boolean) => void;
  setBandiRemarks: (value: string) => void;
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
    draft.directions[k].trim()
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
    projectName: draft.projectName.trim() || 'Untitled project',
    khatedarName: draft.khatedarName.trim() || '—',
    surveyNo: draft.surveyNo.trim() || '—',
    plotNo: draft.plotNo.trim() || '—',
    village: draft.village.trim() || '—',
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

export function ProjectProvider({ children }: { children: ReactNode }) {
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

  const loadApplicationForEdit = useCallback((id: string) => {
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
  }, [applications]);

  const startNewProject = useCallback(() => {
    setSelectedApplicationId(null);
    setDraft(createEmptyDraft());
  }, []);

  const updateField = useCallback(
    (field: ProjectField, value: string) => {
      touch((prev) => ({ ...prev, [field]: value }));
    },
    [touch]
  );

  const setGps = useCallback(
    (
      gps: GpsFix,
      address?: Partial<Pick<ProjectDraft, 'village' | 'taluk' | 'district' | 'state'>>
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
    [touch]
  );

  const setBandiVerified = useCallback(
    (ok: boolean) => {
      touch((prev) => ({ ...prev, bandiVerified: ok }));
    },
    [touch]
  );

  const setBandiRemarks = useCallback(
    (value: string) => {
      touch((prev) => ({ ...prev, bandiRemarks: value }));
    },
    [touch]
  );

  const setDirection = useCallback(
    (cardinal: Cardinal, value: string) => {
      touch((prev) => ({
        ...prev,
        directions: { ...prev.directions, [cardinal]: value },
      }));
    },
    [touch]
  );

  const setApproachNotes = useCallback(
    (value: string) => {
      touch((prev) => ({ ...prev, approachNotes: value }));
    },
    [touch]
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
    [touch]
  );

  const addPhoto = useCallback(
    (asset: MediaAsset) => {
      touch((prev) => {
        if (prev.photos.length >= 10) return prev;
        return { ...prev, photos: [...prev.photos, asset] };
      });
    },
    [touch]
  );

  const removePhoto = useCallback(
    (id: string) => {
      touch((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p.id !== id),
      }));
    },
    [touch]
  );

  const setVideo = useCallback(
    (asset: MediaAsset | null) => {
      touch((prev) => ({ ...prev, video: asset }));
    },
    [touch]
  );

  const saveDraft = useCallback(() => {
    touch((prev) => ({ ...prev, status: 'draft' }));
  }, [touch]);

  const submitApplication = useCallback(async (): Promise<SubmittedApplication | null> => {
    const summary = validationSummary(validateDraft(draft));
    if (!summary.allOk) return null;

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
  }, [draft, submitSeq]);

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
      startNewProject,
      updateField,
      setGps,
      setBandiVerified,
      setBandiRemarks,
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
      startNewProject,
      updateField,
      setGps,
      setBandiVerified,
      setBandiRemarks,
      setDirection,
      setApproachNotes,
      setSurroundingPhoto,
      addPhoto,
      removePhoto,
      setVideo,
      saveDraft,
      submitApplication,
    ]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return ctx;
}
