import {
  createContext,
  use,
  useCallback,
  useEffect,
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
  currentThemeId,
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

async function readThemeLocal(): Promise<ThemeId | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(THEME_STORAGE_KEY)
        : await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    return raw ? normalizeThemeId(raw) : null;
  } catch {
    return null;
  }
}

function activateTheme(id: ThemeId) {
  applyTheme(id);
  applyUniwindTheme(id);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, updateSessionUser } = useAuth();
  const [themeId, setThemeId] = useState<ThemeId>(currentThemeId);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cached = await readThemeLocal();
      const fromUser = normalizeThemeId(user?.themePreference);
      const next = user?.themePreference ? fromUser : (cached ?? fromUser);
      if (!cancelled) {
        activateTheme(next);
        setThemeId(next);
        setThemeReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.themePreference) return;
    const next = normalizeThemeId(user.themePreference);
    if (next === themeId) return;
    activateTheme(next);
    setThemeId(next);
    void saveThemeLocal(next);
  }, [user?.themePreference, themeId]);

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
