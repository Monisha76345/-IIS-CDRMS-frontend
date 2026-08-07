import { ApiError } from "@/src/api/client";
import { isPageNotFoundError, type ErrorKind } from "./types";

type LooseError = {
  message?: string;
  status?: number;
  code?: string | number;
  name?: string;
  errorKind?: ErrorKind;
};

const ERROR_KINDS: Record<ErrorKind, true> = {
  bad_request: true,
  unauthorized: true,
  page_not_found: true,
  api_not_found: true,
  timeout: true,
  internal: true,
  bad_gateway: true,
  service_unavailable: true,
  gateway_timeout: true,
  network: true,
  unexpected: true,
};

export function mapHttpStatusToErrorKind(status: number): ErrorKind {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
    case 403:
      return "unauthorized";
    case 404:
      return "api_not_found";
    case 408:
      return "timeout";
    case 500:
      return "internal";
    case 502:
      return "bad_gateway";
    case 503:
      return "service_unavailable";
    case 504:
      return "gateway_timeout";
    default:
      if (status >= 500) return "internal";
      if (status >= 400) return "bad_request";
      return "unexpected";
  }
}

function getHttpStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;
  if (!error || typeof error !== "object") return undefined;
  const e = error as LooseError;
  if (typeof e.status === "number") return e.status;
  return undefined;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 0) return true;
  if (!error || typeof error !== "object") return false;
  const e = error as LooseError;
  if (e.status === 0) return true;
  if (typeof e.message === "string" && e.message.toLowerCase().includes("network")) {
    return true;
  }
  return false;
}

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as LooseError;
  if (e.message?.toLowerCase().includes("timeout")) return true;
  return getHttpStatus(error) === 408;
}

export function resolveErrorKind(error: unknown): ErrorKind {
  if (!error) return "unexpected";
  if (isPageNotFoundError(error)) return "page_not_found";

  if (typeof error === "object") {
    const e = error as LooseError;
    if (e.errorKind && ERROR_KINDS[e.errorKind]) return e.errorKind;
  }

  if (isTimeoutError(error)) return "timeout";
  if (isNetworkError(error)) return "network";

  const status = getHttpStatus(error);
  // status 0 already handled as network
  if (typeof status === "number" && status >= 400) {
    return mapHttpStatusToErrorKind(status);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Error).message === "string"
  ) {
    const msg = (error as Error).message.toLowerCase();
    if (msg.includes("404") && msg.includes("page not found")) {
      return "page_not_found";
    }
    if (msg.includes("404") || msg.includes("not found")) {
      return "api_not_found";
    }
  }

  return "unexpected";
}

export function resolveErrorStatus(error: unknown): number | null {
  if (isPageNotFoundError(error)) return 404;
  const status = getHttpStatus(error);
  if (typeof status === "number" && status > 0) return status;

  switch (resolveErrorKind(error)) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "page_not_found":
    case "api_not_found":
      return 404;
    case "timeout":
      return 408;
    case "internal":
    case "unexpected":
      return 500;
    case "bad_gateway":
      return 502;
    case "service_unavailable":
      return 503;
    case "gateway_timeout":
      return 504;
    case "network":
    default:
      return null;
  }
}

/**
 * Full-screen ErrorScreen kinds (not inline form validation).
 * 400 stays local; 401 is handled by session-expired flow.
 */
export function isFullPageApiError(error: unknown): boolean {
  if (isPageNotFoundError(error)) return true;
  if (isNetworkError(error)) return true;
  if (isTimeoutError(error)) return true;
  const status = getHttpStatus(error);
  if (typeof status !== "number") return false;
  if (status === 404 || status === 408) return true;
  if (status === 403) return true;
  if (status >= 500) return true;
  return false;
}
