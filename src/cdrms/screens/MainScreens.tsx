import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Edit3,
  FileText,
  FolderOpen,
  HelpCircle,
  Layers,
  Lock,
  LogOut,
  MapPin,
  MapPinned,
  MoreVertical,
  Phone,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Undo2,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import {
  AppCard,
  AppHeader,
  BottomNav,
  GradientHeader,
  IconBox,
  ScreenShell,
  StatusChip,
  ListLoader,
  ScreenLoader,
} from '@/src/cdrms/components/primitives';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { COLORS, FONTS } from '@/src/cdrms/theme';
import { TERMS } from '@/src/cdrms/terminology';
import type { Go, Screen } from '@/src/cdrms/types';
import { useAuth } from '@/src/auth/AuthContext';
import { displayName, homeScreenForRole, resolveAppRole } from '@/src/auth/roles';
import { ApiError } from '@/src/api/client';
import { fetchEngineerTasks, type MobileApplication } from '@/src/api/applications';
import { NotificationBell } from '@/src/cdrms/components/NotificationBell';
import { useNotifications } from '@/src/cdrms/hooks/useNotifications';
import {
  formatNotifTime,
  navigateFromNotification,
  notifIconConfig,
  resolveNotificationAction,
} from '@/src/cdrms/notifications/helpers';

function mapTaskStatus(status: MobileApplication['status']) {
  if (status === 'submitted') return 'Submitted';
  if (status === 'verified') return 'Verified';
  if (status === 'returned') return 'Returned';
  if (status === 'rejected') return 'Rejected';
  if (status === 'in_progress') return 'In progress';
  return 'Assigned';
}

function taskCoverImage(app: MobileApplication): string | null {
  if (app.selfieUrl?.trim()) return app.selfieUrl.trim();
  const firstPhoto = app.photoUrls?.find((u) => typeof u === 'string' && u.trim());
  if (firstPhoto) return firstPhoto.trim();
  const schedule = app.schedulePhotoUrls
    ? Object.values(app.schedulePhotoUrls).find((u) => typeof u === 'string' && u.trim())
    : null;
  if (schedule) return schedule.trim();
  return null;
}

function mapTaskCard(app: MobileApplication) {
  return {
    id: app.id,
    project: app.applicationNumber || `Site ${app.siteNo}`,
    siteNo: app.siteNo ? `Site ${app.siteNo}` : '',
    status: mapTaskStatus(app.status),
    date: app.zoneCode,
    village: [app.addressArea, app.addressBlock].filter(Boolean).join(', ') || '—',
    image: taskCoverImage(app),
    live: true as const,
    apiTask: true as const,
  };
}

