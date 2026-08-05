import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { openPdfWithChooser } from '@/src/cdrms/lib/pdfFileShare';
import { pdfDownloadProgressText } from '@/src/cdrms/components/PdfDownloadThinProgress';

const ANDROID_CHANNEL_ID = 'pdf-downloads-v2';

type NotificationsModule = typeof import('expo-notifications');

let initialized = false;
const lastOpenUriByFile = new Map<string, string>();

function notificationsSupported(): boolean {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** One notification per file — progress updates replace the same shade entry. */
function notificationId(fileName: string) {
  return `cdrms-pdf-${fileName.replace(/[^\w.-]+/g, '_')}`;
}

function loadNotifications(): NotificationsModule | null {
  if (!notificationsSupported()) return null;
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

export async function initPdfDownloadNotifications(): Promise<void> {
  const Notifications = loadNotifications();
  if (!Notifications || initialized) return;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const phase = notification.request.content.data?.phase;
      return {
        shouldShowAlert: true,
        shouldPlaySound: phase === 'complete',
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Downloads',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'PDF download progress and completion',
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 250, 120, 250],
    });
  }

  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as {
      type?: string;
      openUri?: string;
      fileName?: string;
    };
    if (data?.type !== 'pdf-download') return;
    const uri =
      data.openUri ||
      (data.fileName ? lastOpenUriByFile.get(data.fileName) : undefined);
    if (uri) void openPdfWithChooser(uri);
  });

  initialized = true;
}

export async function canUsePdfDownloadNotifications(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;

  await initPdfDownloadNotifications();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });

  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function publish(
  fileName: string,
  content: import('expo-notifications').NotificationContentInput,
) {
  const Notifications = loadNotifications();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    identifier: notificationId(fileName),
    content,
    trigger: null,
  });
}

export async function showPdfDownloadProgressNotification(
  fileName: string,
  percent = 0,
  label = 'Downloading…',
) {
  const Notifications = loadNotifications();
  const line = pdfDownloadProgressText(percent);

  await publish(fileName, {
    title: fileName,
    body: `${label}  ${line}`,
    data: { type: 'pdf-download', phase: 'progress', percent, fileName },
    sound: false,
    ...(Platform.OS === 'android'
      ? {
          android: {
            channelId: ANDROID_CHANNEL_ID,
            ongoing: true,
            autoCancel: false,
            priority: Notifications?.AndroidNotificationPriority.LOW,
          },
        }
      : {}),
  });
}

export async function showPdfDownloadCompleteNotification(
  fileName: string,
  fileSizeBytes: number | undefined,
  openUri: string,
) {
  lastOpenUriByFile.set(fileName, openUri);
  const sizeLabel = formatBytes(fileSizeBytes ?? 0);
  const body = sizeLabel ? `Download complete • ${sizeLabel}` : 'Download complete';
  const Notifications = loadNotifications();

  await publish(fileName, {
    title: fileName,
    body,
    sound: 'default',
    data: { type: 'pdf-download', phase: 'complete', openUri, fileName },
    ...(Platform.OS === 'android'
      ? {
          android: {
            channelId: ANDROID_CHANNEL_ID,
            ongoing: false,
            autoCancel: true,
            priority: Notifications?.AndroidNotificationPriority.HIGH,
          },
        }
      : {}),
  });
}

export async function showPdfDownloadErrorNotification(fileName: string, message: string) {
  await publish(fileName, {
    title: 'Download failed',
    body: message,
    sound: false,
    data: { type: 'pdf-download', phase: 'error', fileName },
    ...(Platform.OS === 'android'
      ? {
          android: {
            channelId: ANDROID_CHANNEL_ID,
            ongoing: false,
            autoCancel: true,
          },
        }
      : {}),
  });
}
