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

/**
 * Upload a local file URI to MinIO via the same Nest object-store API as web.
 */
export async function uploadMobileMedia(params: {
  token: string;
  applicationId: string;
  refKey: string;
  uri: string;
  kind: 'image' | 'video';
}): Promise<string> {
  const { token, applicationId, refKey, uri, kind } = params;
  const form = new FormData();
  form.append('file', {
    uri,
    name: fileNameFromUri(uri, kind, refKey),
    type: guessMime(uri, kind),
  } as unknown as Blob);

  const qs = new URLSearchParams({
    entityType: 'DOCUMENT',
    entityId: String(entityIdFromUuid(applicationId)),
    refType: kind === 'video' ? 'OTHER' : 'LAYOUT_IMAGE',
    refId: `${applicationId}:${refKey}`,
  });

  const res = await fetch(`${API_BASE_URL}/object-store/upload?${qs.toString()}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Upload failed (${res.status})`;
    // If storage is down but we already uploaded this ref earlier, reuse that URL.
    if (res.status >= 500) {
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
    throw new ApiError(res.status, msg);
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
    const res = await fetch(`${API_BASE_URL}/object-store/by-url?${qs.toString()}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) return;
  }

  if (refId) {
    const qs = new URLSearchParams({ refId });
    const res = await fetch(`${API_BASE_URL}/object-store/by-ref?${qs.toString()}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => '');
      throw new ApiError(res.status, text || `Delete failed (${res.status})`);
    }
  }
}