export function Dashboard({ go }: { go: Go }) {
  const insets = useSafeAreaInsets();
  const { openBackendTask } = useProject();
  const { accessToken, user, logout } = useAuth();
  const [tasks, setTasks] = useState<MobileApplication[]>([]);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    const roleHome = homeScreenForRole(user);
    if (roleHome !== 'dashboard') {
      go(roleHome);
    }
  }, [user, go]);

  useEffect(() => {
    if (!accessToken) return;
    fetchEngineerTasks(accessToken)
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [accessToken]);

  const openAssignedTask = async (id: string) => {
    setOpeningId(id);
    try {
      await openBackendTask(id);
      go('project');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unable to open task';
      Alert.alert('Task', msg);
    } finally {
      setOpeningId(null);
    }
  };

  const taskCards = tasks
    .filter((t) => t.status === 'assigned' || t.status === 'in_progress' || t.status === 'returned')
    .slice(0, 5)
    .map(mapTaskCard);
  const recentCards = taskCards;
  const pending = tasks.filter(
    (t) => t.status === 'assigned' || t.status === 'in_progress' || t.status === 'returned',
  ).length;
  const submitted = tasks.filter((t) => t.status === 'submitted').length;
  const verified = tasks.filter((t) => t.status === 'verified').length;
  const returned = tasks.filter((t) => t.status === 'returned').length;

  const stats = [
    { label: 'Pending', value: pending, bg: '#EFF6FF', fg: '#2563EB', icon: FileText },
    { label: 'Submitted', value: submitted, bg: '#DBEAFE', fg: '#2563EB', icon: ClipboardCheck },
    { label: 'Verified', value: verified, bg: '#D1FAE5', fg: '#059669', icon: CheckCircle2 },
    { label: 'Returned', value: returned, bg: '#FFEDD5', fg: '#EA580C', icon: AlertTriangle },
  ];

  const actions: Array<{
    icon: typeof ClipboardCheck;
    watermark: typeof ClipboardCheck;
    label: string;
    desc: string;
    to: Screen;
    primary?: boolean;
    iconBg: string;
    iconColor: string;
    watermarkColor: string;
    onPress?: () => void;
  }> = [
    {
      icon: ClipboardCheck,
      watermark: ClipboardCheck,
      label: 'My assigned tasks',
      desc: pending > 0 ? `${pending} awaiting field capture` : 'No open tasks yet',
      to: 'history',
      primary: true,
      iconBg: 'rgba(255,255,255,0.22)',
      iconColor: '#FFFFFF',
      watermarkColor: 'rgba(255,255,255,0.22)',
    },
    {
      icon: Edit3,
      watermark: FileText,
      label: 'Continue open task',
      desc: taskCards[0] ? taskCards[0].project : 'Open a task from My Tasks',
      to: 'project',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      watermarkColor: 'rgba(37,99,235,0.14)',
      onPress: () => {
        if (taskCards[0]) void openAssignedTask(taskCards[0].id);
        else go('history');
      },
    },
  ];

  const progressFor = (status: string) => {
    if (status === 'Verified' || status === 'Approved') return 100;
    if (status === 'Submitted') return 60;
    if (status === 'Returned') return 40;
    if (status === 'Draft') return 20;
    return 30;
  };

  return (
    <ScreenShell className="bg-[#F3F4F6]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#1E40AF', '#2563EB', '#3B82F6']}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingBottom: 40,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            overflow: 'hidden',
          }}
        >
          <Box
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -80,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.14)',
            }}
          />
          <Box
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -40,
              right: 10,
              width: 140,
              height: 140,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          />

          <Box className="px-5" style={{ paddingTop: insets.top + 8 }}>
            <HStack className="items-center justify-between">
              <HStack className="items-center gap-3 flex-1 min-w-0">
                <Pressable
                  onPress={() => go('profile')}
                  className="active:opacity-85 items-center justify-center"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text className="font-extrabold text-[16px]" style={{ color: '#2563EB' }}>
                    {displayName(user)
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() || '')
                      .join('') || 'U'}
                  </Text>
                </Pressable>
                <VStack className="flex-1 min-w-0">
                  <Text className="text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Welcome back,
                  </Text>
                  <Text className="font-bold text-[17px] text-white" numberOfLines={1}>
                    {displayName(user)}
                  </Text>
                </VStack>
              </HStack>
              <HStack className="items-center gap-2">
              <NotificationBell go={go} variant="header" />
              <Pressable
                onPress={async () => {
                  await logout();
                  go('login');
                }}
                className="flex-row items-center gap-1 active:opacity-85"
                style={{
                  height: 36,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.35)',
                }}
              >
                <LogOut size={14} color={COLORS.white} />
                <Text className="text-[11px] font-bold text-white">Logout</Text>
              </Pressable>
              </HStack>
            </HStack>

            <HStack className="mt-4 items-center flex-wrap" style={{ gap: 6 }}>
              <Clock size={13} color="rgba(255,255,255,0.85)" />
              <Text className="text-[11px]" style={{ color: 'rgba(255,255,255,0.88)' }}>
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Text className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                ·
              </Text>
              <MapPin size={13} color="rgba(255,255,255,0.85)" />
              <Text className="text-[11px] flex-1" style={{ color: 'rgba(255,255,255,0.88)' }} numberOfLines={1}>
                {tasks[0]
                  ? `Zone ${tasks[0].zoneCode}${tasks[0].addressArea ? ` · ${tasks[0].addressArea}` : ''}`
                  : 'Assigned zone tasks'}
              </Text>
            </HStack>

            <Pressable
              onPress={() => go('history')}
              className="active:opacity-95"
            >
            <LinearGradient
              colors={['#1E40AF', '#2563EB', '#3B82F6']}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                marginTop: 14,
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.28)',
              }}
            >
              <HStack className="items-center justify-between" style={{ gap: 12 }}>
                <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: 11,
                      color: 'rgba(219,234,254,0.95)',
                    }}
                  >
                    Today&apos;s Applications
                  </Text>
                  <HStack className="items-baseline" style={{ gap: 6 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 22,
                        lineHeight: 26,
                        color: COLORS.white,
                      }}
                    >
                      {pending}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.medium,
                        fontSize: 13,
                        color: 'rgba(219,234,254,0.92)',
                      }}
                    >
                      open tasks
                    </Text>
                  </HStack>
                </VStack>
                <Box
                  className="items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.6} />
                </Box>
              </HStack>
            </LinearGradient>
            </Pressable>
          </Box>
        </LinearGradient>

        {/* Stats card overlapping header */}
        <Box className="px-4" style={{ marginTop: -28 }}>
          <Box
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              paddingVertical: 16,
              paddingHorizontal: 10,
              shadowColor: '#1E3A8A',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <HStack className="justify-between">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <Pressable
                    key={s.label}
                    onPress={() => go('history')}
                    className="flex-1 items-center active:opacity-80"
                  >
                    <Box
                      className="items-center justify-center rounded-full"
                      style={{ width: 44, height: 44, backgroundColor: s.bg }}
                    >
                      <Icon size={18} color={s.fg} strokeWidth={2.3} />
                    </Box>
                    <Text className="mt-2 text-[18px] font-extrabold" style={{ color: '#0F172A' }}>
                      {s.value}
                    </Text>
                    <Text className="text-[11px] font-semibold" style={{ color: '#94A3B8' }}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box className="px-4 mt-5">
          <Text className="text-[16px] font-bold mb-3" style={{ color: '#0F172A' }}>
            Quick Actions
          </Text>

          <Box className="flex-row flex-wrap" style={{ gap: 12 }}>
            {actions.map((a) => {
              const Icon = a.icon;
              const Watermark = a.watermark;
              const watermark = (
                <Box
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 10,
                    opacity: 1,
                    transform: [{ rotate: '12deg' }],
                  }}
                >
                  <Watermark size={42} color={a.watermarkColor} strokeWidth={1.4} />
                </Box>
              );

              if (a.primary) {
                return (
                  <Pressable
                    key={a.label}
                    onPress={() => {
                      if (a.onPress) a.onPress();
                      else go(a.to);
                    }}
                    className="overflow-hidden active:opacity-90"
                    style={{
                      width: '47.5%',
                      borderRadius: 24,
                      shadowColor: '#2563EB',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.28,
                      shadowRadius: 14,
                      elevation: 5,
                    }}
                  >
                    <LinearGradient
                      colors={['#2563EB', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ padding: 16, minHeight: 138, overflow: 'hidden' }}
                    >
                      {watermark}
                      <Box
                        className="items-center justify-center"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 14,
                          backgroundColor: a.iconBg,
                          zIndex: 1,
                        }}
                      >
                        <Icon size={20} color={a.iconColor} strokeWidth={2.4} />
                      </Box>
                      <Text className="mt-5 font-bold text-[13px] text-white" style={{ zIndex: 1 }}>
                        {a.label}
                      </Text>
                      <Text
                        className="text-[11px] mt-0.5"
                        style={{ color: 'rgba(255,255,255,0.8)', zIndex: 1 }}
                      >
                        {a.desc}
                      </Text>
                      <Box
                        className="absolute bottom-3.5 right-3.5 items-center justify-center rounded-full"
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: 'rgba(255,255,255,0.22)',
                          zIndex: 2,
                        }}
                      >
                        <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.6} />
                      </Box>
                    </LinearGradient>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={a.label}
                  onPress={() => {
                    if (a.onPress) a.onPress();
                    else go(a.to);
                  }}
                  className="overflow-hidden active:opacity-90"
                  style={{
                    width: '47.5%',
                    minHeight: 138,
                    borderRadius: 24,
                    padding: 16,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.06,
                    shadowRadius: 14,
                    elevation: 3,
                  }}
                >
                  {watermark}
                  <Box
                    className="items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      backgroundColor: a.iconBg,
                      zIndex: 1,
                    }}
                  >
                    <Icon size={18} color={a.iconColor} strokeWidth={2.3} />
                  </Box>
                  <Text
                    className="mt-5 font-bold text-[13px]"
                    style={{ color: '#0F172A', zIndex: 1 }}
                  >
                    {a.label}
                  </Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: '#94A3B8', zIndex: 1 }}>
                    {a.desc}
                  </Text>
                  <Box
                    className="absolute bottom-3.5 right-3.5 items-center justify-center rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      shadowColor: '#0F172A',
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      zIndex: 2,
                    }}
                  >
                    <ChevronRight size={14} color="#2563EB" strokeWidth={2.4} />
                  </Box>
                </Pressable>
              );
            })}
          </Box>
        </Box>

        {/* Recent Activity */}
        <Box className="px-4 mt-6">
          <HStack className="items-center justify-between mb-3">
            <Text className="text-[16px] font-bold" style={{ color: '#0F172A' }}>
              Recent Activity
            </Text>
            <Pressable
              onPress={() => go('history')}
              className="flex-row items-center active:opacity-70"
            >
              <Text className="text-[12px] font-semibold" style={{ color: COLORS.primary }}>
                See all
              </Text>
              <ChevronRight size={13} color={COLORS.primary} />
            </Pressable>
          </HStack>

          <VStack space="sm">
            {recentCards.length === 0 ? (
              <Box className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8">
                <Text className="text-center text-sm text-slate-500">
                  No assigned tasks yet. When a Zonal Commissioner creates an application for you,
                  it will appear here.
                </Text>
              </Box>
            ) : (
              recentCards.map((a) => {
              const pct = progressFor(a.status);
              return (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    if (a.apiTask) {
                      void openAssignedTask(a.id);
                      return;
                    }
                    go('history');
                  }}
                  disabled={openingId === a.id}
                  className="active:opacity-90"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 22,
                    padding: 14,
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-start gap-3">
                    <Box
                      className="items-center justify-center rounded-full"
                      style={{ width: 42, height: 42, backgroundColor: '#EFF6FF' }}
                    >
                      <FileText size={18} color={COLORS.primary} />
                    </Box>
                    <VStack className="flex-1 min-w-0">
                      <HStack className="items-start justify-between gap-2">
                        <VStack className="flex-1 min-w-0">
                          <Text
                            style={{
                              fontFamily: FONTS.bold,
                              fontSize: 13,
                              color: COLORS.ink,
                            }}
                            numberOfLines={1}
                          >
                            {a.project}
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.medium,
                              fontSize: 11,
                              color: COLORS.ink,
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            {[a.siteNo, a.village !== '—' ? a.village : null, a.date]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </VStack>
                        <HStack className="items-center gap-1.5">
                          <StatusChip status={a.status} />
                          <MoreVertical size={16} color="#94A3B8" />
                        </HStack>
                      </HStack>

                      <HStack className="items-center gap-2 mt-3">
                        <Box
                          className="flex-1 rounded-full overflow-hidden"
                          style={{ height: 6, backgroundColor: '#EFF6FF' }}
                        >
                          <Box
                            style={{
                              width: `${pct}%`,
                              height: 6,
                              borderRadius: 999,
                              backgroundColor: COLORS.primary,
                            }}
                          />
                        </Box>
                        <Text className="text-[10px] font-bold" style={{ color: COLORS.primary }}>
                          {pct}%
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </Pressable>
              );
            })
            )}
          </VStack>
        </Box>
      </ScrollView>

      <BottomNav active="home" onNav={go} hidePlus hideAlerts />
    </ScreenShell>
  );
}

