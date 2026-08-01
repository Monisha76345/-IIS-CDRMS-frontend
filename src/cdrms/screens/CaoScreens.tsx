import {
  ClipboardList,
  Download,
  FileText,
  RefreshCw,
  Search,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, TextInput } from 'react-native';
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
  fetchApplication,
  fetchCaoApplications,
  fetchCaoCounts,
  type MobileApplication,
} from '@/src/api/applications';
import { ApplicationStatusBadge } from '@/src/cdrms/components/ApplicationStatusBadge';
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
  type StatusCountItem,
} from '@/src/cdrms/components/StatusCountGrid';
import { ApplicationRecordDetails } from '@/src/cdrms/components/ApplicationRecordDetails';
import { getCaoReturnScreen, getSelectedOfficeAppId, setCaoReturnScreen, setSelectedOfficeAppId } from '@/src/cdrms/officeSelection';
import { downloadApplicationPdf } from '@/src/cdrms/lib/downloadApplicationPdf';
import { COLORS, FONTS } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

function addressLine(app: MobileApplication) {
  return [app.addressArea, app.addressBlock, app.addressPincode].filter(Boolean).join(', ');
}

function submittedApps(apps: MobileApplication[]) {
  return apps.filter((a) => a.status === 'submitted');
}

export function CaoHomeScreen({ go }: { go: Go }) {
  const { accessToken, user } = useAuth();
  const [apps, setApps] = useState<MobileApplication[]>([]);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [list, c] = await Promise.all([
        fetchCaoApplications(accessToken),
        fetchCaoCounts(accessToken).catch(() => null),
      ]);
      setApps(list);
      setSubmittedCount(
        c?.pending ?? list.filter((a) => a.status === 'submitted').length,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load tasks');
      setApps([]);
      setSubmittedCount(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const countItems: StatusCountItem[] = [
    {
      key: 'submitted',
      label: 'Submitted',
      count: submittedCount,
      icon: ClipboardList,
      tint: '#2563EB',
      soft: '#DBEAFE',
    },
  ];

  const filtered = useMemo(() => {
    let items = submittedApps(apps);
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter(
      (a) =>
        a.applicationNumber.toLowerCase().includes(needle) ||
        a.siteNo.toLowerCase().includes(needle) ||
        (a.assignedEngineerName || '').toLowerCase().includes(needle) ||
        (a.zoneCode || '').toLowerCase().includes(needle),
    );
  }, [apps, q]);

  return (
    <ScreenShell className="bg-[#F8FAFC]">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="CAO Tasks"
          subtitle={`Welcome, ${displayName(user)} · view & download submissions`}
          go={go}
        />

        <Box className="px-4 mt-4">
          <HStack className="items-baseline justify-between" style={{ marginBottom: 12, gap: 8 }}>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: COLORS.ink }}>
              Task overview
            </Text>
            <Text
              style={{
                flexShrink: 1,
                fontFamily: FONTS.medium,
                fontSize: 12,
                color: COLORS.ink,
                textAlign: 'right',
              }}
              numberOfLines={1}
            >
              {submittedCount} submitted
            </Text>
          </HStack>

          <StatusCountGrid
            items={countItems}
            activeKey="submitted"
            columns={2}
            onSelect={() => {}}
          />

          <Box
            className="mt-4 flex-row items-center"
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingHorizontal: 12,
              height: 44,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
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
          </Box>

          <HStack className="items-center justify-between" style={{ marginTop: 20, marginBottom: 10 }}>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: COLORS.ink }}>
              Submitted
              {!loading ? ` · ${filtered.length}` : ''}
            </Text>
            <Pressable
              onPress={() => void reload()}
              accessibilityLabel="Refresh"
              className="active:opacity-70"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={15} color={COLORS.primary} strokeWidth={2.4} />
            </Pressable>
          </HStack>

          {loading ? (
            <ListLoader text="Loading CAO applications…" />
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
                borderRadius: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.white,
                paddingVertical: 28,
                paddingHorizontal: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}>
                No submitted tasks
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  color: COLORS.ink,
                  marginTop: 6,
                  textAlign: 'center',
                }}
              >
                Engineer submissions will appear here for view and download.
              </Text>
            </Box>
          ) : (
            filtered.map((app) => (
              <OfficeAppRow
                key={app.id}
                title={app.applicationNumber}
                subtitle={`Site ${app.siteNo} · Zone ${app.zoneCode}`}
                meta={`${app.assignedEngineerName || '—'} · ${addressLine(app) || '—'}`}
                status={app.status}
                onPress={() => {
                  setSelectedOfficeAppId(app.id);
                  setCaoReturnScreen('cao_home');
                  go('cao_detail');
                }}
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
        hideAlerts
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
      <AppHeader
        title="Applications"
        subtitle={`${submittedApps(apps).length} submitted · view & download only`}
        go={go}
      />

      <Box style={{ backgroundColor: '#F8FAFC' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            gap: 8,
          }}
        >
          {CAO_APP_FILTERS.map((f) => {
            const on = tab === f.key;
            const count =
              f.key === 'All'
                ? apps.length
                : apps.filter((a) => a.status === f.status).length;
            return (
              <Pressable
                key={f.key}
                onPress={() => setTab(f.key)}
                style={{
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? COLORS.primary : COLORS.white,
                  borderWidth: 1,
                  borderColor: on ? COLORS.primary : COLORS.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 12,
                    color: on ? '#FFFFFF' : COLORS.ink,
                  }}
                >
                  {f.key} · {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

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
              subtitle={`Site ${app.siteNo} · Zone ${app.zoneCode}`}
              meta={`${app.assignedEngineerName || '—'} · ${addressLine(app) || '—'}`}
              status={app.status}
              onPress={() => {
                setSelectedOfficeAppId(app.id);
                setCaoReturnScreen('cao_apps');
                go('cao_detail');
              }}
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
    if (!app || !accessToken) return;
    setDownloading(true);
    try {
      const result = await downloadApplicationPdf(app, accessToken);
      Alert.alert('Download complete', result.message);
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Could not generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScreenShell className="bg-[#F8FAFC]">
      <AppHeader
        title="View Application"
        onBack={() => go(backTarget)}
        gradient={false}
        go={go}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ScreenLoader text="Loading application details…" />
        ) : error || !app ? (
          <Box
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#FECACA',
              backgroundColor: '#FEF2F2',
              padding: 14,
            }}
          >
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: '#DC2626' }}>
              {error || 'Not found'}
            </Text>
          </Box>
        ) : (
          <VStack style={{ gap: 12 }}>
            <Box
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                overflow: 'hidden',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.07,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <HStack>
                <Box
                  style={{
                    width: 4,
                    backgroundColor: '#2563EB',
                    alignSelf: 'stretch',
                  }}
                />
                <VStack className="flex-1" style={{ padding: 12, gap: 6 }}>
                  <HStack className="items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <Box
                      style={{
                        backgroundColor: '#EFF6FF',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: COLORS.primary }}>
                        Zone {app.zoneCode}
                      </Text>
                    </Box>
                    <Box
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: COLORS.ink }}>
                        Site {app.siteNo}
                      </Text>
                    </Box>
                    <Box style={{ marginLeft: 'auto' }}>
                      <ApplicationStatusBadge status={app.status} size="md" />
                    </Box>
                  </HStack>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 17, color: COLORS.ink }}>
                    {app.applicationNumber}
                  </Text>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}>
                    Engineer: {app.assignedEngineerName || '—'}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <ApplicationRecordDetails app={app} />

            <Pressable
              onPress={() => void handleDownload()}
              disabled={downloading}
              style={{
                height: 48,
                borderRadius: 14,
                backgroundColor: COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: downloading ? 0.7 : 1,
              }}
            >
              {downloading ? (
                <ButtonLoader color="#FFF" />
              ) : (
                <HStack className="items-center" style={{ gap: 6 }}>
                  <Download size={16} color="#FFFFFF" />
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                    Download PDF
                  </Text>
                </HStack>
              )}
            </Pressable>
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
