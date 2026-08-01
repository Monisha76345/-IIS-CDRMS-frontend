import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Edit3,
  Eye,
  FileText,
  FolderOpen,
  HelpCircle,
  Layers,
  Lock,
  LogOut,
  Mail,
  MapPinned,
  MoreVertical,
  Phone,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Undo2,
  Upload,
  User,
  UserCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { TextInput, Alert, Image, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  ProfileMenu,
  ScreenShell,
  StatusChip,
  ListLoader,
  ScreenLoader,
} from '@/src/cdrms/components/primitives';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import {
  COLORS,
  FONTS,
  GLASS,
  GRADIENT_HEADER,
  GRADIENT_PRIMARY,
  SPACE,
  gradientStops,
} from '@/src/cdrms/theme';
import { GlassSectionCard } from '@/src/cdrms/components/GlassSurface';
import { ThemeToggleButton } from '@/src/cdrms/components/ThemePicker';
import { useTheme } from '@/src/theme/ThemeContext';
import { TERMS } from '@/src/cdrms/terminology';
import type { Go, Screen } from '@/src/cdrms/types';
import { useAuth } from '@/src/auth/AuthContext';
import { displayName, homeScreenForRole, resolveAppRole } from '@/src/auth/roles';
import { ApiError } from '@/src/api/client';
import {
  fetchApplication,
  fetchEngineerTasks,
  engineerTaskProgressPercent,
  isOpenEngineerTask,
  type MobileApplication,
} from '@/src/api/applications';
import { ApplicationRecordDetails } from '@/src/cdrms/components/ApplicationRecordDetails';
import { NotificationBell } from '@/src/cdrms/components/NotificationBell';
import { useNotifications } from '@/src/cdrms/hooks/useNotifications';
import {
  formatNotifTime,
  navigateFromNotification,
  notifIconConfig,
  resolveNotificationAction,
} from '@/src/cdrms/notifications/helpers';
import {
  getSelectedOfficeAppId,
  setSelectedOfficeAppId,
  setEngineerAppsFilter,
  consumeEngineerAppsFilter,
  setEngineerAppsReturn,
  consumeEngineerAppsReturn,
} from '@/src/cdrms/officeSelection';
import { ensureCameraPermission } from '@/src/cdrms/mediaPermission';

function mapTaskStatus(status: MobileApplication['status']) {
  if (status === 'submitted') return 'Submitted';
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
    progress: engineerTaskProgressPercent(app),
    live: true as const,
    apiTask: true as const,
  };
}

function getAppStatusAccent(status: string): string {
  switch (status) {
    case 'Submitted':
    case 'Verified':
    case 'Approved':
      return COLORS.success;
    case 'Returned':
      return COLORS.warning;
    case 'Rejected':
      return COLORS.destructive;
    case 'In progress':
      return COLORS.slate;
    default:
      return COLORS.primary;
  }
}

