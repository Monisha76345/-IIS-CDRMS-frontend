/**
 * CDRMS mobile design system — runtime theme tokens + static typography/spacing.
 * Color tokens mutate in place via applyTheme() so existing imports re-render on theme change.
 */

import {
  buildThemePreset,
  DEFAULT_THEME_ID,
  normalizeThemeId,
  type ThemeId,
  type ThemePreset,
} from '@/src/cdrms/themePresets';
import { applyUniwindTheme } from '@/src/theme/applyUniwindTheme';

export type { ThemeId } from '@/src/cdrms/themePresets';
export {
  DEFAULT_THEME_ID,
  THEME_OPTIONS,
  getThemeOption,
  normalizeThemeId,
} from '@/src/cdrms/themePresets';

export let currentThemeId: ThemeId = DEFAULT_THEME_ID;

const initial = buildThemePreset(DEFAULT_THEME_ID);

function replaceArray<T>(target: T[], source: readonly T[]) {
  target.length = 0;
  target.push(...source);
}

/** Mutable color buckets — updated by applyTheme(). */
export const COLORS = { ...initial.COLORS };
export const GLASS = { ...initial.GLASS };
export const BLUE_SHADES = { ...initial.BLUE_SHADES };
export const CARDINAL_ACCENT = { ...initial.CARDINAL_ACCENT };

export const GRADIENT_HEADER: string[] = [...initial.GRADIENT_HEADER];
export const GRADIENT_PRIMARY: string[] = [...initial.GRADIENT_PRIMARY];
export const GRADIENT_SUBTLE: string[] = [...initial.GRADIENT_SUBTLE];
export const GRADIENT_MAP: string[] = [...initial.GRADIENT_MAP];
export const GRADIENT_VIDEO: string[] = [...initial.GRADIENT_VIDEO];
export const GRADIENT_CARD_HEADER: string[] = [...initial.GRADIENT_CARD_HEADER];
export const GRADIENT_MESH: string[] = [...initial.GRADIENT_MESH];

export type CardinalKey = keyof typeof CARDINAL_ACCENT;

function assignPreset(preset: ThemePreset) {
  Object.assign(COLORS, preset.COLORS);
  Object.assign(GLASS, preset.GLASS);
  Object.assign(BLUE_SHADES, preset.BLUE_SHADES);
  Object.assign(CARDINAL_ACCENT, preset.CARDINAL_ACCENT);
  replaceArray(GRADIENT_HEADER, preset.GRADIENT_HEADER);
  replaceArray(GRADIENT_PRIMARY, preset.GRADIENT_PRIMARY);
  replaceArray(GRADIENT_SUBTLE, preset.GRADIENT_SUBTLE);
  replaceArray(GRADIENT_MAP, preset.GRADIENT_MAP);
  replaceArray(GRADIENT_VIDEO, preset.GRADIENT_VIDEO);
  replaceArray(GRADIENT_CARD_HEADER, preset.GRADIENT_CARD_HEADER);
  replaceArray(GRADIENT_MESH, preset.GRADIENT_MESH);
  rebuildType();
}

/** White-on-gradient text (theme-neutral — works on any header gradient). */
export const HEADER_ON_GRADIENT = {
  muted: 'rgba(255,255,255,0.85)',
  soft: 'rgba(255,255,255,0.78)',
  faint: 'rgba(255,255,255,0.45)',
} as const;

/** Primary tint pair for stat chips / count grids. */
export function themeStatColors() {
  return { tint: COLORS.primary, soft: GLASS.tintBlue };
}

export function gradientStops(stops: readonly string[] | string[]): [string, string, ...string[]] {
  const a = stops[0] ?? COLORS.primary;
  const b = stops[1] ?? a;
  const rest = stops.slice(2);
  return [a, b, ...rest] as [string, string, ...string[]];
}

export function applyTheme(id: ThemeId): ThemePreset {
  const preset = buildThemePreset(id);
  currentThemeId = id;
  assignPreset(preset);
  return preset;
}

export function cardinalAccentColor(face: string): string {
  if (face in CARDINAL_ACCENT) {
    return CARDINAL_ACCENT[face as CardinalKey];
  }
  return COLORS.primary;
}

/** Loaded font family names (expo-google-fonts). */
export const FONTS = {
  regular: 'IBMPlexSans_400Regular',
  medium: 'IBMPlexSans_500Medium',
  semibold: 'IBMPlexSans_600SemiBold',
  bold: 'IBMPlexSans_700Bold',
  display: 'SourceSerif4_600SemiBold',
  displayBold: 'SourceSerif4_700Bold',
} as const;

/** 4px spacing scale */
export const SPACE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  gutter: 16,
  cardPad: 16,
  section: 20,
  cardGap: 16,
  radius: 16,
  radiusLg: 20,
  touch: 52,
} as const;

function buildType() {
  return {
    caption: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
      color: COLORS.ink,
    },
    label: {
      fontFamily: FONTS.semibold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
      color: COLORS.ink,
    },
    body: {
      fontFamily: FONTS.regular,
      fontSize: 15,
      lineHeight: 22,
      color: COLORS.ink,
    },
    bodyStrong: {
      fontFamily: FONTS.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: COLORS.ink,
    },
    title: {
      fontFamily: FONTS.bold,
      fontSize: 17,
      lineHeight: 24,
      letterSpacing: -0.2,
      color: COLORS.ink,
    },
    screen: {
      fontFamily: FONTS.bold,
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.3,
      color: COLORS.ink,
    },
    hero: {
      fontFamily: FONTS.displayBold,
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.4,
      color: COLORS.ink,
    },
    button: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: 0.2,
    },
  } as const;
}

export let TYPE = buildType();

function rebuildType() {
  TYPE = buildType();
}

// Ensure defaults are applied at module load
applyTheme(DEFAULT_THEME_ID);

/** Fixed blue gradients for splash/login — never follow user theme. */
export const AUTH_GRADIENT_HEADER = ['#1E3A8A', '#1D4ED8', '#3B82F6'] as const;
export const AUTH_GRADIENT_PRIMARY = ['#1E3A8A', '#2563EB'] as const;

/** Reset to default blue (sync) — call on logout and pre-auth screens. */
export function applyAuthTheme() {
  applyTheme(DEFAULT_THEME_ID);
  applyUniwindTheme(DEFAULT_THEME_ID);
}
