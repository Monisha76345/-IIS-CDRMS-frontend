import { Uniwind } from 'uniwind';

import { buildThemePreset, type ThemeId } from '@/src/cdrms/themePresets';

/** Push theme primary palette into Uniwind CSS variables (Tailwind className colors). */
export function applyUniwindTheme(id: ThemeId) {
  const preset = buildThemePreset(id);
  const v = preset.uniwind;

  Uniwind.updateCSSVariables('light', {
    '--primary': v.primary,
    '--primary-glow': v.primaryGlow,
    '--primary-deep': v.primaryDeep,
    '--ring': v.ring,
    '--accent': v.accent,
    '--accent-foreground': v.accentForeground,
    '--secondary': v.secondary,
  });
}
