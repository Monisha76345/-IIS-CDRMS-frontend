import {
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, TextInput } from 'react-native';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/src/auth/AuthContext';
import { displayName, resolveAppRole } from '@/src/auth/roles';
import { ApiError } from '@/src/api/client';
import {
  applicationStatusLabel,
  caoDecideApplication,
  fetchApplication,
  fetchCaoApplications,
  fetchCaoCounts,
  type CaoCounts,
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
  DetailRow,
  OfficeAppRow,
  StatusCountGrid,
  type StatusCountItem,
} from '@/src/cdrms/components/StatusCountGrid';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { resolveBoundaryDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import { getSelectedOfficeAppId, setSelectedOfficeAppId } from '@/src/cdrms/officeSelection';
import { COLORS, FONTS } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

type CaoTab = 'pending' | 'verified' | 'returned' | 'rejected' | 'all';

function addressLine(app: MobileApplication) {
  return [app.addressArea, app.addressBlock, app.addressPincode].filter(Boolean).join(', ');
}

export function CaoHomeScreen({ go }: { go: Go }) {
  const { accessToken, user } = useAuth();
  const [apps, setApps] = useState<MobileApplication[]>([]);
  const [counts, setCounts] = useState<CaoCounts>({
    pending: 0,
    verified: 0,
    returned: 0,
    rejected: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CaoTab>('pending');
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
      if (c) setCounts(c);
      else {
        setCounts({
          pending: list.filter((a) => a.status === 'submitted').length,
          verified: list.filter((a) => a.status === 'verified').length,
          returned: list.filter((a) => a.status === 'returned').length,
          rejected: list.filter((a) => a.status === 'rejected').length,
          total: list.length,
        });
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load tasks');
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const countItems: StatusCountItem[] = [
    {
      key: 'pending',
      label: 'Pending review',
      count: counts.pending,
      icon: ClipboardList,
      tint: '#2563EB',
      soft: '#DBEAFE',
    },
    {
      key: 'verified',
      label: 'Verified',
      count: counts.verified,
      icon: CheckCircle2,
      tint: '#059669',
      soft: '#D1FAE5',
    },
    {
      key: 'returned',
      label: 'Returned',
      count: counts.returned,
      icon: RotateCcw,
      tint: '#D97706',
      soft: '#FEF3C7',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: counts.rejected,
      icon: XCircle,
      tint: '#DC2626',
      soft: '#FEE2E2',
    },
  ];

  const filtered = useMemo(() => {
    let items = apps;
    if (tab === 'pending') items = items.filter((a) => a.status === 'submitted');
    else if (tab === 'verified') items = items.filter((a) => a.status === 'verified');
    else if (tab === 'returned') items = items.filter((a) => a.status === 'returned');
    else if (tab === 'rejected') items = items.filter((a) => a.status === 'rejected');
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

  const sectionLabel = countItems.find((i) => i.key === tab)?.label || 'All';

  return (
    <ScreenShell className="bg-[#F8FAFC]">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="CAO Tasks"
          subtitle={`Welcome, ${displayName(user)} · verify submissions`}
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
              Tap a card to filter · {counts.total} total
            </Text>
          </HStack>

          <StatusCountGrid
            items={countItems}
            activeKey={tab}
            columns={2}
            onSelect={(key) => setTab(key as CaoTab)}
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
              {sectionLabel}
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
                No tasks here
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
                Nothing in this bucket yet.
              </Text>
            </Box>
          ) : (
            filtered.map((app) => (
              <OfficeAppRow
                key={app.id}
                title={app.applicationNumber}
                subtitle={`Site ${app.siteNo} · Zone ${app.zoneCode}`}
                meta={`${app.assignedEngineerName || '—'} · ${addressLine(app) || '—'}`}
                status={applicationStatusLabel(app.status)}
                onPress={() => {
                  setSelectedOfficeAppId(app.id);
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
        appsTarget="cao_home"
        hidePlus
        hideAlerts
      />
    </ScreenShell>
  );
}

export function CaoDetailScreen({ go }: { go: Go }) {
  const { accessToken, user } = useAuth();
  const isSuperAdmin = resolveAppRole(user) === 'super_admin';
  const [app, setApp] = useState<MobileApplication | null>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'verify' | 'return' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getSelectedOfficeAppId();
    if (!accessToken || !id) {
      setError('No task selected');
      setLoading(false);
      return;
    }
    fetchApplication(accessToken, id)
      .then((data) => {
        setApp(data);
        if (data.caoRemarks) setRemarks(data.caoRemarks);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Not found'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const canReview = !isSuperAdmin && app?.status === 'submitted';

  const act = async (kind: 'verify' | 'return' | 'reject') => {
    if (!accessToken || !app) return;
    if ((kind === 'return' || kind === 'reject') && !remarks.trim()) {
      return Alert.alert('Remarks required', 'Please enter remarks for return/reject.');
    }
    setBusy(kind);
    try {
      await caoDecideApplication(accessToken, app.id, kind, remarks.trim() || undefined);
      Alert.alert(
        'Done',
        kind === 'verify'
          ? 'Application verified'
          : kind === 'return'
            ? 'Returned to engineer'
            : 'Application rejected',
        [{ text: 'OK', onPress: () => go('cao_home') }],
      );
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScreenShell className="bg-[#F8FAFC]">
      <AppHeader title="Task review" onBack={() => go('cao_home')} gradient={false} go={go} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ScreenLoader text="Loading CAO task review…" />
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
          <VStack style={{ gap: 10 }}>
            {isSuperAdmin ? (
              <Box
                style={{
                  backgroundColor: '#FFFBEB',
                  borderColor: '#FDE68A',
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#92400E' }}>
                  Super Admin view — approval actions disabled
                </Text>
              </Box>
            ) : null}

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
                    backgroundColor:
                      app.status === 'verified'
                        ? '#059669'
                        : app.status === 'returned'
                          ? '#F97316'
                          : app.status === 'rejected'
                            ? '#EF4444'
                            : '#2563EB',
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
                    <Box
                      style={{
                        marginLeft: 'auto',
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        backgroundColor: '#EFF6FF',
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: COLORS.primary }}>
                        {applicationStatusLabel(app.status)}
                      </Text>
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

            <Box
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 12,
                paddingTop: 4,
                paddingBottom: 2,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 13,
                  color: COLORS.ink,
                  paddingTop: 8,
                  paddingBottom: 2,
                }}
              >
                Site particulars
              </Text>
              <DetailRow label="Address" value={addressLine(app)} />
              <DetailRow label="Occupancy" value={app.occupancy || '—'} />
              <DetailRow label="Site area" value={app.totalSiteArea || '—'} />
              <DetailRow label="Site type" value={app.siteDimensionType || '—'} />
              <DetailRow label="Site dimension" value={app.siteDimension || '—'} />
              <DetailRow
                label="GPS"
                value={
                  app.latitude && app.longitude ? `${app.latitude}, ${app.longitude}` : '—'
                }
              />
              <DetailRow label="Engineer comments" value={app.engineerComments || '—'} />
            </Box>

            <Box
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 12,
                paddingTop: 4,
                paddingBottom: 2,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 13,
                  color: COLORS.ink,
                  paddingTop: 8,
                  paddingBottom: 2,
                }}
              >
                Schedules (around)
              </Text>
              <DetailRow label="North" value={app.scheduleNorth || '—'} />
              <DetailRow label="South" value={app.scheduleSouth || '—'} />
              <DetailRow label="West" value={app.scheduleWest || '—'} />
              <DetailRow label="East" value={app.scheduleEast || '—'} />
            </Box>

            {(() => {
              const boundary = resolveBoundaryDims(app);
              if (!boundary.dims) return null;
              return (
                <BoundariesDiagram
                  north={boundary.dims.north}
                  south={boundary.dims.south}
                  east={boundary.dims.east}
                  west={boundary.dims.west}
                  odd={app.siteDimensionType === 'Odd'}
                  siteNo={app.siteNo}
                  totalArea={boundary.total}
                  scheduleNorth={app.scheduleNorth}
                  scheduleSouth={app.scheduleSouth}
                  scheduleEast={app.scheduleEast}
                  scheduleWest={app.scheduleWest}
                />
              );
            })()}

            <Box
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 12,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 13,
                  color: COLORS.ink,
                  marginBottom: 8,
                }}
              >
                CAO remarks
              </Text>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                editable={canReview}
                multiline
                placeholder="Enter remarks (required for return/reject)"
                placeholderTextColor="#94A3B8"
                style={{
                  minHeight: 80,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: '#FAFBFC',
                  padding: 10,
                  textAlignVertical: 'top',
                  fontFamily: FONTS.medium,
                  fontSize: 13,
                  color: COLORS.ink,
                }}
              />
            </Box>

            {canReview ? (
              <VStack style={{ gap: 8 }}>
                <Pressable
                  onPress={() => void act('verify')}
                  disabled={!!busy}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#059669',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: busy && busy !== 'verify' ? 0.5 : 1,
                  }}
                >
                  {busy === 'verify' ? (
                    <ButtonLoader color="#FFF" />
                  ) : (
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                      Verify & approve
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => void act('return')}
                  disabled={!!busy}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#D97706',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: busy && busy !== 'return' ? 0.5 : 1,
                  }}
                >
                  {busy === 'return' ? (
                    <ButtonLoader color="#FFF" />
                  ) : (
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                      Return to engineer
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => void act('reject')}
                  disabled={!!busy}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#DC2626',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: busy && busy !== 'reject' ? 0.5 : 1,
                  }}
                >
                  {busy === 'reject' ? (
                    <ButtonLoader color="#FFF" />
                  ) : (
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                      Reject
                    </Text>
                  )}
                </Pressable>
              </VStack>
            ) : null}
          </VStack>
        )}
      </ScrollView>
    </ScreenShell>
  );
}
