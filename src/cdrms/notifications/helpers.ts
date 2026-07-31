import {
  Bell,
  CheckCircle2,
  ClipboardList,
  RotateCcw,
  Send,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import type { AppNotification } from '@/src/api/notifications';
import type { Go } from '@/src/cdrms/types';
import type { AppRole } from '@/src/auth/roles';
import { setSelectedOfficeAppId } from '@/src/cdrms/officeSelection';

function applicationIdFromNotification(notif: AppNotification): string | null {
  const linkPath = notif.linkPath?.trim();
  if (linkPath) {
    const match = linkPath.match(
      /\/(?:cao\/tasks|engineer\/tasks|admin\/applications)\/([^/]+)/,
    );
    if (match) return match[1];
  }
  return notif.applicationId ?? null;
}

export function formatNotifTime(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function notifIconConfig(type: string): {
  Icon: LucideIcon;
  bg: string;
  color: string;
} {
  if (type === 'task_verified') {
    return { Icon: CheckCircle2, bg: '#D1FAE5', color: '#047857' };
  }
  if (type === 'task_returned') {
    return { Icon: RotateCcw, bg: '#FFEDD5', color: '#C2410C' };
  }
  if (type === 'task_rejected') {
    return { Icon: XCircle, bg: '#FFE4E6', color: '#BE123C' };
  }
  if (type === 'task_submitted') {
    return { Icon: Send, bg: '#EDE9FE', color: '#6D28D9' };
  }
  if (type === 'task_assigned') {
    return { Icon: ClipboardList, bg: '#E0F2FE', color: '#0369A1' };
  }
  return { Icon: Bell, bg: '#DBEAFE', color: '#2563EB' };
}

export type NotificationNavAction =
  | { kind: 'task'; applicationId: string }
  | { kind: 'cao_detail'; applicationId: string }
  | { kind: 'zc_detail'; applicationId: string }
  | { kind: 'notifications' };

export function resolveNotificationAction(
  notif: AppNotification,
  role?: AppRole,
): NotificationNavAction {
  const applicationId = applicationIdFromNotification(notif);
  if (!applicationId) {
    return { kind: 'notifications' };
  }

  if (role === 'cao' || role === 'super_admin') {
    return { kind: 'cao_detail', applicationId };
  }
  if (role === 'zc') {
    return { kind: 'zc_detail', applicationId };
  }

  return { kind: 'task', applicationId };
}

export async function navigateFromNotification(
  action: NotificationNavAction,
  go: Go,
  openBackendTask?: (id: string) => Promise<void>,
) {
  if (action.kind === 'task' && openBackendTask) {
    await openBackendTask(action.applicationId);
    go('project');
    return;
  }
  if (action.kind === 'cao_detail') {
    setSelectedOfficeAppId(action.applicationId);
    go('cao_detail');
    return;
  }
  if (action.kind === 'zc_detail') {
    setSelectedOfficeAppId(action.applicationId);
    go('zc_detail');
    return;
  }
  go('notifications');
}
