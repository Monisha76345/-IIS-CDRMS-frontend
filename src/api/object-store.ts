import * as FileSystem from 'expo-file-system/legacy';

import { API_BASE_URL } from './config';
import { ApiError } from './client';

type UploadResult = {
  id: number;
  image_url: string;
  key: string;
  fileName: string;
  message: string;
};

function entityIdFromUuid(uuid: string): number {
  let h = 0;
  for (const ch of uuid.replace(/-/g, '')) {
    h = (Math.imul(h, 31) + parseInt(ch, 16)) >>> 0;
  }
  return h % 2147483646 || 1;
}

function guessMime(uri: string, kind: 'image' | 'video'): string {
  const lower = uri.toLowerCase();
  if (kind === 'video') {
    if (lower.includes('.mov')) return 'video/quicktime';
    if (lower.includes('.webm')) return 'video/webm';
    return 'video/mp4';
  }
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function fileNameFromUri(uri: string, kind: 'image' | 'video', refKey: string) {
  const ext =
    kind === 'video'
      ? uri.toLowerCase().includes('.mov')
        ? 'mov'
        : 'mp4'
      : uri.toLowerCase().includes('.png')
        ? 'png'
        : 'jpg';
  return `${refKey}.${ext}`;
}

function networkHint(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (/network request failed|failed to fetch|network error/i.test(msg)) {
    return (
      `Network request failed. Phone cannot reach ${API_BASE_URL}. ` +
      `Keep phone + Mac on the same Wi‑Fi, ensure backend is running on port 3710, ` +
      `and set EXPO_PUBLIC_API_URL to your Mac LAN IP (then restart Metro).`
    );
  }
  return msg || 'Upload failed';
}

/**
 * Ensure a file:// path RN upload APIs can read (content:// often breaks FormData).
 */
async function ensureUploadableUri(uri: string, kind: 'image' | 'video'): Promise<string> {
  const trimmed = uri.trim();
  if (trimmed.startsWith('file://')) return trimmed;

  const cache = FileSystem.cacheDirectory;
  if (!cache) return trimmed;

  const ext = kind === 'video' ? 'mp4' : 'jpg';
  const dest = `${cache}cdrms-upload-${Date.now()}.${ext}`;
  try {
    await FileSystem.copyAsync({ from: trimmed, to: dest });
    return dest;
  } catch {
    return trimmed;
  }
}

/**
 * Upload a local file URI to MinIO via the same Nest object-store API as web.
 * Uses expo-file-system multipart upload — more reliable than fetch+FormData on device.
 */
export async function uploadMobileMedia(params: {
  token: string;
  applicationId: string;
  refKey: string;
  uri: string;
  kind: 'image' | 'video';
}): Promise<string> {
  const { token, applicationId, refKey, uri, kind } = params;
  const fileUri = await ensureUploadableUri(uri, kind);
  const mime = guessMime(fileUri, kind);
  const fileName = fileNameFromUri(fileUri, kind, refKey);

  const qs = new URLSearchParams({
    entityType: 'DOCUMENT',
    entityId: String(entityIdFromUuid(applicationId)),
    refType: kind === 'video' ? 'OTHER' : 'LAYOUT_IMAGE',
    refId: `${applicationId}:${refKey}`,
  });

  const uploadUrl = `${API_BASE_URL}/object-store/upload?${qs.toString()}`;

  let status = 0;
  let bodyText = '';

  try {
    const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: mime,
      parameters: {
        // Some Android stacks need the filename in parameters too
        filename: fileName,
      },
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
    });
    status = result.status;
    bodyText = result.body ?? '';
  } catch (err) {
    throw new ApiError(0, networkHint(err));
  }

  let data: unknown = null;
  if (bodyText) {
    try {
      data = JSON.parse(bodyText);
    } catch {
      data = bodyText;
    }
  }

  if (status < 200 || status >= 300) {
    const msg =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Upload failed (${status || 'network'})`;

    if (status >= 500 || status === 0) {
      try {
        const existing = await fetch(
          `${API_BASE_URL}/object-store/by-ref?refId=${encodeURIComponent(`${applicationId}:${refKey}`)}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (existing.ok) {
          const body = (await existing.json()) as { image_url?: string };
          if (body.image_url) return body.image_url;
        }
      } catch {
        /* fall through */
      }
    }
    throw new ApiError(status || 0, msg);
  }

  const url = String((data as UploadResult)?.image_url || '');
  if (!url) throw new ApiError(500, 'Upload returned no URL');
  return url;
}

/** Same as web `deleteObjectStoreFile` — clear by URL and/or refId. */
export async function deleteMobileMedia(params: {
  token: string;
  url?: string;
  refId?: string;
}): Promise<void> {
  const { token, url, refId } = params;
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (url && !url.startsWith('data:') && /^https?:\/\//i.test(url)) {
    const qs = new URLSearchParams({ url });
    try {
      const res = await fetch(`${API_BASE_URL}/object-store/by-url?${qs.toString()}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) return;
    } catch (err) {
      throw new ApiError(0, networkHint(err));
    }
  }

  if (refId) {
    const qs = new URLSearchParams({ refId });
    try {
      const res = await fetch(`${API_BASE_URL}/object-store/by-ref?${qs.toString()}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok && res.status !== 404) {
        const text = await res.text().catch(() => '');
        throw new ApiError(res.status, text || `Delete failed (${res.status})`);
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(0, networkHint(err));
    }
  }
}
