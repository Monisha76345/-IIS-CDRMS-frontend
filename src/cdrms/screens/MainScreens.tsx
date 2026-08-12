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
  HelpCircle,
  Layers,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Send,
  Settings,
  Shield,
  User,
  UserCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { SearchField } from '@/src/cdrms/components/SearchField';
import {
  AppCard,
  AppHeader,
  BottomNav,
  GradientHeader,
  IconBox,
  ScreenShell,
  StatusChip,
  statusChipColors,
  ListLoader,
  ScreenLoader,
} from '@/src/cdrms/components/primitives';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import {
  COLORS,
  DESIGN,
  FONTS,
  GLASS,
  SPACE,
  hexAlpha,
  usesLightHeader,
} from '@/src/cdrms/theme';
import {
  BdaPageWatermark,
  WelcomeHomeHeader,
  welcomeFilterGap,
} from '@/src/cdrms/components/WelcomeHomeChrome';
import { useTheme } from '@/src/theme/ThemeContext';
import { TERMS } from '@/src/cdrms/terminology';
import type { Go, Screen } from '@/src/cdrms/types';
import { useAuth } from '@/src/auth/AuthContext';
import { displayName, homeScreenForRole, resolveAppRole, roleDisplayTitle } from '@/src/auth/roles';
import { ApiError } from '@/src/api/client';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';
import {
  fetchApplication,
  fetchEngineerTasks,
  fetchMyZoneMeta,
  applicationCardDateLine,
  engineerResumeScreen,
  engineerTaskProgressPercent,
  engineerApplicationListStatus,
  type MobileApplication,
} from '@/src/api/applications';
import { ApplicationRecordDetails } from '@/src/cdrms/components/ApplicationRecordDetails';
import { ViewApplicationHeader } from '@/src/cdrms/components/ViewApplicationHeader';
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
  setZcEditApplicationId,
  consumeEngineerAppsFilter,
  consumeEngineerAppsReturn,
} from '@/src/cdrms/officeSelection';
import { ensureCameraPermission } from '@/src/cdrms/mediaPermission';

function mapTaskStatus(app: MobileApplication) {
  return engineerApplicationListStatus(app);
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
    siteNo: app.siteNo?.trim() || '',
    status: mapTaskStatus(app),
    zone: app.zoneCode?.trim() || '',
    date: applicationCardDateLine(app),
    village: [app.addressArea, app.addressBlock].filter(Boolean).join(', ') || '—',
    image: taskCoverImage(app),
    progress: engineerTaskProgressPercent(app),
    live: true as const,
    apiTask: true as const,
  };
}

function siteNoMetaLine(siteNo?: string | null) {
  const site = (siteNo || '').replace(/^Site\s+/i, '').trim() || '—';
  const display = site.length > 22 ? `${site.slice(0, 21)}…` : site;
  return `Site no: ${display}`;
}

