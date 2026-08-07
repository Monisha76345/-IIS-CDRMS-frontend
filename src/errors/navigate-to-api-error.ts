import type { Go, Screen } from "@/src/cdrms/types";
import { resolveErrorKind, resolveErrorStatus } from "./resolve-error-kind";

/**
 * Leave the current screen and show the shared ErrorScreen (404 API, network, etc.).
 * Retry returns to `returnScreen` so that screen can reload.
 */
export function navigateToApiError(
  go: Go,
  error: unknown,
  opts: {
    returnScreen: Screen;
    variant?: "global" | "shell";
  },
) {
  go("error", {
    replace: true,
    errorKind: resolveErrorKind(error),
    errorStatus: resolveErrorStatus(error),
    errorVariant: opts.variant ?? "shell",
    onRetry: () => go(opts.returnScreen, { replace: true }),
  });
}
