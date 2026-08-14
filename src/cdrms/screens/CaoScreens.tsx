import {
  Download,
  FileText,
  Layers,
  RefreshCw,
  Send,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/src/auth/AuthContext';
import { ApiError } from '@/src/api/client';
import {
  applicationCardDateLine,
  applicationStatusTone,
  countZcBuckets,
  fetchApplication,
  fetchCaoApplications,
  fetchMyZoneMeta,
  normalizeApplicationStatus,
  type MobileApplication,
} from '@/src/api/applications';
import {
  AppHeader,
  BottomNav,
  ScreenShell,
  ScreenLoader,
  ListLoader,
  ButtonLoader,
} from '@/src/cdrms/components/primitives';
import {
  OfficeAppRow,
  StatusCountGrid,
} from '@/src/cdrms/components/StatusCountGrid';
import {
  BdaPageWatermark,
  WelcomeHomeHeader,
  welcomeFilterGap,
  welcomeOverlayScrollPad,
  welcomeSolidCollapseDistance,
} from '@/src/cdrms/components/WelcomeHomeChrome';
import { ApplicationRecordDetails } from '@/src/cdrms/components/ApplicationRecordDetails';
import { getCaoReturnScreen, getSelectedOfficeAppId, setCaoReturnScreen, setSelectedOfficeAppId } from '@/src/cdrms/officeSelection';
import { runApplicationPdfDownload } from '@/src/cdrms/lib/runApplicationPdfDownload';
import { usePdfDownloads } from '@/src/cdrms/hooks/usePdfDownloadProgress';
import { PdfDownloadThinProgress } from '@/src/cdrms/components/PdfDownloadThinProgress';
import { SearchField } from '@/src/cdrms/components/SearchField';
import { ViewApplicationScroll } from '@/src/cdrms/components/ViewApplicationHeader';
import {
  COLORS,
  FONTS,
  GLASS,
  GRADIENT_PRIMARY,
  themeStatColors,
  gradientStops,
  DESIGN,
  hexAlpha,
  usesLightHeader,
} from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Go } from '@/src/cdrms/types';

function addressLine(app: MobileApplication) {
  return [
    app.addressLine1,
    app.addressLine2,
    app.addressBlock,
    app.addressCity,
    app.addressState,
    app.addressPincode,
  ]
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(', ');
}

function submittedApps(apps: MobileApplication[]) {
  return apps.filter((a) => a.status === 'submitted');
}

type CaoTab = 'all' | 'submitted';

const CAO_STATUS_FILTERS: { key: CaoTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
];