export function Dashboard({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { openBackendTask } = useProject();
  const { accessToken, user, logout } = useAuth();
  const [allApps, setAllApps] = useState<MobileApplication[]>([]);
  const [zoneLabel, setZoneLabel] = useState<string | null>(
    () => user?.activePost?.zoneCode?.trim() || null,
  );
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  /** Home list filter from the 4 status cards. */
  const [recentFilter, setRecentFilter] = useState<
    'all' | 'assigned' | 'in_progress' | 'submitted'
  >('all');

  useEffect(() => {
    const roleHome = homeScreenForRole(user);
    if (roleHome !== 'dashboard') {
      go(roleHome);
    }
  }, [user, go]);

  useEffect(() => {
    if (!accessToken) {
      setAllApps([]);
      setZoneLabel(null);
      setLoadingTasks(false);
      return;
    }
    setLoadingTasks(true);
    const fallbackZone = user?.activePost?.zoneCode?.trim() || null;
    Promise.all([
      fetchEngineerTasks(accessToken, 'all'),
      fetchMyZoneMeta(accessToken).catch(() => null),
    ])
      .then(([all, meta]) => {
        setAllApps(all);
        setZoneLabel(meta?.zoneCode?.trim() || fallbackZone);
      })
      .catch(() => {
        setAllApps([]);
        setZoneLabel(fallbackZone);
      })
      .finally(() => setLoadingTasks(false));
  }, [accessToken, user?.activePost?.zoneCode]);

  const openAssignedTask = async (id: string) => {
    setOpeningId(id);
    try {
      const app = await openBackendTask(id);
      go(engineerResumeScreen(app));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unable to open task';
      showAppDialog({
        variant: 'error',
        title: 'Task',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      setOpeningId(null);
    }
  };

  const { assignedTasks, inProgressTasks, submittedTasks } = useMemo(() => {
    const assigned: MobileApplication[] = [];
    const inProgress: MobileApplication[] = [];
    const submitted: MobileApplication[] = [];
    for (const app of allApps) {
      const status = engineerApplicationListStatus(app);
      if (status === 'Assigned') assigned.push(app);
      else if (status === 'In progress') inProgress.push(app);
      else if (status === 'Submitted') submitted.push(app);
    }
    return {
      assignedTasks: assigned,
      inProgressTasks: inProgress,
      submittedTasks: submitted,
    };
  }, [allApps]);

  const filteredApps = useMemo(() => {
    if (recentFilter === 'assigned') return assignedTasks;
    if (recentFilter === 'in_progress') return inProgressTasks;
    if (recentFilter === 'submitted') return submittedTasks;
    return allApps;
  }, [allApps, recentFilter, assignedTasks, inProgressTasks, submittedTasks]);

  const searchedApps = useMemo(() => {
    if (!searchQuery.trim()) return filteredApps;
    const needle = searchQuery.trim().toLowerCase();
    return filteredApps.filter(
      (a) =>
        a.applicationNumber.toLowerCase().includes(needle) ||
        a.siteNo.toLowerCase().includes(needle) ||
        (a.zoneCode || '').toLowerCase().includes(needle) ||
        (a.addressArea || '').toLowerCase().includes(needle) ||
        (a.addressBlock || '').toLowerCase().includes(needle) ||
        (a.eOfficeNumber || '').toLowerCase().includes(needle),
    );
  }, [filteredApps, searchQuery]);

  const recentCards = searchedApps.slice(0, 12).map(mapTaskCard);

  const filterCards: Array<{
    id: 'all' | 'assigned' | 'in_progress' | 'submitted';
    label: string;
    value: number;
    bg: string;
    fg: string;
    icon: typeof FileText;
  }> = [
    {
      id: 'all',
      label: 'All tasks',
      value: allApps.length,
      bg: usesLightHeader() ? '#ECFDF5' : GLASS.tintBlue,
      fg: usesLightHeader() ? '#059669' : COLORS.primary,
      icon: Layers,
    },
    {
      id: 'assigned',
      label: 'Assigned',
      value: assignedTasks.length,
      bg: usesLightHeader() ? '#EEF2FF' : GLASS.tintBlue,
      fg: usesLightHeader() ? '#4F46E5' : COLORS.primary,
      icon: FileText,
    },
    {
      id: 'in_progress',
      label: 'In progress',
      value: inProgressTasks.length,
      bg: usesLightHeader() ? '#FEF3C7' : '#FEE2E2',
      fg: usesLightHeader() ? '#D97706' : '#DC2626',
      icon: Edit3,
    },
    {
      id: 'submitted',
      label: 'Submitted',
      value: submittedTasks.length,
      bg: usesLightHeader() ? '#E0F2FE' : GLASS.tintSky,
      fg: usesLightHeader() ? '#0284C7' : COLORS.primary,
      icon: ClipboardCheck,
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

  const sectionTitle =
    recentFilter === 'all'
      ? 'Recent Activity'
      : recentFilter === 'assigned'
        ? 'Assigned'
        : recentFilter === 'in_progress'
          ? 'In progress'
          : 'Submitted';

  const emptyMessage =
    recentFilter === 'assigned'
      ? 'No assigned tasks yet.'
      : recentFilter === 'in_progress'
        ? 'No in-progress tasks yet.'
        : recentFilter === 'submitted'
          ? 'No submitted applications yet.'
          : 'No tasks yet. Assigned applications will appear here.';

  return (
    <ScreenShell className="bg-background">
      <BdaPageWatermark />
      <ScrollView
        key={themeId}
        className="flex-1"
        style={{ zIndex: 1 }}
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <WelcomeHomeHeader
          user={user}
          zoneLabel={zoneLabel}
          go={go}
          onLogout={() => {
            void (async () => {
              await logout();
              go('login');
            })();
          }}
        />

        {/* Status filters — always one row: All · Assigned · In progress · Submitted */}
        <Box className="px-4" style={{ marginTop: welcomeFilterGap() }}>
          <HStack style={{ gap: 8 }}>
            {filterCards.map((s) => {
              const Icon = s.icon;
              const selected = recentFilter === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setRecentFilter(s.id)}
                  className="flex-1 active:opacity-90"
                  style={{
                    backgroundColor: selected ? COLORS.primary : COLORS.white,
                    borderRadius: 14,
                    paddingVertical: 8,
                    paddingHorizontal: 2,
                    alignItems: 'center',
                    minHeight: 78,
                    justifyContent: 'center',
                    shadowColor: selected ? COLORS.primaryDeep : '#0F172A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selected ? 0.1 : 0.04,
                    shadowRadius: 5,
                    elevation: selected ? 2 : 1,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : 'rgba(26,86,219,0.22)',
                    gap: 3,
                  }}
                >
                  <Box
                    className="items-center justify-center"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      backgroundColor: selected
                        ? 'rgba(255,255,255,0.22)'
                        : hexAlpha(COLORS.primary, 0.12),
                    }}
                  >
                    <Icon
                      size={13}
                      color={selected ? COLORS.white : COLORS.primary}
                      strokeWidth={2.3}
                    />
                  </Box>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 16,
                      lineHeight: 19,
                      color: selected ? COLORS.white : COLORS.ink,
                    }}
                  >
                    {loadingTasks ? '—' : s.value}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 11,
                      color: selected ? COLORS.white : COLORS.ink,
                      textAlign: 'center',
                      paddingHorizontal: 2,
                    }}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>
        </Box>

        <Box className="px-4" style={{ marginTop: 8 }}>
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by application no, site, zone…"
            height={46}
            iconColor={COLORS.ink}
            placeholderTextColor={COLORS.ink}
            inputStyle={{ fontSize: 15, color: COLORS.ink }}
          />
        </Box>

        {/* Filtered activity list */}
        <Box className="px-4" style={{ marginTop: 10 }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 17,
              color: COLORS.ink,
              marginBottom: 6,
            }}
          >
            {sectionTitle}
          </Text>

          <VStack style={{ gap: 8 }}>
            {loadingTasks ? (
              <ListLoader count={3} />
            ) : recentCards.length === 0 ? (
              <Box
                className="rounded-2xl border border-dashed px-4 py-8"
                style={{
                  borderColor: COLORS.border,
                  backgroundColor: 'rgba(255,255,255,0.42)',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: FONTS.medium,
                    fontSize: 14,
                    color: COLORS.ink,
                  }}
                >
                  {emptyMessage}
                </Text>
              </Box>
            ) : (
              recentCards.map((a) => {
              const pct =
                typeof a.progress === 'number' ? a.progress : progressFor(a.status);
              const canOpen = a.status === 'Assigned' || a.status === 'In progress';
              const openOrContinue = () => {
                if (canOpen && a.apiTask) {
                  void openAssignedTask(a.id);
                  return;
                }
                if (a.apiTask) {
                  setSelectedOfficeAppId(a.id);
                  go('engineer_detail');
                  return;
                }
                go('history');
              };
              const ringSize = 56;
              const stroke = 4.5;
              const radius = (ringSize - stroke) / 2;
              const circ = 2 * Math.PI * radius;
              const dash = (Math.max(0, Math.min(100, pct)) / 100) * circ;
              const chip = statusChipColors(a.status);
              const zoneDateLine = [a.zone?.trim() || null, a.date || null]
                .filter(Boolean)
                .join(' • ');
              return (
                <Pressable
                  key={a.id}
                  onPress={openOrContinue}
                  disabled={openingId === a.id}
                  className="active:opacity-92"
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 18,
                    marginBottom: 2,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    borderWidth: 1.5,
                    borderColor: hexAlpha(chip.fg, 0.28),
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 1,
                    opacity: openingId === a.id ? 0.7 : 1,
                  }}
                >
                  <HStack style={{ alignItems: 'center', gap: 10 }}>
                    <Box
                      className="items-center justify-center rounded-full"
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: chip.bg,
                        borderWidth: 1,
                        borderColor: hexAlpha(chip.fg, 0.22),
                        flexShrink: 0,
                      }}
                    >
                      <Edit3 size={18} color={chip.fg} strokeWidth={2.2} />
                    </Box>

                    <VStack style={{ flex: 1, minWidth: 0, gap: 3, justifyContent: 'center' }}>
                      <Text
                        style={{
                          fontFamily: FONTS.bold,
                          fontSize: 15,
                          lineHeight: 19,
                          color: '#0F172A',
                        }}
                        numberOfLines={2}
                      >
                        {a.project}
                      </Text>
                      <HStack style={{ alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                        <StatusChip status={a.status} compact />
                        <Text
                          style={{
                            fontFamily: FONTS.semibold,
                            fontSize: 13,
                            lineHeight: 16,
                            color: '#1A368E',
                            flexShrink: 1,
                            minWidth: 0,
                          }}
                          numberOfLines={1}
                        >
                          {siteNoMetaLine(a.siteNo)}
                        </Text>
                      </HStack>
                      {zoneDateLine ? (
                        <Text
                          style={{
                            fontFamily: FONTS.medium,
                            fontSize: 12,
                            lineHeight: 15,
                            color: '#64748B',
                          }}
                          numberOfLines={1}
                        >
                          {zoneDateLine}
                        </Text>
                      ) : null}
                    </VStack>

                    <Box
                      style={{
                        width: ringSize,
                        height: ringSize,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Svg width={ringSize} height={ringSize}>
                        <Circle
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                          r={radius}
                          stroke={chip.bg}
                          strokeWidth={stroke}
                          fill="none"
                        />
                        <Circle
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                          r={radius}
                          stroke={chip.fg}
                          strokeWidth={stroke}
                          fill="none"
                          strokeDasharray={`${dash} ${circ}`}
                          strokeLinecap="round"
                          transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                        />
                      </Svg>
                      <Text
                        style={{
                          position: 'absolute',
                          fontFamily: FONTS.bold,
                          fontSize: 12,
                          color: chip.fg,
                        }}
                      >
                        {pct}%
                      </Text>
                    </Box>
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
      showAppDialog({
        variant: 'error',
        title: 'Notification',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
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
        keyboardShouldPersistTaps="handled"
      >
        <Box className="px-5 pt-4">
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search notifications"
            nested={false}
            height={48}
            className="rounded-2xl bg-card shadow-sm"
            style={{ paddingHorizontal: 16 }}
            inputStyle={{ fontSize: 14 }}
          />

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
                            <Text className="text-xs font-bold" style={{ color: COLORS.primary }}>
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
        hidePlus
        hideAlerts
      />
    </ScreenShell>
  );
}

const ENGINEER_APP_FILTERS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: 'All', label: 'All', icon: Layers },
  { key: 'Assigned', label: 'Assigned', icon: FileText },
  { key: 'In progress', label: 'In progress', icon: Edit3 },
  { key: 'Submitted', label: 'Submitted', icon: Send },
];

const ENGINEER_APP_FILTER_KEYS = new Set(ENGINEER_APP_FILTERS.map((f) => f.key));

function normalizeEngineerAppsFilter(pre: string | null): string {
  if (pre && ENGINEER_APP_FILTER_KEYS.has(pre)) return pre;
  return 'All';
}

function ApplicationThumb({ uri }: { uri: string | null }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;

  return (
    <Box
      className="overflow-hidden items-center justify-center"
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        backgroundColor: '#EEF4FF',
        borderWidth: 1,
        borderColor: 'rgba(26,86,219,0.18)',
        flexShrink: 0,
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
  zone,
  date,
  image,
  onView,
  onOpen,
}: {
  project: string;
  siteNo?: string;
  status: string;
  village?: string;
  zone?: string;
  date: string;
  image: string | null;
  onView: () => void;
  /** Assigned / In progress — open capture flow. */
  onOpen?: () => void;
}) {
  const chip = statusChipColors(status);
  const site = (siteNo || '').replace(/^Site\s+/i, '').trim() || '—';
  const zoneDateLine = [zone?.trim() || null, date || null].filter(Boolean).join(' • ');
  const isSubmitted = status === 'Submitted';
  const isAssigned = status === 'Assigned';
  const isInProgress = status === 'In progress';

  const actionBtn = (() => {
    if (isSubmitted) {
      return (
        <Box
          className="items-center justify-center"
          accessibilityLabel="Submitted"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: '#DCFCE7',
            borderWidth: 1,
            borderColor: '#BBF7D0',
          }}
        >
          <CheckCircle2 size={16} color={COLORS.success} strokeWidth={2.4} />
        </Box>
      );
    }
    if (isAssigned && onOpen) {
      return (
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel="Open task"
          className="active:opacity-85 items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: chip.bg,
            borderWidth: 1,
            borderColor: hexAlpha(chip.fg, 0.22),
          }}
        >
          <ChevronRight size={18} color={chip.fg} strokeWidth={2.6} />
        </Pressable>
      );
    }
    if (isInProgress && onOpen) {
      return (
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel="Continue task"
          className="active:opacity-85 items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: COLORS.primary,
          }}
        >
          <Edit3 size={15} color={COLORS.white} strokeWidth={2.4} />
        </Pressable>
      );
    }
    return null;
  })();

  return (
    <Pressable
      onPress={onView}
      className="active:opacity-92"
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: hexAlpha(chip.fg, 0.28),
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <HStack style={{ alignItems: 'center', gap: 10 }}>
        <ApplicationThumb uri={image} />

        <VStack style={{ flex: 1, minWidth: 0, gap: 3, justifyContent: 'center' }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 15,
              lineHeight: 19,
              color: '#0F172A',
            }}
            numberOfLines={2}
          >
            {project}
          </Text>
          <HStack style={{ alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
            <StatusChip status={status} compact />
            <Text
              style={{
                fontFamily: FONTS.semibold,
                fontSize: 13,
                lineHeight: 16,
                color: '#1A368E',
                flexShrink: 1,
                minWidth: 0,
              }}
              numberOfLines={1}
            >
              Site no: {site}
            </Text>
          </HStack>
          {zoneDateLine ? (
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 12,
                lineHeight: 15,
                color: '#64748B',
              }}
              numberOfLines={1}
            >
              {zoneDateLine}
            </Text>
          ) : null}
        </VStack>

        <HStack style={{ alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Pressable
            onPress={onView}
            accessibilityRole="button"
            accessibilityLabel="View application"
            className="active:opacity-85 items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: COLORS.primary,
            }}
          >
            <Eye size={15} color={COLORS.white} strokeWidth={2.4} />
          </Pressable>
          {actionBtn}
        </HStack>
      </HStack>
    </Pressable>
  );
}

