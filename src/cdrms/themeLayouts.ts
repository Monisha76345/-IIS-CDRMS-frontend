import type { ThemeId } from '@/src/cdrms/themePresets';

/**
 * Layout / chrome design family — each theme maps to a visibly different UI system
 * (steppers, cards, filters, list rows, header waves), not only a color palette.
 */
export type LayoutId = 'classic' | 'soft' | 'bold' | 'nature' | 'minimal' | 'ocean';

/** How the survey step rail is drawn */
export type StepVariant = 'rail' | 'pills' | 'blocks' | 'dots' | 'underline';
/** How section / list cards are drawn */
export type CardVariant = 'elevated' | 'soft' | 'outline' | 'flat' | 'tinted';
/** How office filter/status tiles look */
export type FilterVariant = 'tiles' | 'pills' | 'blocks' | 'chips' | 'tabs';
/** How application list rows look */
export type ListVariant = 'card' | 'strip' | 'tile' | 'row' | 'ghost';
/**
 * Header bottom edge shape — one per theme reference:
 * mesh       — animated filled waves (dual-tone Coral)
 * convex     — Introze gentle downward arc (Ocean Wave)
 * asymmetric — language-app swoop (Violet)
 * swoop      — large concave cutout (Teal unit style)
 * plain      — soft radius + line waves only (Plain)
 * solid      — original Ocean Blue solid gradient header
 */
export type HeaderWave = 'mesh' | 'convex' | 'asymmetric' | 'swoop' | 'plain' | 'solid';

export type ThemeLayout = {
  id: LayoutId;
  label: string;
  /** One-line description shown in Profile theme picker */
  blurb: string;

  stepVariant: StepVariant;
  cardVariant: CardVariant;
  filterVariant: FilterVariant;
  listVariant: ListVariant;
  headerWave: HeaderWave;

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
  /** Header bottom corners (used when headerWave is plain/mesh) */
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
  /** Original Ocean Blue — solid blue header · clean white cards (pre multi-design) */
  ocean: {
    id: 'ocean',
    label: 'Ocean Blue',
    blurb: 'Original solid ocean blue · normal header · clean cards',
    stepVariant: 'rail',
    cardVariant: 'elevated',
    filterVariant: 'tiles',
    listVariant: 'card',
    headerWave: 'solid',
    radius: 16,
    radiusLg: 20,
    cardRadius: 16,
    buttonRadius: 14,
    stepRadius: 12,
    stepSize: 30,
    headerRadius: 0,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 1, y: 1 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    chipRadius: 12,
    borderWidth: 1.5,
    sectionGap: 12,
    headerCardGap: 16,
    ctaHeight: 48,
  },
  /** Wave — Search Mechanic mock: navy header, white cards, deep-blue FAB nav */
  classic: {
    id: 'classic',
    label: 'Wave',
    blurb: 'Navy geometric header · white cards · deep-blue wave nav',
    stepVariant: 'rail',
    cardVariant: 'elevated',
    filterVariant: 'tiles',
    listVariant: 'card',
    headerWave: 'convex',
    radius: 20,
    radiusLg: 28,
    cardRadius: 20,
    buttonRadius: 999,
    stepRadius: 999,
    stepSize: 30,
    headerRadius: 0,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 1, y: 1 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    chipRadius: 14,
    borderWidth: 0,
    sectionGap: 12,
    headerCardGap: 16,
    ctaHeight: 48,
  },
  /** Plain — smart-home airy: light header · pastel cards · white page */
  soft: {
    id: 'soft',
    label: 'Plain',
    blurb: 'Light airy header · pastel cards · clean white page',
    stepVariant: 'pills',
    cardVariant: 'soft',
    filterVariant: 'pills',
    listVariant: 'strip',
    headerWave: 'plain',
    radius: 16,
    radiusLg: 18,
    cardRadius: 16,
    buttonRadius: 14,
    stepRadius: 12,
    stepSize: 32,
    headerRadius: 0,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 1, y: 1 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    chipRadius: 12,
    borderWidth: 0,
    sectionGap: 14,
    headerCardGap: 18,
    ctaHeight: 48,
  },
  /** Violet — language-app asymmetric purple blobs + pill cards */
  bold: {
    id: 'bold',
    label: 'Violet',
    blurb: 'Asymmetric purple waves · pill unit cards',
    stepVariant: 'blocks',
    cardVariant: 'outline',
    filterVariant: 'pills',
    listVariant: 'tile',
    headerWave: 'asymmetric',
    radius: 24,
    radiusLg: 36,
    cardRadius: 36,
    buttonRadius: 999,
    stepRadius: 999,
    stepSize: 36,
    headerRadius: 0,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 1, y: 0.85 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    chipRadius: 999,
    borderWidth: 0,
    sectionGap: 12,
    headerCardGap: 18,
    ctaHeight: 50,
  },
  /** Mesh — silk blobs · scalloped header lobes · soft rounded shell (not Wave) */
  nature: {
    id: 'nature',
    label: 'Mesh',
    blurb: 'Silk mesh blobs · scalloped header · soft rounded shell',
    stepVariant: 'dots',
    cardVariant: 'tinted',
    filterVariant: 'tiles',
    listVariant: 'card',
    headerWave: 'mesh',
    radius: 18,
    radiusLg: 24,
    cardRadius: 18,
    buttonRadius: 16,
    stepRadius: 12,
    stepSize: 32,
    /** Soft asymmetric shell — bottom corners only (Mesh Welcome / headers) */
    headerRadius: 40,
    headerStart: { x: 0.1, y: 0 },
    headerEnd: { x: 0.9, y: 1 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    chipRadius: 8,
    borderWidth: 1,
    sectionGap: 12,
    headerCardGap: 16,
    ctaHeight: 48,
  },
  /** Teal — large swoop header cutout + flat clean panels */
  minimal: {
    id: 'minimal',
    label: 'Teal',
    blurb: 'Big swoop header · clean teal panels',
    stepVariant: 'underline',
    cardVariant: 'flat',
    filterVariant: 'tabs',
    listVariant: 'ghost',
    headerWave: 'swoop',
    radius: 10,
    radiusLg: 12,
    cardRadius: 12,
    buttonRadius: 10,
    stepRadius: 8,
    stepSize: 28,
    headerRadius: 0,
    headerStart: { x: 0, y: 0 },
    headerEnd: { x: 1, y: 1 },
    cardHeaderStart: { x: 0, y: 0 },
    cardHeaderEnd: { x: 1, y: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    chipRadius: 8,
    borderWidth: 1,
    sectionGap: 8,
    headerCardGap: 14,
    ctaHeight: 46,
  },
};

/** All theme ids resolve to Ocean Blue layout. */
const THEME_LAYOUT: Record<ThemeId, LayoutId> = {
  ocean: 'ocean',
};

export function layoutIdForTheme(themeId: ThemeId): LayoutId {
  return THEME_LAYOUT[themeId] ?? 'ocean';
}

export function buildThemeLayout(themeId: ThemeId): ThemeLayout {
  return { ...LAYOUTS[layoutIdForTheme(themeId)] };
}

export function getLayoutOption(id: LayoutId) {
  return LAYOUTS[id];
}
