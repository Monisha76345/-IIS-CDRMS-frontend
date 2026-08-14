import {
  Activity,
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
import { Image, Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
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
  welcomeOverlayScrollPad,
  welcomeSolidCollapseDistance,
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
  applicationStatusTone,
  engineerResumeScreen,
  engineerTaskProgressPercent,
  engineerApplicationListStatus,
  type MobileApplication,
} from '@/src/api/applications';
import { ApplicationRecordDetails } from '@/src/cdrms/components/ApplicationRecordDetails';
import { StatusLeadingIcon } from '@/src/cdrms/components/StatusCountGrid';
import { ViewApplicationScroll } from '@/src/cdrms/components/ViewApplicationHeader';
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
const PROFILE_PHOTO_BANNER = require('../../../assets/illustrations/profile-photo-banner.png');
const PROFILE_HERO_ART = require('../../../assets/illustrations/survey-step-hero.png');

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
    village:
      [
        app.addressLine1,
        app.addressLine2,
        app.addressBlock,
        app.addressCity,
        app.addressState,
        app.addressPincode,
      ]
        .map((p) => (p || '').trim())
        .filter(Boolean)
        .join(', ') || '—',
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
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
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
  const headerScrollY = useSharedValue(0);
  const onHeaderScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      headerScrollY.value = e.contentOffset.y;
    },
  });
  const overlayPad = welcomeOverlayScrollPad(insets.top);
  const collapseDist = welcomeSolidCollapseDistance(insets.top);
  /** Short lists still need enough scroll room to fully collapse the header. */
  const scrollMinH = windowH + (overlayPad > 0 ? collapseDist : 0);

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
        (a.addressLine1 || '').toLowerCase().includes(needle) ||
        (a.addressLine2 || '').toLowerCase().includes(needle) ||
        (a.addressCity || '').toLowerCase().includes(needle) ||
        (a.addressState || '').toLowerCase().includes(needle) ||
        (a.addressBlock || '').toLowerCase().includes(needle) ||
        (a.addressPincode || '').toLowerCase().includes(needle) ||
        (a.eOfficeNumber || '').toLowerCase().includes(needle),
    );
  }, [filteredApps, searchQuery]);

  // Show all apps for the active filter (do not cap at 12 — count cards must match list)
  const recentCards = searchedApps.map(mapTaskCard);

  const assignedTone = applicationStatusTone('assigned');
  const inProgressTone = applicationStatusTone('in_progress');
  const submittedTone = applicationStatusTone('submitted');

  const filterCards: Array<{
    id: 'all' | 'assigned' | 'in_progress' | 'submitted';
    label: string;
    value: number;
    icon: typeof FileText;
    iconBg: string;
    iconFg: string;
  }> = [
    {
      id: 'all',
      label: 'All',
      value: allApps.length,
      icon: Layers,
      iconBg: hexAlpha(COLORS.primary, 0.12),
      iconFg: COLORS.primary,
    },
    {
      id: 'assigned',
      label: 'Assigned',
      value: assignedTasks.length,
      icon: FileText,
      iconBg: assignedTone.bg,
      iconFg: assignedTone.fg,
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: inProgressTasks.length,
      icon: Activity,
      iconBg: inProgressTone.bg,
      iconFg: inProgressTone.fg,
    },
    {
      id: 'submitted',
      label: 'Submitted',
      value: submittedTasks.length,
      icon: Send,
      iconBg: submittedTone.bg,
      iconFg: submittedTone.fg,
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
      {/* Header outside ScrollView so profile menu stays tappable when collapsed */}
      <WelcomeHomeHeader
        user={user}
        zoneLabel={zoneLabel}
        go={go}
        scrollY={headerScrollY}
        onLogout={() => {
          void (async () => {
            await logout();
            go('login');
          })();
        }}
      />
      <Animated.ScrollView
        key={themeId}
        className="flex-1"
        style={{ flex: 1, minHeight: 0, zIndex: 1 }}
        contentContainerStyle={{
          paddingTop: overlayPad,
          paddingBottom: 150,
          minHeight: scrollMinH,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        overScrollMode="never"
        onScroll={onHeaderScroll}
        scrollEventThrottle={16}
      >
        {/* Dashboard metric cards — earlier colors, slightly shorter height */}
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
                    minHeight: 80,
                    justifyContent: 'center',
                    shadowColor: selected ? COLORS.primaryDeep : '#0F172A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selected ? 0.12 : 0.05,
                    shadowRadius: 5,
                    elevation: selected ? 2 : 1,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : 'rgba(26,86,219,0.22)',
                    gap: 3,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: selected ? '#FFFFFF' : s.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      size={13}
                      color={selected ? COLORS.primary : s.iconFg}
                      strokeWidth={2.3}
                    />
                  </View>
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
              const ringSize = 40;
              const stroke = 3.5;
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
                    <StatusLeadingIcon status={a.status} size={38} />

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
                      <Text
                        style={{
                          fontFamily: FONTS.semibold,
                          fontSize: 13,
                          lineHeight: 16,
                          color: '#1A368E',
                        }}
                        numberOfLines={1}
                      >
                        {siteNoMetaLine(a.siteNo)}
                      </Text>
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

                    <VStack
                      style={{
                        alignItems: 'center',
                        gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <StatusChip status={a.status} />
                      <Box
                        style={{
                          width: ringSize,
                          height: ringSize,
                          alignItems: 'center',
                          justifyContent: 'center',
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
                            fontSize: 10,
                            color: chip.fg,
                          }}
                        >
                          {pct}%
                        </Text>
                      </Box>
                    </VStack>
                  </HStack>
                </Pressable>
              );
            })
            )}
          </VStack>
        </Box>
      </Animated.ScrollView>

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
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 13,
              lineHeight: 16,
              color: '#1A368E',
            }}
            numberOfLines={1}
          >
            Site no: {site}
          </Text>
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

        <VStack style={{ alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <StatusChip status={status} />
          <HStack style={{ alignItems: 'center', gap: 6 }}>
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
        </VStack>
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
        {/* Sticky Applications header + filter chips (pinned while list scrolls) */}
        <Box
          style={{
            zIndex: 40,
            elevation: 12,
            backgroundColor: '#F7FAFF',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
          }}
        >
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
          <ScrollView
            key={`apps-filters-${themeId}`}
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
          style={{ flex: 1, minHeight: 0, backgroundColor: '#F7FAFF', zIndex: 1 }}
          contentContainerStyle={{ paddingBottom: 150, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
      <ViewApplicationScroll
        scrollKey={themeId}
        onBack={() => go('history')}
        zone={app?.zoneCode}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
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
      </ViewApplicationScroll>
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

          <Pressable
            onPress={() => {
              if (profilePhoto) setPreviewModalOpen(true);
              else showPhotoSourceOptions();
            }}
            disabled={savingPhoto}
            accessibilityLabel="Profile photo"
            className="active:opacity-90"
            style={{ position: 'relative', flexShrink: 0 }}
          >
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
          </Pressable>
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
        {/* Profile summary card — outer wraps shadow; inner clips banner radius */}
        <Box
          style={{
            borderRadius: 20,
            backgroundColor: COLORS.white,
            shadowColor: '#0F2A6B',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.14,
            shadowRadius: 18,
            elevation: 7,
          }}
        >
          <Box
            style={{
              borderRadius: 20,
              borderWidth: 1.75,
              borderColor: hexAlpha('#1A368E', 0.38),
              overflow: 'hidden',
              backgroundColor: COLORS.white,
            }}
          >
          <Box
            style={{
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#F4F8FF',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(26,86,219,0.12)',
              paddingHorizontal: 14,
              paddingVertical: 13,
              minHeight: 72,
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
              <Image
                source={PROFILE_PHOTO_BANNER}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </Box>
            <HStack className="items-center" style={{ gap: 10, zIndex: 1 }}>
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={16} color={COLORS.white} strokeWidth={2.4} />
              </Box>
              <VStack style={{ gap: 2 }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 17, color: '#0F172A' }}>
                  Profile Photo
                </Text>
                {/* <Text
                  style={{
                    fontFamily: FONTS.semibold,
                    fontSize: 12,
                    color: '#475569',
                    lineHeight: 16,
                  }}
                >
                  {profilePhoto ? 'Last updated' : 'Add a photo'}
                </Text> */}
              </VStack>
            </HStack>
          </Box>

          <HStack style={{ padding: 14, gap: 10, alignItems: 'center' }}>
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

            <VStack style={{ flex: 1, minWidth: 0, gap: 5 }}>
              <HStack className="items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 16,
                    lineHeight: 21,
                    color: '#1A368E',
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {name}
                </Text>
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
                    flexShrink: 0,
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
              </HStack>
              <HStack className="items-center" style={{ gap: 4, minWidth: 0 }}>
                <MapPin size={11} color="#1A368E" strokeWidth={2.4} />
                <Text
                  style={{
                    fontFamily: FONTS.semibold,
                    fontSize: 11,
                    color: '#1A368E',
                    lineHeight: 14,
                    flex: 1,
                    minWidth: 0,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {roleTitle}
                  {zone !== '—' ? ` · ${zone}` : ''}
                </Text>
              </HStack>
              <HStack className="items-center" style={{ gap: 5 }}>
                <Shield size={12} color="#1A368E" strokeWidth={2.4} />
                <Text
                  style={{ fontFamily: FONTS.semibold, fontSize: 12, color: '#475569' }}
                  numberOfLines={1}
                >
                  Login ID
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 14,
                    color: '#1A368E',
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {loginId}
                </Text>
              </HStack>
            </VStack>

            <Box
              pointerEvents="none"
              style={{
                width: 64,
                height: 64,
                flexShrink: 0,
              }}
            >
              <Image
                source={PROFILE_HERO_ART}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </Box>
          </HStack>
          </Box>
        </Box>

        {/* Personal information */}
        <Box
          style={{
            borderRadius: 20,
            backgroundColor: COLORS.white,
            shadowColor: '#0F2A6B',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.14,
            shadowRadius: 18,
            elevation: 7,
          }}
        >
        <Box
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            borderWidth: 1.75,
            borderColor: hexAlpha('#1A368E', 0.38),
            padding: 12,
            overflow: 'hidden',
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
                    shadowColor: '#0F2A6B',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 2,
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
                        fontSize: 14,
                        color: '#1A368E',
                        letterSpacing: 0.1,
                        lineHeight: 17,
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
            borderColor: '#FECACA',
            backgroundColor: '#FEF2F2',
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
        // ZC keeps the center + on every tab (including Profile); engineer/CAO hide it.
        hidePlus={appRole !== 'zc'}
        hideAlerts
        onPlus={
          appRole === 'zc'
            ? () => {
                setZcEditApplicationId(null);
                go('zc_create');
              }
            : undefined
        }
      />
    </ScreenShell>
  );
}

