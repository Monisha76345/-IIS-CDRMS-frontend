import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiRequest, ApiError } from '@/src/api/client';
import { isMobileAllowedRole } from '@/src/auth/roles';

const TOKEN_KEY = 'cdrms_access_token';
const USER_KEY = 'cdrms_auth_user';

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string | null;
  loginId?: string | null;
  userType?: string;
  role?: string;
  roleName?: string;
  profilePhoto?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (loginIdOrEmail: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfilePhoto: (photoUriOrBase64: string | null) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function readItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [token, rawUser] = await Promise.all([
          readItem(TOKEN_KEY),
          readItem(USER_KEY),
        ]);
        if (token) {
          setAccessToken(token);
          // Sync fresh profile data from backend on launch if token present
          apiRequest<AuthUser>('/auth/profile', { token })
            .then((p) => {
              if (p && (p.id || p.email)) {
                setUser((prev) => {
                  const merged = { ...prev, ...p };
                  void saveItem(USER_KEY, JSON.stringify(merged));
                  return merged;
                });
              }
            })
            .catch(() => {
              /* fallback to cached user */
            });
        }
        if (rawUser) setUser(JSON.parse(rawUser) as AuthUser);
      } catch {
        // ignore corrupt session
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const login = useCallback(async (loginIdOrEmail: string, password: string) => {
    try {
      const res = await apiRequest<{
        user: AuthUser;
        accessToken: string;
        refreshToken?: string;
      }>('/auth/login', {
        method: 'POST',
        body: { email: loginIdOrEmail.trim(), password },
      });
      if (!res.accessToken) {
        throw new ApiError(500, 'Login succeeded but no access token returned');
      }
      if (res.user && !isMobileAllowedRole(res.user)) {
        throw new ApiError(
          403,
          'This mobile app supports Engineers, Zonal Commissioners, and CAO. Use the web portal for other roles.',
        );
      }
      const nextUser = res.user ?? {};
      await saveItem(TOKEN_KEY, res.accessToken);
      await saveItem(USER_KEY, JSON.stringify(nextUser));
      setAccessToken(res.accessToken);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, 'Unable to reach CDRMS API. Check EXPO_PUBLIC_API_URL.');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token: accessToken,
        });
      }
    } catch {
      // clear local anyway
    }
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, [accessToken]);

  const updateProfilePhoto = useCallback(
    async (photoUriOrBase64: string | null) => {
      let dataUrl: string | null = photoUriOrBase64;

      if (
        photoUriOrBase64 &&
        (photoUriOrBase64.startsWith('file://') ||
          photoUriOrBase64.startsWith('ph://') ||
          photoUriOrBase64.startsWith('content://'))
      ) {
        try {
          const base64 = await FileSystem.readAsStringAsync(photoUriOrBase64, {
            encoding: 'base64',
          });
          dataUrl = `data:image/jpeg;base64,${base64}`;
        } catch {
          dataUrl = photoUriOrBase64;
        }
      }

      if (accessToken) {
        try {
          if (dataUrl) {
            await apiRequest<{ success: boolean; profilePhoto: string }>('/auth/profile/avatar', {
              method: 'POST',
              token: accessToken,
              body: { profilePhoto: dataUrl },
            });
          } else {
            await apiRequest('/auth/profile/avatar', {
              method: 'DELETE',
              token: accessToken,
            });
          }
        } catch (e) {
          console.warn('[AuthContext] Backend avatar sync warning:', e);
        }
      }

      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, profilePhoto: dataUrl };
        void saveItem(USER_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [accessToken],
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
      updateProfilePhoto,
    }),
    [user, accessToken, login, logout, updateProfilePhoto],
  );

  if (!hydrated) return null;

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