export function NotificationsScreen({ go }: { go: Go }) {
  const { accessToken, user } = useAuth();
  const { openBackendTask } = useProject();
  const home = homeScreenForRole(user);
  const role = resolveAppRole(user);
  const [query, setQuery] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const { items, unreadCount, loading, error, markOne, markAll } = useNotifications(accessToken);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const unread = items.filter((n) => !n.isRead);
    if (!q) return unread;
    return unread.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.applicationNumber || '').toLowerCase().includes(q),
    );
  }, [items, query]);

  const onMarkAll = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAll();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to mark all as read';
      Alert.alert('Notifications', msg);
    } finally {
      setMarkingAll(false);
    }
  };

  const onOpenNotification = async (notif: (typeof items)[number]) => {
    try {
      if (!notif.isRead) {
        await markOne(notif.id);
      }
    } catch {
      // still navigate even if mark-read fails
    }
    const action = resolveNotificationAction(notif, role);
    try {
      await navigateFromNotification(action, go, openBackendTask);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unable to open notification';
      Alert.alert('Notification', msg);
    }
  };

  return (
    <ScreenShell>
      <AppHeader
        title="Notifications"
        subtitle={unreadCount ? `${unreadCount} unread` : 'All caught up'}
        go={go}
        showNotifications={false}
        right={
          <Pressable
            onPress={() => void onMarkAll()}
            disabled={markingAll || unreadCount === 0}
            className="active:opacity-85"
            style={{ opacity: markingAll || unreadCount === 0 ? 0.45 : 1 }}
          >
            <Text className="text-[11px] font-bold text-white">Mark all read</Text>
          </Pressable>
        }
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Box className="px-5 pt-4">
          <HStack className="items-center gap-3 h-12 px-4 rounded-2xl bg-card shadow-sm">
            <Search size={16} color="#6B7289" />
            <TextInput
              placeholder="Search notifications"
              placeholderTextColor="#6B7289"
              value={query}
              onChangeText={setQuery}
              className="flex-1 text-sm text-foreground"
            />
          </HStack>

          <VStack className="mt-4" space="sm">
            {loading && items.length === 0 ? (
              <ListLoader count={3} text="Loading notifications…" />
            ) : error ? (
              <Text className="text-[13px] mt-6 text-center" style={{ color: '#DC2626' }}>
                {error}
              </Text>
            ) : filtered.length === 0 ? (
              <Text className="text-[13px] mt-6 text-center" style={{ color: '#64748B' }}>
                All caught up — no new notifications.
              </Text>
            ) : (
              filtered.map((n) => {
              const { Icon, bg, color } = notifIconConfig(n.type);

              return (
                <Pressable key={n.id} onPress={() => void onOpenNotification(n)} className="active:opacity-92">
                <AppCard
                  className="p-4"
                >
                  <HStack className="items-start gap-3">
                    <Box
                      className="items-center justify-center rounded-full shrink-0"
                      style={{ width: 40, height: 40, backgroundColor: bg }}
                    >
                      <Icon size={18} color={color} />
                    </Box>
                    <VStack className="flex-1 min-w-0">
                      <HStack className="items-center justify-between gap-2">
                        <Text
                          className="font-semibold text-sm text-foreground flex-1"
                          numberOfLines={2}
                        >
                          {n.title}
                        </Text>
                        {!n.isRead ? (
                          <Pressable
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              void markOne(n.id);
                            }}
                            hitSlop={8}
                            className="active:opacity-70 shrink-0"
                          >
                            <Text className="text-[10px] font-bold" style={{ color: COLORS.primary }}>
                              Dismiss
                            </Text>
                          </Pressable>
                        ) : null}
                      </HStack>
                      <Text className="text-xs text-muted-foreground mt-1">{n.message}</Text>
                      <Text className="text-[11px] text-muted-foreground mt-1">
                        {formatNotifTime(n.createdAt)}
                        {n.applicationNumber ? ` · ${n.applicationNumber}` : ''}
                      </Text>
                    </VStack>
                    {!n.isRead ? (
                      <Box className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                    ) : null}
                  </HStack>
                </AppCard>
                </Pressable>
              );
            })
            )}
          </VStack>
        </Box>
      </ScrollView>
      <BottomNav
        active="notif"
        onNav={go}
        homeTarget={home}
        appsTarget={home === 'dashboard' ? 'history' : home}
        hidePlus={home !== 'zc_home'}
        hideAlerts={home !== 'zc_home'}
        onPlus={home === 'zc_home' ? () => go('zc_create') : undefined}
      />
    </ScreenShell>
  );
}