export function HistoryScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { applications, draft, openApplication, openBackendTask } = useProject();
  const { accessToken } = useAuth();
  const [tab, setTab] = useState(() =>
    normalizeEngineerAppsFilter(consumeEngineerAppsFilter()),
  );
  const [backTarget] = useState(() => consumeEngineerAppsReturn());
  const [apiTasks, setApiTasks] = useState<MobileApplication[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

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

  const canOpenTask = (status: string) =>
    status === 'Assigned' || status === 'In progress';

  const openTask = async (id: string) => {
    if (openingId) return;
    setOpeningId(id);
    try {
      const app = await openBackendTask(id);
      go(engineerResumeScreen(app));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unable to open task';
      showAppDialog({
        variant: 'error',
        title: 'Task',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      setOpeningId(null);
    }
  };

  const viewApplication = (id: string, status: string, live: boolean, apiTask?: boolean) => {
    if (apiTask) {
      setSelectedOfficeAppId(id);
      go('engineer_detail');
      return;
    }
    openApplication(id);
    go('details');
  };

  const liveApps = useMemo(() => {
    const apiRows = apiTasks.map(mapTaskCard);

    if (accessToken) {
      // Backend API is the single source of truth — ZC drafts are never shown to engineers.
      return apiRows;
    }

    const submitted = applications.map((a) => ({
      id: a.applicationId,
      project: a.projectName,
      siteNo: '',
      status: 'Submitted' as string,
      zone: '',
      date: new Date(a.submittedAt).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
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
              siteNo: draft.siteNo?.trim() || '',
              status: 'In progress' as string,
              zone: draft.zoneCode?.trim() || '',
              date: `Updated · ${new Date(draft.updatedAt).toLocaleString(undefined, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}`,
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
      <BdaPageWatermark />
      <Box style={{ zIndex: 1, flex: 1 }}>
      <AppHeader
        title="Applications"
        subtitle={
          loadingTasks
            ? 'Loading…'
            : `${filtered.length} application${filtered.length === 1 ? '' : 's'}`
        }
        go={go}
        onBack={() => go(backTarget ?? 'dashboard', { replace: true })}
      />

      <Box style={{ backgroundColor: '#F7FAFF' }}>
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
          {ENGINEER_APP_FILTERS.map((f) => {
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
                  borderRadius: 999,
                  backgroundColor: on ? '#EEF4FF' : COLORS.white,
                  borderWidth: 1.5,
                  borderColor: on ? hexAlpha(COLORS.primary, 0.45) : 'rgba(26,86,219,0.14)',
                  shadowColor: COLORS.primaryDeep,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: on ? 0.1 : 0.04,
                  shadowRadius: 4,
                  elevation: on ? 2 : 0,
                }}
              >
                <Icon
                  size={13}
                  color={on ? COLORS.primary : COLORS.ink}
                  strokeWidth={on ? 2.4 : 2.1}
                />
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 13,
                    color: on ? COLORS.primaryDeep : COLORS.ink,
                  }}
                >
                  {f.label}
                </Text>
                <Box
                  style={{
                    width: 22,
                    height: 22,
                    minWidth: 22,
                    borderRadius: 999,
                    backgroundColor: on ? COLORS.primary : '#EEF4FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 12,
                      lineHeight: 14,
                      color: on ? COLORS.white : COLORS.primaryDeep,
                      textAlign: 'center',
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                    }}
                  >
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
        style={{ backgroundColor: '#F7FAFF' }}
        contentContainerStyle={{ paddingBottom: 150, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack className="px-4" style={{ gap: 10 }}>
          {loadingTasks ? (
            <ListLoader count={4} text="Loading engineer applications…" />
          ) : filtered.length === 0 ? (
            <Box
              className="items-center py-14 px-6"
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: hexAlpha(COLORS.primary, 0.16),
              }}
            >
              <Box
                className="items-center justify-center"
                style={{
                  height: 56,
                  width: 56,
                  borderRadius: DESIGN.radiusLg,
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
                zone={'zone' in a ? a.zone : ''}
                date={a.date}
                image={a.image}
                onView={() => viewApplication(a.id, a.status, a.live, a.apiTask)}
                onOpen={
                  a.apiTask && canOpenTask(a.status)
                    ? () => void openTask(a.id)
                    : undefined
                }
              />
            ))
          )}
        </VStack>
      </ScrollView>
      <BottomNav active="apps" onNav={go} hidePlus hideAlerts />
      </Box>
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

  const listStatus = app ? engineerApplicationListStatus(app) : null;
  const cover = app ? taskCoverImage(app) : null;

  return (
    <ScreenShell className="bg-background">
      <Box style={{ flex: 1, backgroundColor: '#F0F4F8' }}>
        <ScrollView
          key={themeId}
          style={{ flex: 1, backgroundColor: '#F0F4F8' }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          <ViewApplicationHeader onBack={() => go('history')} zone={app?.zoneCode} />
          <Box
            style={{
              flexGrow: 1,
              backgroundColor: COLORS.white,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 16,
              gap: 12,
            }}
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
            <>
              <Box style={{ paddingHorizontal: SPACE.gutter }}>
                <Box
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 20,
                    borderWidth: 1.75,
                    borderColor: hexAlpha('#1A368E', 0.38),
                    overflow: 'hidden',
                    shadowColor: '#1A368E',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                >
                  <Box style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
                    <HStack className="items-center" style={{ gap: 10, alignItems: 'center' }}>
                      <Box
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 11,
                          backgroundColor: '#E8F0FE',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={16} color="#1A368E" strokeWidth={2.4} />
                      </Box>
                      <VStack style={{ flex: 1, minWidth: 0, flexShrink: 1, gap: 2, justifyContent: 'center' }}>
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: FONTS.bold,
                            fontSize: 15,
                            lineHeight: 18,
                            color: '#0F172A',
                            letterSpacing: -0.2,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {app.applicationNumber || `Site ${app.siteNo}`}
                        </Text>
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: FONTS.medium,
                            fontSize: 12,
                            lineHeight: 15,
                            color: '#64748B',
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          Application overview
                        </Text>
                      </VStack>
                      {listStatus ? <StatusChip status={listStatus} /> : null}
                    </HStack>
                  </Box>

                  <HStack style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12, alignItems: 'center' }}>
                    <Box
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        overflow: 'hidden',
                        backgroundColor: '#E8F0FE',
                        borderWidth: 1.5,
                        borderColor: hexAlpha('#1A368E', 0.42),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cover ? (
                        <ApiMediaImage
                          uri={cover}
                          style={{ width: 56, height: 56 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Building2 size={22} color="#1A368E" strokeWidth={2.2} />
                      )}
                    </Box>
                    <VStack style={{ flex: 1, minWidth: 0, gap: 6 }}>
                      <HStack style={{ gap: 6, flexWrap: 'wrap' }}>
                        <Box
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 999,
                            backgroundColor: '#F7FAFF',
                            borderWidth: 1.5,
                            borderColor: hexAlpha('#1A368E', 0.35),
                          }}
                        >
                          <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: COLORS.ink }}>
                            Site no:{' '}
                            <Text
                              style={{
                                fontFamily: FONTS.bold,
                                fontSize: 11,
                                color: '#1A368E',
                              }}
                            >
                              {app.siteNo?.trim() || '—'}
                            </Text>
                          </Text>
                        </Box>
                        <Box
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 999,
                            backgroundColor: '#F7FAFF',
                            borderWidth: 1.5,
                            borderColor: hexAlpha('#1A368E', 0.35),
                          }}
                        >
                          <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: COLORS.ink }}>
                            Zone:{' '}
                            <Text
                              style={{
                                fontFamily: FONTS.bold,
                                fontSize: 11,
                                color: '#1A368E',
                              }}
                            >
                              {app.zoneCode?.trim() || '—'}
                            </Text>
                          </Text>
                        </Box>
                      </HStack>
                      <HStack className="items-center" style={{ gap: 4 }}>
                        <Clock size={12} color="#1A368E" strokeWidth={2.3} />
                        <Text
                          style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}
                          numberOfLines={1}
                        >
                          {applicationCardDateLine(app)}
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              </Box>
              <ApplicationRecordDetails app={app} showEmptyEngineer={false} viewerRole="engineer" />
            </>
          )}
          </Box>
        </ScrollView>
      </Box>
    </ScreenShell>
  );
}

