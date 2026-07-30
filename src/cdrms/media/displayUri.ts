import { API_BASE_URL } from '@/src/api/config';

/** True for http(s) media already stored via the API / object-store. */
export function isRemoteMediaUri(uri: string | null | undefined): boolean {
  return Boolean(uri && /^https?:\/\//i.test(uri.trim()));
}

/**
 * Build authenticated object-store preview URI for RN <Image> / Video.
 * Local file:// and content:// URIs pass through unchanged.
 */
export function mediaSource(
  uri: string | null | undefined,
  token: string | null | undefined
): { uri: string; headers?: Record<string, string> } | null {
  if (!uri?.trim()) return null;
  const trimmed = uri.trim();

  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('ph://') ||
    trimmed.startsWith('assets-library://')
  ) {
    return { uri: trimmed };
  }

  if (!isRemoteMediaUri(trimmed)) {
    return { uri: trimmed };
  }

  // Authenticated proxy — same as web `/object-store/view-by-url`
  const proxy = `${API_BASE_URL}/object-store/view-by-url?url=${encodeURIComponent(trimmed)}`;
  if (token) {
    return {
      uri: proxy,
      headers: { Authorization: `Bearer ${token}` },
    };
  }
  return { uri: proxy };
}
