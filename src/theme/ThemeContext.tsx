import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { apiRequest } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthContext';
import {
  applyTheme,
  applyAuthTheme,
  currentThemeId,
  DEFAULT_THEME_ID,
  normalizeThemeId,
  THEME_OPTIONS,
  type ThemeId,
} from '@/src/cdrms/theme';
import { applyUniwindTheme } from '@/src/theme/applyUniwindTheme';

const THEME_STORAGE_KEY = 'cdrms_theme_preference';

type ThemeContextValue = {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => Promise<void>;
  themeOptions: typeof THEME_OPTIONS;
  themeReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function saveThemeLocal(id: ThemeId) {
  if (Platform.OS === 'web') {
    localStorage.setItem(THEME_STORAGE_KEY, id);
    return;
  }
  await SecureStore.setItemAsync(THEME_STORAGE_KEY, id);
}

async function clearThemeLocal() {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(THEME_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function activateTheme(id: ThemeId) {
  applyTheme(id);
  applyUniwindTheme(id);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, updateSessionUser, isAuthenticated } = useAuth();
  const [themeId, setThemeId] = useState<ThemeId>(currentThemeId);
  const [themeReady, setThemeReady] = useState(false);

  useLayoutEffect(() => {
    if (isAuthenticated) return;
    // Pre-auth: restore last local theme so login mesh is theme-wise.
    let cancelled = false;
    void (async () => {
      try {
        let raw: string | null = null;
        if (Platform.OS === 'web') {
          raw = localStorage.getItem(THEME_STORAGE_KEY);
        } else {
          raw = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        }
        const next = normalizeThemeId(raw);
        if (cancelled) return;
        activateTheme(next);
        setThemeId(next);
      } catch {
        if (!cancelled) {
          applyAuthTheme();
          setThemeId(DEFAULT_THEME_ID);
        }
      } finally {
        if (!cancelled) setThemeReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Server preference wins; otherwise keep the theme tried on login.
    const next = user?.themePreference
      ? normalizeThemeId(user.themePreference)
      : normalizeThemeId(themeId);
    activateTheme(next);
    setThemeId(next);
    setThemeReady(true);
    void saveThemeLocal(next);
    // themeId intentionally omitted — only react to auth/server preference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.themePreference]);

  const setTheme = useCallback(
    async (id: ThemeId) => {
      const next = normalizeThemeId(id);
      activateTheme(next);
      setThemeId(next);
      await saveThemeLocal(next);
      updateSessionUser({ themePreference: next });

      if (accessToken) {
        try {
          await apiRequest<{ themePreference: ThemeId }>('/auth/profile/theme', {
            method: 'PATCH',
            token: accessToken,
            body: { themePreference: next },
          });
        } catch {
          /* local theme still applied */
        }
      }
    },
    [accessToken, updateSessionUser],
  );

  const value = useMemo(
    () => ({
      themeId,
      setTheme,
      themeOptions: THEME_OPTIONS,
      themeReady,
    }),
    [themeId, setTheme, themeReady],
  );

  if (!themeReady) return null;

  return (
    <ThemeContext value={value}>
      <View style={{ flex: 1 }}>{children}</View>
    </ThemeContext>
  );
}

export function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