export function ProfileScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { user, logout, accessToken, refreshProfile } = useAuth();
  const appRole = resolveAppRole(user);
  const home = homeScreenForRole(user);
  const appsTarget =
    appRole === 'cao' || appRole === 'super_admin'
      ? 'cao_apps'
      : appRole === 'zc'
        ? 'zc_home'
        : 'history';
  const { updateProfilePhoto } = useAuth();
  const profilePhoto = user?.profilePhoto || user?.officer?.profilePhoto || null;
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void refreshProfile();
  }, [accessToken, refreshProfile]);

  const applyPickedAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setSavingPhoto(true);
    try {
      const photoData = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      await updateProfilePhoto(photoData);
      showAppDialog({
        variant: 'success',
        title: 'Profile photo',
        message: 'Profile photo updated successfully.',
        hideCancel: true,
        confirmLabel: 'OK',
      });
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
      showAppDialog({
        variant: 'error',
        title: 'Camera',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAppDialog({
          variant: 'warning',
          title: 'Photos permission needed',
          message: 'Allow photo library access in Settings so you can upload a profile photo.',
          hideCancel: true,
          confirmLabel: 'OK',
        });
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
      showAppDialog({
        variant: 'error',
        title: 'Gallery',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    }
  };

  const showPhotoSourceOptions = () => {
    showAppDialog({
      variant: 'info',
      title: 'Profile photo',
      message: 'Choose how to set your photo.',
      cancelLabel: 'Gallery',
      confirmLabel: 'Camera',
      onCancel: () => void handlePickFromGallery(),
      onConfirm: () => void handleTakePhoto(),
    });
  };

  const handleDeletePhoto = () => {
    showAppDialog({
      variant: 'error',
      title: 'Delete photo',
      message: 'Are you sure you want to remove your profile photo?',
      cancelLabel: 'Cancel',
      confirmLabel: 'Delete',
      onConfirm: () => {
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
    });
  };

  const u = user || {};
  const officer = u.officer;
  const post = u.activePost;
  const name =
    user?.name?.trim() ||
    [officer?.firstName, officer?.lastName].filter(Boolean).join(' ').trim() ||
    (appRole === 'zc' ? 'Ramesh Kumar (ZC)' : appRole === 'cao' ? 'Monisha s' : 'Engineer');
  const nameParts = name.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Monisha';
  const lastName = nameParts.slice(1).join(' ') || 's';
  const initials = `${firstName[0]?.toUpperCase() || ''}${lastName[0]?.toUpperCase() || ''}` || 'U';
  const loginId =
    officer?.personUniqueId || user?.loginId || 'CDRMS00007';
  const roleTitle = roleDisplayTitle(user);

  const zone =
    post?.zoneCode?.trim() ||
    post?.location?.trim() ||
    '—';
  const email = officer?.email || user?.email || '—';
  const phone = officer?.mobileNumber?.trim() || '—';
  const gender = officer?.gender?.trim() || '—';
  const department = officer?.department?.trim() || '—';
  const districtState = [officer?.districtName, officer?.state]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .join(', ') || '—';
  const officeAddress =
    post?.ofcAddress?.trim() || post?.location?.trim() || '—';
  const mappingStatus =
    officer?.status?.trim() ||
    (user?.status ? String(user.status) : '') ||
    '—';
  const mappingLabel =
    mappingStatus === '—'
      ? '—'
      : mappingStatus
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

  const insets = useSafeAreaInsets();
  const infoTiles: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    iconBg: string;
    iconFg: string;
  }> = [
    { label: 'Name', value: name, icon: User, iconBg: '#DBEAFE', iconFg: COLORS.primary },
    { label: 'Role', value: roleTitle, icon: Shield, iconBg: '#EDE9FE', iconFg: '#7C3AED' },
    { label: 'Email', value: email, icon: Mail, iconBg: '#DCFCE7', iconFg: '#059669' },
    { label: 'Mobile', value: phone, icon: Phone, iconBg: '#DBEAFE', iconFg: COLORS.primary },
    { label: 'Gender', value: gender, icon: UserCheck, iconBg: '#FFEDD5', iconFg: '#C2410C' },
    { label: 'Department', value: department, icon: Building2, iconBg: '#DCFCE7', iconFg: '#059669' },
    { label: 'Location', value: districtState, icon: MapPin, iconBg: '#EDE9FE', iconFg: '#7C3AED' },
    { label: 'Zone', value: zone, icon: Layers, iconBg: '#FFEDD5', iconFg: '#C2410C' },
    { label: 'Office', value: officeAddress, icon: Building2, iconBg: '#DBEAFE', iconFg: COLORS.primary },
    { label: 'Status', value: mappingLabel, icon: CheckCircle2, iconBg: '#DCFCE7', iconFg: '#059669' },
  ];

  return (
    <ScreenShell className="bg-background">
      <BdaPageWatermark />
      <Box
        style={{
          backgroundColor: '#F7FAFF',
          paddingTop: insets.top + 6,
          paddingHorizontal: SPACE.gutter,
          paddingBottom: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: 'rgba(26,86,219,0.12)',
          zIndex: 2,
        }}
      >
        <HStack className="items-center" style={{ gap: 8 }}>
          <Pressable
            onPress={() => go(home)}
            hitSlop={10}
            className="active:opacity-75"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: 'rgba(26,86,219,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={15} color={COLORS.primaryDeep} strokeWidth={2.3} />
          </Pressable>

          <VStack className="flex-1 min-w-0" style={{ gap: 3 }}>
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 22,
                lineHeight: 26,
                color: '#1A368E',
                letterSpacing: -0.3,
              }}
              numberOfLines={1}
            >
              My Profile
            </Text>
            <Text
              style={{
                fontFamily: FONTS.semibold,
                fontSize: 12,
                color: '#475569',
                lineHeight: 16,
              }}
              numberOfLines={1}
            >
              Officer details & personal information
            </Text>
          </VStack>

          <Box style={{ position: 'relative' }}>
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                overflow: 'hidden',
                backgroundColor: COLORS.primary,
                borderWidth: 2,
                borderColor: COLORS.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: COLORS.white }}>
                  {initials}
                </Text>
              )}
            </Box>
            <Box
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 9,
                height: 9,
                borderRadius: 5,
                backgroundColor: '#22C55E',
                borderWidth: 1.5,
                borderColor: COLORS.white,
              }}
            />
          </Box>
        </HStack>
      </Box>

      <ScrollView
        key={themeId}
        className="flex-1"
        style={{ zIndex: 1, backgroundColor: '#F7FAFF' }}
        contentContainerStyle={{
          flexGrow: 1,
          // Capsule nav (~70) + safe area + breathing room so Logout stays visible
          paddingBottom: 70 + Math.max(insets.bottom, 10) + 28,
          paddingTop: 8,
          gap: 10,
          paddingHorizontal: SPACE.gutter,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile summary card */}
        <Box
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            borderWidth: 1.75,
            borderColor: hexAlpha('#1A368E', 0.38),
            overflow: 'hidden',
            shadowColor: '#1A368E',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <Box
            style={{
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#EAF1FF',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(26,86,219,0.12)',
              paddingHorizontal: 14,
              paddingVertical: 13,
              minHeight: 66,
              justifyContent: 'center',
            }}
          >
            <Box
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                top: 0,
              }}
            >
              <ProfileSkylineLine width={360} height={64} />
            </Box>
            <HStack className="items-center" style={{ gap: 10, zIndex: 1 }}>
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#E8F0FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={16} color="#1A368E" strokeWidth={2.4} />
              </Box>
              <VStack style={{ gap: 2 }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 17, color: '#0F172A' }}>
                  Profile Photo
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.semibold,
                    fontSize: 12,
                    color: '#475569',
                    lineHeight: 16,
                  }}
                >
                  {profilePhoto ? 'Last updated' : 'Add a photo'}
                </Text>
              </VStack>
            </HStack>
          </Box>

          <HStack style={{ padding: 14, gap: 10, alignItems: 'flex-start' }}>
            <Box style={{ position: 'relative', flexShrink: 0 }}>
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
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: COLORS.primary,
                    borderWidth: 3,
                    borderColor: COLORS.primary,
                  }}
                >
                  {profilePhoto ? (
                    <Image
                      source={{ uri: profilePhoto }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 22, color: COLORS.white }}>
                      {initials}
                    </Text>
                  )}
                </Box>
              </Pressable>
              <Pressable
                onPress={showPhotoSourceOptions}
                disabled={savingPhoto}
                accessibilityLabel="Change profile photo"
                className="active:opacity-85"
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: COLORS.primary,
                  borderWidth: 2,
                  borderColor: COLORS.white,
                  opacity: savingPhoto ? 0.6 : 1,
                }}
              >
                <Camera size={11} color={COLORS.white} strokeWidth={2.4} />
              </Pressable>
            </Box>

            <VStack style={{ flex: 1, minWidth: 0, gap: 5, paddingTop: 2 }}>
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 16,
                  lineHeight: 21,
                  color: '#1A368E',
                }}
                numberOfLines={2}
              >
                {name}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 13,
                  color: '#1A368E',
                  lineHeight: 17,
                }}
                numberOfLines={2}
              >
                {roleTitle}
              </Text>
              <HStack className="items-start" style={{ gap: 5 }}>
                <Shield size={12} color="#1A368E" strokeWidth={2.4} style={{ marginTop: 1 }} />
                <VStack style={{ gap: 1, flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: '#475569' }}>
                    Login ID
                  </Text>
                  <Text
                    style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#1A368E' }}
                    numberOfLines={1}
                  >
                    {loginId}
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            {/* Active sits above the home/building art on the right */}
            <VStack style={{ alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <Box
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: '#ECFDF5',
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                }}
              >
                <Box
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#22C55E',
                  }}
                />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: '#047857' }}>
                  Active
                </Text>
              </Box>
              <ProfileHeroArt />
            </VStack>
          </HStack>
        </Box>

        {/* Personal information */}
        <Box
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            borderWidth: 1.75,
            borderColor: hexAlpha('#1A368E', 0.38),
            padding: 12,
            shadowColor: '#1A368E',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <HStack className="items-center" style={{ marginBottom: 10, gap: 8 }}>
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#E8F0FE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={16} color="#1A368E" strokeWidth={2.4} />
            </Box>
            <VStack style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: '#0F172A' }}>
                Personal Information
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 12,
                  color: '#475569',
                  lineHeight: 16,
                }}
              >
                Officer details
              </Text>
            </VStack>
          </HStack>

          <Box
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: 8,
              columnGap: 8,
            }}
          >
            {infoTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Box
                  key={tile.label}
                  style={{
                    width: '48%',
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: hexAlpha('#1A368E', 0.42),
                    backgroundColor: COLORS.white,
                    paddingHorizontal: 8,
                    paddingVertical: 7,
                  }}
                >
                  {/* Icon + key on one line */}
                  <HStack style={{ alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <Box
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        backgroundColor: tile.iconBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={11} color={tile.iconFg} strokeWidth={2.3} />
                    </Box>
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 12,
                        color: '#1A368E',
                        letterSpacing: 0.1,
                        lineHeight: 15,
                        flex: 1,
                        minWidth: 0,
                      }}
                      numberOfLines={1}
                    >
                      {tile.label}
                    </Text>
                  </HStack>
                  {/* Value on next line */}
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: 13,
                      color: '#0F172A',
                      lineHeight: 17,
                    }}
                  >
                    {tile.value || '—'}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Pressable
          onPress={async () => {
            await logout();
            go('login');
          }}
          className="active:opacity-90"
          style={{
            height: 48,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: `${COLORS.destructive}40`,
            backgroundColor: COLORS.white,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 4,
          }}
        >
          <LogOut size={16} color={COLORS.destructive} strokeWidth={2.2} />
          <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: COLORS.destructive }}>
            Logout
          </Text>
        </Pressable>
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
                <Text style={{ fontFamily: FONTS.bold, fontSize: 17, color: '#0F172A' }}>
                  Profile Photo
                </Text>
                <Pressable onPress={() => setPreviewModalOpen(false)} className="p-1">
                  <Text className="text-slate-400 font-bold text-base">✕</Text>
                </Pressable>
              </HStack>
              <Image
                source={{ uri: profilePhoto }}
                style={{ width: '100%', height: 300, borderRadius: DESIGN.cardRadius }}
                resizeMode="contain"
              />
              <HStack style={{ gap: 8, marginTop: 12 }}>
                <Pressable
                  onPress={() => {
                    setPreviewModalOpen(false);
                    showPhotoSourceOptions();
                  }}
                  className="flex-1 active:opacity-85"
                  style={{
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: COLORS.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.white }}>
                    Change
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDeletePhoto}
                  className="flex-1 active:opacity-85"
                  style={{
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: '#DC2626' }}>
                    Delete
                  </Text>
                </Pressable>
              </HStack>
            </Box>
          </Pressable>
        </Modal>
      ) : null}

      <BottomNav
        active="profile"
        onNav={go}
        homeTarget={home}
        appsTarget={appsTarget}
        hidePlus
        hideAlerts
      />
    </ScreenShell>
  );
}

