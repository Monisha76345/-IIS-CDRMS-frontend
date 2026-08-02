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
    if (!isAuthenticated) {
      // Pre-auth / logout — always Ocean Blue; drop any leftover device cache.
      applyAuthTheme();
      setThemeId(DEFAULT_THEME_ID);
      setThemeReady(true);
      void clearThemeLocal();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Server preference wins. If they never picked a theme (or continue past
    // geo without choosing), stay on Ocean Blue — do not revive a stale cache.
    const next = user?.themePreference
      ? normalizeThemeId(user.themePreference)
      : DEFAULT_THEME_ID;
    activateTheme(next);
    setThemeId(next);
    setThemeReady(true);
    void saveThemeLocal(next);
  }, [isAuthenticated, user?.themePreference]);

  const setTheme = useCallback(
    async (id: ThemeId) => {
      activateTheme(id);
      setThemeId(id);
      await saveThemeLocal(id);
      updateSessionUser({ themePreference: id });

      if (accessToken) {
        try {
          await apiRequest<{ themePreference: ThemeId }>('/auth/profile/theme', {
            method: 'PATCH',
            token: accessToken,
            body: { themePreference: id },
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