const APP_STATUS_ACCENT: Record<string, string> = {
  Submitted: '#10B981',
  Verified: '#059669',
  Approved: '#10B981',
  Returned: '#F97316',
  Rejected: '#EF4444',
  Draft: '#2563EB',
  'In progress': '#64748B',
  Assigned: '#2563EB',
};

const APP_FILTERS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: 'All', label: 'All', icon: Layers },
  { key: 'Draft', label: 'Draft', icon: FileText },
  { key: 'Submitted', label: 'Submitted', icon: Send },
  { key: 'Returned', label: 'Returned', icon: Undo2 },
  { key: 'Verified', label: 'Verified', icon: CheckCircle2 },
  { key: 'Rejected', label: 'Rejected', icon: XCircle },
];

function ApplicationThumb({ uri }: { uri: string | null }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;

  return (
    <Box
      className="overflow-hidden items-center justify-center"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {showImage ? (
        <ApiMediaImage
          uri={uri}
          style={{ width: 44, height: 44 }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <FileText size={18} color={COLORS.primary} strokeWidth={2.2} />
      )}
    </Box>
  );
}

function ApplicationListCard({
  project,
  siteNo,
  status,
  village,
  date,
  image,
  onPress,
}: {
  project: string;
  siteNo?: string;
  status: string;
  village: string;
  date: string;
  image: string | null;
  onPress: () => void;
}) {
  const accent = APP_STATUS_ACCENT[status] || COLORS.primary;
  const meta = [siteNo, village !== '—' ? village : null].filter(Boolean).join(' · ');

  return (
    <Pressable onPress={onPress} className="active:opacity-92">
      <Box
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: COLORS.border,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <HStack>
          <Box style={{ width: 4, backgroundColor: accent, alignSelf: 'stretch' }} />
          <HStack
            className="flex-1 items-center"
            style={{ paddingVertical: 14, paddingHorizontal: 14, gap: 12 }}
          >
            <ApplicationThumb uri={image} />
            <VStack className="flex-1 min-w-0" style={{ gap: 4 }}>
              <HStack className="items-start justify-between" style={{ gap: 8 }}>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: FONTS.bold,
                    fontSize: 15,
                    lineHeight: 20,
                    color: COLORS.ink,
                  }}
                  numberOfLines={1}
                >
                  {project}
                </Text>
                <StatusChip status={status} />
              </HStack>

              {meta ? (
                <Text
                  style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}
                  numberOfLines={1}
                >
                  {meta}
                </Text>
              ) : null}

              <HStack className="items-center justify-between" style={{ marginTop: 2 }}>
                <HStack className="items-center flex-1 min-w-0" style={{ gap: 10 }}>
                  {date ? (
                    <HStack className="items-center" style={{ gap: 4 }}>
                      <MapPinned size={12} color={COLORS.primary} strokeWidth={2.3} />
                      <Text
                        style={{ fontFamily: FONTS.semibold, fontSize: 11, color: COLORS.ink }}
                        numberOfLines={1}
                      >
                        {date}
                      </Text>
                    </HStack>
                  ) : null}
                </HStack>
                <HStack className="items-center" style={{ gap: 2 }}>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.primary }}>
                    Open
                  </Text>
                  <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.6} />
                </HStack>
              </HStack>
            </VStack>
          </HStack>
        </HStack>
      </Box>
    </Pressable>
  );
}

