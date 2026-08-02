import {
  Download,
  FileText,
  Layers,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/src/auth/AuthContext';
import { displayName } from '@/src/auth/roles';
import { ApiError } from '@/src/api/client';
import {
  applicationCardDateLine,
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
import { ApplicationRecordDetails } from '@/src/cdrms/components/ApplicationRecordDetails';
import { getCaoReturnScreen, getSelectedOfficeAppId, setCaoReturnScreen, setSelectedOfficeAppId } from '@/src/cdrms/officeSelection';
import { downloadApplicationPdf, openPdfFile } from '@/src/cdrms/lib/downloadApplicationPdf';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';
import { COLORS, FONTS, GLASS, GRADIENT_PRIMARY, themeStatColors, gradientStops } from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Go } from '@/src/cdrms/types';

function CaoDownloadOverlay({ visible }: { visible: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.48)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 280,
            borderRadius: 24,
            backgroundColor: COLORS.white,
            paddingVertical: 28,
            paddingHorizontal: 24,
            alignItems: 'center',
            gap: 14,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.2,
            shadowRadius: 28,
            elevation: 12,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#BFDBFE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: COLORS.ink, textAlign: 'center' }}>
            Downloading PDF…
          </Text>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.slate, textAlign: 'center' }}>
            Please wait while the file is prepared.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function addressLine(app: MobileApplication) {
  return [app.addressArea, app.addressBlock, app.addressPincode].filter(Boolean).join(', ');
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
  const { accessToken, user } = useAuth();
  const [apps, setApps] = useState<MobileApplication[]>([]);
  const [zoneLabel, setZoneLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CaoTab>('all');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [list, meta] = await Promise.all([
        fetchCaoApplications(accessToken),
        fetchMyZoneMeta(accessToken).catch(() => null),
      ]);
      setApps(list);
      setZoneLabel(
        meta?.zoneCode?.trim() ||
          list.find((a) => a.zoneCode?.trim())?.zoneCode?.trim() ||
          null,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load applications');
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleDownloadApp = useCallback(
    async (app: MobileApplication) => {
      if (!accessToken || downloading) return;
      setDownloading(true);
      try {
        const result = await downloadApplicationPdf(app, accessToken);
        const pdfUri = result.openUri || result.savedPath;
        showAppDialog({
          variant: 'success',
          title: 'Downloaded',
          message: result.message,
          cancelLabel: 'OK',
          confirmLabel: 'Share',
          onConfirm: () => {
            if (pdfUri) void openPdfFile(pdfUri);
          },
        });
      } catch (e) {
        showAppDialog({
          variant: 'error',
          title: 'Download failed',
          message: e instanceof Error ? e.message : 'Could not generate PDF',
          hideCancel: true,
          confirmLabel: 'OK',
        });
      } finally {
        setDownloading(false);
      }
    },
    [accessToken, downloading],
  );

  const counts = useMemo(() => countZcBuckets(apps), [apps]);

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

  const sectionLabel = tab === 'submitted' ? 'Submitted applications' : 'All applications';

  const statColors = themeStatColors();
  const countItems = [
    { key: 'all', label: 'Total', count: counts.total, icon: Layers, ...statColors },
    { key: 'submitted', label: 'Submitted', count: counts.submitted, icon: Send, ...statColors },
  ];

  return (
    <ScreenShell className="bg-background">
      <CaoDownloadOverlay visible={downloading} />
      <ScrollView
        key={themeId}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          title="Welcome"
          subtitle={displayName(user)}
          welcome
          zoneLabel={zoneLabel}
          go={go}
        />

        <Box className="px-4" style={{ marginTop: 10 }}>
          <Text
            className="text-[15px] font-bold"
            style={{ color: COLORS.ink, marginBottom: 8 }}
          >
            Application overview
          </Text>

          <StatusCountGrid
            items={countItems}
            activeKey={tab}
            columns={2}
            onSelect={(key) => setTab(key as CaoTab)}
          />

          <Box
            className="mt-3 flex-row items-center"
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingHorizontal: 10,
              height: 42,
            }}
          >
            <Search size={16} color={COLORS.slate} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search application, site, engineer…"
              placeholderTextColor={COLORS.slate}
              style={{ flex: 1, marginLeft: 8, fontSize: 13, color: COLORS.ink }}
            />
          </Box>



          <HStack className="items-center justify-between" style={{ marginTop: 10, marginBottom: 6 }}>
            <Text className="text-[14px] font-bold" style={{ color: COLORS.ink }}>
              {sectionLabel}
            </Text>
            <Pressable onPress={() => void reload()} className="active:opacity-70">
              <Text className="text-[12px] font-semibold" style={{ color: COLORS.primary }}>
                Refresh
              </Text>
            </Pressable>
          </HStack>

          {loading ? (
            <ListLoader text="Loading CAO applications…" />
          ) : error ? (
            <Text className="text-[13px]" style={{ color: COLORS.destructive, marginTop: 8 }}>
              {error}
            </Text>
          ) : filtered.length === 0 ? (
            <Text className="text-[13px]" style={{ color: COLORS.slate, marginTop: 8 }}>
              No applications found matching your criteria.
            </Text>
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
              />
            ))
          )}
        </Box>
      </ScrollView>

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
  const { accessToken } = useAuth();
  const [apps, setApps] = useState<MobileApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CaoAppsFilter>('All');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCaoApplications(accessToken);
      setApps(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load applications');
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleDownloadApp = useCallback(
    async (app: MobileApplication) => {
      if (!accessToken || downloading) return;
      setDownloading(true);
      try {
        const result = await downloadApplicationPdf(app, accessToken);
        const pdfUri = result.openUri || result.savedPath;
        showAppDialog({
          variant: 'success',
          title: 'Downloaded',
          message: result.message,
          cancelLabel: 'OK',
          confirmLabel: 'Share',
          onConfirm: () => {
            if (pdfUri) void openPdfFile(pdfUri);
          },
        });
      } catch (e) {
        showAppDialog({
          variant: 'error',
          title: 'Download failed',
          message: e instanceof Error ? e.message : 'Could not generate PDF',
          hideCancel: true,
          confirmLabel: 'OK',
        });
      } finally {
        setDownloading(false);
      }
    },
    [accessToken, downloading],
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
    <ScreenShell className="bg-[#F8FAFC]">
      <CaoDownloadOverlay visible={downloading} />
      <AppHeader
        title="Applications"
        subtitle={`${submittedApps(apps).length} submitted · view & download only`}
        go={go}
      />

      <Box style={{ backgroundColor: '#F8FAFC' }}>


        <Box className="px-4 pb-2">
          <HStack
            className="items-center"
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <Search size={16} color={COLORS.primary} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search application, site, engineer…"
              placeholderTextColor="#94A3B8"
              style={{
                flex: 1,
                marginLeft: 8,
                fontFamily: FONTS.medium,
                fontSize: 13,
                color: COLORS.ink,
              }}
            />
            <Pressable onPress={() => void reload()} accessibilityLabel="Refresh">
              <RefreshCw size={15} color={COLORS.primary} strokeWidth={2.4} />
            </Pressable>
          </HStack>
        </Box>
      </Box>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ListLoader text="Loading all CAO applications…" />
        ) : error ? (
          <Box
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#FECACA',
              backgroundColor: '#FEF2F2',
              padding: 14,
            }}
          >
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: '#DC2626' }}>
              {error}
            </Text>
          </Box>
        ) : filtered.length === 0 ? (
          <Box
            style={{
              borderRadius: 16,
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
    </ScreenShell>
  );
}

export function CaoDetailScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { accessToken } = useAuth();
  const [app, setApp] = useState<MobileApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backTarget = getCaoReturnScreen();

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

  const handleDownload = async () => {
    if (!app || !accessToken || downloading) return;
    setDownloading(true);
    try {
      const result = await downloadApplicationPdf(app, accessToken);
      const pdfUri = result.openUri || result.savedPath;
      showAppDialog({
        variant: 'success',
        title: 'Downloaded',
        message: result.message,
        cancelLabel: 'OK',
        confirmLabel: 'Share',
        onConfirm: () => {
          if (pdfUri) void openPdfFile(pdfUri);
        },
      });
    } catch (e) {
      showAppDialog({
        variant: 'error',
        title: 'Download failed',
        message: e instanceof Error ? e.message : 'Could not generate PDF',
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScreenShell className="bg-background">
      <CaoDownloadOverlay visible={downloading} />
      <AppHeader
        title="View Application"
        subtitle={app?.applicationNumber || 'Application details'}
        onBack={() => go(backTarget)}
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
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: COLORS.destructive, textAlign: 'center' }}>
              {error || 'Not found'}
            </Text>
          </Box>
        ) : (
          <VStack style={{ gap: 12 }}>
            <ApplicationRecordDetails app={app} />

            <Box style={{ marginHorizontal: 16 }}>
              <Pressable
                onPress={() => void handleDownload()}
                disabled={downloading}
                className="overflow-hidden active:opacity-90"
                style={{
                  borderRadius: 14,
                  opacity: downloading ? 0.7 : 1,
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
                    height: 48,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {downloading ? (
                    <ButtonLoader color={COLORS.white} />
                  ) : (
                    <>
                      <Download size={16} color={COLORS.white} />
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.white }}>
                        Download PDF
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Box>
          </VStack>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

/** @deprecated CAO no longer approves — kept for route compatibility. */
export function CaoApprovalScreen({ go }: { go: Go }) {
  return <CaoDetailScreen go={go} />;
}
