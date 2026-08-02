/** CDRMS app color themes — synced with users.themePreference in backend. */

export type ThemeId =
  | 'blue'
  | 'sky'
  | 'indigo'
  | 'azure'
  | 'teal'
  | 'emerald'
  | 'mint'
  | 'forest'
  | 'pink'
  | 'blush'
  | 'peach'
  | 'lavender'
  | 'rose'
  | 'coral'
  | 'amber'
  | 'wine'
  | 'slate'
  | 'zinc'
  | 'stone'
  | 'charcoal'
  | 'fuchsia'
  | 'plum';

/** Clean solid Ocean Blue — no glass fog overlays. */
export const DEFAULT_THEME_ID: ThemeId = 'blue';

/** Quick picks shown in header theme menu (max 3). */
export const HEADER_THEME_IDS: readonly ThemeId[] = ['blue', 'teal', 'emerald'] as const;

export const THEME_OPTIONS: ReadonlyArray<{
  id: ThemeId;
  label: string;
  swatch: string;
}> = [
  // Classic — 4
  { id: 'blue', label: 'Ocean Blue', swatch: '#2563EB' },
  { id: 'sky', label: 'Sky', swatch: '#0284C7' },
  { id: 'indigo', label: 'Navy', swatch: '#1E3A8A' },
  { id: 'azure', label: 'Azure', swatch: '#1D4ED8' },
  // Nature — 4
  { id: 'teal', label: 'Teal', swatch: '#0F766E' },
  { id: 'emerald', label: 'Green', swatch: '#047857' },
  { id: 'mint', label: 'Mint', swatch: '#059669' },
  { id: 'forest', label: 'Forest', swatch: '#166534' },
  // Soft — 4
  { id: 'pink', label: 'Pink', swatch: '#DB2777' },
  { id: 'blush', label: 'Blush', swatch: '#F472B6' },
  { id: 'peach', label: 'Peach', swatch: '#FB7185' },
  { id: 'lavender', label: 'Lavender', swatch: '#A78BFA' },
  // Bold — 4
  { id: 'rose', label: 'Rose', swatch: '#E11D48' },
  { id: 'coral', label: 'Coral', swatch: '#EA580C' },
  { id: 'amber', label: 'Amber', swatch: '#D97706' },
  { id: 'wine', label: 'Wine', swatch: '#9F1239' },
  // Minimal — 4
  { id: 'slate', label: 'Slate', swatch: '#475569' },
  { id: 'zinc', label: 'Zinc', swatch: '#52525B' },
  { id: 'stone', label: 'Stone', swatch: '#78716C' },
  { id: 'charcoal', label: 'Charcoal', swatch: '#334155' },
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
  teal: buildPreset(
    'teal',
    '#0F766E',
    '#14B8A6',
    '#115E59',
    ['#115E59', '#0F766E'],
    { cyan: '#0D9488', sky: '#14B8A6', indigo: '#0E7490', cardinalS: '#EA580C' },
    '#F0FDFA',
    '204 251 241',
    '240 253 250',
  ),
  emerald: buildPreset(
    'emerald',
    '#047857',
    '#10B981',
    '#065F46',
    ['#065F46', '#047857'],
    { cyan: '#059669', sky: '#10B981', indigo: '#047857', cardinalS: '#D97706' },
    '#ECFDF5',
    '209 250 229',
    '240 253 244',
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
  sky: buildPreset(
    'sky',
    '#0284C7',
    '#38BDF8',
    '#075985',
    ['#075985', '#0284C7'],
    { cyan: '#0EA5E9', sky: '#38BDF8', indigo: '#0369A1', cardinalS: '#F59E0B' },
    '#F0F9FF',
    '224 242 254',
    '240 249 255',
  ),
  amber: buildPreset(
    'amber',
    '#D97706',
    '#FBBF24',
    '#B45309',
    ['#B45309', '#D97706'],
    { cyan: '#F59E0B', sky: '#FBBF24', indigo: '#92400E', cardinalS: '#0D9488' },
    '#FFFBEB',
    '254 243 199',
    '255 251 235',
  ),
  rose: buildPreset(
    'rose',
    '#E11D48',
    '#FB7185',
    '#BE123C',
    ['#BE123C', '#E11D48'],
    { cyan: '#F43F5E', sky: '#FB7185', indigo: '#9F1239', cardinalS: '#0F766E' },
    '#FFF1F2',
    '255 228 230',
    '255 241 242',
  ),
  slate: buildPreset(
    'slate',
    '#475569',
    '#94A3B8',
    '#1E293B',
    ['#1E293B', '#475569'],
    { cyan: '#64748B', sky: '#94A3B8', indigo: '#334155', cardinalS: '#F59E0B' },
    '#F1F5F9',
    '226 232 240',
    '241 245 249',
  ),
  pink: buildPreset(
    'pink',
    '#DB2777',
    '#F472B6',
    '#9D174D',
    ['#9D174D', '#DB2777'],
    { cyan: '#EC4899', sky: '#F9A8D4', indigo: '#BE185D', cardinalS: '#0D9488' },
    '#FDF2F8',
    '252 231 243',
    '253 242 248',
  ),
  blush: buildPreset(
    'blush',
    '#F472B6',
    '#FBCFE8',
    '#DB2777',
    ['#DB2777', '#F472B6'],
    { cyan: '#F9A8D4', sky: '#FCE7F3', indigo: '#EC4899', cardinalS: '#14B8A6' },
    '#FDF2F8',
    '252 231 243',
    '255 241 242',
  ),
  lavender: buildPreset(
    'lavender',
    '#8B5CF6',
    '#C4B5FD',
    '#6D28D9',
    ['#6D28D9', '#8B5CF6'],
    { cyan: '#A78BFA', sky: '#DDD6FE', indigo: '#7C3AED', cardinalS: '#F472B6' },
    '#F5F3FF',
    '237 233 254',
    '245 243 255',
  ),
  peach: buildPreset(
    'peach',
    '#FB7185',
    '#FECDD3',
    '#E11D48',
    ['#E11D48', '#FB7185'],
    { cyan: '#FDA4AF', sky: '#FFE4E6', indigo: '#F43F5E', cardinalS: '#F59E0B' },
    '#FFF1F2',
    '255 228 230',
    '255 247 237',
  ),
  fuchsia: buildPreset(
    'fuchsia',
    '#C026D3',
    '#E879F9',
    '#86198F',
    ['#86198F', '#C026D3'],
    { cyan: '#D946EF', sky: '#F0ABFC', indigo: '#A21CAF', cardinalS: '#F472B6' },
    '#FDF4FF',
    '250 232 255',
    '253 244 255',
  ),
  wine: buildPreset(
    'wine',
    '#9F1239',
    '#E11D48',
    '#4C0519',
    ['#4C0519', '#9F1239'],
    { cyan: '#BE123C', sky: '#FB7185', indigo: '#881337', cardinalS: '#D97706' },
    '#FFF1F2',
    '255 228 230',
    '255 241 242',
  ),
  coral: buildPreset(
    'coral',
    '#EA580C',
    '#FB923C',
    '#9A3412',
    ['#9A3412', '#EA580C'],
    { cyan: '#F97316', sky: '#FDBA74', indigo: '#C2410C', cardinalS: '#0D9488' },
    '#FFF7ED',
    '255 237 213',
    '255 247 237',
  ),
  plum: buildPreset(
    'plum',
    '#7E22CE',
    '#A855F7',
    '#581C87',
    ['#581C87', '#7E22CE'],
    { cyan: '#9333EA', sky: '#C084FC', indigo: '#6B21A8', cardinalS: '#DB2777' },
    '#FAF5FF',
    '243 232 255',
    '250 245 255',
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
  mint: buildPreset(
    'mint',
    '#059669',
    '#34D399',
    '#047857',
    ['#047857', '#059669'],
    { cyan: '#10B981', sky: '#6EE7B7', indigo: '#065F46', cardinalS: '#F59E0B' },
    '#ECFDF5',
    '209 250 229',
    '240 253 244',
  ),
  forest: buildPreset(
    'forest',
    '#166534',
    '#22C55E',
    '#14532D',
    ['#14532D', '#166534'],
    { cyan: '#16A34A', sky: '#4ADE80', indigo: '#15803D', cardinalS: '#D97706' },
    '#F0FDF4',
    '220 252 231',
    '240 253 244',
  ),
  zinc: buildPreset(
    'zinc',
    '#52525B',
    '#A1A1AA',
    '#27272A',
    ['#27272A', '#52525B'],
    { cyan: '#71717A', sky: '#A1A1AA', indigo: '#3F3F46', cardinalS: '#F59E0B' },
    '#F4F4F5',
    '228 228 231',
    '250 250 250',
  ),
  stone: buildPreset(
    'stone',
    '#78716C',
    '#A8A29E',
    '#44403C',
    ['#44403C', '#78716C'],
    { cyan: '#A8A29E', sky: '#D6D3D1', indigo: '#57534E', cardinalS: '#EA580C' },
    '#F5F5F4',
    '231 229 228',
    '250 250 249',
  ),
  charcoal: buildPreset(
    'charcoal',
    '#334155',
    '#64748B',
    '#0F172A',
    ['#0F172A', '#334155'],
    { cyan: '#475569', sky: '#94A3B8', indigo: '#1E293B', cardinalS: '#F59E0B' },
    '#F1F5F9',
    '226 232 240',
    '248 250 252',
  ),
};

const ALL_THEME_IDS = new Set<string>(Object.keys(PRESETS));

export function normalizeThemeId(raw?: string | null): ThemeId {
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
