import type { ThemeId } from '@/src/cdrms/themePresets';

/**
 * Layout / chrome design family — each theme maps to a visibly different UI system
 * (steppers, cards, filters, list rows), not only a color palette.
 */
export type LayoutId = 'classic' | 'soft' | 'bold' | 'nature' | 'minimal';

/** How the survey step rail is drawn */
export type StepVariant = 'rail' | 'pills' | 'blocks' | 'dots' | 'underline';
/** How section / list cards are drawn */
export type CardVariant = 'elevated' | 'soft' | 'outline' | 'flat' | 'tinted';
/** How office filter/status tiles look */
export type FilterVariant = 'tiles' | 'pills' | 'blocks' | 'chips' | 'tabs';
/** How application list rows look */
export type ListVariant = 'card' | 'strip' | 'tile' | 'row' | 'ghost';

export type ThemeLayout = {
  id: LayoutId;
  label: string;
  /** One-line description shown in Profile theme picker */
  blurb: string;

  stepVariant: StepVariant;
  cardVariant: CardVariant;
  filterVariant: FilterVariant;
  listVariant: ListVariant;

  /** Screen / sheet corner radius */
  radius: number;
  radiusLg: number;
  /** Cards & section shells */
  cardRadius: number;
  /** Primary / continue buttons */
  buttonRadius: number;
  /** Step icons */
  stepRadius: number;
  stepSize: number;
  /** Header bottom corners */
  headerRadius: number;
  /** Header gradient direction */
  headerStart: { x: number; y: number };
  headerEnd: { x: number; y: number };
  /** Card header gradient direction */
  cardHeaderStart: { x: number; y: number };
  cardHeaderEnd: { x: number; y: number };
  /** Elevation */
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
  /** Filter / chip shape */
  chipRadius: number;
  /** Border weight on cards */
  borderWidth: number;
  /** Compact vs airy section gaps */
  sectionGap: number;
  /** Space between survey header/stepper and first card */
  headerCardGap: number;
  /** Footer CTA height */
  ctaHeight: number;
};

const LAYOUTS: Record<LayoutId, ThemeLayout> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    blurb: 'Numbered rail · elevated cards',
    stepVariant: 'rail',
    cardVariant: 'elevated',
    filterVariant: 'tiles',
    listVariant: 'card',
    radius: 16,
    radiusLg: 20,
    cardRadius: 18,
    buttonRadius: 14,
    stepRadius: 999,
    stepSize: 30,
    headerRadius: 24,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 1, y: 0 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    chipRadius: 14,
    borderWidth: 1,
    sectionGap: 8,
    headerCardGap: 14,
    ctaHeight: 46,
  },
  soft: {
    id: 'soft',
    label: 'Soft',
    blurb: 'Pill steppers · floating soft cards',
    stepVariant: 'pills',
    cardVariant: 'soft',
    filterVariant: 'pills',
    listVariant: 'strip',
    radius: 22,
    radiusLg: 28,
    cardRadius: 22,
    buttonRadius: 999,
    stepRadius: 999,
    stepSize: 36,
    headerRadius: 36,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 1, y: 1 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 2,
    chipRadius: 999,
    borderWidth: 0,
    sectionGap: 10,
    headerCardGap: 16,
    ctaHeight: 46,
  },
  bold: {
    id: 'bold',
    label: 'Bold',
    blurb: 'Elegant progress · luminous cards',
    stepVariant: 'blocks',
    cardVariant: 'outline',
    filterVariant: 'tiles',
    listVariant: 'card',
    radius: 18,
    radiusLg: 22,
    cardRadius: 20,
    buttonRadius: 14,
    stepRadius: 999,
    stepSize: 36,
    headerRadius: 28,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 1, y: 0.85 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    chipRadius: 16,
    borderWidth: 0,
    sectionGap: 14,
    headerCardGap: 20,
    ctaHeight: 48,
  },
  nature: {
    id: 'nature',
    label: 'Nature',
    blurb: 'Dot trail · tinted nature cards',
    stepVariant: 'dots',
    cardVariant: 'tinted',
    filterVariant: 'chips',
    listVariant: 'row',
    radius: 18,
    radiusLg: 24,
    cardRadius: 16,
    buttonRadius: 16,
    stepRadius: 14,
    stepSize: 32,
    headerRadius: 32,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 0.8, y: 1 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 0.6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3,
    chipRadius: 18,
    borderWidth: 1,
    sectionGap: 8,
    headerCardGap: 14,
    ctaHeight: 46,
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    blurb: 'Underline tabs · plain flat panels',
    stepVariant: 'underline',
    cardVariant: 'flat',
    filterVariant: 'tabs',
    listVariant: 'ghost',
    radius: 6,
    radiusLg: 8,
    cardRadius: 8,
    buttonRadius: 6,
    stepRadius: 4,
    stepSize: 26,
    headerRadius: 0,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 1, y: 0 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 0 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0,
    chipRadius: 6,
    borderWidth: 1,
    sectionGap: 6,
    headerCardGap: 12,
    ctaHeight: 42,
  },
};

const THEME_LAYOUT: Record<ThemeId, LayoutId> = {
  blue: 'classic',
  sky: 'classic',
  indigo: 'classic',
  azure: 'classic',
  teal: 'nature',
  emerald: 'nature',
  mint: 'nature',
  forest: 'nature',
  pink: 'soft',
  blush: 'soft',
  peach: 'soft',
  lavender: 'soft',
  fuchsia: 'soft',
  rose: 'bold',
  coral: 'bold',
  amber: 'bold',
  wine: 'bold',
  plum: 'bold',
  slate: 'minimal',
  zinc: 'minimal',
  stone: 'minimal',
  charcoal: 'minimal',
};

export function layoutIdForTheme(themeId: ThemeId): LayoutId {
  return THEME_LAYOUT[themeId] ?? 'classic';
}

export function buildThemeLayout(themeId: ThemeId): ThemeLayout {
  return { ...LAYOUTS[layoutIdForTheme(themeId)] };
}

export function getLayoutOption(id: LayoutId) {
  return LAYOUTS[id];
}