export function HistoryScreen({ go }: { go: Go }) {
  const { applications, draft, openApplication, statusOverrides, openBackendTask } = useProject();
  const { accessToken } = useAuth();
  const [tab, setTab] = useState('All');
  const [apiTasks, setApiTasks] = useState<MobileApplication[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoadingTasks(false);
      return;
    }
    setLoadingTasks(true);
    fetchEngineerTasks(accessToken)
      .then(setApiTasks)
      .catch(() => setApiTasks([]))
      .finally(() => setLoadingTasks(false));
  }, [accessToken]);

  const openDetails = async (id: string, status: string, live: boolean, apiTask?: boolean) => {
    if (apiTask) {
      setOpeningId(id);
      try {
        await openBackendTask(id);
        go('project');
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Unable to open task';
        Alert.alert('Task', msg);
      } finally {
        setOpeningId(null);
      }
      return;
    }
    if (status === 'Draft' && live) {
      go('project');
      return;
    }
    openApplication(id);
    go('details');
  };

  const liveApps = useMemo(() => {
    const apiRows = apiTasks.map(mapTaskCard);

    if (accessToken) {
      // When authenticated with backend, live API tasks are the single source of truth.
      // Include local draft only if it is attached to a backend task.
      const backendDraftRow =
        draft.status === 'draft' &&
        draft.backendApplicationId &&
        !apiRows.some((r) => r.id === draft.backendApplicationId)
          ? [
              {
                id: draft.id,
                project: draft.projectName.trim() || draft.applicationNumber || 'Untitled draft',
                siteNo: draft.siteNo ? `Site ${draft.siteNo}` : '',
                status: 'Draft' as string,
                date: draft.siteNo || '—',
                village: draft.village.trim() || '—',
                image:
                  draft.photos[0]?.uri ||
                  draft.surroundingPhotos.N?.uri ||
                  null,
                live: true as const,
                apiTask: false as const,
              },
            ]
          : [];
      return [...apiRows, ...backendDraftRow];
    }

    const submitted = applications.map((a) => ({
      id: a.applicationId,
      project: a.projectName,
      siteNo: '',
      status: 'Submitted' as string,
      date: new Date(a.submittedAt).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      village: a.village,
      image: a.coverImage?.trim() || null,
      live: true as const,
      apiTask: false as const,
    }));

    const draftPhoto =
      draft.photos[0]?.uri ||
      draft.surroundingPhotos.N?.uri ||
      draft.surroundingPhotos.S?.uri ||
      draft.surroundingPhotos.E?.uri ||
      draft.surroundingPhotos.W?.uri ||
      null;

    const draftRow =
      draft.status === 'draft' &&
      (draft.projectName.trim() || draft.surveyNo.trim() || draft.gps)
        ? [
            {
              id: draft.id,
              project: draft.projectName.trim() || 'Untitled draft',
              siteNo: draft.siteNo ? `Site ${draft.siteNo}` : '',
              status: 'Draft' as string,
              date: new Date(draft.updatedAt).toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              village: draft.village.trim() || '—',
              image: draftPhoto,
              live: true as const,
              apiTask: false as const,
            },
          ]
        : [];

    return [...draftRow, ...submitted];
  }, [apiTasks, applications, draft, accessToken]);

  const filtered = tab === 'All' ? liveApps : liveApps.filter((a) => a.status === tab);

  return (
    <ScreenShell className="bg-[#F8FAFC]">
      <AppHeader
        title="Applications"
        subtitle={`${filtered.length} task${filtered.length === 1 ? '' : 's'} · assigned & submitted`}
        go={go}
      />

      <Box style={{ backgroundColor: '#F8FAFC' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="grow-0"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            gap: 8,
          }}
        >
          {APP_FILTERS.map((f) => {
            const Icon = f.icon;
            const on = tab === f.key;
            const count =
              f.key === 'All'
                ? liveApps.length
                : liveApps.filter((a) => a.status === f.key).length;
            return (
              <Pressable
                key={f.key}
                onPress={() => setTab(f.key)}
                className="flex-row items-center gap-1.5 active:opacity-85"
                style={{
                  height: 36,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: COLORS.white,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: on ? 0.12 : 0.06,
                  shadowRadius: 6,
                  elevation: on ? 3 : 1,
                  borderWidth: on ? 1.5 : 0,
                  borderColor: on ? COLORS.primary : 'transparent',
                }}
              >
                <Icon
                  size={13}
                  color={COLORS.ink}
                  strokeWidth={on ? 2.4 : 2.1}
                />
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 12,
                    color: COLORS.ink,
                  }}
                >
                  {f.label}
                </Text>
                <Box
                  style={{
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    borderRadius: 9,
                    backgroundColor: on ? '#EFF6FF' : '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: COLORS.ink }}>
                    {count}
                  </Text>
                </Box>
              </Pressable>
            );
          })}
        </ScrollView>
      </Box>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack className="px-4" style={{ gap: 12 }}>
          {loadingTasks ? (
            <ListLoader count={4} text="Loading engineer applications…" />
          ) : filtered.length === 0 ? (
            <Box
              className="items-center py-14 px-6"
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                shadowColor: '#0F172A',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
              <Box
                className="items-center justify-center"
                style={{
                  height: 56,
                  width: 56,
                  borderRadius: 16,
                  backgroundColor: COLORS.white,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <FileText size={24} color={COLORS.ink} />
              </Box>
              <Text
                style={{
                  marginTop: 16,
                  fontFamily: FONTS.bold,
                  fontSize: 16,
                  color: COLORS.ink,
                }}
              >
                No applications
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  color: COLORS.ink,
                  textAlign: 'center',
                }}
              >
                Nothing in this category yet.
              </Text>
            </Box>
          ) : null}

          {filtered.map((a) => (
            <ApplicationListCard
              key={`${a.id}-${a.status}`}
              project={a.project}
              siteNo={'siteNo' in a ? a.siteNo : ''}
              status={a.status}
              village={a.village}
              date={a.date}
              image={a.image}
              onPress={() => openDetails(a.id, a.status, a.live, a.apiTask)}
            />
          ))}
        </VStack>
      </ScrollView>
      <BottomNav active="apps" onNav={go} hidePlus hideAlerts />
    </ScreenShell>
  );
}

