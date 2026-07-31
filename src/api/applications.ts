import { apiRequest } from './client';

export type MobileApplicationStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'verified'
  | 'returned'
  | 'rejected';

export type ApplicationHistoryItem = {
  id?: string;
  taskName: string;
  performedBy: string;
  sentTo?: string | null;
  startedOn?: string | null;
  completedOn?: string | null;
  comments?: string | null;
  statusBefore?: string | null;
  statusAfter?: string | null;
};

export type MobileApplication = {
  id: string;
  applicationNumber: string;
  siteNo: string;
  addressArea: string;
  addressBlock: string;
  addressPincode: string;
  siteDimensionType: 'Even' | 'Odd' | 'Regular';
  siteDimension?: string | null;
  siteDimensionComment?: string | null;
  scheduleNorth?: string | null;
  scheduleSouth?: string | null;
  scheduleWest?: string | null;
  scheduleEast?: string | null;
  engineerScheduleNotes?: Record<string, string> | null;
  scheduleRoadFlags?: Record<string, boolean> | null;
  /** Engineer N/S/E/W — separate from ZC siteDimension. */
  engineerDimensions?: Record<string, string> | null;
  zoneId?: number;
  zoneCode: string;
  status: MobileApplicationStatus;
  createdByZcName?: string | null;
  assignedEngineerName?: string | null;
  assignedEngineerUserId?: string;
  assignedEngineerLoginId?: string | null;
  assignedCaoName?: string | null;
  engineerSiteDetails?: string | null;
  compass?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  occupancy?: 'Empty' | 'Occupied' | null;
  occupancyReason?: string | null;
  dimNorth?: string | null;
  dimSouth?: string | null;
  dimEast?: string | null;
  dimWest?: string | null;
  totalSiteArea?: string | null;
  selfieUrl?: string | null;
  photoUrls?: string[] | null;
  schedulePhotoUrls?: Record<string, string> | null;
  videoUrl?: string | null;
  engineerComments?: string | null;
  engineerSubmittedAt?: string | null;
  caoRemarks?: string | null;
  caoReviewedAt?: string | null;
  history?: ApplicationHistoryItem[] | null;
};

export type ApplicationAs = 'engineer' | 'zc' | 'cao';

export type MyZoneEngineer = {
  userId: string;
  name: string;
  postName?: string | null;
};

export type MyZoneMeta = {
  zoneId: number;
  zoneCode: string;
  zoneName: string;
  engineers: MyZoneEngineer[];
};

export type CaoCounts = {
  pending: number;
  verified: number;
  returned: number;
  rejected: number;
  total: number;
};

export type CreateApplicationInput = {
  siteNo: string;
  addressArea: string;
  addressBlock: string;
  addressPincode: string;
  siteDimensionType: 'Even' | 'Odd';
  /** Plot size e.g. 20*40 — required by backend */
  siteDimension: string;
  siteDimensionComment?: string;
  scheduleNorth?: string;
  scheduleSouth?: string;
  scheduleWest?: string;
  scheduleEast?: string;
  assignedEngineerUserId: string;
};

export type SiteDimensionOption = {
  id: string;
  label: string;
  code?: string;
};

/** Public master list for Site dimension dropdown (Even/Odd plot sizes). */
export async function fetchSiteDimensions(token?: string | null) {
  const raw = await apiRequest<{ items?: SiteDimensionOption[] } | SiteDimensionOption[]>(
    '/public/attributes?type=site_dimension&status=Active',
    { token: token ?? undefined },
  );
  const items = Array.isArray(raw) ? raw : raw.items ?? [];
  return items
    .map((row) => ({
      id: String((row as SiteDimensionOption).id ?? ''),
      label: String((row as SiteDimensionOption).label ?? '').trim(),
      code: (row as SiteDimensionOption).code,
    }))
    .filter((row) => row.label);
}

export function fetchEngineerTasks(token: string) {
  return apiRequest<MobileApplication[]>('/applications?as=engineer', { token });
}

export function fetchZcApplications(token: string) {
  return apiRequest<MobileApplication[]>('/applications?as=zc', { token });
}

export function fetchCaoApplications(token: string) {
  return apiRequest<MobileApplication[]>('/applications?as=cao', { token });
}

export function fetchApplicationsAs(token: string, as: ApplicationAs) {
  return apiRequest<MobileApplication[]>(`/applications?as=${as}`, { token });
}

export function fetchMyZoneMeta(token: string) {
  return apiRequest<MyZoneMeta>('/applications/meta/my-zone', { token });
}

export function fetchCaoCounts(token: string) {
  return apiRequest<CaoCounts>('/applications/meta/cao-counts', { token });
}

export function createApplication(token: string, body: CreateApplicationInput) {
  return apiRequest<MobileApplication>('/applications', {
    method: 'POST',
    token,
    body,
  });
}

