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
}): ViewStyle {
  const cv = DESIGN.cardVariant;
  const nested = Boolean(opts?.nested);
  const mh = opts?.marginHorizontal;

  const base: ViewStyle = {
    borderRadius: cv === 'flat' ? 0 : DESIGN.cardRadius,
    overflow: 'hidden',
    ...(mh != null ? { marginHorizontal: mh } : null),
  };

  switch (cv) {
    case 'soft':
      return {
        ...base,
        backgroundColor: COLORS.white,
        borderWidth: 0,
        shadowColor: GLASS.shadow,
        shadowOffset: { width: 0, height: nested ? 4 : 12 },
        shadowOpacity: Platform.OS === 'ios' ? DESIGN.shadowOpacity + 0.02 : DESIGN.shadowOpacity,
        shadowRadius: DESIGN.shadowRadius + (nested ? 0 : 6),
        elevation: DESIGN.elevation + (nested ? 0 : 2),
      };
    case 'outline':
      // Bold — luminous white cards with soft top accent (no black / side bars)
      return {
        ...base,
        backgroundColor: COLORS.white,
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
      return {
        ...base,
        backgroundColor: hexAlpha(COLORS.primary, 0.06),
        borderWidth: 1,
        borderColor: hexAlpha(COLORS.primary, 0.18),
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0.04,
        shadowRadius: 10,
        elevation: 2,
      };
    case 'flat':
      return {
        ...base,
        backgroundColor: 'transparent',
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
        backgroundColor: COLORS.white,
        borderWidth: DESIGN.borderWidth,
        borderColor: COLORS.border,
        shadowColor: GLASS.shadow,
        shadowOffset: { width: 0, height: nested ? 2 : 6 },
        shadowOpacity: Platform.OS === 'ios' ? DESIGN.shadowOpacity : DESIGN.shadowOpacity * 0.8,
        shadowRadius: DESIGN.shadowRadius,
        elevation: DESIGN.elevation,
      };
  }
}

/** Body fill inside a section card (under header). */
export function cardBodyStyle(): ViewStyle {
  const cv = DESIGN.cardVariant;
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
