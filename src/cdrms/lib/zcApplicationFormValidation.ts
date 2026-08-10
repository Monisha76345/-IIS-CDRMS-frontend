import type { CreateApplicationInput } from '@/src/api/applications';

/** Mirrors backend `@MaxLength` constraints in create-application.dto.ts */
export const ZC_FORM_LIMITS = {
  eOfficeNumber: 100,
  eOfficeMinLength: 3,
  siteNoMaxDigits: 10,
  addressArea: 150,
  addressBlock: 150,
  siteDimension: 100,
  siteDimensionComment: 500,
} as const;

/** Alphanumeric plus / . - _ (no spaces). */
export const E_OFFICE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/.\-_]*[A-Za-z0-9]$|^[A-Za-z0-9]{3,100}$/;

/** Positive whole number, no leading zero. */
export const SITE_NO_PATTERN = /^[1-9]\d*$/;

/** e.g. A Block, Block 1, Block1 */
export const BLOCK_PATTERN = /^([A-Za-z]+\s+Block|Block\s*[1-9]\d*)$/i;

/** Six digits — no extra format rules. */
export const PINCODE_PATTERN = /^\d{6}$/;

export const SITE_DIMENSION_PATTERN = /^\d+(\*\d+)+$/;

const SIDE_LABELS = ['North', 'South', 'West', 'East'] as const;

export type ZcApplicationFieldErrors = Partial<
  Record<
    | keyof CreateApplicationInput
    | 'siteDimensionType'
    | 'assignedEngineerUserId',
    string
  >
>;

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

export function validateAddressArea(raw: string): string | undefined {
  const value = raw?.trim() ?? '';
  if (!value) return 'Area is required';
  if (value.length > ZC_FORM_LIMITS.addressArea) {
    return `Area cannot exceed ${ZC_FORM_LIMITS.addressArea} characters`;
  }
  return undefined;
}

export function validateAddressBlock(raw: string): string | undefined {
  if (!raw) return 'Block is required';
  if (raw !== raw.trim()) {
    return 'Leading or trailing spaces are not allowed';
  }
  const value = raw.trim();
  if (!value) return 'Block is required';
  if (!BLOCK_PATTERN.test(value)) {
    return 'Enter a valid block name (e.g. A Block, Block 1, Block1)';
  }
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

  const areaErr = validateAddressArea(form.addressArea);
  if (areaErr) next.addressArea = areaErr;

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

export function sanitizeAreaInput(value: string): string {
  return value.slice(0, ZC_FORM_LIMITS.addressArea);
}

export function sanitizeBlockInput(value: string): string {
  return value
    .replace(/[^A-Za-z0-9 ]/g, '')
    .slice(0, ZC_FORM_LIMITS.addressBlock);
}

export function sanitizeSiteDimensionInput(value: string): string {
  return value.replace(/[^\d*]/g, '').slice(0, ZC_FORM_LIMITS.siteDimension);
}

export function sanitizeCommentInput(value: string): string {
  return value.slice(0, ZC_FORM_LIMITS.siteDimensionComment);
}