export function caoDecideApplication(
  token: string,
  id: string,
  kind: 'verify' | 'return' | 'reject',
  remarks?: string,
) {
  return apiRequest<MobileApplication>(`/applications/${id}/${kind}`, {
    method: 'POST',
    token,
    body: remarks ? { remarks } : {},
  });
}

export function fetchApplication(token: string, id: string) {
  return apiRequest<MobileApplication>(`/applications/${id}`, { token });
}

export function countZcBuckets(apps: MobileApplication[]) {
  return {
    assigned: apps.filter((a) => a.status === 'assigned').length,
    in_progress: apps.filter((a) => a.status === 'in_progress').length,
    submitted: apps.filter((a) => a.status === 'submitted').length,
    verified: apps.filter((a) => a.status === 'verified').length,
    returned: apps.filter((a) => a.status === 'returned').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
    total: apps.length,
  };
}

export function startApplicationTask(token: string, id: string) {
  return apiRequest<MobileApplication>(`/applications/${id}/start`, {
    method: 'PATCH',
    token,
  });
}

/** Partial engineer capture — each step / schedule edit. */
export type EngineerDraftInput = {
  engineerSiteDetails?: string;
  compass?: string;
  latitude?: string;
  longitude?: string;
  occupancy?: 'Empty' | 'Occupied';
  occupancyReason?: string;
  dimNorth?: string;
  dimSouth?: string;
  dimEast?: string;
  dimWest?: string;
  /** Preferred engineer dims (separate from ZC siteDimension). */
  engineerDimensions?: Partial<Record<'N' | 'S' | 'E' | 'W', string>>;
  totalSiteArea?: string;
  selfieUrl?: string;
  photoUrls?: string[];
  schedulePhotoUrls?: Partial<Record<'N' | 'S' | 'E' | 'W', string>>;
  engineerScheduleNotes?: Partial<Record<'N' | 'S' | 'E' | 'W', string>>;
  scheduleRoadFlags?: Partial<Record<'N' | 'S' | 'E' | 'W', boolean>>;
  videoUrl?: string;
  engineerComments?: string;
};

export function saveEngineerDraft(
  token: string,
  id: string,
  body: EngineerDraftInput,
) {
  return apiRequest<MobileApplication>(`/applications/${id}/draft`, {
    method: 'PATCH',
    token,
    body,
  });
}

export function submitEngineerApplication(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return apiRequest<MobileApplication>(`/applications/${id}/submit`, {
    method: 'POST',
    token,
    body,
  });
}

export function applicationStatusLabel(status: MobileApplicationStatus) {
  if (status === 'assigned') return 'Assigned';
  if (status === 'in_progress') return 'In progress';
  if (status === 'submitted') return 'Pending CAO';
  if (status === 'verified') return 'Verified';
  if (status === 'returned') return 'Send back';
  if (status === 'rejected') return 'Rejected';
  return status;
}

export type ApplicationStatusTone = {
  bg: string;
  fg: string;
  bar: string;
  border: string;
};

/** Match web ApplicationStatusBadge palette. */
export function applicationStatusTone(
  status: MobileApplicationStatus | string | null | undefined,
): ApplicationStatusTone {
  const raw = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (raw === 'assigned') {
    return { bg: '#E0F2FE', fg: '#075985', bar: '#0EA5E9', border: '#BAE6FD' };
  }
  if (raw === 'in_progress' || raw === 'inprogress') {
    return { bg: '#FFFBEB', fg: '#92400E', bar: '#F59E0B', border: '#FDE68A' };
  }
  if (raw === 'submitted' || raw === 'pending_cao' || raw === 'pending') {
    return { bg: '#F5F3FF', fg: '#5B21B6', bar: '#8B5CF6', border: '#DDD6FE' };
  }
  if (raw === 'verified') {
    return { bg: '#D1FAE5', fg: '#047857', bar: '#059669', border: '#A7F3D0' };
  }
  if (raw === 'returned' || raw === 'send_back' || raw === 'sendback') {
    return { bg: '#FFEDD5', fg: '#C2410C', bar: '#F97316', border: '#FED7AA' };
  }
  if (raw === 'rejected') {
    return { bg: '#FFE4E6', fg: '#BE123C', bar: '#F43F5E', border: '#FECDD3' };
  }
  return { bg: '#F8FAFC', fg: '#334155', bar: '#64748B', border: '#E2E8F0' };
}

export function normalizeApplicationStatus(
  status: string | null | undefined,
): MobileApplicationStatus | null {
  const raw = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (raw === 'assigned') return 'assigned';
  if (raw === 'in_progress' || raw === 'inprogress') return 'in_progress';
  if (raw === 'submitted' || raw === 'pending' || raw === 'pending_cao') return 'submitted';
  if (raw === 'verified') return 'verified';
  if (raw === 'returned' || raw === 'send_back' || raw === 'sendback') return 'returned';
  if (raw === 'rejected') return 'rejected';
  return null;
}

export function applicationStatusDisplayLabel(status: string | null | undefined) {
  const key = normalizeApplicationStatus(status);
  if (key) return applicationStatusLabel(key);
  return String(status || '—');
}
