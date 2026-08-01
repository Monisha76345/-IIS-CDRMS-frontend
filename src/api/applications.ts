import { apiRequest } from './client';

function asData<T>(payload: unknown): T {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function asList<T>(payload: unknown): T[] {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: T[] }).items;
  }
  const value = asData<unknown>(payload);
  return Array.isArray(value) ? (value as T[]) : [];
}

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
  assignedEngineerProfilePhoto?: string | null;
  assignedCaoName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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

function parseJsonField<T>(value: unknown): T | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function normalizeStringArray(value: unknown): string[] | null {
  const parsed = parseJsonField<unknown>(value) ?? value;
  if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()];
  if (!Array.isArray(parsed)) return null;
  const urls = parsed.map((v) => String(v).trim()).filter(Boolean);
  return urls.length ? urls : null;
}

function normalizeStringRecord(value: unknown): Record<string, string> | null {
  const parsed = parseJsonField<unknown>(value) ?? value;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
    if (val != null && String(val).trim()) out[key] = String(val);
  }
  return Object.keys(out).length ? out : null;
}

function normalizeHistory(value: unknown): ApplicationHistoryItem[] | null {
  const parsed = parseJsonField<unknown>(value) ?? value;
  if (!Array.isArray(parsed)) return null;
  return parsed.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id != null ? String(r.id) : undefined,
      taskName: String(r.taskName ?? ''),
      performedBy: String(r.performedBy ?? ''),
      sentTo: r.sentTo != null ? String(r.sentTo) : null,
      startedOn: r.startedOn != null ? String(r.startedOn) : null,
      completedOn: r.completedOn != null ? String(r.completedOn) : null,
      comments: r.comments != null ? String(r.comments) : null,
      statusBefore: r.statusBefore != null ? String(r.statusBefore) : null,
      statusAfter: r.statusAfter != null ? String(r.statusAfter) : null,
    };
  });
}

function normalizeApplication(raw: Record<string, unknown>): MobileApplication {
  const status =
    normalizeApplicationStatus(String(raw.status ?? '')) ?? ('assigned' as MobileApplicationStatus);

  return {
    id: String(raw.id ?? ''),
    applicationNumber: String(raw.applicationNumber ?? ''),
    siteNo: String(raw.siteNo ?? ''),
    addressArea: String(raw.addressArea ?? ''),
    addressBlock: String(raw.addressBlock ?? ''),
    addressPincode: String(raw.addressPincode ?? ''),
    siteDimensionType:
      raw.siteDimensionType === 'Odd' || raw.siteDimensionType === 'Regular'
        ? (raw.siteDimensionType === 'Odd' ? 'Odd' : 'Even')
        : 'Even',
    siteDimension: raw.siteDimension != null ? String(raw.siteDimension) : null,
    siteDimensionComment:
      raw.siteDimensionComment != null ? String(raw.siteDimensionComment) : null,
    scheduleNorth: raw.scheduleNorth != null ? String(raw.scheduleNorth) : null,
    scheduleSouth: raw.scheduleSouth != null ? String(raw.scheduleSouth) : null,
    scheduleWest: raw.scheduleWest != null ? String(raw.scheduleWest) : null,
    scheduleEast: raw.scheduleEast != null ? String(raw.scheduleEast) : null,
    engineerScheduleNotes:
      normalizeStringRecord(raw.engineerScheduleNotes) as MobileApplication['engineerScheduleNotes'],
    scheduleRoadFlags: parseJsonField<MobileApplication['scheduleRoadFlags']>(
      raw.scheduleRoadFlags,
    ),
    engineerDimensions:
      normalizeStringRecord(raw.engineerDimensions) as MobileApplication['engineerDimensions'],
    zoneId: raw.zoneId != null ? Number(raw.zoneId) : undefined,
    zoneCode: String(raw.zoneCode ?? ''),
    status,
    createdByZcName: raw.createdByZcName != null ? String(raw.createdByZcName) : null,
    assignedEngineerName:
      raw.assignedEngineerName != null ? String(raw.assignedEngineerName) : null,
    assignedEngineerUserId:
      raw.assignedEngineerUserId != null ? String(raw.assignedEngineerUserId) : undefined,
    assignedEngineerLoginId:
      raw.assignedEngineerLoginId != null ? String(raw.assignedEngineerLoginId) : null,
    assignedEngineerProfilePhoto:
      raw.assignedEngineerProfilePhoto != null
        ? String(raw.assignedEngineerProfilePhoto)
        : null,
    assignedCaoName: raw.assignedCaoName != null ? String(raw.assignedCaoName) : null,
    engineerSiteDetails:
      raw.engineerSiteDetails != null ? String(raw.engineerSiteDetails) : null,
    compass: raw.compass != null ? String(raw.compass) : null,
    latitude: raw.latitude != null ? String(raw.latitude) : null,
    longitude: raw.longitude != null ? String(raw.longitude) : null,
    occupancy:
      raw.occupancy === 'Empty' || raw.occupancy === 'Occupied' ? raw.occupancy : null,
    occupancyReason: raw.occupancyReason != null ? String(raw.occupancyReason) : null,
    dimNorth: raw.dimNorth != null ? String(raw.dimNorth) : null,
    dimSouth: raw.dimSouth != null ? String(raw.dimSouth) : null,
    dimEast: raw.dimEast != null ? String(raw.dimEast) : null,
    dimWest: raw.dimWest != null ? String(raw.dimWest) : null,
    totalSiteArea: raw.totalSiteArea != null ? String(raw.totalSiteArea) : null,
    selfieUrl: raw.selfieUrl != null ? String(raw.selfieUrl) : null,
    photoUrls: normalizeStringArray(raw.photoUrls),
    schedulePhotoUrls:
      normalizeStringRecord(raw.schedulePhotoUrls) as MobileApplication['schedulePhotoUrls'],
    videoUrl: raw.videoUrl != null ? String(raw.videoUrl) : null,
    engineerComments: raw.engineerComments != null ? String(raw.engineerComments) : null,
    engineerSubmittedAt:
      raw.engineerSubmittedAt != null ? String(raw.engineerSubmittedAt) : null,
    caoRemarks: raw.caoRemarks != null ? String(raw.caoRemarks) : null,
    caoReviewedAt: raw.caoReviewedAt != null ? String(raw.caoReviewedAt) : null,
    history: normalizeHistory(raw.history),
    createdAt: raw.createdAt != null ? String(raw.createdAt) : null,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : null,
  };
}

