export const NO_HTML_MESSAGE =
  'HTML or script tags are not allowed in this field.';

const HTML_META_CHARS = /[<>]/;

export function containsForbiddenHtml(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false;
  if (HTML_META_CHARS.test(value)) return true;
  if (/javascript\s*:/i.test(value)) return true;
  if (/\bon[a-z]+\s*=/i.test(value)) return true;
  return false;
}

export function stripHtmlMetaChars(value: string): string {
  return value.replace(/[<>]/g, '');
}

export function findForbiddenHtmlPath(
  value: unknown,
  path: string[] = [],
): string | null {
  if (typeof value === 'string') {
    return containsForbiddenHtml(value)
      ? path.length
        ? path.join('.')
        : '(root)'
      : null;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = findForbiddenHtmlPath(value[i], [...path, String(i)]);
      if (found) return found;
    }
    return null;
  }
  if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const found = findForbiddenHtmlPath(v, [...path, k]);
      if (found) return found;
    }
  }
  return null;
}

/** Use on TextInput onChangeText to strip angle brackets as the user types. */
export function sanitizeTextInput(value: string): string {
  return stripHtmlMetaChars(value);
}
