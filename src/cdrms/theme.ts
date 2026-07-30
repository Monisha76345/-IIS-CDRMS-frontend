/**
 * CDRMS mobile design system — fonts, type, space, color.
 * Blue institutional theme + IBM Plex Sans / Source Serif 4.
 */

/** Hex colors for LinearGradient / icons (match global.css) */
export const GRADIENT_HEADER = ['#1E3A8A', '#1D4ED8', '#3B82F6'] as const;
export const GRADIENT_PRIMARY = ['#1D4ED8', '#2563EB'] as const;
export const GRADIENT_SUBTLE = ['#F8FAFC', '#EFF6FF'] as const;
export const GRADIENT_MAP = ['#DBEAFE', '#EFF6FF', '#BFDBFE'] as const;
export const GRADIENT_VIDEO = ['#1E3A8A', '#2563EB'] as const;

export const COLORS = {
  primary: '#2563EB',
  primaryGlow: '#3B82F6',
  primaryDeep: '#1E3A8A',
  success: '#16A34A',
  warning: '#D97706',
  destructive: '#DC2626',
  white: '#FFFFFF',
  ink: '#0F172A',
  muted: '#F1F5F9',
  border: '#E2E8F0',
  soft: '#F8FAFC',
  slate: '#64748B',
} as const;

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

export const TYPE = {
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
