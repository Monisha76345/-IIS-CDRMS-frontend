import { apiRequest } from './client';

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  applicationId?: string | null;
  applicationNumber?: string | null;
  linkPath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

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

function normalizeNotification(raw: Record<string, unknown>): AppNotification {
  return {
    id: String(raw.id ?? ''),
    userId: String(raw.userId ?? ''),
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    type: String(raw.type ?? 'general'),
    isRead: raw.isRead === true || raw.isRead === 1 || raw.isRead === '1',
    applicationId: raw.applicationId != null ? String(raw.applicationId) : null,
    applicationNumber:
      raw.applicationNumber != null ? String(raw.applicationNumber) : null,
    linkPath: raw.linkPath != null ? String(raw.linkPath) : null,
    createdAt: raw.createdAt != null ? String(raw.createdAt) : null,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : null,
  };
}

export async function fetchNotifications(token: string): Promise<AppNotification[]> {
  const raw = await apiRequest<unknown>('/notifications', { token });
  return asList<Record<string, unknown>>(raw).map(normalizeNotification);
}

export async function fetchUnreadNotificationCount(token: string): Promise<number> {
  const raw = await apiRequest<unknown>('/notifications/unread-count', { token });
  const data = asData<{ count?: unknown }>(raw);
  return Math.max(0, Number(data?.count ?? 0));
}

export async function markNotificationRead(
  token: string,
  id: string,
): Promise<AppNotification> {
  const raw = await apiRequest<unknown>(`/notifications/${id}/read`, {
    method: 'PATCH',
    token,
  });
  return normalizeNotification(asData<Record<string, unknown>>(raw));
}

export async function markAllNotificationsRead(
  token: string,
): Promise<{ updated: number }> {
  const raw = await apiRequest<unknown>('/notifications/read-all', {
    method: 'PATCH',
    token,
  });
  const data = asData<{ updated?: unknown }>(raw);
  return { updated: Math.max(0, Number(data?.updated ?? 0)) };
}