export function CaoHomeScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const { accessToken, user, logout } = useAuth();
  const [apps, setApps] = useState<MobileApplication[]>([]);
  const [zoneLabel, setZoneLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CaoTab>('all');
  const [q, setQ] = useState('');
  const pdfDownloads = usePdfDownloads();
  const headerScrollY = useSharedValue(0);
  const onHeaderScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      headerScrollY.value = e.contentOffset.y;
    },
  });
  const overlayPad = welcomeOverlayScrollPad(insets.top);
  const collapseDist = welcomeSolidCollapseDistance(insets.top);
  const scrollMinH = windowH + (overlayPad > 0 ? collapseDist : 0);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const fallbackZone = user?.activePost?.zoneCode?.trim() || null;
    try {
      const [list, meta] = await Promise.all([
        fetchCaoApplications(accessToken),
        fetchMyZoneMeta(accessToken).catch(() => null),
      ]);
      setApps(list);
      setZoneLabel(meta?.zoneCode?.trim() || fallbackZone);
    } catch (e) {
      setApps([]);
      setZoneLabel(fallbackZone);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user?.activePost?.zoneCode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleDownloadApp = useCallback(
    (app: MobileApplication) => {
      if (!accessToken) return;
      void runApplicationPdfDownload(app, accessToken);
    },
    [accessToken],
  );

  const counts = useMemo(() => countZcBuckets(apps), [apps]);

  const submittedTone = applicationStatusTone('submitted');
  const filterCards = [
    {
      id: 'all' as const,
      label: 'All',
      value: counts.total,
      bg: GLASS.tintBlue,
      fg: COLORS.primary,
      icon: Layers,
    },
    {
      id: 'submitted' as const,
      label: 'Submitted',
      value: counts.submitted,
      bg: submittedTone.bg,
      fg: submittedTone.fg,
      icon: Send,
    },
  ];

  const filtered = useMemo(() => {
    let items = apps;
    if (tab === 'submitted') {
      items = items.filter((a) => normalizeApplicationStatus(a.status) === 'submitted');
    }
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter(
      (a) =>
        a.applicationNumber.toLowerCase().includes(needle) ||
        a.siteNo.toLowerCase().includes(needle) ||
        (a.assignedEngineerName || '').toLowerCase().includes(needle) ||
        (a.zoneCode || '').toLowerCase().includes(needle),
    );
  }, [apps, tab, q]);

  const sectionLabel = tab === 'submitted' ? 'Submitted' : 'Recent Activity';

  return (
    <ScreenShell className="bg-background">
      <BdaPageWatermark />
      {/* Header outside ScrollView so profile menu stays tappable when collapsed */}
      <WelcomeHomeHeader
        user={user}
        zoneLabel={zoneLabel}
        go={go}
        scrollY={headerScrollY}
        eyebrow="CAO"
        tagline="Review submitted applications"
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
        <Box className="px-3" style={{ marginTop: welcomeFilterGap() }}>
          <HStack style={{ gap: 6 }}>
            {filterCards.map((s) => {
              const Icon = s.icon;
              const selected = tab === s.id;
              const plainLite = usesLightHeader();
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setTab(s.id)}
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
                  }}
                >
                  <Box
                    className="items-center justify-center mb-1"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
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
                    {loading ? '—' : s.value}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 12,
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
          <HStack className="items-center justify-between mb-2">
            <Text className="text-[15px] font-bold" style={{ color: COLORS.ink }}>
              {sectionLabel}
            </Text>
            <Pressable onPress={() => void reload()} className="active:opacity-70">
              <HStack className="items-center" style={{ gap: 4 }}>
                <RefreshCw size={13} color={COLORS.primary} strokeWidth={2.4} />
                <Text className="text-[12px] font-semibold" style={{ color: COLORS.primary }}>
                  Refresh
                </Text>
              </HStack>
            </Pressable>
          </HStack>

          <SearchField
            value={q}
            onChangeText={setQ}
            placeholder="Search application, site, engineer…"
            height={48}
            iconColor={COLORS.ink}
            placeholderTextColor={COLORS.ink}
            inputStyle={{ fontSize: 15, color: COLORS.ink }}
            style={{
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: hexAlpha(COLORS.primary, 0.35),
              backgroundColor: COLORS.white,
              paddingHorizontal: 12,
            }}
          />

          {loading ? (
            <ListLoader text="Loading CAO applications…" />
          ) : filtered.length === 0 ? (
            <Box
              className="rounded-2xl border border-dashed px-4 py-8 mt-3"
              style={{
                borderColor: COLORS.border,
                backgroundColor: 'rgba(255,255,255,0.42)',
              }}
            >
              <Text className="text-center text-sm" style={{ color: COLORS.slate }}>
                No applications found matching your criteria.
              </Text>
            </Box>
          ) : (
            <VStack style={{ gap: 0, marginTop: 10 }}>
              {filtered.map((app) => (
                <OfficeAppRow
                  key={app.id}
                  title={app.applicationNumber}
                  siteNo={app.siteNo}
                  zoneCode={app.zoneCode}
                  engineerName={app.assignedEngineerName}
                  status={app.status}
                  dateLine={applicationCardDateLine(app)}
                  zoneBesideDate
                  compactDateZone
                  onPress={() => {
                    setSelectedOfficeAppId(app.id);
                    setCaoReturnScreen('cao_home');
                    go('cao_detail');
                  }}
                  onDownload={
                    app.status === 'submitted'
                      ? () => void handleDownloadApp(app)
                      : undefined
                  }
                  downloading={Boolean(pdfDownloads[app.id])}
                  downloadPercent={pdfDownloads[app.id]?.percent}
                />
              ))}
            </VStack>
          )}
        </Box>
      </Animated.ScrollView>

      <BottomNav
        active="home"
        onNav={go}
        homeTarget="cao_home"
        appsTarget="cao_apps"
        hidePlus
      />
    </ScreenShell>
  );
}

