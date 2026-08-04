/** CDRMS themes — Ocean Blue only. */

export type ThemeId = 'ocean';

export const DEFAULT_THEME_ID: ThemeId = 'ocean';

/** Designs selectable on Profile — Ocean Blue only. */
export const HEADER_THEME_IDS: readonly ThemeId[] = ['ocean'] as const;

export const THEME_OPTIONS: ReadonlyArray<{
  id: ThemeId;
  label: string;
  swatch: string;
}> = [{ id: 'ocean', label: 'Ocean Blue', swatch: '#1A56DB' }];

export const HEADER_THEME_OPTIONS = THEME_OPTIONS;

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

/** Dual-tone theme + fluid login mesh stops. Surfaces stay white. */
function buildPreset(
  id: ThemeId,
  primary: string,
  primaryGlow: string,
  primaryDeep: string,
  gradientHeader: readonly [string, string] | readonly [string, string, string],
  mesh: readonly [string, string, string, string, ...string[]],
  accents: { cyan: string; sky: string; indigo: string; cardinalS: string },
  tint: string,
  soft: string,
  uniwindAccent: string,
  uniwindSecondary: string,
  /** CTA / continue gradient — defaults to header when omitted. */
  gradientPrimary?: readonly [string, string] | readonly [string, string, string],
): ThemePreset {
  const cta = gradientPrimary ?? gradientHeader;
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
      ink: '#111827',
      muted: '#F3F4F6',
      border: '#E5E7EB',
      soft,
      slate: '#6B7280',
    },
    GLASS: {
      card: '#FFFFFF',
      cardSolid: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceSolid: '#FFFFFF',
      surfaceTint: tint,
      iconBg: tint,
      border: '#E5E7EB',
      borderSoft: '#F3F4F6',
      divider: '#F3F4F6',
      shadow: '#0F172A',
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
    GRADIENT_PRIMARY: cta,
    GRADIENT_SUBTLE: [soft, tint] as const,
    GRADIENT_MAP: [tint, '#FFFFFF', soft] as const,
    GRADIENT_VIDEO: cta,
    GRADIENT_CARD_HEADER: cta,
    GRADIENT_MESH: mesh,
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

/** Ocean Blue — only active design. */
const PRESETS: Record<ThemeId, ThemePreset> = {
  ocean: buildPreset(
    'ocean',
    '#1A56DB',
    '#3B82F6',
    '#0B1F4D',
    ['#0B1F4D', '#123A8C', '#1A56DB'],
    ['#0B1F4D', '#123A8C', '#1A56DB', '#3B82F6', '#60A5FA'],
    { cyan: '#0284C7', sky: '#0EA5E9', indigo: '#1D4ED8', cardinalS: '#0891B2' },
    '#EEF4FF',
    '#F4F7FB',
    '219 234 254',
    '238 244 255',
  ),
};

/** Any legacy / unknown id → Ocean Blue. */
export function normalizeThemeId(_raw?: string | null): ThemeId {
  return DEFAULT_THEME_ID;
}

export function buildThemePreset(id: ThemeId): ThemePreset {
  return PRESETS[id] ?? PRESETS[DEFAULT_THEME_ID];
}

export function getThemeOption(id: ThemeId) {
  return THEME_OPTIONS.find((t) => t.id === id) ?? THEME_OPTIONS[0];
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
