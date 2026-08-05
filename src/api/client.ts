import { API_BASE_URL, apiConnectionHint } from './config';
import {
  NO_HTML_MESSAGE,
  findForbiddenHtmlPath,
} from '../lib/xssValidation';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  /** Skip 401→refresh retry (used by refresh itself). */
  skipAuthRefresh?: boolean;
};

type TokenHandlers = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (access: string, refresh?: string | null) => Promise<void> | void;
  onSessionExpired: () => Promise<void> | void;
};

let tokenHandlers: TokenHandlers | null = null;
/** Shared promise so concurrent 401s wait for one refresh. */
let refreshPromise: Promise<string | null> | null = null;

export function configureApiAuth(handlers: TokenHandlers) {
  tokenHandlers = handlers;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!tokenHandlers) return null;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = tokenHandlers?.getRefreshToken();
      if (!refreshToken) return null;
      try {
        const res = await apiRequest<{
          accessToken?: string;
          refreshToken?: string;
        }>('/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
          skipAuthRefresh: true,
        });
        const access = res.accessToken?.trim();
        if (!access) return null;
        await tokenHandlers?.setTokens(access, res.refreshToken ?? refreshToken);
        return access;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = options.token ?? tokenHandlers?.getAccessToken() ?? null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body != null) {
    const badPath = findForbiddenHtmlPath(options.body);
    if (badPath) {
      throw new ApiError(400, `${NO_HTML_MESSAGE} (field: ${badPath})`);
    }
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: options.method || 'GET',
      headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(
      0,
      /network request failed|failed to fetch/i.test(detail)
        ? `Network request failed — cannot reach ${API_BASE_URL}. ${apiConnectionHint()}`
        : detail,
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (
    res.status === 401 &&
    !options.skipAuthRefresh &&
    !path.includes('/auth/login') &&
    !path.includes('/auth/refresh') &&
    !path.includes('/auth/logout')
  ) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, {
        ...options,
        token: newToken,
        skipAuthRefresh: true,
      });
    }
    await tokenHandlers?.onSessionExpired();
  }

  if (!res.ok) {
    const msg =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : Array.isArray((data as { message?: unknown })?.message)
          ? String(((data as { message: unknown[] }).message || [])[0] || `Request failed (${res.status})`)
          : `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }

  return data as T;
}
