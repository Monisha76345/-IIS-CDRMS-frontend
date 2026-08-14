import type { CreateApplicationInput } from '@/src/api/applications';

/** Mirrors backend `@MaxLength` constraints in create-application.dto.ts */
export const ZC_FORM_LIMITS = {
  eOfficeNumber: 100,
  eOfficeMinLength: 3,
  siteNoMaxDigits: 10,
  addressLine1: 255,
  addressLine2: 255,
  addressBlock: 150,
  siteDimension: 100,
  siteDimensionComment: 500,
} as const;

/** Alphanumeric plus / . - _ (no spaces). */
export const E_OFFICE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/.\-_]*[A-Za-z0-9]$|^[A-Za-z0-9]{3,100}$/;

/** Positive whole number, no leading zero. */
export const SITE_NO_PATTERN = /^[1-9]\d*$/;

/** Six digits — no extra format rules. */
export const PINCODE_PATTERN = /^\d{6}$/;

export const SITE_DIMENSION_PATTERN = /^\d+(\*\d+)+$/;

const SIDE_LABELS = ['North', 'South', 'West', 'East'] as const;

export type ZcApplicationFieldKey =
  | 'eOfficeNumber'
  | 'siteNo'
  | 'siteDimensionType'
  | 'siteDimension'
  | 'addressLine1'
  | 'addressLine2'
  | 'addressBlock'
  | 'addressPincode'
  | 'assignedEngineerUserId'
  | 'siteDimensionComment';

export type ZcApplicationFieldErrors = Partial<
  Record<
    | keyof CreateApplicationInput
    | 'siteDimensionType'
    | 'assignedEngineerUserId',
    string
  >
>;

/** Display names for validation dialogs + scroll targets. */
export const ZC_FIELD_LABELS: Record<ZcApplicationFieldKey, string> = {
  eOfficeNumber: 'E-office number',
  siteNo: 'Site no',
  siteDimensionType: 'Site type',
  siteDimension: 'Site dimension',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  addressBlock: 'Block',
  addressPincode: 'Pincode',
  assignedEngineerUserId: 'Assign engineer',
  siteDimensionComment: 'Comments',
};

/** Top-to-bottom form order for first-error focus. */
export const ZC_FIELD_ORDER: readonly ZcApplicationFieldKey[] = [
  'eOfficeNumber',
  'siteNo',
  'siteDimensionType',
  'siteDimension',
  'addressLine1',
  'addressLine2',
  'addressBlock',
  'addressPincode',
  'assignedEngineerUserId',
  'siteDimensionComment',
] as const;

export function firstZcFieldError(
  errors: ZcApplicationFieldErrors,
): { key: ZcApplicationFieldKey; label: string; message: string } | null {
  for (const key of ZC_FIELD_ORDER) {
    const message = errors[key];
    if (message) {
      return { key, label: ZC_FIELD_LABELS[key], message };
    }
  }
  return null;
}

export function validateSiteDimensionType(
  siteType: CreateApplicationInput['siteDimensionType'],
): string | undefined {
  if (!siteType) return 'Site type is required';
  if (siteType !== 'Even' && siteType !== 'Odd') {
    return 'Site type must be Even or Odd';
  }
  return undefined;
}

export function validateEOfficeNumber(raw: string): string | undefined {
  if (!raw) return 'E-office number is required';
  if (raw !== raw.trim()) {
    return 'Leading or trailing spaces are not allowed';
  }
  const value = raw.trim();
  if (value.length < ZC_FORM_LIMITS.eOfficeMinLength) {
    return `Enter a valid e-office number (min ${ZC_FORM_LIMITS.eOfficeMinLength} characters)`;
  }
  if (value.length > ZC_FORM_LIMITS.eOfficeNumber) {
    return `E-office number cannot exceed ${ZC_FORM_LIMITS.eOfficeNumber} characters`;
  }
  if (!E_OFFICE_PATTERN.test(value)) {
    return 'E-office number may contain only letters, numbers, and / . - _';
  }
  return undefined;
}

export function validateSiteNo(raw: string): string | undefined {
  if (!raw) return 'Site no is required';
  if (raw !== raw.trim()) {
    return 'Leading or trailing spaces are not allowed';
  }
  const value = raw.trim();
  if (!SITE_NO_PATTERN.test(value)) {
    return 'Site no must be a positive whole number (no 0, decimals, letters, or special characters)';
  }
  if (value.length > ZC_FORM_LIMITS.siteNoMaxDigits) {
    return `Site no cannot exceed ${ZC_FORM_LIMITS.siteNoMaxDigits} digits`;
  }
  return undefined;
}

export function validateAddressLine1(raw: string): string | undefined {
  const value = raw?.trim() ?? '';
  if (!value) return 'Address line 1 is required';
  if (value.length > ZC_FORM_LIMITS.addressLine1) {
    return `Address line 1 cannot exceed ${ZC_FORM_LIMITS.addressLine1} characters`;
  }
  return undefined;
}

