import {
  ClipboardList,
  FilePlus2,
  Hourglass,
  CheckCircle2,
  RotateCcw,
  Send,
  XCircle,
  Search,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  TextInput,
  View,
} from 'react-native';
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
  applicationStatusLabel,
  countZcBuckets,
  createApplication,
  fetchApplication,
  fetchMyZoneMeta,
  fetchZcApplications,
  type CreateApplicationInput,
  type MobileApplication,
  type MyZoneMeta,
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
import { setSelectedOfficeAppId, getSelectedOfficeAppId } from '@/src/cdrms/officeSelection';
import { COLORS } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

type ZcTab =
  | 'all'
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'verified'
  | 'returned'
  | 'rejected';

function addressLine(app: MobileApplication) {
  return [app.addressArea, app.addressBlock, app.addressPincode].filter(Boolean).join(', ');
}

export function ZcHomeScreen({ go }: { go: Go }) {
  const { accessToken, user } = useAuth();
  const [apps, setApps] = useState<MobileApplication[]>([]);
  const [zone, setZone] = useState<MyZoneMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ZcTab>('all');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [list, meta] = await Promise.all([
        fetchZcApplications(accessToken),
        fetchMyZoneMeta(accessToken).catch(() => null),
      ]);
      setApps(list);
      setZone(meta);
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

  const counts = useMemo(() => countZcBuckets(apps), [apps]);

  const countItems: StatusCountItem[] = [
    {
      key: 'assigned',
      label: 'Assigned',
      count: counts.assigned,
      icon: ClipboardList,
      tint: '#2563EB',
      soft: '#DBEAFE',
    },
    {
      key: 'in_progress',
      label: 'In progress',
      count: counts.in_progress,
      icon: Hourglass,
      tint: '#7C3AED',
      soft: '#EDE9FE',
    },
    {
      key: 'submitted',
      label: 'Pending CAO',
      count: counts.submitted,
      icon: Send,
      tint: '#0EA5E9',
      soft: '#E0F2FE',
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
    if (tab !== 'all') items = items.filter((a) => a.status === tab);
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter(
      (a) =>
        a.applicationNumber.toLowerCase().includes(needle) ||
        a.siteNo.toLowerCase().includes(needle) ||
        (a.assignedEngineerName || '').toLowerCase().includes(needle),
    );
  }, [apps, tab, q]);

  const openDetail = (id: string) => {
    setSelectedOfficeAppId(id);
    go('zc_detail');
  };

  return (
    <ScreenShell className="bg-[#F3F4F6]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          title="ZC Applications"
          subtitle={
            zone
              ? `Zone ${zone.zoneCode} · ${zone.zoneName}`
              : `Welcome, ${displayName(user)}`
          }
          go={go}
        />

        <Box className="px-4 mt-4">
          <HStack className="items-center justify-between mb-3">
            <VStack className="flex-1 min-w-0">
              <Text className="text-[16px] font-bold" style={{ color: '#0F172A' }}>
                Application overview
              </Text>
              <Text className="text-[12px] mt-0.5" style={{ color: '#94A3B8' }}>
                {counts.total} total · tap a status to filter
              </Text>
            </VStack>
            <Pressable
              onPress={() => go('zc_create')}
              className="flex-row items-center gap-1.5 active:opacity-90"
              style={{
                backgroundColor: '#1e3a5f',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <FilePlus2 size={15} color="#FFFFFF" />
              <Text className="text-[12px] font-bold text-white">Create</Text>
            </Pressable>
          </HStack>

          <StatusCountGrid
            items={countItems}
            activeKey={tab}
            columns={3}
            onSelect={(key) => setTab((prev) => (prev === key ? 'all' : (key as ZcTab)))}
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
              placeholder="Search app, site, engineer…"
              placeholderTextColor="#94A3B8"
              style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
            />
          </Box>

          <HStack className="items-center justify-between mt-5 mb-2">
            <Text className="text-[15px] font-bold" style={{ color: '#0F172A' }}>
              {tab === 'all' ? 'All applications' : countItems.find((i) => i.key === tab)?.label}
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
              No applications in this bucket. Create one to assign an engineer.
            </Text>
          ) : (
            filtered.map((app) => (
              <OfficeAppRow
                key={app.id}
                title={app.applicationNumber}
                subtitle={`Site ${app.siteNo} · ${addressLine(app) || '—'}`}
                meta={app.assignedEngineerName || 'Unassigned engineer'}
                status={applicationStatusLabel(app.status)}
                onPress={() => openDetail(app.id)}
              />
            ))
          )}
        </Box>
      </ScrollView>

      <BottomNav
        active="home"
        onNav={go}
        homeTarget="zc_home"
        appsTarget="zc_home"
        onPlus={() => go('zc_create')}
      />
    </ScreenShell>
  );
}

