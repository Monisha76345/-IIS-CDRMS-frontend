export type ErrorKind =
  | "bad_request"
  | "unauthorized"
  | "page_not_found"
  | "api_not_found"
  | "timeout"
  | "internal"
  | "bad_gateway"
  | "service_unavailable"
  | "gateway_timeout"
  | "network"
  | "unexpected";

export type ErrorActionId =
  | "goBack"
  | "goHome"
  | "goDashboard"
  | "retry"
  | "loginNow"
  | "contactSupport"
  | "contactAdmin"
  | "goStatus"
  | "retryLater";

export interface ErrorKindConfig {
  kind: ErrorKind;
  code: number | null;
  accent: string;
  tipsBg: string;
  /** Metro require() asset number */
  illustration: number;
  tipCount: number;
  primaryAction: ErrorActionId;
  secondaryAction: ErrorActionId;
}

export const PAGE_NOT_FOUND_KIND = "page_not_found" as const;

export class PageNotFoundError extends Error {
  readonly errorKind = PAGE_NOT_FOUND_KIND;
  readonly status = 404;

  constructor(message = "404: Page Not Found") {
    super(message);
    this.name = "PageNotFoundError";
  }
}

export function isPageNotFoundError(error: unknown): error is PageNotFoundError {
  if (!error || typeof error !== "object") return false;
  const e = error as { errorKind?: string; name?: string };
  return e.errorKind === PAGE_NOT_FOUND_KIND || e.name === "PageNotFoundError";
}
