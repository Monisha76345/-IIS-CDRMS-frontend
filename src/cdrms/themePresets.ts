/** CDRMS app color themes — synced with users.themePreference in backend. */

export type ThemeId = 'blue' | 'teal' | 'indigo' | 'emerald';

export const DEFAULT_THEME_ID: ThemeId = 'blue';

export const THEME_OPTIONS: ReadonlyArray<{
  id: ThemeId;
  label: string;
  swatch: string;
}> = [
  { id: 'blue', label: 'Ocean Blue', swatch: '#2563EB' },
  { id: 'teal', label: 'Teal', swatch: '#0891B2' },
  { id: 'indigo', label: 'Indigo', swatch: '#4F46E5' },
  { id: 'emerald', label: 'Emerald', swatch: '#059669' },
];

export type ThemeColors = {
  primary: string;
  primaryGlow: string;
  primaryDeep: string;
  success: string;
  warning: string;
  destructive: string;
  white: string;
  ink: string;
  muted: string;
  border: string;
  soft: string;
  slate: string;
};

export type ThemeGlass = {
  card: string;
  cardSolid: string;
  surface: string;
  surfaceSolid: string;
  surfaceTint: string;
  iconBg: string;
  border: string;
  borderSoft: string;
  divider: string;
  shadow: string;
  tintBlue: string;
  tintCyan: string;
  tintSky: string;
  tintIndigo: string;
};

export type ThemeUniwind = {
  primary: string;
  primaryGlow: string;
  primaryDeep: string;
  ring: string;
  accent: string;
  accentForeground: string;
  secondary: string;
};

export type ThemePreset = {
  id: ThemeId;
  COLORS: ThemeColors;
  GLASS: ThemeGlass;
  BLUE_SHADES: {
    cyan: string;
    sky: string;
    primary: string;
    indigo: string;
    deep: string;
  };
  CARDINAL_ACCENT: {
    N: string;
    S: string;
    E: string;
    W: string;
  };
  GRADIENT_HEADER: readonly string[];
  GRADIENT_PRIMARY: readonly string[];
  GRADIENT_SUBTLE: readonly string[];
  GRADIENT_MAP: readonly string[];
  GRADIENT_VIDEO: readonly string[];
  GRADIENT_CARD_HEADER: readonly string[];
  GRADIENT_MESH: readonly string[];
  uniwind: ThemeUniwind;
};

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function buildPreset(
  id: ThemeId,
  primary: string,
  primaryGlow: string,
  primaryDeep: string,
  gradientHeader: readonly [string, string, string],
  gradientCardHeader: readonly [string, string, string, string],
  gradientMesh: readonly [string, string, string],
  glass: Pick<ThemeGlass, 'shadow' | 'tintBlue' | 'tintCyan' | 'tintSky' | 'tintIndigo' | 'card'>,
  accents: { cyan: string; sky: string; indigo: string; cardinalS: string },
  uniwindAccent: string,
  uniwindSecondary: string,
): ThemePreset {
  return {
    id,
    COLORS: {
      primary,
      primaryGlow,
      primaryDeep,
      success: '#16A34A',
      warning: '#D97706',
      destructive: '#DC2626',
      white: '#FFFFFF',
      ink: '#0F172A',
      muted: '#F1F5F9',
      border: '#E2E8F0',
      soft: '#F8FAFC',
      slate: '#64748B',
    },
    GLASS: {
      card: glass.card,
      cardSolid: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceSolid: '#FFFFFF',
      surfaceTint: '#F8FAFC',
      iconBg: '#FFFFFF',
      border: '#E2E8F0',
      borderSoft: '#E2E8F0',
      divider: '#E2E8F0',
      shadow: glass.shadow,
      tintBlue: glass.tintBlue,
      tintCyan: glass.tintCyan,
      tintSky: glass.tintSky,
      tintIndigo: glass.tintIndigo,
    },
    BLUE_SHADES: {
      cyan: accents.cyan,
      sky: accents.sky,
      primary,
      indigo: accents.indigo,
      deep: primaryDeep,
    },
    CARDINAL_ACCENT: {
      N: primary,
      S: accents.cardinalS,
      E: accents.sky,
      W: accents.indigo,
    },
    GRADIENT_HEADER: gradientHeader,
    GRADIENT_PRIMARY: [primaryDeep, primary] as const,
    GRADIENT_SUBTLE: ['#F8FAFC', glass.tintBlue] as const,
    GRADIENT_MAP: [glass.tintBlue, '#EFF6FF', '#BFDBFE'] as const,
    GRADIENT_VIDEO: [primaryDeep, primary] as const,
    GRADIENT_CARD_HEADER: gradientCardHeader,
    GRADIENT_MESH: gradientMesh,
    uniwind: {
      primary: hexToRgbTriplet(primary),
      primaryGlow: hexToRgbTriplet(primaryGlow),
      primaryDeep: hexToRgbTriplet(primaryDeep),
      ring: hexToRgbTriplet(primary),
      accent: uniwindAccent,
      accentForeground: hexToRgbTriplet(primaryDeep),
      secondary: uniwindSecondary,
    },
  };
}

