/** Occupancy reason rules (engineer site particulars). */
export const OCCUPANCY_REASON_MIN = 3;
export const OCCUPANCY_REASON_MAX = 500;

export function sanitizeOccupancyReason(value: string): string {
  return value.slice(0, OCCUPANCY_REASON_MAX);
}

/**
 * When site is Occupied, a meaningful reason is required.
 * Returns an error message, or undefined when valid.
 */
export function validateOccupancyReason(
  occupancy: 'Empty' | 'Occupied' | string | null | undefined,
  reason: string | null | undefined,
): string | undefined {
  if (occupancy !== 'Occupied') return undefined;

  const raw = String(reason ?? '');
  if (raw !== raw.trim()) {
    return 'Leading or trailing spaces are not allowed';
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'Occupancy reason is required when site is Occupied';
  }
  if (trimmed.length < OCCUPANCY_REASON_MIN) {
    return `Enter at least ${OCCUPANCY_REASON_MIN} characters`;
  }
  if (trimmed.length > OCCUPANCY_REASON_MAX) {
    return `Reason cannot exceed ${OCCUPANCY_REASON_MAX} characters`;
  }
  return undefined;
}

export function isOccupancyOk(
  occupancy: 'Empty' | 'Occupied' | string | null | undefined,
  reason: string | null | undefined,
): boolean {
  if (!occupancy) return false;
  if (occupancy === 'Empty') return true;
  return !validateOccupancyReason(occupancy, reason);
}
