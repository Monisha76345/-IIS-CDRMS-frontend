import { Platform, type ViewStyle } from 'react-native';

import { COLORS, DESIGN, GLASS, hexAlpha } from '@/src/cdrms/theme';

/**
 * Shared surface chrome for cards / panels — changes with theme layout family.
 *
 * Classic  → elevated white cards + soft shadow
 * Soft     → borderless floating panels
 * Bold     → luminous white cards with soft top accent + deep shadow
 * Nature   → primary-tinted fill
 * Minimal  → plain / flat (no card look)
 */
export function cardSurfaceStyle(opts?: {
  /** Tighter shadow for nested panels */
  nested?: boolean;
  /** Override horizontal margin (SurveyCard uses gutter) */
  marginHorizontal?: number;
  /** Soft frosted fill so page watermark shows through (View Application). */
  translucent?: boolean;
}): ViewStyle {
  const cv = DESIGN.cardVariant;
  const nested = Boolean(opts?.nested);
  const mh = opts?.marginHorizontal;
  const frost = opts?.translucent ? 'rgba(255,255,255,0.55)' : null;

  const base: ViewStyle = {
    borderRadius: cv === 'flat' ? 0 : DESIGN.cardRadius,
    // Keep overflow off the bordered shell — overflow:'hidden' on the same
    // view clips the border on Android (cards look borderless).
    ...(mh != null ? { marginHorizontal: mh } : null),
  };

  switch (cv) {
    case 'soft':
      // Plain — soft pastel panel (smart-home card feel)
      return {
        ...base,
        backgroundColor: frost ?? hexAlpha(COLORS.primary, 0.06),
        borderWidth: 0,
        shadowColor: GLASS.shadow,
        shadowOffset: { width: 0, height: nested ? 2 : 6 },
        shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0.04,
        shadowRadius: nested ? 8 : 14,
        elevation: nested ? 1 : 2,
        marginBottom: nested ? 0 : 12,
      };
    case 'outline':
      // Bold — luminous white cards with soft top accent (no black / side bars)
      return {
        ...base,
        backgroundColor: frost ?? COLORS.white,
        borderWidth: 0,
        borderTopWidth: 3,
        borderTopColor: COLORS.primary,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: nested ? 4 : 10 },
        shadowOpacity: Platform.OS === 'ios' ? 0.14 : 0.1,
        shadowRadius: nested ? 10 : 18,
        elevation: nested ? 3 : 5,
      };
    case 'tinted':
      // Mesh — solid white cards with soft tint (no bleed/overlap)
      return {
        ...base,
        backgroundColor: frost ?? COLORS.white,
        borderWidth: 1.5,
        borderColor: hexAlpha(COLORS.primary, 0.22),
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.06,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: nested ? 0 : 10,
      };
    case 'flat':
      return {
        ...base,
        backgroundColor: frost ?? 'transparent',
        borderWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        borderRadius: 0,
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        paddingBottom: 2,
      };
    case 'elevated':
    default:
      return {
        ...base,
        backgroundColor: frost ?? COLORS.white,
        // Visible primary-tinted border (Ocean Blue had borderWidth 0 — cards looked borderless)
        borderWidth: Math.max(DESIGN.borderWidth || 0, 1.5),
        borderColor: hexAlpha(COLORS.primary, nested ? 0.5 : 0.58),
        shadowColor: GLASS.shadow,
        shadowOffset: { width: 0, height: nested ? 2 : 6 },
        shadowOpacity: Platform.OS === 'ios' ? DESIGN.shadowOpacity * (frost ? 0.55 : 1) : DESIGN.shadowOpacity * (frost ? 0.45 : 0.8),
        shadowRadius: DESIGN.shadowRadius,
        elevation: frost ? Math.max(1, DESIGN.elevation - 1) : DESIGN.elevation,
        marginBottom: nested ? 0 : 10,
      };
  }
}

/** Body fill inside a section card (under header). */
export function cardBodyStyle(opts?: { translucent?: boolean }): ViewStyle {
  const cv = DESIGN.cardVariant;
  if (opts?.translucent) {
    return { backgroundColor: 'rgba(255,255,255,0.28)' };
  }
  switch (cv) {
    case 'tinted':
      return { backgroundColor: hexAlpha(COLORS.primary, 0.03) };
    case 'soft':
      return { backgroundColor: COLORS.white };
    case 'flat':
      return { backgroundColor: 'transparent' };
    case 'outline':
      return { backgroundColor: COLORS.white };
    default:
      return { backgroundColor: GLASS.cardSolid };
  }
}

/** Whether section cards should show the gradient header bar. */
export function cardShowsGradientHeader(): boolean {
  // Bold uses a soft tinted header (cleaner with top-accent cards)
  return DESIGN.cardVariant === 'elevated';
}

/** Soft / nature / minimal use a lighter plain header instead of gradient. */
export function cardPlainHeaderStyle(): ViewStyle {
  const cv = DESIGN.cardVariant;
  if (cv === 'soft') {
    return {
      backgroundColor: hexAlpha(COLORS.primary, 0.08),
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderBottomWidth: 0,
    };
  }
  if (cv === 'outline') {
    return {
      backgroundColor: hexAlpha(COLORS.primary, 0.07),
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: hexAlpha(COLORS.primary, 0.1),
    };
  }
  if (cv === 'tinted') {
    return {
      backgroundColor: hexAlpha(COLORS.primary, 0.12),
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: hexAlpha(COLORS.primary, 0.15),
    };
  }
  // flat / fallback
  return {
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  };
}