export function Dashboard({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const insets = useSafeAreaInsets();
  const { openBackendTask } = useProject();
  const { accessToken, user, logout } = useAuth();
  const [tasks, setTasks] = useState<MobileApplication[]>([]);
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  /** Home Recent Activity + quick-action highlight. */
  const [recentFilter, setRecentFilter] = useState<'all' | 'in_progress'>('all');

  useEffect(() => {
    const roleHome = homeScreenForRole(user);
    if (roleHome !== 'dashboard') {
      go(roleHome);
    }
  }, [user, go]);

  useEffect(() => {
    if (!accessToken) {
      setTasks([]);
      setSubmittedTotal(0);
      setLoadingTasks(false);
      return;
    }
    setLoadingTasks(true);
    // Load full assignment history once: open work for the home task list,
    // submitted total = all submissions so far (not only open queue).
    fetchEngineerTasks(accessToken, 'all')
      .then((all) => {
        setTasks(all.filter(isOpenEngineerTask));
        setSubmittedTotal(
          all.filter(
            (t) =>
              t.status === 'submitted' || Boolean(t.engineerSubmittedAt?.trim()),
          ).length,
        );
      })
      .catch(() => {
        setTasks([]);
        setSubmittedTotal(0);
      })
      .finally(() => setLoadingTasks(false));
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

  const openAppsWithFilter = (filter: string) => {
    setEngineerAppsFilter(filter);
    setEngineerAppsReturn('dashboard');
    go('history');
  };

  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const recentSource = recentFilter === 'in_progress' ? inProgressTasks : tasks;
  const recentCards = recentSource.slice(0, 8).map(mapTaskCard);
  const assigned = tasks.filter((t) => t.status === 'assigned').length;
  const inProgress = inProgressTasks.length;
  const totalTasks = tasks.length;

  const stats = [
    {
      label: 'Assigned',
      filter: 'Assigned',
      value: assigned,
      bg: GLASS.tintBlue,
      fg: COLORS.primary,
      icon: FileText,
    },
    {
      label: 'In progress',
      filter: 'In progress',
      value: inProgress,
      bg: '#FFFBEB',
      fg: '#B45309',
      icon: Edit3,
    },
    {
      label: 'Submitted',
      filter: 'Submitted',
      value: submittedTotal,
      bg: GLASS.tintSky,
      fg: COLORS.primary,
      icon: ClipboardCheck,
    },
  ];

  const actions: Array<{
    id: 'all' | 'in_progress';
    icon: typeof ClipboardCheck;
    watermark: typeof ClipboardCheck;
    label: string;
    desc: string;
  }> = [
    {
      id: 'all',
      icon: ClipboardCheck,
      watermark: ClipboardCheck,
      label: 'All tasks',
      desc: loadingTasks
        ? 'Loading…'
        : totalTasks > 0
          ? `${totalTasks} application${totalTasks === 1 ? '' : 's'}`
          : 'No tasks yet',
    },
    {
      id: 'in_progress',
      icon: Edit3,
      watermark: FileText,
      label: 'Continue open task',
      desc: loadingTasks
        ? 'Loading…'
        : inProgress > 0
          ? `${inProgress} in progress`
          : 'No in-progress tasks',
    },
  ];

  const progressFor = (status: string) => {
    if (status === 'Verified' || status === 'Approved' || status === 'Submitted') return 100;
    if (status === 'In progress') return 50;
    if (status === 'Returned') return 75;
    if (status === 'Draft') return 10;
    if (status === 'Assigned') return 0;
    return 0;
  };

  return (
    <ScreenShell className="bg-background">
      <ScrollView
        key={themeId}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradientStops(GRADIENT_HEADER)}
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
                  className="active:opacity-85 items-center justify-center overflow-hidden"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    shadowColor: GLASS.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {user?.profilePhoto ? (
                    <Image
                      source={{ uri: user.profilePhoto }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="font-extrabold text-[16px]" style={{ color: COLORS.primary }}>
                      {displayName(user)
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() || '')
                        .join('') || 'U'}
                    </Text>
                  )}
                </Pressable>
                <VStack className="flex-1 min-w-0" style={{ gap: 3 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 22,
                      lineHeight: 28,
                      letterSpacing: -0.3,
                      color: COLORS.white,
                    }}
                    numberOfLines={1}
                  >
                    Welcome
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 14,
                      lineHeight: 18,
                      letterSpacing: 0.1,
                      color: 'rgba(255,255,255,0.88)',
                    }}
                    numberOfLines={1}
                  >
                    {displayName(user)}
                  </Text>
                </VStack>
              </HStack>
              <HStack className="items-center gap-2">
                <ThemeToggleButton variant="header" />
                <ProfileMenu
                gradient
                userName={displayName(user)}
                roleName={user?.roleName}
                loginId={user?.loginId}
                photoUrl={user?.profilePhoto}
                onLogout={() => {
                  void (async () => {
                    await logout();
                    go('login');
                  })();
                }}
              />
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
            </HStack>
          </Box>
        </LinearGradient>

        {/* Status counts — three small cards */}
        <Box className="px-4" style={{ marginTop: -28 }}>
          <HStack style={{ gap: 10 }}>
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <Pressable
                  key={s.label}
                  onPress={() => openAppsWithFilter(s.filter)}
                  className="flex-1 active:opacity-90"
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 18,
                    paddingVertical: 14,
                    paddingHorizontal: 6,
                    alignItems: 'center',
                    shadowColor: COLORS.primaryDeep,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.1,
                    shadowRadius: 14,
                    elevation: 5,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Box
                    className="items-center justify-center rounded-full"
                    style={{ width: 40, height: 40, backgroundColor: s.bg }}
                  >
                    <Icon size={17} color={s.fg} strokeWidth={2.3} />
                  </Box>
                  <Text
                    className="mt-2 text-[18px] font-extrabold"
                    style={{ color: COLORS.ink }}
                  >
                    {loadingTasks ? '—' : s.value}
                  </Text>
                  <Text
                    className="text-[10px] font-semibold text-center"
                    style={{ color: COLORS.slate, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>
        </Box>

        {/* Quick Actions */}
        <Box className="px-4 mt-5">
          <Text className="text-[16px] font-bold mb-3" style={{ color: COLORS.ink }}>
            Quick Actions
          </Text>

          <Box className="flex-row flex-wrap" style={{ gap: 12 }}>
            {actions.map((a) => {
              const Icon = a.icon;
              const Watermark = a.watermark;
              const selected = recentFilter === a.id;
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
                  <Watermark
                    size={42}
                    color={selected ? 'rgba(255,255,255,0.22)' : `${COLORS.primary}24`}
                    strokeWidth={1.4}
                  />
                </Box>
              );

              if (selected) {
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setRecentFilter(a.id)}
                    className="overflow-hidden active:opacity-90"
                    style={{
                      width: '47.5%',
                      borderRadius: 24,
                      shadowColor: COLORS.primary,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.28,
                      shadowRadius: 14,
                      elevation: 5,
                    }}
                  >
                    <LinearGradient
                      colors={gradientStops(GRADIENT_PRIMARY)}
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
                          backgroundColor: 'rgba(255,255,255,0.22)',
                          zIndex: 1,
                        }}
                      >
                        <Icon size={20} color={COLORS.white} strokeWidth={2.4} />
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
                        <ChevronRight size={14} color={COLORS.white} strokeWidth={2.6} />
                      </Box>
                    </LinearGradient>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={a.id}
                  onPress={() => setRecentFilter(a.id)}
                  className="overflow-hidden active:opacity-90"
                  style={{
                    width: '47.5%',
                    minHeight: 138,
                    borderRadius: 24,
                    padding: 16,
                    backgroundColor: COLORS.white,
                    shadowColor: GLASS.shadow,
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
                      backgroundColor: GLASS.tintBlue,
                      zIndex: 1,
                    }}
                  >
                    <Icon size={18} color={COLORS.primary} strokeWidth={2.3} />
                  </Box>
                  <Text
                    className="mt-5 font-bold text-[13px]"
                    style={{ color: COLORS.ink, zIndex: 1 }}
                  >
                    {a.label}
                  </Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: COLORS.slate, zIndex: 1 }}>
                    {a.desc}
                  </Text>
                  <Box
                    className="absolute bottom-3.5 right-3.5 items-center justify-center rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: COLORS.white,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      shadowColor: GLASS.shadow,
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      zIndex: 2,
                    }}
                  >
                    <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.4} />
                  </Box>
                </Pressable>
              );
            })}
          </Box>
        </Box>

        {/* Recent Activity */}
        <Box className="px-4 mt-6">
          <Text className="text-[16px] font-bold mb-3" style={{ color: COLORS.ink }}>
            {recentFilter === 'in_progress' ? 'In progress' : 'Recent Activity'}
          </Text>

          <VStack space="sm">
            {loadingTasks ? (
              <ListLoader count={3} />
            ) : recentCards.length === 0 ? (
              <Box
                className="rounded-2xl border border-dashed px-4 py-8"
                style={{
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.white,
                }}
              >
                <Text className="text-center text-sm" style={{ color: COLORS.slate }}>
                  {recentFilter === 'in_progress'
                    ? 'No in-progress tasks yet.'
                    : 'No assigned tasks yet. When a Zonal Commissioner creates an application for you, it will appear here.'}
                </Text>
              </Box>
            ) : (
              recentCards.map((a) => {
              const pct =
                typeof a.progress === 'number' ? a.progress : progressFor(a.status);
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
                    backgroundColor: COLORS.white,
                    borderRadius: 22,
                    padding: 14,
                    shadowColor: GLASS.shadow,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-start gap-3">
                    <Box
                      className="items-center justify-center rounded-full"
                      style={{ width: 42, height: 42, backgroundColor: GLASS.tintBlue }}
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
                          <MoreVertical size={16} color={COLORS.slate} />
                        </HStack>
                      </HStack>

                      <HStack className="items-center gap-2 mt-3">
                        <Box
                          className="flex-1 rounded-full overflow-hidden"
                          style={{ height: 6, backgroundColor: GLASS.tintBlue }}
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
  const { themeId } = useTheme();
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
        key={themeId}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Box className="px-5 pt-4">
          <HStack className="items-center gap-3 h-12 px-4 rounded-2xl bg-card shadow-sm">
            <Search size={16} color={COLORS.slate} />
            <TextInput
              placeholder="Search notifications"
              placeholderTextColor={COLORS.slate}
              value={query}
              onChangeText={setQuery}
              className="flex-1 text-sm text-foreground"
            />
          </HStack>

          <VStack className="mt-4" space="sm">
            {loading && items.length === 0 ? (
              <ListLoader count={3} text="Loading notifications…" />
            ) : error ? (
              <Text className="text-[13px] mt-6 text-center" style={{ color: COLORS.destructive }}>
                {error}
              </Text>
            ) : filtered.length === 0 ? (
              <Text className="text-[13px] mt-6 text-center" style={{ color: COLORS.slate }}>
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

const APP_FILTERS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: 'All', label: 'All', icon: Layers },
  { key: 'Assigned', label: 'Assigned', icon: FileText },
  { key: 'In progress', label: 'In progress', icon: Edit3 },
  { key: 'Submitted', label: 'Submitted', icon: Send },
  { key: 'Draft', label: 'Draft', icon: FolderOpen },
  { key: 'Returned', label: 'Returned', icon: Undo2 },
  { key: 'Verified', label: 'Verified', icon: CheckCircle2 },
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
        backgroundColor: GLASS.tintBlue,
        shadowColor: GLASS.shadow,
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
  const accent = getAppStatusAccent(status);
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
          shadowColor: GLASS.shadow,
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
                <Box
                  className="items-center justify-center"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: COLORS.primary,
                  }}
                >
                  <Eye size={15} color={COLORS.white} strokeWidth={2.4} />
                </Box>
              </HStack>
            </VStack>
          </HStack>
        </HStack>
      </Box>
    </Pressable>
  );
}

export function HistoryScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { applications, draft, openApplication } = useProject();
  const { accessToken } = useAuth();
  const [tab, setTab] = useState(() => consumeEngineerAppsFilter() || 'All');
  const [backTarget] = useState(() => consumeEngineerAppsReturn());
  const [apiTasks, setApiTasks] = useState<MobileApplication[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoadingTasks(false);
      return;
    }
    setLoadingTasks(true);
    // Applications tab: full list including submitted / completed.
    fetchEngineerTasks(accessToken, 'all')
      .then(setApiTasks)
      .catch(() => setApiTasks([]))
      .finally(() => setLoadingTasks(false));
  }, [accessToken]);

  const viewApplication = (id: string, status: string, live: boolean, apiTask?: boolean) => {
    if (apiTask) {
      setSelectedOfficeAppId(id);
      go('engineer_detail');
      return;
    }
    if (status === 'Draft' && live) {
      openApplication(id);
      go('details');
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
    <ScreenShell className="bg-background">
      <AppHeader
        title="Applications"
        subtitle={
          loadingTasks
            ? 'Loading…'
            : `${filtered.length} application${filtered.length === 1 ? '' : 's'}`
        }
        go={go}
        onBack={backTarget ? () => go(backTarget) : undefined}
      />

      <Box style={{ backgroundColor: COLORS.soft }}>
        <ScrollView
          key={themeId}
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
              loadingTasks
                ? null
                : f.key === 'All'
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
                  shadowColor: GLASS.shadow,
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
                    backgroundColor: on ? GLASS.tintBlue : COLORS.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: COLORS.ink }}>
                    {count == null ? '—' : count}
                  </Text>
                </Box>
              </Pressable>
            );
          })}
        </ScrollView>
      </Box>

      <ScrollView
        key={themeId}
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
                shadowColor: GLASS.shadow,
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
                  shadowColor: GLASS.shadow,
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
          ) : (
            filtered.map((a) => (
              <ApplicationListCard
                key={`${a.id}-${a.status}`}
                project={a.project}
                siteNo={'siteNo' in a ? a.siteNo : ''}
                status={a.status}
                village={a.village}
                date={a.date}
                image={a.image}
                onPress={() => viewApplication(a.id, a.status, a.live, a.apiTask)}
              />
            ))
          )}
        </VStack>
      </ScrollView>
      <BottomNav active="apps" onNav={go} hidePlus hideAlerts />
    </ScreenShell>
  );
}

