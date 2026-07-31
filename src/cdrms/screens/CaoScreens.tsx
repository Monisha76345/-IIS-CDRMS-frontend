import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
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
  caoDecideApplication,
  fetchApplication,
  fetchCaoApplications,
  fetchCaoCounts,
  type CaoCounts,
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
import { COLORS, FONTS } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

type CaoTab = 'pending' | 'verified' | 'returned' | 'rejected' | 'all';
type CaoDecision = 'approve' | 'sendback' | 'reject' | '';

const CAO_REVIEW_STEPS = ['Application details', 'Approval'] as const;

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

type CaoAppsFilter = 'All' | 'Pending CAO' | 'Verified' | 'Returned' | 'Rejected';

const CAO_APP_FILTERS: { key: CaoAppsFilter; status?: MobileApplication['status'] }[] = [
  { key: 'All' },
  { key: 'Pending CAO', status: 'submitted' },
  { key: 'Verified', status: 'verified' },
  { key: 'Returned', status: 'returned' },
  { key: 'Rejected', status: 'rejected' },
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
        subtitle={`${apps.length} total · all CAO tasks in your zone`}
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

function CaoReviewStepper({ step }: { step: number }) {
  return (
    <HStack className="items-center" style={{ gap: 8 }}>
      {CAO_REVIEW_STEPS.map((label, idx) => {
        const active = idx === step;
        const done = idx < step;
        return (
          <HStack key={label} className="items-center" style={{ gap: 8, flex: idx === CAO_REVIEW_STEPS.length - 1 ? 0 : 1 }}>
            <HStack className="items-center" style={{ gap: 6 }}>
              <Box
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active || done ? COLORS.primary : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 11,
                    color: active || done ? '#FFFFFF' : '#64748B',
                  }}
                >
                  {done ? '✓' : idx + 1}
                </Text>
              </Box>
              <Text
                style={{
                  fontFamily: active ? FONTS.bold : FONTS.medium,
                  fontSize: 12,
                  color: active ? COLORS.primary : '#64748B',
                }}
              >
                {label}
              </Text>
            </HStack>
            {idx < CAO_REVIEW_STEPS.length - 1 ? (
              <Box style={{ flex: 1, height: 2, backgroundColor: done ? COLORS.primary : '#E2E8F0' }} />
            ) : null}
          </HStack>
        );
      })}
    </HStack>
  );
}

function DecisionOption({
  label,
  hint,
  Icon,
  selected,
  onPress,
}: {
  label: string;
  hint: string;
  Icon: typeof CheckCircle2;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: selected ? COLORS.primary : '#E2E8F0',
        backgroundColor: selected ? '#EFF6FF' : COLORS.white,
        padding: 12,
      }}
    >
      <HStack className="items-start" style={{ gap: 10 }}>
        <Box
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: selected ? COLORS.primary : '#CBD5E1',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          {selected ? (
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: COLORS.primary,
              }}
            />
          ) : null}
        </Box>
        <VStack style={{ flex: 1, gap: 2 }}>
          <HStack className="items-center" style={{ gap: 6 }}>
            <Icon size={15} color={COLORS.primary} strokeWidth={2.3} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>{label}</Text>
          </HStack>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: '#64748B' }}>{hint}</Text>
        </VStack>
      </HStack>
    </Pressable>
  );
}