/** Soft cityscape + trees + shade rays for Profile Photo header (ref mock). */
function ProfileSkylineLine({ width = 360, height = 64 }: { width?: number; height?: number }) {
  const shade = '#93C5FD';
  return (
    <Svg width={width} height={height} viewBox="0 0 360 64" preserveAspectRatio="xMaxYMax meet">
      {/* diagonal shade rays */}
      <Path d="M210 0 L250 64 L236 64 L196 0 Z" fill={shade} opacity={0.08} />
      <Path d="M250 0 L295 64 L278 64 L233 0 Z" fill={shade} opacity={0.1} />
      <Path d="M290 0 L340 64 L320 64 L270 0 Z" fill={shade} opacity={0.07} />
      {/* far buildings */}
      <Rect x={168} y={28} width={18} height={36} rx={1} fill="#BFDBFE" opacity={0.55} />
      <Rect x={188} y={18} width={22} height={46} rx={1} fill="#93C5FD" opacity={0.5} />
      <Rect x={212} y={24} width={14} height={40} rx={1} fill="#BFDBFE" opacity={0.55} />
      <Rect x={228} y={10} width={26} height={54} rx={1} fill="#60A5FA" opacity={0.38} />
      <Rect x={256} y={20} width={18} height={44} rx={1} fill="#93C5FD" opacity={0.48} />
      <Rect x={276} y={14} width={30} height={50} rx={1} fill="#3B82F6" opacity={0.28} />
      <Rect x={308} y={26} width={16} height={38} rx={1} fill="#93C5FD" opacity={0.45} />
      <Rect x={326} y={16} width={22} height={48} rx={1} fill="#BFDBFE" opacity={0.5} />
      {/* trees */}
      <Ellipse cx={180} cy={52} rx={7} ry={9} fill="#86EFAC" opacity={0.45} />
      <Rect x={178} y={54} width={4} height={10} fill="#86EFAC" opacity={0.35} />
      <Ellipse cx={248} cy={50} rx={8} ry={11} fill="#6EE7B7" opacity={0.4} />
      <Rect x={246} y={54} width={4} height={10} fill="#6EE7B7" opacity={0.32} />
      <Ellipse cx={300} cy={51} rx={6} ry={8} fill="#86EFAC" opacity={0.42} />
      <Rect x={298} y={54} width={3} height={10} fill="#86EFAC" opacity={0.32} />
      <Ellipse cx={340} cy={50} rx={9} ry={12} fill="#6EE7B7" opacity={0.38} />
      <Rect x={338} y={54} width={4} height={10} fill="#6EE7B7" opacity={0.3} />
    </Svg>
  );
}

