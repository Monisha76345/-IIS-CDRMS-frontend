import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { apiRequest, ApiError, configureApiAuth } from '@/src/api/client';
import { isMobileAllowedRole } from '@/src/auth/roles';
import { applyAuthTheme } from '@/src/cdrms/theme';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';

const TOKEN_KEY = 'cdrms_access_token';
const REFRESH_TOKEN_KEY = 'cdrms_refresh_token';
const USER_KEY = 'cdrms_auth_user';
const DEFAULT_TIMEOUT_MINUTES = 30;

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string | null;
  loginId?: string | null;
  userType?: string;
  role?: string;
  roleName?: string;
  profilePhoto?: string | null;
  themePreference?: string;
  status?: string;
  activePost?: {
    postId?: string;
    postName?: string | null;
    ofcAddress?: string | null;
    locationId?: number | null;
    location?: string | null;
    zoneId?: number | null;
    zoneCode?: string | null;
  } | null;
  officer?: {
    personUniqueId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    mobileNumber?: string | null;
    gender?: string | null;
    department?: string | null;
    districtName?: string | null;
    state?: string | null;
    status?: string | null;
    profilePhoto?: string | null;
  } | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (loginIdOrEmail: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfilePhoto: (photoUriOrBase64: string | null) => Promise<void>;
  updateSessionUser: (patch: Partial<AuthUser>) => void;
  refreshProfile: () => Promise<AuthUser | null>;
  /** Call on user activity to reset idle session timer. */
  touchSession: () => void;
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
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutMsRef = useRef(DEFAULT_TIMEOUT_MINUTES * 60_000);
  const loggingOutRef = useRef(false);

  accessTokenRef.current = accessToken;
  refreshTokenRef.current = refreshToken;

  const clearSessionLocal = useCallback(async () => {
    await deleteItem(TOKEN_KEY);
    await deleteItem(REFRESH_TOKEN_KEY);
    await deleteItem(USER_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    applyAuthTheme();
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    try {
      if (accessTokenRef.current) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token: accessTokenRef.current,
          body: refreshTokenRef.current
            ? { refreshToken: refreshTokenRef.current }
            : undefined,
          skipAuthRefresh: true,
        });
      }
    } catch {
      // clear local anyway
    }
    await clearSessionLocal();
  }, [clearSessionLocal]);

  const expireSession = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    try {
      await logout();
      showAppDialog({
        variant: 'warning',
        title: 'Session timed out',
        message: 'You were signed out due to inactivity. Please sign in again.',
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      loggingOutRef.current = false;
    }
  }, [logout]);

  const armIdleTimer = useCallback(() => {
    if (!accessTokenRef.current) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      void expireSession();
    }, timeoutMsRef.current);
  }, [expireSession]);

  const touchSession = useCallback(() => {
    armIdleTimer();
  }, [armIdleTimer]);

  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => accessTokenRef.current,
      getRefreshToken: () => refreshTokenRef.current,
      setTokens: async (access, refresh) => {
        accessTokenRef.current = access;
        setAccessToken(access);
        await saveItem(TOKEN_KEY, access);
        if (refresh) {
          refreshTokenRef.current = refresh;
          setRefreshToken(refresh);
          await saveItem(REFRESH_TOKEN_KEY, refresh);
        }
      },
      onSessionExpired: async () => {
        applyAuthTheme();
        await clearSessionLocal();
        showAppDialog({
          variant: 'warning',
          title: 'Session expired',
          message: 'Please sign in again.',
          hideCancel: true,
          confirmLabel: 'OK',
        });
      },
    });
  }, [clearSessionLocal]);

  useEffect(() => {
    (async () => {
      try {
        const [token, refresh, rawUser] = await Promise.all([
          readItem(TOKEN_KEY),
          readItem(REFRESH_TOKEN_KEY),
          readItem(USER_KEY),
        ]);

        if (!token) {
          if (rawUser) await deleteItem(USER_KEY);
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);
          return;
        }

        setRefreshToken(refresh);
        refreshTokenRef.current = refresh;

        try {
          const profile = await apiRequest<AuthUser>('/auth/profile', { token });
          if (!profile || !(profile.id || profile.email || profile.loginId)) {
            throw new Error('Invalid profile');
          }
          const cached = rawUser ? (JSON.parse(rawUser) as AuthUser) : {};
          const merged = { ...cached, ...profile };
          setAccessToken(token);
          setUser(merged);
          void saveItem(USER_KEY, JSON.stringify(merged));
        } catch (err) {
          const authRejected =
            err instanceof ApiError && (err.status === 401 || err.status === 403);
          const transient =
            err instanceof ApiError && !authRejected && Boolean(rawUser);

          if (transient) {
            setAccessToken(token);
            setUser(JSON.parse(rawUser!) as AuthUser);
            return;
          }

          await clearSessionLocal();
        }
      } catch {
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      } finally {
        setHydrated(true);
      }
    })();
  }, [clearSessionLocal]);

  useEffect(() => {
    if (!accessToken) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    let cancelled = false;
    void apiRequest<{ sessionTimeoutMinutes?: number }>('/auth/session-config', {
      skipAuthRefresh: true,
    })
      .then((cfg) => {
        if (cancelled) return;
        const minutes = Number(cfg?.sessionTimeoutMinutes);
        if (Number.isFinite(minutes) && minutes > 0) {
          timeoutMsRef.current = minutes * 60_000;
        }
        armIdleTimer();
      })
      .catch(() => {
        if (!cancelled) armIdleTimer();
      });

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') armIdleTimer();
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      sub.remove();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [accessToken, armIdleTimer]);

  const login = useCallback(async (loginIdOrEmail: string, password: string) => {
    try {
      const res = await apiRequest<{
        user: AuthUser;
        accessToken: string;
        refreshToken?: string;
      }>('/auth/login', {
        method: 'POST',
        body: { email: loginIdOrEmail.trim(), password },
        skipAuthRefresh: true,
      });
      if (!res.accessToken) {
        throw new ApiError(500, 'Login succeeded but no access token returned');
      }
      if (res.user && !isMobileAllowedRole(res.user)) {
        throw new ApiError(
          403,
          'This mobile app supports Engineers, Zone Commissioners, and CAO. Use the web portal for other roles.',
        );
      }
      const nextUser = res.user ?? {};
      await saveItem(TOKEN_KEY, res.accessToken);
      if (res.refreshToken) {
        await saveItem(REFRESH_TOKEN_KEY, res.refreshToken);
        setRefreshToken(res.refreshToken);
        refreshTokenRef.current = res.refreshToken;
      }
      await saveItem(USER_KEY, JSON.stringify(nextUser));
      setAccessToken(res.accessToken);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, 'Unable to reach CDRMS API. Check EXPO_PUBLIC_API_URL.');
    }
  }, []);

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

  const updateSessionUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      void saveItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) return null;
    try {
      const profile = await apiRequest<AuthUser>('/auth/profile', {
        token: accessToken,
      });
      if (!profile || !(profile.id || profile.email || profile.loginId)) {
        return null;
      }
      setUser((prev) => {
        const merged = { ...(prev || {}), ...profile };
        void saveItem(USER_KEY, JSON.stringify(merged));
        return merged;
      });
      return profile;
    } catch {
      return null;
    }
  }, [accessToken]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
      updateProfilePhoto,
      updateSessionUser,
      refreshProfile,
      touchSession,
    }),
    [
      user,
      accessToken,
      login,
      logout,
      updateProfilePhoto,
      updateSessionUser,
      refreshProfile,
      touchSession,
    ],
  );

  if (!hydrated) return null;

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