export function CaoDetailScreen({ go }: { go: Go }) {
  const { accessToken, user } = useAuth();
  const isSuperAdmin = resolveAppRole(user) === 'super_admin';
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

  const canApprove = !isSuperAdmin && app?.status === 'submitted';
  const backTarget = getCaoReturnScreen();

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
                  Super Admin view — read-only. Use Tasks → Approval when signed in as CAO.
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

            {canApprove ? (
              <Pressable
                onPress={() => go('cao_approve')}
                style={{
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                  Go to Approval
                </Text>
              </Pressable>
            ) : null}
          </VStack>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

/** CAO approval workflow — stepper (details → decision), like web /cao/tasks/:id/approve */
export function CaoApprovalScreen({ go }: { go: Go }) {
  const { accessToken, user } = useAuth();
  const isSuperAdmin = resolveAppRole(user) === 'super_admin';
  const [app, setApp] = useState<MobileApplication | null>(null);
  const [step, setStep] = useState(0);
  const [decision, setDecision] = useState<CaoDecision>('');
  const [sendBackEngineerId, setSendBackEngineerId] = useState('');
  const [engineerPickerOpen, setEngineerPickerOpen] = useState(false);
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

  useEffect(() => {
    if (decision !== 'sendback') {
      setSendBackEngineerId('');
      setEngineerPickerOpen(false);
    }
  }, [decision]);

  const canReview = !isSuperAdmin && app?.status === 'submitted';
  const remarksOk = remarks.trim().length > 0;
  const engineerLogin = app?.assignedEngineerLoginId?.trim() || null;
  const engineerName = app?.assignedEngineerName?.trim() || 'Engineer';
  const engineerSelectLabel = engineerLogin
    ? `${engineerName} (${engineerLogin})`
    : engineerName;
  const sendBackOk =
    remarksOk &&
    Boolean(sendBackEngineerId) &&
    sendBackEngineerId === app?.assignedEngineerUserId;

  const commentsPlaceholder =
    decision === 'approve'
      ? 'Enter approval comments…'
      : decision === 'sendback'
        ? 'Explain what the engineer must correct…'
        : decision === 'reject'
          ? 'Enter rejection reason…'
          : 'Select a decision first';

  const act = async (kind: 'verify' | 'return' | 'reject') => {
    if (!accessToken || !app) return;
    if (!remarks.trim()) {
      return Alert.alert('Comments required', 'Please enter comments before continuing.');
    }
    if (kind === 'return' && sendBackEngineerId !== app.assignedEngineerUserId) {
      return Alert.alert(
        'Select engineer',
        'Select the assigned engineer to send the task back.',
      );
    }
    setBusy(kind);
    try {
      await caoDecideApplication(accessToken, app.id, kind, remarks.trim());
      Alert.alert(
        'Done',
        kind === 'verify'
          ? 'Application approved'
          : kind === 'return'
            ? 'Sent back to engineer'
            : 'Application rejected',
        [{ text: 'OK', onPress: () => go('cao_home') }],
      );
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const submitDisabled =
    !!busy ||
    !decision ||
    (decision === 'approve' && !remarksOk) ||
    (decision === 'sendback' && !sendBackOk) ||
    (decision === 'reject' && !remarksOk);

  return (
    <ScreenShell className="bg-[#F8FAFC]">
      <AppHeader
        title={step === 0 ? 'Application details' : 'Approval'}
        onBack={() => {
          if (step > 0) setStep(0);
          else go('cao_detail');
        }}
        gradient={false}
        go={go}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ScreenLoader text="Loading application for review…" />
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

            <CaoReviewStepper step={step} />

            {step === 0 ? (
              <>
                <ApplicationRecordDetails app={app} />

                {canReview ? (
                  <Pressable
                    onPress={() => setStep(1)}
                    style={{
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: COLORS.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                      Next: Approval
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => go('cao_detail')}
                    style={{
                      height: 44,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.ink }}>
                      ← Back to view
                    </Text>
                  </Pressable>
                )}
              </>
            ) : (
              <Box
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#EEF2F7',
                  overflow: 'hidden',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.07,
                  shadowRadius: 10,
                  elevation: 3,
                }}
              >
                <Box
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderBottomWidth: 1,
                    borderBottomColor: '#DBEAFE',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.primary }}>
                    Approval decision
                  </Text>
                </Box>

                <VStack style={{ padding: 14, gap: 14 }}>
                  <VStack style={{ gap: 6 }}>
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: '#64748B' }}>
                      APPLICATION NO
                    </Text>
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}>
                      {app.applicationNumber}
                    </Text>
                  </VStack>
                  <VStack style={{ gap: 6 }}>
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: '#64748B' }}>
                      ENGINEER
                    </Text>
                    <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.ink }}>
                      {engineerSelectLabel}
                    </Text>
                  </VStack>

                  {!canReview ? (
                    <Box
                      style={{
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        backgroundColor: '#F8FAFC',
                        padding: 12,
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: '#64748B' }}>
                        This application is not pending CAO review
                        {app.caoRemarks ? `. Last remarks: ${app.caoRemarks}` : '.'}
                      </Text>
                    </Box>
                  ) : (
                    <>
                      <VStack style={{ gap: 8 }}>
                        <HStack className="items-center" style={{ gap: 3 }}>
                          <Text
                            style={{
                              fontFamily: FONTS.bold,
                              fontSize: 12,
                              color: COLORS.ink,
                              textTransform: 'uppercase',
                              letterSpacing: 0.4,
                            }}
                          >
                            Decision
                          </Text>
                          <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#DC2626' }}>
                            *
                          </Text>
                        </HStack>
                        <VStack style={{ gap: 8 }}>
                          <DecisionOption
                            label="Approve"
                            hint="Verify & close"
                            Icon={CheckCircle2}
                            selected={decision === 'approve'}
                            onPress={() => {
                              setDecision('approve');
                              setRemarks('');
                            }}
                          />
                          <DecisionOption
                            label="Send back"
                            hint="Return to engineer"
                            Icon={RotateCcw}
                            selected={decision === 'sendback'}
                            onPress={() => {
                              setDecision('sendback');
                              setRemarks('');
                              setSendBackEngineerId('');
                              setEngineerPickerOpen(false);
                            }}
                          />
                          <DecisionOption
                            label="Reject"
                            hint="Close as rejected"
                            Icon={XCircle}
                            selected={decision === 'reject'}
                            onPress={() => {
                              setDecision('reject');
                              setRemarks('');
                            }}
                          />
                        </VStack>
                      </VStack>

                      {decision === 'sendback' ? (
                        <VStack style={{ gap: 8 }}>
                          <HStack className="items-center" style={{ gap: 3 }}>
                            <Text
                              style={{
                                fontFamily: FONTS.bold,
                                fontSize: 12,
                                color: COLORS.ink,
                                textTransform: 'uppercase',
                                letterSpacing: 0.4,
                              }}
                            >
                              Send back to engineer
                            </Text>
                            <Text
                              style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#DC2626' }}
                            >
                              *
                            </Text>
                          </HStack>
                          <Pressable
                            onPress={() => setEngineerPickerOpen((open) => !open)}
                            style={{
                              height: 44,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: '#E2E8F0',
                              backgroundColor: '#FFFFFF',
                              paddingHorizontal: 12,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: FONTS.medium,
                                fontSize: 13,
                                color: sendBackEngineerId ? COLORS.ink : '#94A3B8',
                                flex: 1,
                              }}
                              numberOfLines={1}
                            >
                              {sendBackEngineerId ? engineerSelectLabel : 'Select'}
                            </Text>
                            <ChevronDown
                              size={16}
                              color="#64748B"
                              style={{
                                transform: [{ rotate: engineerPickerOpen ? '180deg' : '0deg' }],
                              }}
                            />
                          </Pressable>
                          {engineerPickerOpen ? (
                            <Box
                              style={{
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                                backgroundColor: '#FFFFFF',
                                overflow: 'hidden',
                              }}
                            >
                              <Pressable
                                onPress={() => {
                                  if (app.assignedEngineerUserId) {
                                    setSendBackEngineerId(app.assignedEngineerUserId);
                                  }
                                  setEngineerPickerOpen(false);
                                }}
                                style={{
                                  paddingHorizontal: 12,
                                  paddingVertical: 12,
                                  backgroundColor:
                                    sendBackEngineerId === app.assignedEngineerUserId
                                      ? '#EFF6FF'
                                      : '#FFFFFF',
                                }}
                              >
                                <HStack className="items-center justify-between">
                                  <Text
                                    style={{
                                      fontFamily: FONTS.semibold,
                                      fontSize: 13,
                                      color: COLORS.ink,
                                      flex: 1,
                                    }}
                                  >
                                    {engineerSelectLabel}
                                  </Text>
                                  {sendBackEngineerId === app.assignedEngineerUserId ? (
                                    <CheckCircle2 size={16} color={COLORS.primary} />
                                  ) : null}
                                </HStack>
                              </Pressable>
                            </Box>
                          ) : null}
                          {sendBackEngineerId ? (
                            <Text
                              style={{ fontFamily: FONTS.medium, fontSize: 11, color: '#64748B' }}
                            >
                              Task returns to {engineerSelectLabel} with status Send back.
                            </Text>
                          ) : null}
                        </VStack>
                      ) : null}

                      {decision ? (
                        <VStack style={{ gap: 8 }}>
                          <HStack className="items-center" style={{ gap: 3 }}>
                            <Text
                              style={{
                                fontFamily: FONTS.bold,
                                fontSize: 12,
                                color: COLORS.ink,
                                textTransform: 'uppercase',
                                letterSpacing: 0.4,
                              }}
                            >
                              Comments
                            </Text>
                            <Text
                              style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#DC2626' }}
                            >
                              *
                            </Text>
                          </HStack>
                          <TextInput
                            value={remarks}
                            onChangeText={setRemarks}
                            multiline
                            placeholder={commentsPlaceholder}
                            placeholderTextColor="#94A3B8"
                            style={{
                              minHeight: 96,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: '#E2E8F0',
                              backgroundColor: '#F8FAFC',
                              padding: 12,
                              textAlignVertical: 'top',
                              fontFamily: FONTS.medium,
                              fontSize: 13,
                              color: COLORS.ink,
                            }}
                          />
                        </VStack>
                      ) : null}

                      {decision === 'approve' ? (
                        <Pressable
                          onPress={() => void act('verify')}
                          disabled={submitDisabled}
                          style={{
                            height: 48,
                            borderRadius: 14,
                            backgroundColor: '#059669',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: submitDisabled ? 0.5 : 1,
                          }}
                        >
                          {busy === 'verify' ? (
                            <ButtonLoader color="#FFF" />
                          ) : (
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <CheckCircle2 size={16} color="#FFF" />
                              <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                                Approve
                              </Text>
                            </HStack>
                          )}
                        </Pressable>
                      ) : null}

                      {decision === 'sendback' ? (
                        <Pressable
                          onPress={() => void act('return')}
                          disabled={submitDisabled}
                          style={{
                            height: 48,
                            borderRadius: 14,
                            backgroundColor: '#D97706',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: submitDisabled ? 0.5 : 1,
                          }}
                        >
                          {busy === 'return' ? (
                            <ButtonLoader color="#FFF" />
                          ) : (
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <RotateCcw size={16} color="#FFF" />
                              <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                                Send back
                              </Text>
                            </HStack>
                          )}
                        </Pressable>
                      ) : null}

                      {decision === 'reject' ? (
                        <Pressable
                          onPress={() => void act('reject')}
                          disabled={submitDisabled}
                          style={{
                            height: 48,
                            borderRadius: 14,
                            backgroundColor: '#DC2626',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: submitDisabled ? 0.5 : 1,
                          }}
                        >
                          {busy === 'reject' ? (
                            <ButtonLoader color="#FFF" />
                          ) : (
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <XCircle size={16} color="#FFF" />
                              <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                                Reject
                              </Text>
                            </HStack>
                          )}
                        </Pressable>
                      ) : null}
                    </>
                  )}

                  <Pressable
                    onPress={() => setStep(0)}
                    style={{
                      height: 44,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.ink }}>
                      ← Back to application details
                    </Text>
                  </Pressable>
                </VStack>
              </Box>
            )}
          </VStack>
        )}
      </ScrollView>
    </ScreenShell>
  );
}
