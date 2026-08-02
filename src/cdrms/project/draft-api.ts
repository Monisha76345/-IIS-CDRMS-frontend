import { ApiError } from '@/src/api/client';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';

export function draftErrorMessage(err: unknown, fallback = 'Could not save progress') {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) {
    if (/network request failed/i.test(err.message)) {
      return (
        `${err.message}\n\nCheck: phone and Mac on same Wi‑Fi, backend running, ` +
        `EXPO_PUBLIC_API_URL set to your Mac IP (currently in .env).`
      );
    }
    return err.message;
  }
  return fallback;
}

export function alertDraftError(err: unknown, fallback?: string) {
  showAppDialog({
    variant: 'error',
    title: 'Save failed',
    message: draftErrorMessage(err, fallback),
    hideCancel: true,
    confirmLabel: 'OK',
  });
}