export function ProfileScreen({ go }: { go: Go }) {
  const { user, logout } = useAuth();
  const appRole = resolveAppRole(user);
  const home = homeScreenForRole(user);
  const name =
    user?.name?.trim() ||
    user?.loginId ||
    user?.email ||
    'Officer';
  const loginId = user?.loginId || user?.email || '—';
  const role = user?.roleName || user?.userType || 'engineer';
  const portalLabel =
    appRole === 'zc'
      ? 'CDRMS Zonal Commissioner'
      : appRole === 'cao' || appRole === 'super_admin'
        ? 'CDRMS CAO'
        : 'CDRMS Field Engineer';

  const infoRows = [
    { icon: Phone, label: 'Account', val: loginId },
    { icon: MapPinned, label: 'Role', val: String(role).replace(/_/g, ' ') },
    { icon: Building2, label: 'Portal', val: portalLabel },
  ] as const;

  const menuRows = [
    { icon: Lock, label: 'Change Password' },
    { icon: HelpCircle, label: 'Help & Support' },
    { icon: Settings, label: 'App Settings' },
    { icon: ShieldCheck, label: 'About CDRMS' },
  ] as const;

  return (
    <ScreenShell>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <GradientHeader rounded>
          <Box className="px-5 pb-10">
            <HStack className="items-center justify-between gap-2 pt-2">
              <HStack className="items-center gap-2 flex-1 min-w-0">
                <Pressable
                  onPress={() => go(home)}
                  className="h-10 w-10 rounded-full items-center justify-center"
                >
                  <ArrowLeft size={20} color={COLORS.white} />
                </Pressable>
                <Text className="text-lg font-bold text-white">Profile</Text>
              </HStack>
              <Pressable
                onPress={async () => {
                  await logout();
                  go('login');
                }}
                className="flex-row items-center gap-1.5 active:opacity-85"
                style={{
                  height: 36,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.35)',
                }}
              >
                <LogOut size={14} color={COLORS.white} />
                <Text className="text-[12px] font-bold text-white">Logout</Text>
              </Pressable>
            </HStack>

            <VStack className="mt-6 items-center">
              <Box
                className="items-center justify-center"
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.22,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <Text className="font-extrabold text-[34px]" style={{ color: '#2563EB' }}>
                  {name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() || '')
                    .join('') || 'U'}
                </Text>
              </Box>
              <Text className="mt-4 font-extrabold text-xl text-white">
                {name}
              </Text>
              <Text className="text-sm text-white/85">{portalLabel}</Text>
              <HStack className="mt-3 items-center gap-2">
                <Box className="bg-white/15 px-2.5 py-1 rounded-full">
                  <Text className="text-[11px] text-white">ID · {loginId}</Text>
                </Box>
              </HStack>
            </VStack>
          </Box>
        </GradientHeader>

        <VStack className="px-5 -mt-5" space="sm">
          <AppCard className="p-0 overflow-hidden">
            {infoRows.map((r, i) => {
              const Icon = r.icon;
              return (
                <HStack
                  key={r.label}
                  className={`items-center gap-3 p-4 ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <IconBox className="bg-primary/10">
                    <Icon size={20} color={COLORS.primary} />
                  </IconBox>
                  <VStack className="flex-1">
                    <Text className="text-[11px] uppercase font-semibold text-muted-foreground">
                      {r.label}
                    </Text>
                    <Text className="font-semibold text-sm text-foreground">{r.val}</Text>
                  </VStack>
                </HStack>
              );
            })}
          </AppCard>

          <AppCard className="p-0 overflow-hidden">
            {menuRows.map((r, i) => {
              const Icon = r.icon;
              return (
                <Pressable
                  key={r.label}
                  className={`flex-row items-center gap-3 p-4 active:opacity-80 ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <IconBox className="bg-muted">
                    <Icon size={20} color={COLORS.primaryDeep} />
                  </IconBox>
                  <Text className="flex-1 font-semibold text-sm text-foreground">
                    {r.label}
                  </Text>
                  <ChevronRight size={16} color="#6B7289" />
                </Pressable>
              );
            })}
          </AppCard>

          <Pressable
            onPress={async () => {
              await logout();
              go('login');
            }}
            className="w-full h-14 rounded-2xl bg-destructive/10 flex-row items-center justify-center gap-2 active:opacity-90"
          >
            <LogOut size={20} color={COLORS.destructive} />
            <Text className="font-bold text-destructive">Logout</Text>
          </Pressable>

          <Text className="text-center text-[11px] text-muted-foreground pt-2">
            {portalLabel} · mobile
          </Text>
        </VStack>
      </ScrollView>
      <BottomNav
        active="profile"
        onNav={go}
        homeTarget={home}
        appsTarget={home}
        hidePlus={appRole !== 'zc'}
        hideAlerts={appRole !== 'zc'}
        onPlus={appRole === 'zc' ? () => go('zc_create') : undefined}
      />
    </ScreenShell>
  );
}