const emptyForm: CreateApplicationInput = {
  siteNo: '',
  addressArea: '',
  addressBlock: '',
  addressPincode: '',
  siteDimensionType: 'Regular',
  siteDimensionComment: '',
  scheduleNorth: '',
  scheduleSouth: '',
  scheduleWest: '',
  scheduleEast: '',
  assignedEngineerUserId: '',
};

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <VStack className="mb-3">
      <Text className="text-[12px] font-semibold mb-1.5" style={{ color: '#334155' }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={{
          height: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 12,
          fontSize: 14,
          color: '#0F172A',
        }}
      />
    </VStack>
  );
}

export function ZcCreateScreen({ go }: { go: Go }) {
  const { accessToken } = useAuth();
  const [zone, setZone] = useState<MyZoneMeta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetchMyZoneMeta(accessToken)
      .then((meta) => {
        setZone(meta);
        setZoneError(null);
      })
      .catch((e) => {
        setZone(null);
        setZoneError(
          e instanceof ApiError
            ? e.message
            : 'Your post must have a master zone before creating applications.',
        );
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const engineers = (zone?.engineers ?? []).filter((e) => e.userId);

  const onSubmit = async () => {
    if (!accessToken) return;
    if (!form.siteNo.trim()) return Alert.alert('Validation', 'Site no is required');
    if (!form.addressArea.trim() || !form.addressBlock.trim() || !form.addressPincode.trim()) {
      return Alert.alert('Validation', 'Area, block and pincode are mandatory');
    }
    if (form.siteDimensionType === 'Odd' && !form.siteDimensionComment?.trim()) {
      return Alert.alert('Validation', 'Comment is required for Odd site dimension');
    }
    if (!form.assignedEngineerUserId) return Alert.alert('Validation', 'Assign an engineer');

    setSaving(true);
    try {
      const created = await createApplication(accessToken, {
        ...form,
        siteNo: form.siteNo.trim(),
        addressArea: form.addressArea.trim(),
        addressBlock: form.addressBlock.trim(),
        addressPincode: form.addressPincode.trim(),
        siteDimensionComment: form.siteDimensionComment?.trim() || undefined,
        scheduleNorth: form.scheduleNorth?.trim() || undefined,
        scheduleSouth: form.scheduleSouth?.trim() || undefined,
        scheduleWest: form.scheduleWest?.trim() || undefined,
        scheduleEast: form.scheduleEast?.trim() || undefined,
      });
      Alert.alert('Created', created.applicationNumber, [
        { text: 'OK', onPress: () => go('zc_home') },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to create application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell className="bg-[#F3F4F6]">
      <AppHeader title="Create application" onBack={() => go('zc_home')} gradient={false} go={go} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : zoneError ? (
          <Box
            style={{
              backgroundColor: '#FFF1F2',
              borderColor: '#FECDD3',
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <Text style={{ color: '#9F1239', fontSize: 13 }}>{zoneError}</Text>
          </Box>
        ) : (
          <VStack>
            <Text className="text-[13px] mb-4" style={{ color: '#64748B' }}>
              Will generate{' '}
              <Text className="font-bold" style={{ color: '#0F172A' }}>
                ZC-{zone?.zoneCode}-AUC-####
              </Text>{' '}
              and create a task for the assigned engineer.
            </Text>

            <Field
              label="Site no *"
              value={form.siteNo}
              onChange={(v) => setForm((f) => ({ ...f, siteNo: v }))}
            />

            <Text className="text-[12px] font-semibold mb-1.5" style={{ color: '#334155' }}>
              Site dimension *
            </Text>
            <HStack className="gap-2 mb-3">
              {(['Regular', 'Odd'] as const).map((opt) => {
                const on = form.siteDimensionType === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setForm((f) => ({ ...f, siteDimensionType: opt }))}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? '#1e3a5f' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: on ? '#1e3a5f' : '#E5E7EB',
                    }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: on ? '#FFFFFF' : '#334155' }}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>

            <Field
              label="Area *"
              value={form.addressArea}
              onChange={(v) => setForm((f) => ({ ...f, addressArea: v }))}
            />
            <Field
              label="Block *"
              value={form.addressBlock}
              onChange={(v) => setForm((f) => ({ ...f, addressBlock: v }))}
            />
            <Field
              label="Pincode *"
              value={form.addressPincode}
              onChange={(v) => setForm((f) => ({ ...f, addressPincode: v }))}
            />
            <Field
              label={form.siteDimensionType === 'Odd' ? 'Odd site comment *' : 'Dimension comments'}
              value={form.siteDimensionComment || ''}
              onChange={(v) => setForm((f) => ({ ...f, siteDimensionComment: v }))}
            />

            <Text className="text-[13px] font-bold mb-2 mt-1" style={{ color: '#0F172A' }}>
              Schedule (site around)
            </Text>
            <Field
              label="North"
              value={form.scheduleNorth || ''}
              onChange={(v) => setForm((f) => ({ ...f, scheduleNorth: v }))}
            />
            <Field
              label="South"
              value={form.scheduleSouth || ''}
              onChange={(v) => setForm((f) => ({ ...f, scheduleSouth: v }))}
            />
            <Field
              label="West"
              value={form.scheduleWest || ''}
              onChange={(v) => setForm((f) => ({ ...f, scheduleWest: v }))}
            />
            <Field
              label="East"
              value={form.scheduleEast || ''}
              onChange={(v) => setForm((f) => ({ ...f, scheduleEast: v }))}
            />

            <Text className="text-[12px] font-semibold mb-1.5" style={{ color: '#334155' }}>
              Assign engineer * (zone {zone?.zoneCode})
            </Text>
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                backgroundColor: '#FFFFFF',
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              {engineers.length === 0 ? (
                <Text style={{ padding: 12, color: '#B45309', fontSize: 12 }}>
                  No engineers with an active post mapping in this zone.
                </Text>
              ) : (
                engineers.map((eng) => {
                  const on = form.assignedEngineerUserId === eng.userId;
                  return (
                    <Pressable
                      key={eng.userId}
                      onPress={() =>
                        setForm((f) => ({ ...f, assignedEngineerUserId: eng.userId }))
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        backgroundColor: on ? '#EFF6FF' : '#FFFFFF',
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                      }}
                    >
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: on ? '#1D4ED8' : '#0F172A' }}
                      >
                        {eng.name}
                        {eng.postName ? ` · ${eng.postName}` : ''}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>

            <HStack className="gap-2 mt-4">
              <Pressable
                onPress={() => go('zc_home')}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Text className="font-semibold" style={{ color: '#334155' }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void onSubmit()}
                disabled={saving}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1e3a5f',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-bold text-white">Submit</Text>
                )}
              </Pressable>
            </HStack>
          </VStack>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

export function ZcDetailScreen({ go }: { go: Go }) {
  const { accessToken } = useAuth();
  const [app, setApp] = useState<MobileApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <ScreenShell className="bg-[#F3F4F6]">
      <AppHeader title="Application" onBack={() => go('zc_home')} gradient={false} go={go} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : error || !app ? (
          <Text style={{ color: '#DC2626' }}>{error || 'Not found'}</Text>
        ) : (
          <Box
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              paddingHorizontal: 14,
              paddingVertical: 4,
            }}
          >
            <Text className="text-[18px] font-bold mt-3 mb-1" style={{ color: '#0F172A' }}>
              {app.applicationNumber}
            </Text>
            <DetailRow label="Status" value={applicationStatusLabel(app.status)} />
            <DetailRow label="Site no" value={app.siteNo} />
            <DetailRow label="Area" value={app.addressArea} />
            <DetailRow label="Block" value={app.addressBlock} />
            <DetailRow label="Pincode" value={app.addressPincode} />
            <DetailRow label="Site dimension" value={app.siteDimensionType} />
            <DetailRow label="Comment" value={app.siteDimensionComment || '—'} />
            <DetailRow label="Schedule N" value={app.scheduleNorth || '—'} />
            <DetailRow label="Schedule S" value={app.scheduleSouth || '—'} />
            <DetailRow label="Schedule W" value={app.scheduleWest || '—'} />
            <DetailRow label="Schedule E" value={app.scheduleEast || '—'} />
            <DetailRow label="Zone" value={app.zoneCode} />
            <DetailRow label="Assigned engineer" value={app.assignedEngineerName || '—'} />
            {app.caoRemarks ? <DetailRow label="CAO remarks" value={app.caoRemarks} /> : null}
          </Box>
        )}
      </ScrollView>
    </ScreenShell>
  );
}
