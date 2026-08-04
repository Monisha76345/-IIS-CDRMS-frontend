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
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
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

  if (!res.ok) {
    const msg =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }

  return data as T;
}
