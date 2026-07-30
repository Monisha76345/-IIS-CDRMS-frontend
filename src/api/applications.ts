import { apiRequest } from './client';

export type MobileApplicationStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'verified'
  | 'returned'
  | 'rejected';

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
  zoneId?: number;
  zoneCode: string;
  status: MobileApplicationStatus;
  createdByZcName?: string | null;
  assignedEngineerName?: string | null;
  assignedEngineerUserId?: string;
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
  caoRemarks?: string | null;
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
  siteDimensionType: 'Regular' | 'Odd';
  siteDimensionComment?: string;
  scheduleNorth?: string;
  scheduleSouth?: string;
  scheduleWest?: string;
  scheduleEast?: string;
  assignedEngineerUserId: string;
};

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
  if (status === 'returned') return 'Returned';
  if (status === 'rejected') return 'Rejected';
  return status;
}
