import {
  CheckCircle2,
  ClipboardList,
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
} from '@/src/cdrms/components/primitives';
import {
  DetailRow,
  OfficeAppRow,
  StatusCountGrid,
  type StatusCountItem,
} from '@/src/cdrms/components/StatusCountGrid';
import { getSelectedOfficeAppId, setSelectedOfficeAppId } from '@/src/cdrms/officeSelection';
import { COLORS } from '@/src/cdrms/theme';
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

  return (
    <ScreenShell className="bg-[#F3F4F6]">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="CAO Tasks"
          subtitle={`Welcome, ${displayName(user)} · verify engineer submissions`}
          go={go}
        />

        <Box className="px-4 mt-4">
          <Text className="text-[16px] font-bold mb-1" style={{ color: '#0F172A' }}>
            Task overview
          </Text>
          <Text className="text-[12px] mb-3" style={{ color: '#94A3B8' }}>
            Tap a card to filter · {counts.total} total in scope
          </Text>

          <StatusCountGrid
            items={countItems}
            activeKey={tab}
            columns={2}
            onSelect={(key) => setTab(key as CaoTab)}
          />

          <Box
            className="mt-4 flex-row items-center"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <Search size={16} color="#94A3B8" />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search application, site, engineer…"
              placeholderTextColor="#94A3B8"
              style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
            />
          </Box>

          <HStack className="items-center justify-between mt-5 mb-2">
            <Text className="text-[15px] font-bold" style={{ color: '#0F172A' }}>
              {countItems.find((i) => i.key === tab)?.label || 'All'}
            </Text>
            <Pressable onPress={() => void reload()} className="active:opacity-70">
              <Text className="text-[12px] font-semibold" style={{ color: COLORS.primary }}>
                Refresh
              </Text>
            </Pressable>
          </HStack>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primary} />
          ) : error ? (
            <Text className="text-[13px] mt-4" style={{ color: '#DC2626' }}>
              {error}
            </Text>
          ) : filtered.length === 0 ? (
            <Text className="text-[13px] mt-4" style={{ color: '#64748B' }}>
              No tasks in this bucket yet.
            </Text>
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
    <ScreenShell className="bg-[#F3F4F6]">
      <AppHeader title="Task review" onBack={() => go('cao_home')} gradient={false} go={go} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : error || !app ? (
          <Text style={{ color: '#DC2626' }}>{error || 'Not found'}</Text>
        ) : (
          <VStack>
            {isSuperAdmin ? (
              <Box
                style={{
                  backgroundColor: '#FFFBEB',
                  borderColor: '#FDE68A',
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text className="text-[12px] font-bold" style={{ color: '#92400E' }}>
                  Super Admin view — approval actions disabled
                </Text>
              </Box>
            ) : null}

            <Box
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                padding: 14,
                marginBottom: 12,
              }}
            >
              <HStack className="gap-2 mb-2">
                <Box style={{ backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text className="text-[11px] font-bold" style={{ color: '#2563EB' }}>
                    Zone {app.zoneCode}
                  </Text>
                </Box>
                <Box style={{ backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text className="text-[11px] font-bold" style={{ color: '#334155' }}>
                    Site {app.siteNo}
                  </Text>
                </Box>
              </HStack>
              <Text className="text-[18px] font-bold" style={{ color: '#0F172A' }}>
                {app.applicationNumber}
              </Text>
              <Text className="text-[12px] mt-1" style={{ color: '#64748B' }}>
                Engineer: {app.assignedEngineerName || '—'}
              </Text>
              <Text className="text-[12px] mt-1 font-semibold" style={{ color: '#2563EB' }}>
                {applicationStatusLabel(app.status)}
              </Text>
            </Box>

            <Box
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                paddingHorizontal: 14,
                paddingVertical: 4,
                marginBottom: 12,
              }}
            >
              <DetailRow label="Address" value={addressLine(app)} />
              <DetailRow label="Occupancy" value={app.occupancy || '—'} />
              <DetailRow label="Site area" value={app.totalSiteArea || '—'} />
              <DetailRow label="N / S / E / W" value={[app.dimNorth, app.dimSouth, app.dimEast, app.dimWest].filter(Boolean).join(' · ') || '—'} />
              <DetailRow label="GPS" value={app.latitude && app.longitude ? `${app.latitude}, ${app.longitude}` : '—'} />
              <DetailRow label="Engineer comments" value={app.engineerComments || '—'} />
            </Box>

            <Text className="text-[13px] font-bold mb-2" style={{ color: '#0F172A' }}>
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
                minHeight: 96,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                backgroundColor: '#FFFFFF',
                padding: 12,
                textAlignVertical: 'top',
                fontSize: 13,
                color: '#0F172A',
                marginBottom: 14,
              }}
            />

            {canReview ? (
              <VStack className="gap-2">
                <Pressable
                  onPress={() => void act('verify')}
                  disabled={!!busy}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#059669',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: busy && busy !== 'verify' ? 0.5 : 1,
                  }}
                >
                  {busy === 'verify' ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="font-bold text-white">Verify & approve</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => void act('return')}
                  disabled={!!busy}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#D97706',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: busy && busy !== 'return' ? 0.5 : 1,
                  }}
                >
                  {busy === 'return' ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="font-bold text-white">Return to engineer</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => void act('reject')}
                  disabled={!!busy}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#DC2626',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: busy && busy !== 'reject' ? 0.5 : 1,
                  }}
                >
                  {busy === 'reject' ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="font-bold text-white">Reject</Text>
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