async function fetchApplicationList(token: string, as: ApplicationAs) {
  const raw = await apiRequest<unknown>(`/applications?as=${as}`, { token });
  return asList<Record<string, unknown>>(raw).map(normalizeApplication);
}

export function fetchEngineerTasks(token: string) {
  return fetchApplicationList(token, 'engineer');
}

export function fetchZcApplications(token: string) {
  return fetchApplicationList(token, 'zc');
}

export function fetchCaoApplications(token: string) {
  return fetchApplicationList(token, 'cao');
}

export function fetchApplicationsAs(token: string, as: ApplicationAs) {
  return fetchApplicationList(token, as);
}

export function fetchMyZoneMeta(token: string) {
  return apiRequest<unknown>('/applications/meta/my-zone', { token }).then((raw) =>
    asData<MyZoneMeta>(raw),
  );
}

export function fetchCaoCounts(token: string) {
  return apiRequest<unknown>('/applications/meta/cao-counts', { token }).then((raw) =>
    asData<CaoCounts>(raw),
  );
}

export function createApplication(token: string, body: CreateApplicationInput) {
  return apiRequest<unknown>('/applications', {
    method: 'POST',
    token,
    body,
  }).then((raw) => normalizeApplication(asData<Record<string, unknown>>(raw)));
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
  return apiRequest<unknown>(`/applications/${id}`, { token }).then((raw) =>
    normalizeApplication(asData<Record<string, unknown>>(raw)),
  );
}

export function formatApplicationDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB');
}

export function countZcBuckets(apps: MobileApplication[]) {
  return {
    assigned: apps.filter((a) => normalizeApplicationStatus(a.status) === 'assigned').length,
    in_progress: apps.filter((a) => normalizeApplicationStatus(a.status) === 'in_progress')
      .length,
    submitted: apps.filter((a) => normalizeApplicationStatus(a.status) === 'submitted').length,
    verified: apps.filter((a) => normalizeApplicationStatus(a.status) === 'verified').length,
    returned: apps.filter((a) => normalizeApplicationStatus(a.status) === 'returned').length,
    rejected: apps.filter((a) => normalizeApplicationStatus(a.status) === 'rejected').length,
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
  if (status === 'submitted') return 'Submitted';
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