type CaoAppsFilter = 'All' | 'Submitted';

const CAO_APP_FILTERS: { key: CaoAppsFilter; status?: MobileApplication['status'] }[] = [
  { key: 'All' },
  { key: 'Submitted', status: 'submitted' },
];

/** All CAO zone applications — opened from bottom Apps tab. */
export function CaoApplicationsScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { accessToken } = useAuth();
  const [apps, setApps] = useState<MobileApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CaoAppsFilter>('All');
  const [q, setQ] = useState('');
  const pdfDownloads = usePdfDownloads();

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const list = await fetchCaoApplications(accessToken);
      setApps(list);
    } catch (e) {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleDownloadApp = useCallback(
    (app: MobileApplication) => {
      if (!accessToken) return;
      void runApplicationPdfDownload(app, accessToken);
    },
    [accessToken],
  );

  const filtered = useMemo(() => {
    const filterDef = CAO_APP_FILTERS.find((f) => f.key === tab);
    let items = apps;
    if (filterDef?.status) {
      items = items.filter((a) => a.status === filterDef.status);
    }
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter(
      (a) =>
        a.applicationNumber.toLowerCase().includes(needle) ||
        a.siteNo.toLowerCase().includes(needle) ||
        (a.assignedEngineerName || '').toLowerCase().includes(needle) ||
        (a.zoneCode || '').toLowerCase().includes(needle) ||
        addressLine(a).toLowerCase().includes(needle),
    );
  }, [apps, tab, q]);

  return (
    <ScreenShell key={themeId} className="bg-[#F8FAFC]">
      <Box style={{ flex: 1 }}>
        {/* Sticky Applications header + search */}
        <Box
          style={{
            zIndex: 40,
            elevation: 12,
            backgroundColor: '#F8FAFC',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
          }}
        >
          <AppHeader
            title="Applications"
            subtitle={`${submittedApps(apps).length} submitted · view & download only`}
            go={go}
          />
          <Box className="px-4 pb-2" style={{ backgroundColor: '#F8FAFC' }}>
            <SearchField
              value={q}
              onChangeText={setQ}
              placeholder="Search application, site, engineer…"
              height={48}
              iconColor={COLORS.primary}
              placeholderTextColor={COLORS.ink}
              inputStyle={{ fontSize: 15, color: COLORS.ink }}
              style={{
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: hexAlpha(COLORS.primary, 0.35),
                backgroundColor: COLORS.white,
              }}
              endAdornment={
                <Pressable onPress={() => void reload()} accessibilityLabel="Refresh">
                  <RefreshCw size={15} color={COLORS.primary} strokeWidth={2.4} />
                </Pressable>
              }
            />
          </Box>
        </Box>

      <ScrollView
        style={{ flex: 1, minHeight: 0, zIndex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ListLoader text="Loading all CAO applications…" />
        ) : filtered.length === 0 ? (
          <Box
            style={{
              borderRadius: DESIGN.radiusLg,
              backgroundColor: COLORS.white,
              paddingVertical: 32,
              paddingHorizontal: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <FileText size={28} color={COLORS.ink} />
            <Text
              style={{
                marginTop: 12,
                fontFamily: FONTS.bold,
                fontSize: 15,
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
          filtered.map((app) => (
            <OfficeAppRow
              key={app.id}
              title={app.applicationNumber}
              siteNo={app.siteNo}
              zoneCode={app.zoneCode}
              engineerName={app.assignedEngineerName}
              status={app.status}
              dateLine={applicationCardDateLine(app)}
              zoneBesideDate
              compactDateZone
              onPress={() => {
                setSelectedOfficeAppId(app.id);
                setCaoReturnScreen('cao_apps');
                go('cao_detail');
              }}
              onDownload={
                app.status === 'submitted'
                  ? () => void handleDownloadApp(app)
                  : undefined
              }
              downloading={Boolean(pdfDownloads[app.id])}
              downloadPercent={pdfDownloads[app.id]?.percent}
            />
          ))
        )}
      </ScrollView>

      <BottomNav
        active="apps"
        onNav={go}
        homeTarget="cao_home"
        appsTarget="cao_apps"
        hidePlus
        hideAlerts
      />
      </Box>
    </ScreenShell>
  );
}

export function CaoDetailScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { accessToken } = useAuth();
  const [app, setApp] = useState<MobileApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfDownloads = usePdfDownloads();
  const backTarget = getCaoReturnScreen();
  const activeDownload = app ? pdfDownloads[app.id] ?? null : null;
  const isDownloadingThis = Boolean(activeDownload);

  useEffect(() => {
    const id = getSelectedOfficeAppId();
    if (!accessToken || !id) {
      setError('No application selected');
      setLoading(false);
      return;
    }
    fetchApplication(accessToken, id)
      .then(setApp)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Not found'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleDownload = () => {
    if (!app || !accessToken || isDownloadingThis) return;
    void runApplicationPdfDownload(app, accessToken);
  };

  return (
    <ScreenShell className="bg-background">
      <ViewApplicationScroll
        scrollKey={themeId}
        onBack={() => go(backTarget)}
        zone={app?.zoneCode}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
          <Box
            style={{
              flexGrow: 1,
              backgroundColor: COLORS.white,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              gap: 8,
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
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: COLORS.destructive, textAlign: 'center' }}>
                {error || 'Not found'}
              </Text>
            </Box>
          ) : (
            <VStack style={{ gap: 8 }}>
              <ApplicationRecordDetails app={app} />

              <Box style={{ marginHorizontal: 16 }}>
                <Pressable
                  onPress={() => void handleDownload()}
                  disabled={isDownloadingThis}
                  className="overflow-hidden active:opacity-90"
                  style={{
                    borderRadius: DESIGN.cardRadius,
                    opacity: isDownloadingThis ? 0.7 : 1,
                    shadowColor: COLORS.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.24,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  <LinearGradient
                    colors={gradientStops(GRADIENT_PRIMARY)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      minHeight: 48,
                      paddingHorizontal: 16,
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: isDownloadingThis ? 10 : 0,
                    }}
                  >
                    {isDownloadingThis && activeDownload ? (
                      <VStack style={{ width: '100%', gap: 6 }}>
                        <Text
                          style={{
                            fontFamily: FONTS.bold,
                            fontSize: 14,
                            color: COLORS.white,
                            textAlign: 'center',
                          }}
                        >
                          Downloading…
                        </Text>
                        <PdfDownloadThinProgress
                          percent={activeDownload.percent}
                          color="#FFFFFF"
                          trackColor="rgba(255,255,255,0.35)"
                          labelColor="#FFFFFF"
                        />
                        <Text
                          style={{
                            fontFamily: FONTS.medium,
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.92)',
                            textAlign: 'center',
                          }}
                          numberOfLines={1}
                        >
                          {activeDownload.label}
                        </Text>
                      </VStack>
                    ) : (
                      <HStack style={{ alignItems: 'center', gap: 8 }}>
                        <Download size={16} color={COLORS.white} />
                        <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.white }}>
                          Download PDF
                        </Text>
                      </HStack>
                    )}
                  </LinearGradient>
                </Pressable>
              </Box>
            </VStack>
          )}
          </Box>
      </ViewApplicationScroll>
    </ScreenShell>
  );
}

/** @deprecated CAO no longer approves — kept for route compatibility. */
export function CaoApprovalScreen({ go }: { go: Go }) {
  return <CaoDetailScreen go={go} />;
}