export function validateAddressLine2(raw: string | undefined): string | undefined {
  const value = raw?.trim() ?? '';
  if (!value) return undefined;
  if (value.length > ZC_FORM_LIMITS.addressLine2) {
    return `Address line 2 cannot exceed ${ZC_FORM_LIMITS.addressLine2} characters`;
  }
  return undefined;
}

export function validateAddressBlock(raw: string): string | undefined {
  const value = raw?.trim() ?? '';
  if (!value) return 'Block is required';
  if (value.length > ZC_FORM_LIMITS.addressBlock) {
    return `Block cannot exceed ${ZC_FORM_LIMITS.addressBlock} characters`;
  }
  return undefined;
}

export function validatePincode(raw: string): string | undefined {
  if (!raw) return 'Pincode is required';
  if (raw !== raw.trim()) {
    return 'Leading or trailing spaces are not allowed';
  }
  const value = raw.trim();
  if (!PINCODE_PATTERN.test(value)) {
    return 'Enter a valid 6-digit pincode';
  }
  return undefined;
}

export function validateSiteDimension(raw: string): string | undefined {
  if (!raw.trim()) return 'Site dimension is required (e.g. 20*40)';
  const normalized = raw.trim().replace(/\s+/g, '');
  if (normalized.length > ZC_FORM_LIMITS.siteDimension) {
    return `Site dimension cannot exceed ${ZC_FORM_LIMITS.siteDimension} characters`;
  }
  if (!SITE_DIMENSION_PATTERN.test(normalized)) {
    return 'Use format like 20*40 or 20*40*50*40';
  }
  const parts = normalized.split('*');
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!/^[1-9]\d*$/.test(part)) {
      const side = parts.length === 4 ? SIDE_LABELS[i] : 'Each side';
      return `${side} dimension must be a positive whole number (no 0, decimals, or leading zeros)`;
    }
  }
  return undefined;
}

export function validateSiteDimensionComment(
  raw: string | undefined,
  siteType: CreateApplicationInput['siteDimensionType'],
): string | undefined {
  const trimmed = raw?.trim() ?? '';
  if (siteType === 'Odd' && !trimmed) {
    return 'Comments are required for Odd site type';
  }
  if (!trimmed) return undefined;
  if (trimmed.length > ZC_FORM_LIMITS.siteDimensionComment) {
    return `Comments cannot exceed ${ZC_FORM_LIMITS.siteDimensionComment} characters`;
  }
  return undefined;
}

export function validateZcApplicationForm(
  form: CreateApplicationInput,
): ZcApplicationFieldErrors {
  const next: ZcApplicationFieldErrors = {};

  const eOfficeErr = validateEOfficeNumber(form.eOfficeNumber);
  if (eOfficeErr) next.eOfficeNumber = eOfficeErr;

  const siteNoErr = validateSiteNo(form.siteNo);
  if (siteNoErr) next.siteNo = siteNoErr;

  const siteTypeErr = validateSiteDimensionType(form.siteDimensionType);
  if (siteTypeErr) next.siteDimensionType = siteTypeErr;

  const dimErr = validateSiteDimension(form.siteDimension);
  if (dimErr) next.siteDimension = dimErr;

  const line1Err = validateAddressLine1(form.addressLine1);
  if (line1Err) next.addressLine1 = line1Err;

  const line2Err = validateAddressLine2(form.addressLine2);
  if (line2Err) next.addressLine2 = line2Err;

  const blockErr = validateAddressBlock(form.addressBlock);
  if (blockErr) next.addressBlock = blockErr;

  const pinErr = validatePincode(form.addressPincode);
  if (pinErr) next.addressPincode = pinErr;

  const commentErr = validateSiteDimensionComment(
    form.siteDimensionComment,
    form.siteDimensionType,
  );
  if (commentErr) next.siteDimensionComment = commentErr;

  if (!String(form.assignedEngineerUserId || '').trim()) {
    next.assignedEngineerUserId = 'Assign engineer is required';
  }

  return next;
}

export function sanitizeEOfficeInput(value: string): string {
  return value.replace(/[^A-Za-z0-9/.\-_]/g, '').slice(0, ZC_FORM_LIMITS.eOfficeNumber);
}

export function sanitizeSiteNoInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const withoutLeadingZeros = digits.replace(/^0+/, '');
  return withoutLeadingZeros.slice(0, ZC_FORM_LIMITS.siteNoMaxDigits);
}

export function sanitizeAddressLineInput(value: string, max = ZC_FORM_LIMITS.addressLine1): string {
  return value.slice(0, max);
}

export function sanitizeBlockInput(value: string): string {
  return value.slice(0, ZC_FORM_LIMITS.addressBlock);
}

export function sanitizeSiteDimensionInput(value: string): string {
  return value.replace(/[^\d*]/g, '').slice(0, ZC_FORM_LIMITS.siteDimension);
}

export function sanitizeCommentInput(value: string): string {
  return value.slice(0, ZC_FORM_LIMITS.siteDimensionComment);
}
