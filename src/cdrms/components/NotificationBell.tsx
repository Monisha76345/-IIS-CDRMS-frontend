import {
  ActivityIndicator,
  Modal,
  Pressable as RNPressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/src/auth/AuthContext';
import { resolveAppRole } from '@/src/auth/roles';
import { COLORS } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';
import { useNotifications } from '@/src/cdrms/hooks/useNotifications';
import {
  formatNotifTime,
  navigateFromNotification,
  notifIconConfig,
  resolveNotificationAction,
} from '@/src/cdrms/notifications/helpers';
import type { AppNotification } from '@/src/api/notifications';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { ApiError } from '@/src/api/client';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';

type NotificationBellProps = {
  go: Go;
  variant?: 'header' | 'plain';
};

export function NotificationBell({ go, variant = 'header' }: NotificationBellProps) {
  const { width } = useWindowDimensions();
  const { accessToken, user } = useAuth();
  const role = resolveAppRole(user);

  const { openBackendTask } = useProject();
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  if (role === 'engineer' || role === 'zc') {
    return null;
  }

  const {
    items,
    unreadCount,
    badgeLabel,
    loading,
    error,
    refresh,
    markOne,
    markAll,
  } = useNotifications(accessToken, true);

  const inboxItems = useMemo(() => items.filter((n) => !n.isRead), [items]);

  const iconColor = variant === 'header' ? COLORS.white : COLORS.primary;
  const btnStyle =
    variant === 'header'
      ? {
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.35)',
        }
      : {
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: '#EFF6FF',
          borderWidth: 1,
          borderColor: '#BFDBFE',
        };

  const openPanel = () => {
    setOpen(true);
    void refresh();
  };

  const onMarkAll = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAll();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to mark all as read';
      showAppDialog({
        variant: 'error',
        title: 'Notifications',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const onOpenNotification = async (notif: AppNotification) => {
    try {
      if (!notif.isRead) {
        await markOne(notif.id);
      }
    } catch {
      // still navigate even if mark-read fails
    }
    setOpen(false);
    const action = resolveNotificationAction(notif, role);
    try {
      await navigateFromNotification(action, go, openBackendTask);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unable to open notification';
      showAppDialog({
        variant: 'error',
        title: 'Notification',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    }
  };

  const onDismiss = async (notif: AppNotification) => {
    try {
      await markOne(notif.id);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to dismiss notification';
      showAppDialog({
        variant: 'error',
        title: 'Notifications',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    }
  };

  return (
    <>
      <Pressable
        onPress={openPanel}
        accessibilityRole="button"
        accessibilityLabel={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
        className="items-center justify-center active:opacity-85"
        style={btnStyle}
      >
        <Bell size={16} color={iconColor} fill={open ? iconColor : 'transparent'} />
        {unreadCount > 0 ? (
          <Box
            className="absolute items-center justify-center rounded-full"
            style={{
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 4,
              backgroundColor: '#EF4444',
              borderWidth: 2,
              borderColor: variant === 'header' ? '#2563EB' : '#FFFFFF',
            }}
          >
            <Text className="text-[10px] font-bold text-white leading-none">{badgeLabel}</Text>
          </Box>
        ) : null}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <RNPressable
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.35)' }}
          onPress={() => setOpen(false)}
        >
          <Box
            style={{
              position: 'absolute',
              top: 56,
              right: 16,
              width: Math.min(400, width - 32),
              maxHeight: 480,
              backgroundColor: COLORS.white,
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.15,
              shadowRadius: 30,
              elevation: 12,
            }}
          >
            <RNPressable onPress={(e) => e.stopPropagation()}>
              <HStack
                className="items-center justify-between"
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F8FAFC',
                }}
              >
                <Text className="text-base font-bold" style={{ color: '#0F172A' }}>
                  Notifications
                </Text>
                <Pressable
                  onPress={() => void onMarkAll()}
                  disabled={markingAll || unreadCount === 0}
                  className="active:opacity-70"
                  style={{ opacity: markingAll || unreadCount === 0 ? 0.4 : 1 }}
                >
                  <Text className="text-xs font-bold" style={{ color: COLORS.primary }}>
                    Mark all as read
                  </Text>
                </Pressable>
              </HStack>

              <HStack
                className="items-center"
                style={{
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F8FAFC',
                }}
              >
                <Box
                  style={{
                    borderBottomWidth: 2,
                    borderBottomColor: '#0F172A',
                    paddingVertical: 10,
                  }}
                >
                  <HStack className="items-center" style={{ gap: 8 }}>
                    <Text className="text-sm font-bold" style={{ color: '#0F172A' }}>
                      Inbox
                    </Text>
                    <Box
                      className="rounded-md items-center justify-center"
                      style={{
                        backgroundColor: '#0F172A',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text className="text-[10px] font-bold text-white">{unreadCount}</Text>
                    </Box>
                  </HStack>
                </Box>
              </HStack>

              <ScrollView style={{ maxHeight: 360 }} bounces={false}>
                {loading && items.length === 0 ? (
                  <Box className="items-center justify-center" style={{ paddingVertical: 48 }}>
                    <ActivityIndicator color={COLORS.primary} />
                  </Box>
                ) : error ? (
                  <Text
                    className="text-sm text-center"
                    style={{ color: '#DC2626', paddingHorizontal: 20, paddingVertical: 40 }}
                  >
                    {error}
                  </Text>
                ) : inboxItems.length === 0 ? (
                  <Text
                    className="text-sm text-center"
                    style={{ color: '#64748B', paddingHorizontal: 20, paddingVertical: 48 }}
                  >
                    All caught up — no new notifications.
                  </Text>
                ) : (
                  <VStack>
                    <Text
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: '#94A3B8', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}
                    >
                      Updates
                    </Text>
                    {inboxItems.map((notif) => {
                      const { Icon, bg, color } = notifIconConfig(notif.type);
                      return (
                        <Pressable
                          key={notif.id}
                          onPress={() => void onOpenNotification(notif)}
                          className="active:opacity-90"
                          style={{
                            flexDirection: 'row',
                            gap: 12,
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            backgroundColor: '#EFF6FF66',
                            borderBottomWidth: 1,
                            borderBottomColor: '#F8FAFC',
                          }}
                        >
                          <Box
                            className="items-center justify-center rounded-full shrink-0"
                            style={{ width: 40, height: 40, backgroundColor: bg }}
                          >
                            <Icon size={18} color={color} />
                          </Box>
                          <VStack className="flex-1 min-w-0" style={{ gap: 4 }}>
                            <HStack className="items-start justify-between" style={{ gap: 8 }}>
                              <Text
                                className="text-sm font-bold flex-1"
                                style={{ color: '#0F172A' }}
                                numberOfLines={2}
                              >
                                {notif.title}
                              </Text>
                              {!notif.isRead ? (
                                <Pressable
                                  onPress={(e) => {
                                    e?.stopPropagation?.();
                                    void onDismiss(notif);
                                  }}
                                  hitSlop={8}
                                  className="active:opacity-70 shrink-0"
                                >
                                  <Text className="text-xs font-bold" style={{ color: COLORS.primary }}>
                                    Dismiss
                                  </Text>
                                </Pressable>
                              ) : null}
                            </HStack>
                            <Text className="text-[13px]" style={{ color: '#475569' }} numberOfLines={3}>
                              {notif.message}
                            </Text>
                            <HStack className="items-center justify-between" style={{ gap: 8 }}>
                              <Text className="text-[11px]" style={{ color: '#94A3B8' }} numberOfLines={1}>
                                {formatNotifTime(notif.createdAt)}
                                {notif.applicationNumber ? ` · ${notif.applicationNumber}` : ''}
                              </Text>
                              {!notif.isRead ? (
                                <Box
                                  className="rounded-full shrink-0"
                                  style={{ width: 8, height: 8, backgroundColor: COLORS.primary }}
                                />
                              ) : null}
                            </HStack>
                          </VStack>
                        </Pressable>
                      );
                    })}
                  </VStack>
                )}
              </ScrollView>
            </RNPressable>
          </Box>
        </RNPressable>
      </Modal>
    </>
  );
}