export function EngineerDetailScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { accessToken } = useAuth();
  const appId = getSelectedOfficeAppId();
  const [app, setApp] = useState<MobileApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !appId) {
      setError('No application selected');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchApplication(accessToken, appId)
      .then(setApp)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Not found'))
      .finally(() => setLoading(false));
  }, [accessToken, appId]);

  return (
    <ScreenShell className="bg-background">
      <AppHeader
        title="View Application"
        subtitle={app?.applicationNumber || 'Application details'}
        onBack={() => go('history')}
        gradient
        go={go}
        showNotifications={false}
        showLogout={false}
      />
      <ScrollView
        key={themeId}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ScreenLoader text="Loading application details…" />
        ) : error || !app ? (
          <Box
            className="mx-4 rounded-2xl border px-4 py-6"
            style={{
              borderColor: `${COLORS.destructive}40`,
              backgroundColor: `${COLORS.destructive}0D`,
            }}
          >
            <Text
              style={{
                color: COLORS.destructive,
                fontFamily: FONTS.medium,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              {error || 'Not found'}
            </Text>
          </Box>
        ) : (
          <ApplicationRecordDetails app={app} showEmptyEngineer={false} />
        )}
      </ScrollView>
    </ScreenShell>
  );
}

export function ProfileScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { user, logout } = useAuth();
  const appRole = resolveAppRole(user);
  const home = homeScreenForRole(user);
  const appsTarget =
    appRole === 'cao' || appRole === 'super_admin'
      ? 'cao_apps'
      : appRole === 'zc'
        ? 'zc_home'
        : 'history';
  const { updateProfilePhoto } = useAuth();
  const profilePhoto = user?.profilePhoto || null;
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const applyPickedAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setSavingPhoto(true);
    try {
      const photoData = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      await updateProfilePhoto(photoData);
      Alert.alert('Profile Photo', 'Profile photo updated successfully!');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const allowed = await ensureCameraPermission();
      if (!allowed) return;

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!res.canceled && res.assets[0]) {
        await applyPickedAsset(res.assets[0]);
      }
    } catch (err) {
      setSavingPhoto(false);
      const msg = err instanceof Error ? err.message : 'Unable to take profile photo';
      Alert.alert('Camera', msg);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photos permission needed',
          'Allow photo library access in Settings so you can upload a profile photo.',
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });

      if (!res.canceled && res.assets[0]) {
        await applyPickedAsset(res.assets[0]);
      }
    } catch (err) {
      setSavingPhoto(false);
      const msg = err instanceof Error ? err.message : 'Unable to update profile photo';
      Alert.alert('Gallery', msg);
    }
  };

  const showPhotoSourceOptions = () => {
    Alert.alert('Profile photo', 'Choose how to set your photo', [
      { text: 'Take photo', onPress: () => void handleTakePhoto() },
      { text: 'Upload from gallery', onPress: () => void handlePickFromGallery() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setSavingPhoto(true);
                await updateProfilePhoto(null);
                setSavingPhoto(false);
                setPreviewModalOpen(false);
              } catch {
                setSavingPhoto(false);
              }
            })();
          },
        },
      ],
    );
  };

  const u = (user || {}) as any;
  const name =
    user?.name?.trim() ||
    (appRole === 'zc' ? 'Ramesh Kumar (ZC)' : appRole === 'cao' ? 'Monisha s' : 'Field Engineer');
  const nameParts = name.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Monisha';
  const lastName = nameParts.slice(1).join(' ') || 's';
  const initials = `${firstName[0]?.toUpperCase() || ''}${lastName[0]?.toUpperCase() || ''}` || 'U';
  const loginId = user?.loginId || 'CDRMS00007';
  const rawRoleTitle: string =
    u.roleName ||
    u.userType ||
    (appRole === 'zc'
      ? 'Zonal Commissioner'
      : appRole === 'cao'
        ? 'CAO Officer'
        : appRole === 'super_admin'
          ? 'Administrator'
          : 'Field Engineer');
  const roleTitle = rawRoleTitle
    .split(/[\s_-]+/)
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const zone = u.zoneCode || (appRole === 'zc' ? 'SOUTH' : 'EAST');
  const email = user?.email || 'monimonisha4379@gmail.com';
  const phone = u.phone || u.mobileNumber || '7019726060';
  const gender = u.gender || 'female';
  const department = u.department || 'bda';
  const districtState = u.districtState || 'Belagavi, Karnataka';
  const officeAddress = u.officeAddress || 'Maddur,Mandya';

  return (
    <ScreenShell className="bg-background">
      <AppHeader
        title="Profile"
        subtitle="Officer details & personal information"
        go={go}
      />

      <ScrollView
        key={themeId}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 12, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <GlassSectionCard
          title="Profile photo"
          subtitle={profilePhoto ? 'Uploaded' : 'Add a photo'}
          icon={Camera}
          bodyStyle={{ paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], gap: SPACE[2] }}
        >
          <HStack style={{ alignItems: 'center', gap: 12 }}>
            <Box style={{ position: 'relative' }}>
              <Pressable
                onPress={() => {
                  if (profilePhoto) setPreviewModalOpen(true);
                  else showPhotoSourceOptions();
                }}
                disabled={savingPhoto}
                className="active:opacity-90"
              >
                <Box
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: COLORS.primary,
                  }}
                >
                  {profilePhoto ? (
                    <Image
                      source={{ uri: profilePhoto }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: COLORS.white }}>
                      {initials}
                    </Text>
                  )}
                </Box>
              </Pressable>
              {profilePhoto ? (
                <Pressable
                  onPress={handleDeletePhoto}
                  disabled={savingPhoto}
                  accessibilityLabel="Delete photo"
                  className="active:opacity-85"
                  style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: COLORS.destructive,
                    borderWidth: 2,
                    borderColor: COLORS.white,
                    opacity: savingPhoto ? 0.6 : 1,
                  }}
                >
                  <Trash2 size={12} color={COLORS.white} strokeWidth={2.4} />
                </Pressable>
              ) : (
                <Box
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: COLORS.primary,
                    borderWidth: 2,
                    borderColor: COLORS.white,
                  }}
                >
                  <Camera size={12} color={COLORS.white} strokeWidth={2.4} />
                </Box>
              )}
            </Box>
            <VStack style={{ flex: 1, gap: 2, minWidth: 0 }}>
              <HStack style={{ alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text
                  style={{ fontFamily: FONTS.bold, fontSize: 15, color: COLORS.ink }}
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Box
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: `${COLORS.success}14`,
                    borderWidth: 1,
                    borderColor: `${COLORS.success}40`,
                  }}
                >
                  <CheckCircle2 size={10} color={COLORS.success} strokeWidth={2.5} />
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: COLORS.success }}>
                    Active
                  </Text>
                </Box>
              </HStack>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.slate }} numberOfLines={1}>
                {roleTitle} · {zone}
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: COLORS.ink }} numberOfLines={1}>
                Login ID: {loginId}
              </Text>
            </VStack>
          </HStack>

          {!profilePhoto ? (
            <HStack style={{ gap: 8 }}>
              <Pressable
                onPress={() => void handleTakePhoto()}
                disabled={savingPhoto}
                className="flex-1 active:opacity-85"
                style={{
                  height: 36,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.white,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: savingPhoto ? 0.6 : 1,
                }}
              >
                <Camera size={14} color={COLORS.primary} strokeWidth={2.2} />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.ink }}>
                  {savingPhoto ? 'Saving…' : 'Take photo'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handlePickFromGallery()}
                disabled={savingPhoto}
                className="flex-1 active:opacity-85"
                style={{
                  height: 36,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.white,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: savingPhoto ? 0.6 : 1,
                }}
              >
                <Upload size={14} color={COLORS.primary} strokeWidth={2.2} />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.ink }}>
                  {savingPhoto ? 'Saving…' : 'Gallery'}
                </Text>
              </Pressable>
            </HStack>
          ) : null}
        </GlassSectionCard>

        <GlassSectionCard
          title="Personal Information"
          subtitle="Officer details"
          icon={User}
          bodyStyle={{ paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], gap: 0 }}
        >
          <ProfilePairRow leftLabel="Name" leftValue={name} rightLabel="Role" rightValue={roleTitle} />
          <ProfilePairRow leftLabel="Email" leftValue={email} rightLabel="Mobile" rightValue={phone} />
          <ProfilePairRow
            leftLabel="Gender"
            leftValue={gender}
            rightLabel="Department"
            rightValue={department}
          />
          <ProfilePairRow
            leftLabel="District / State"
            leftValue={districtState}
            rightLabel="Assigned zone"
            rightValue={zone}
          />
          <ProfilePairRow
            leftLabel="Office address"
            leftValue={officeAddress}
            rightLabel="Mapping status"
            rightValue="Active"
            last
          />
        </GlassSectionCard>

        <Box style={{ marginHorizontal: SPACE.gutter }}>
          <Pressable
            onPress={async () => {
              await logout();
              go('login');
            }}
            className="active:opacity-90"
            style={{
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: `${COLORS.destructive}40`,
              backgroundColor: `${COLORS.destructive}0D`,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <LogOut size={16} color={COLORS.destructive} strokeWidth={2.2} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.destructive }}>
              Logout
            </Text>
          </Pressable>
        </Box>
      </ScrollView>

      {previewModalOpen && profilePhoto ? (
        <Modal
          visible={previewModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewModalOpen(false)}
        >
          <Pressable
            onPress={() => setPreviewModalOpen(false)}
            className="flex-1 bg-black/80 justify-center items-center p-4"
          >
            <Box className="w-full max-w-sm bg-white rounded-2xl p-4 overflow-hidden">
              <HStack className="justify-between items-center pb-3 mb-3 border-b border-slate-100">
                <Text className="font-extrabold text-base text-slate-900">Profile Photo</Text>
                <Pressable onPress={() => setPreviewModalOpen(false)} className="p-1">
                  <Text className="text-slate-400 font-bold text-base">✕</Text>
                </Pressable>
              </HStack>
              <Image
                source={{ uri: profilePhoto }}
                style={{ width: '100%', height: 300, borderRadius: 12 }}
                resizeMode="contain"
              />
            </Box>
          </Pressable>
        </Modal>
      ) : null}

      <BottomNav
        active="profile"
        onNav={go}
        homeTarget={home}
        appsTarget={appsTarget}
        hidePlus={appRole !== 'zc'}
        hideAlerts={appRole !== 'zc'}
        onPlus={appRole === 'zc' ? () => go('zc_create') : undefined}
      />
    </ScreenShell>
  );
}

function ProfilePairRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  last,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  last?: boolean;
}) {
  return (
    <HStack
      style={{
        paddingVertical: 7,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: GLASS.divider,
        gap: 10,
      }}
    >
      <Box style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 10,
            color: COLORS.slate,
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}
        >
          {leftLabel}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 13,
            color: COLORS.ink,
            marginTop: 2,
            lineHeight: 17,
          }}
        >
          {leftValue || '—'}
        </Text>
      </Box>
      <Box style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 10,
            color: COLORS.slate,
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}
        >
          {rightLabel}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 13,
            color: COLORS.ink,
            marginTop: 2,
            lineHeight: 17,
          }}
        >
          {rightValue || '—'}
        </Text>
      </Box>
    </HStack>
  );
}
