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
  Phone,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  UserCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, StyleSheet } from 'react-native';
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
import { GlassSectionCard } from '@/src/cdrms/components/GlassSurface';
import {
  BdaPageWatermark,
  WelcomeHomeHeader,
  welcomeFilterGap,
  listCardSurface,
  listCardInnerClipStyle,
  listCardStatusRailStyle,
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
import { DateZoneMetaRow } from '@/src/cdrms/components/DateZoneMetaRow';
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

function siteZoneMetaLine(siteNo?: string | null, zone?: string | null) {
  const site = (siteNo || '').replace(/^Site\s+/i, '').trim() || '—';
  const z = (zone || '').trim() || '—';
  return `Site no: ${site}  Zone: ${z}`;
}

function getAppStatusAccent(status: string): string {
  switch (status) {
    case 'Submitted':
    case 'Verified':
    case 'Approved':
      return '#059669';
    case 'Returned':
      return '#D97706';
    case 'Rejected':
      return COLORS.destructive;
    case 'In progress':
      return '#0284C7';
    case 'Assigned':
      return '#4F46E5';
    case 'Draft':
      return '#7C3AED';
    default:
      return COLORS.primary;
  }
}

/** Soft left-rail tint paired with status accent. */
function welcomeAccentSoft(status: string): string {
  switch (status) {
    case 'Submitted':
    case 'Verified':
    case 'Approved':
      return 'rgba(5,150,105,0.14)';
    case 'Returned':
      return 'rgba(217,119,6,0.14)';
    case 'Rejected':
      return 'rgba(220,38,38,0.12)';
    case 'In progress':
      return 'rgba(2,132,199,0.14)';
    case 'Assigned':
      return 'rgba(79,70,229,0.14)';
    case 'Draft':
      return 'rgba(124,58,237,0.12)';
    default:
      return hexAlpha(COLORS.primary, 0.12);
  }
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
        contentContainerStyle={{ paddingBottom: 100 }}
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
        <Box className="px-3" style={{ marginTop: welcomeFilterGap() }}>
          <HStack style={{ gap: 6 }}>
            {filterCards.map((s) => {
              const Icon = s.icon;
              const selected = recentFilter === s.id;
              const plainLite = usesLightHeader();
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setRecentFilter(s.id)}
                  className="flex-1 active:opacity-90"
                  style={{
                    backgroundColor: selected
                      ? COLORS.primary
                      : plainLite
                        ? s.bg
                        : COLORS.white,
                    borderRadius: DESIGN.cardRadius,
                    paddingVertical: 8,
                    paddingHorizontal: 2,
                    alignItems: 'center',
                    minHeight: 66,
                    justifyContent: 'center',
                    shadowColor: selected ? COLORS.primaryDeep : GLASS.shadow,
                    shadowOffset: { width: 0, height: plainLite ? 2 : 4 },
                    shadowOpacity: selected ? 0.2 : plainLite ? 0.03 : 0.06,
                    shadowRadius: plainLite ? 6 : 8,
                    elevation: selected ? 3 : plainLite ? 1 : 2,
                    borderWidth: 1.5,
                    borderColor: selected ? COLORS.primary : hexAlpha(COLORS.primary, 0.55),
                    gap: 4,
                  }}
                >
                  <Box
                    className="items-center justify-center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: plainLite ? 999 : 10,
                      backgroundColor: selected
                        ? 'rgba(255,255,255,0.22)'
                        : plainLite
                          ? 'rgba(255,255,255,0.55)'
                          : s.bg,
                    }}
                  >
                    <Icon size={14} color={selected ? COLORS.white : s.fg} strokeWidth={2.3} />
                  </Box>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 15,
                      color: selected ? COLORS.white : COLORS.ink,
                    }}
                  >
                    {loadingTasks ? '—' : s.value}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 9,
                      color: selected ? 'rgba(255,255,255,0.9)' : COLORS.slate,
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

        <Box className="px-4 mt-3">
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by application no, site, zone…"
          />
        </Box>

        {/* Filtered activity list */}
        <Box className="px-4 mt-3">
          <Text className="text-[15px] font-bold mb-2" style={{ color: COLORS.ink }}>
            {sectionTitle}
          </Text>

          <VStack space="sm">
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
                <Text className="text-center text-sm" style={{ color: COLORS.slate }}>
                  {emptyMessage}
                </Text>
              </Box>
            ) : (
              recentCards.map((a, cardIdx) => {
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
              const accent = getAppStatusAccent(a.status);
              const accentSoft = welcomeAccentSoft(a.status);
              return (
                <Box
                  key={a.id}
                  style={[
                    listCardSurface(cardIdx),
                    { padding: 0 },
                    DESIGN.listVariant === 'ghost'
                      ? {
                          borderRadius: 0,
                          marginBottom: 0,
                          backgroundColor: 'transparent',
                          borderWidth: 0,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: COLORS.border,
                        }
                      : null,
                  ]}
                >
                  <HStack
                    style={
                      DESIGN.listVariant === 'ghost'
                        ? { alignItems: 'stretch' }
                        : listCardInnerClipStyle()
                    }
                  >
                    <Box
                      style={
                        DESIGN.listVariant === 'ghost'
                          ? {
                              width: 5,
                              backgroundColor: accent,
                              alignSelf: 'stretch',
                              borderRadius: 2,
                            }
                          : listCardStatusRailStyle(accent)
                      }
                    />
                    <HStack
                      className="items-start flex-1"
                      style={{
                        gap: 10,
                        paddingVertical: DESIGN.listVariant === 'ghost' ? 10 : 7,
                        paddingRight: 10,
                        paddingLeft: 10,
                      }}
                    >
                    <Box
                      className="items-center justify-center rounded-full"
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: accentSoft,
                        borderWidth: 1,
                        borderColor: hexAlpha(accent, 0.28),
                      }}
                    >
                      <FileText size={16} color={accent} strokeWidth={2.2} />
                    </Box>
                    <VStack className="flex-1 min-w-0">
                      <HStack className="items-start justify-between gap-2">
                        <Pressable onPress={openOrContinue} className="flex-1 min-w-0 active:opacity-90">
                          <Text
                            style={{
                              fontFamily: FONTS.bold,
                              fontSize: 15,
                              color: COLORS.ink,
                            }}
                            numberOfLines={1}
                          >
                            {a.project}
                          </Text>
                        </Pressable>
                        <Box style={{ flexShrink: 0, marginLeft: 8 }}>
                          <StatusChip status={a.status} />
                        </Box>
                      </HStack>
                      <Pressable onPress={openOrContinue} className="active:opacity-90">
                        <Text
                          style={{
                            fontFamily: FONTS.semibold,
                            fontSize: 13,
                            color: COLORS.ink,
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          {siteNoMetaLine(a.siteNo)}
                        </Text>
                        {a.date ? (
                          <DateZoneMetaRow date={a.date} zone={a.zone} marginTop={2} />
                        ) : null}
                      </Pressable>

                      <HStack className="items-center gap-2" style={{ marginTop: 6 }}>
                        <Box
                          className="flex-1 rounded-full overflow-hidden"
                          style={{ height: 5, backgroundColor: accentSoft }}
                        >
                          <Box
                            style={{
                              width: `${pct}%`,
                              height: 5,
                              borderRadius: 999,
                              backgroundColor: accent,
                            }}
                          />
                        </Box>
                        <Text className="text-xs font-bold" style={{ color: accent }}>
                          {pct}%
                        </Text>
                        {a.status === 'Submitted' ? (
                          <Box
                            className="items-center justify-center"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: DESIGN.stepRadius,
                              backgroundColor: '#DCFCE7',
                              borderWidth: 1,
                              borderColor: '#BBF7D0',
                            }}
                          >
                            <CheckCircle2 size={16} color="#059669" strokeWidth={2.4} />
                          </Box>
                        ) : a.status === 'Assigned' && canOpen ? (
                          <Pressable
                            onPress={() => {
                              if (a.apiTask) void openAssignedTask(a.id);
                              else go('history');
                            }}
                            disabled={openingId === a.id}
                            accessibilityRole="button"
                            accessibilityLabel="Open task"
                            className="active:opacity-85 items-center justify-center"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: DESIGN.stepRadius,
                              backgroundColor: accentSoft,
                              borderWidth: 1,
                              borderColor: hexAlpha(accent, 0.3),
                              opacity: openingId === a.id ? 0.6 : 1,
                            }}
                          >
                            <ChevronRight size={18} color={accent} strokeWidth={2.6} />
                          </Pressable>
                        ) : a.status === 'In progress' && canOpen ? (
                          <Pressable
                            onPress={() => {
                              if (a.apiTask) void openAssignedTask(a.id);
                              else go('history');
                            }}
                            disabled={openingId === a.id}
                            accessibilityRole="button"
                            accessibilityLabel="Continue task"
                            className="active:opacity-85 items-center justify-center"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: DESIGN.stepRadius,
                              backgroundColor: accent,
                              opacity: openingId === a.id ? 0.6 : 1,
                            }}
                          >
                            <Edit3 size={15} color={COLORS.white} strokeWidth={2.4} />
                          </Pressable>
                        ) : null}
                      </HStack>
                    </VStack>
                    </HStack>
                  </HStack>
                </Box>
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
        hidePlus={home !== 'zc_home'}
        hideAlerts={home !== 'zc_home'}
        onPlus={home === 'zc_home' ? () => { setZcEditApplicationId(null); go('zc_create'); } : undefined}
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
        borderRadius: DESIGN.cardRadius,
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
  zone,
  date,
  image,
  onView,
  onOpen,
}: {
  project: string;
  siteNo?: string;
  status: string;
  village: string;
  zone?: string;
  date: string;
  image: string | null;
  onView: () => void;
  /** Assigned / In progress — open capture flow. */
  onOpen?: () => void;
}) {
  const accent = getAppStatusAccent(status);
  const meta = siteZoneMetaLine(siteNo, zone);
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
            width: 34,
            height: 34,
            borderRadius: DESIGN.stepRadius,
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
            width: 34,
            height: 34,
            borderRadius: DESIGN.stepRadius,
            backgroundColor: GLASS.tintBlue,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <ChevronRight size={18} color={COLORS.primary} strokeWidth={2.6} />
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
            width: 34,
            height: 34,
            borderRadius: DESIGN.stepRadius,
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
    <Pressable onPress={onView} className="active:opacity-92">
      <Box style={[listCardSurface(), { padding: 0 }]}>
        <HStack style={listCardInnerClipStyle()}>
          <Box style={listCardStatusRailStyle(accent)} />
          <HStack
            className="flex-1 items-start"
            style={{ paddingVertical: 11, paddingHorizontal: 12, gap: 10 }}
          >
            <Pressable onPress={onView} className="active:opacity-92" style={{ marginTop: 2 }}>
              <ApplicationThumb uri={image} />
            </Pressable>
            <VStack className="flex-1 min-w-0" style={{ gap: 6 }}>
              <HStack className="items-center" style={{ gap: 8 }}>
                <Pressable onPress={onView} className="flex-1 min-w-0 active:opacity-92">
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 14,
                      lineHeight: 19,
                      color: COLORS.ink,
                    }}
                    numberOfLines={1}
                  >
                    {project}
                  </Text>
                </Pressable>
                <Box style={{ flexShrink: 0 }}>
                  <StatusChip status={status} />
                </Box>
              </HStack>

              <Pressable onPress={onView} className="active:opacity-92">
                <Text
                  style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.ink }}
                  numberOfLines={1}
                >
                  {meta}
                </Text>
              </Pressable>

              <HStack className="items-center justify-between" style={{ gap: 8 }}>
                {date ? (
                  <HStack className="items-center flex-1 min-w-0" style={{ gap: 4 }}>
                    <Clock size={12} color={COLORS.primary} strokeWidth={2.3} />
                    <Text
                      style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}
                      numberOfLines={1}
                    >
                      {date}
                    </Text>
                  </HStack>
                ) : (
                  <Box style={{ flex: 1 }} />
                )}
                <HStack className="items-center" style={{ gap: 6, flexShrink: 0 }}>
                  <Pressable
                    onPress={onView}
                    accessibilityRole="button"
                    accessibilityLabel="View application"
                    className="active:opacity-85 items-center justify-center"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: DESIGN.stepRadius,
                      backgroundColor: COLORS.primary,
                    }}
                  >
                    <Eye size={15} color={COLORS.white} strokeWidth={2.4} />
                  </Pressable>
                  {actionBtn}
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

      <Box style={{ backgroundColor: 'transparent' }}>
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
                  borderRadius: DESIGN.cardRadius,
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
                    borderRadius: DESIGN.chipRadius,
                    backgroundColor: on ? GLASS.tintBlue : COLORS.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.ink }}>
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
                backgroundColor: 'rgba(255,255,255,0.45)',
                borderRadius: DESIGN.radiusLg,
                shadowOpacity: 0,
                elevation: 0,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(15,23,42,0.08)',
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

  return (
    <ScreenShell className="bg-background">
      <BdaPageWatermark />
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
        style={{ zIndex: 1 }}
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
          <ApplicationRecordDetails app={app} showEmptyEngineer={false} viewerRole="engineer" />
        )}
      </ScrollView>
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
        style={{ zIndex: 1 }}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingTop: 12,
          gap: 12,
        }}
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
                    borderRadius: DESIGN.headerRadius,
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
                    borderRadius: DESIGN.stepRadius,
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
                    borderRadius: DESIGN.stepRadius,
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
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.success }}>
                    Active
                  </Text>
                </Box>
              </HStack>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.slate }} numberOfLines={1}>
                {roleTitle} · {zone}
              </Text>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.ink }} numberOfLines={1}>
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
                  borderRadius: DESIGN.stepRadius,
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
                  borderRadius: DESIGN.stepRadius,
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
            rightValue={mappingLabel}
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
              borderRadius: DESIGN.cardRadius,
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
                style={{ width: '100%', height: 300, borderRadius: DESIGN.cardRadius }}
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
        onPlus={appRole === 'zc' ? () => { setZcEditApplicationId(null); go('zc_create'); } : undefined}
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
            fontFamily: FONTS.bold,
            fontSize: 12,
            color: COLORS.ink,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {leftLabel}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 13,
            color: COLORS.slate,
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
            fontFamily: FONTS.bold,
            fontSize: 12,
            color: COLORS.ink,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {rightLabel}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 13,
            color: COLORS.slate,
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