/** Buildings + trees + map pin — matches ref profile hero art. */
function ProfileHeroArt() {
  return (
    <Box
      pointerEvents="none"
      style={{
        width: 72,
        height: 78,
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexShrink: 0,
      }}
    >
      <Svg width={72} height={78} viewBox="0 0 96 104">
        {/* soft ground glow */}
        <Ellipse cx={48} cy={94} rx={34} ry={8} fill={hexAlpha(COLORS.primary, 0.1)} />
        {/* buildings */}
        <Rect x={18} y={48} width={18} height={42} rx={3} fill="#BFDBFE" />
        <Rect x={34} y={30} width={24} height={60} rx={3} fill="#60A5FA" />
        <Rect x={54} y={40} width={18} height={50} rx={3} fill="#93C5FD" />
        {/* windows */}
        <Rect x={22} y={54} width={4} height={4} rx={0.8} fill="#EFF6FF" />
        <Rect x={28} y={54} width={4} height={4} rx={0.8} fill="#EFF6FF" />
        <Rect x={22} y={62} width={4} height={4} rx={0.8} fill="#EFF6FF" />
        <Rect x={28} y={62} width={4} height={4} rx={0.8} fill="#EFF6FF" />
        <Rect x={40} y={38} width={5} height={5} rx={1} fill="#DBEAFE" />
        <Rect x={48} y={38} width={5} height={5} rx={1} fill="#DBEAFE" />
        <Rect x={40} y={48} width={5} height={5} rx={1} fill="#DBEAFE" />
        <Rect x={48} y={48} width={5} height={5} rx={1} fill="#DBEAFE" />
        <Rect x={40} y={58} width={5} height={5} rx={1} fill="#DBEAFE" />
        <Rect x={48} y={58} width={5} height={5} rx={1} fill="#DBEAFE" />
        <Rect x={58} y={48} width={4} height={4} rx={0.8} fill="#EFF6FF" />
        <Rect x={64} y={48} width={4} height={4} rx={0.8} fill="#EFF6FF" />
        <Rect x={58} y={56} width={4} height={4} rx={0.8} fill="#EFF6FF" />
        <Rect x={64} y={56} width={4} height={4} rx={0.8} fill="#EFF6FF" />
        {/* green trees */}
        <Ellipse cx={16} cy={82} rx={7} ry={9} fill="#4ADE80" />
        <Rect x={14.5} y={86} width={3} height={8} rx={1} fill="#16A34A" />
        <Ellipse cx={78} cy={84} rx={8} ry={10} fill="#22C55E" />
        <Rect x={76.5} y={88} width={3} height={8} rx={1} fill="#15803D" />
        <Ellipse cx={68} cy={88} rx={5} ry={6} fill="#86EFAC" />
        {/* map pin above buildings */}
        <Path
          d="M48 8 C39 8 32 15 32 24 C32 36 48 52 48 52 C48 52 64 36 64 24 C64 15 57 8 48 8 Z"
          fill={COLORS.primary}
        />
        <Circle cx={48} cy={23} r={6} fill={COLORS.white} />
      </Svg>
    </Box>
  );
}
