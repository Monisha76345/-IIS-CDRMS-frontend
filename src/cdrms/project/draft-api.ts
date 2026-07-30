import { Alert } from 'react-native';

import { ApiError } from '@/src/api/client';

export function draftErrorMessage(err: unknown, fallback = 'Could not save progress') {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function alertDraftError(err: unknown, fallback?: string) {
  Alert.alert('Save failed', draftErrorMessage(err, fallback));
}
