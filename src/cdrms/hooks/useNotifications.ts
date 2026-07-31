import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/src/api/notifications';

const POLL_MS = 10_000;

export function useNotifications(accessToken: string | null, enabled = true) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken || !enabled) return;
    try {
      setError(null);
      const [list, count] = await Promise.all([
        fetchNotifications(accessToken),
        fetchUnreadNotificationCount(accessToken),
      ]);
      setItems(list);
      const unreadFromList = list.filter((n) => !n.isRead).length;
      setUnreadCount(Math.max(count, unreadFromList));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [accessToken, enabled]);

  useEffect(() => {
    if (!accessToken || !enabled) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') void refresh();
    };
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [accessToken, enabled, refresh]);

  const badgeLabel = useMemo(() => {
    if (unreadCount <= 0) return '';
    return unreadCount > 99 ? '99+' : String(unreadCount);
  }, [unreadCount]);

  const markOne = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      await markNotificationRead(accessToken, id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [accessToken],
  );

  const markAll = useCallback(async () => {
    if (!accessToken) return;
    await markAllNotificationsRead(accessToken);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [accessToken]);

  return {
    items,
    unreadCount,
    badgeLabel,
    loading,
    error,
    refresh,
    markOne,
    markAll,
  };
}
