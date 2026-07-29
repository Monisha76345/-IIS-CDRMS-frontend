import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiRequest, ApiError } from '@/src/api/client';

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
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (loginIdOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
        if (token) setAccessToken(token);
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
      const role = `${res.user?.userType || ''} ${res.user?.role || ''}`.toLowerCase();
      if (role && !role.includes('engineer') && !role.includes('super_admin')) {
        throw new ApiError(
          403,
          'This mobile app is for site engineers. Use the web portal for other roles.',
        );
      }
      await saveItem(TOKEN_KEY, res.accessToken);
      await saveItem(USER_KEY, JSON.stringify(res.user ?? {}));
      setAccessToken(res.accessToken);
      setUser(res.user ?? {});
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

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
    }),
    [user, accessToken, login, logout],
  );

  if (!hydrated) return null;

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
