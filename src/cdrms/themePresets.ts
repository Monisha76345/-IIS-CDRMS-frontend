/** CDRMS app color themes — synced with users.themePreference in backend. */

export type ThemeId = 'blue' | 'navy' | 'azure' | 'sky' | 'indigo';

/** Clean solid Ocean Blue — default theme across the app. */
export const DEFAULT_THEME_ID: ThemeId = 'blue';

/** Allowed theme colors shown in app. */
export const HEADER_THEME_IDS: readonly ThemeId[] = ['blue', 'navy', 'azure', 'sky'] as const;

export const THEME_OPTIONS: ReadonlyArray<{
  id: ThemeId;
  label: string;
  swatch: string;
}> = [
  { id: 'blue', label: 'Ocean Blue', swatch: '#2563EB' },
  { id: 'navy', label: 'Navy', swatch: '#1E3A8A' },
  { id: 'azure', label: 'Azure', swatch: '#1D4ED8' },
  { id: 'sky', label: 'Sky', swatch: '#0EA5E9' },
];

export const HEADER_THEME_OPTIONS = THEME_OPTIONS.filter((t) =>
  (HEADER_THEME_IDS as readonly string[]).includes(t.id),
);

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
  gradientHeader: readonly [string, string],
  accents: { cyan: string; sky: string; indigo: string; cardinalS: string },
  tint: string,
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
      warning: '#EA580C',
      destructive: '#DC2626',
      white: '#FFFFFF',
      ink: '#0F172A',
      muted: '#F1F5F9',
      border: '#E2E8F0',
      soft: '#F8FAFC',
      slate: '#64748B',
    },
    GLASS: {
      card: '#FFFFFF',
      cardSolid: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceSolid: '#FFFFFF',
      surfaceTint: tint,
      iconBg: '#FFFFFF',
      border: '#E2E8F0',
      borderSoft: '#E2E8F0',
      divider: '#E2E8F0',
      shadow: primaryDeep,
      tintBlue: tint,
      tintCyan: tint,
      tintSky: tint,
      tintIndigo: tint,
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
    GRADIENT_SUBTLE: ['#FFFFFF', tint] as const,
    GRADIENT_MAP: [tint, '#FFFFFF', tint] as const,
    GRADIENT_VIDEO: [primaryDeep, primary] as const,
    GRADIENT_CARD_HEADER: [primaryDeep, primary] as const,
    GRADIENT_MESH: [tint, '#FFFFFF', tint] as const,
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
    '#1E40AF',
    ['#1E40AF', '#2563EB'],
    { cyan: '#0284C7', sky: '#0EA5E9', indigo: '#1D4ED8', cardinalS: '#0891B2' },
    '#EFF6FF',
    '219 234 254',
    '239 246 255',
  ),
  navy: buildPreset(
    'navy',
    '#1E3A8A',
    '#3B82F6',
    '#172554',
    ['#172554', '#1E3A8A'],
    { cyan: '#2563EB', sky: '#3B82F6', indigo: '#1E40AF', cardinalS: '#F59E0B' },
    '#EEF2FF',
    '224 231 255',
    '238 242 255',
  ),
  azure: buildPreset(
    'azure',
    '#1D4ED8',
    '#60A5FA',
    '#1E3A8A',
    ['#1E3A8A', '#1D4ED8'],
    { cyan: '#2563EB', sky: '#3B82F6', indigo: '#1E40AF', cardinalS: '#0EA5E9' },
    '#EFF6FF',
    '219 234 254',
    '239 246 255',
  ),
  sky: buildPreset(
    'sky',
    '#0EA5E9',
    '#38BDF8',
    '#0284C7',
    ['#0284C7', '#0EA5E9'],
    { cyan: '#0891B2', sky: '#38BDF8', indigo: '#0369A1', cardinalS: '#14B8A6' },
    '#F0F9FF',
    '224 242 254',
    '240 249 255',
  ),
  indigo: buildPreset(
    'indigo',
    '#1E3A8A',
    '#3B82F6',
    '#172554',
    ['#172554', '#1E3A8A'],
    { cyan: '#2563EB', sky: '#3B82F6', indigo: '#1E40AF', cardinalS: '#F59E0B' },
    '#EEF2FF',
    '224 231 255',
    '238 242 255',
  ),
};

const ALL_THEME_IDS = new Set<string>(Object.keys(PRESETS));

export function normalizeThemeId(raw?: string | null): ThemeId {
  if (raw === 'amber') return 'sky'; // legacy preference → sky
  if (raw && ALL_THEME_IDS.has(raw)) return raw as ThemeId;
  return DEFAULT_THEME_ID;
}

export function buildThemePreset(id: ThemeId): ThemePreset {
  return PRESETS[id] ?? PRESETS[DEFAULT_THEME_ID];
}

export function getThemeOption(id: ThemeId) {
  const listed = THEME_OPTIONS.find((t) => t.id === id);
  if (listed) return listed;
  const preset = PRESETS[id];
  if (preset) {
    return {
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      swatch: preset.COLORS.primary,
    };
  }
  return THEME_OPTIONS[0];
}

export function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}