const PRESETS: Record<ThemeId, ThemePreset> = {
  blue: buildPreset(
    'blue',
    '#2563EB',
    '#3B82F6',
    '#1E3A8A',
    ['#1E3A8A', '#1D4ED8', '#3B82F6'],
    ['#22D3EE', '#38BDF8', '#2563EB', '#1D4ED8'],
    ['#E8F0FE', '#EFF6FF', '#F0F9FF'],
    {
      shadow: '#1E3A8A',
      tintBlue: '#EFF6FF',
      tintCyan: '#ECFEFF',
      tintSky: '#E0F2FE',
      tintIndigo: '#EEF2FF',
      card: '#FAFCFF',
    },
    { cyan: '#06B6D4', sky: '#0EA5E9', indigo: '#4F46E5', cardinalS: '#0891B2' },
    '219 234 254',
    '239 246 255',
  ),
  teal: buildPreset(
    'teal',
    '#0891B2',
    '#06B6D4',
    '#0E7490',
    ['#0E7490', '#0891B2', '#22D3EE'],
    ['#5EEAD4', '#2DD4BF', '#0891B2', '#0E7490'],
    ['#ECFEFF', '#F0FDFA', '#CCFBF1'],
    {
      shadow: '#0E7490',
      tintBlue: '#ECFEFF',
      tintCyan: '#CFFAFE',
      tintSky: '#CCFBF1',
      tintIndigo: '#E0F2FE',
      card: '#F8FFFF',
    },
    { cyan: '#06B6D4', sky: '#14B8A6', indigo: '#0284C7', cardinalS: '#0D9488' },
    '204 251 241',
    '236 254 255',
  ),
  indigo: buildPreset(
    'indigo',
    '#4F46E5',
    '#6366F1',
    '#3730A3',
    ['#3730A3', '#4F46E5', '#818CF8'],
    ['#A5B4FC', '#818CF8', '#4F46E5', '#3730A3'],
    ['#EEF2FF', '#F5F3FF', '#EDE9FE'],
    {
      shadow: '#3730A3',
      tintBlue: '#EEF2FF',
      tintCyan: '#EDE9FE',
      tintSky: '#E0E7FF',
      tintIndigo: '#EDE9FE',
      card: '#FAFAFF',
    },
    { cyan: '#6366F1', sky: '#818CF8', indigo: '#4338CA', cardinalS: '#7C3AED' },
    '224 231 255',
    '238 242 255',
  ),
  emerald: buildPreset(
    'emerald',
    '#059669',
    '#10B981',
    '#047857',
    ['#047857', '#059669', '#34D399'],
    ['#6EE7B7', '#34D399', '#059669', '#047857'],
    ['#ECFDF5', '#F0FDF4', '#D1FAE5'],
    {
      shadow: '#047857',
      tintBlue: '#ECFDF5',
      tintCyan: '#D1FAE5',
      tintSky: '#CCFBF1',
      tintIndigo: '#E0F2FE',
      card: '#F8FFFB',
    },
    { cyan: '#14B8A6', sky: '#22C55E', indigo: '#0284C7', cardinalS: '#0D9488' },
    '209 250 229',
    '240 253 244',
  ),
};

export function normalizeThemeId(raw?: string | null): ThemeId {
  if (raw === 'teal' || raw === 'indigo' || raw === 'emerald' || raw === 'blue') {
    return raw;
  }
  return DEFAULT_THEME_ID;
}

export function buildThemePreset(id: ThemeId): ThemePreset {
  return PRESETS[id];
}

export function getThemeOption(id: ThemeId) {
  return THEME_OPTIONS.find((t) => t.id === id) ?? THEME_OPTIONS[0];
}
