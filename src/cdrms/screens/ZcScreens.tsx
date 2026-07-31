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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View,
  type ScrollView as RNScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  countZcBuckets,
  createApplication,
  fetchApplication,
  fetchMyZoneMeta,
  fetchSiteDimensions,
  fetchZcApplications,
  formatApplicationDate,
  normalizeApplicationStatus,
  type CreateApplicationInput,
  type MobileApplication,
  type MyZoneMeta,
  type SiteDimensionOption,
} from '@/src/api/applications';
import { ApplicationRecordDetails } from '@/src/cdrms/components/ApplicationRecordDetails';
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
import { setSelectedOfficeAppId, getSelectedOfficeAppId } from '@/src/cdrms/officeSelection';
import { COLORS, FONTS } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

type ZcTab =
  | 'all'
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'verified'
  | 'returned'
  | 'rejected';

const ZC_STATUS_FILTERS: { key: ZcTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'submitted', label: 'Pending CAO' },
  { key: 'verified', label: 'Verified' },
  { key: 'returned', label: 'Returned' },
  { key: 'rejected', label: 'Rejected' },
];

function villageLine(app: MobileApplication) {
  const village = app.addressArea || '—';
  const taluka = app.addressBlock || '—';
  const district = app.zoneCode || '—';
  return `${village} (${taluka}, ${district})`;
}

function zcAppDetailLines(app: MobileApplication) {
  return [
    villageLine(app),
    `Sy. ${app.siteNo}`,
    `Submitted ${formatApplicationDate(app.createdAt)}`,
  ];
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
    if (tab !== 'all') {
      items = items.filter((a) => normalizeApplicationStatus(a.status) === tab);
    }
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter(
      (a) =>
        a.applicationNumber.toLowerCase().includes(needle) ||
        a.siteNo.toLowerCase().includes(needle) ||
        (a.assignedEngineerName || '').toLowerCase().includes(needle) ||
        (a.assignedEngineerLoginId || '').toLowerCase().includes(needle) ||
        (a.zoneCode || '').toLowerCase().includes(needle) ||
        villageLine(a).toLowerCase().includes(needle),
    );
  }, [apps, tab, q]);

  const sectionLabel =
    tab === 'all' ? 'All applications' : ZC_STATUS_FILTERS.find((f) => f.key === tab)?.label;

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
          title="Zone Applications"
          subtitle={
            zone
              ? `Zone ${zone.zoneCode} · ${zone.zoneName} · Series ZC-${zone.zoneCode}-AUC-####`
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
            activeKey={tab === 'all' ? '' : tab}
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
              placeholder="Search by application no, site, engineer…"
              placeholderTextColor="#94A3B8"
              style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
            />
          </Box>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 4, gap: 8 }}
          >
            {ZC_STATUS_FILTERS.map((f) => {
              const on = tab === f.key;
              const count =
                f.key === 'all'
                  ? counts.total
                  : counts[f.key as Exclude<ZcTab, 'all'>];
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
                    {f.label} · {count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <HStack className="items-center justify-between mt-4 mb-2">
            <Text className="text-[15px] font-bold" style={{ color: '#0F172A' }}>
              {sectionLabel}
            </Text>
            <Pressable onPress={() => void reload()} className="active:opacity-70">
              <Text className="text-[12px] font-semibold" style={{ color: COLORS.primary }}>
                Refresh
              </Text>
            </Pressable>
          </HStack>

          {loading ? (
            <ListLoader text="Loading ZC applications…" />
          ) : error ? (
            <Text className="text-[13px] mt-4" style={{ color: '#DC2626' }}>
              {error}
            </Text>
          ) : filtered.length === 0 ? (
            <Text className="text-[13px] mt-4" style={{ color: '#64748B' }}>
              No applications found matching your criteria.
            </Text>
          ) : (
            filtered.map((app) => (
              <OfficeAppRow
                key={app.id}
                title={app.applicationNumber}
                subtitle={`Site #${app.siteNo} · Zone ${app.zoneCode}`}
                detailLines={zcAppDetailLines(app)}
                meta={app.assignedEngineerName || 'Assigned Engineer'}
                metaSub={
                  app.assignedEngineerLoginId ||
                  app.assignedEngineerUserId ||
                  undefined
                }
                status={app.status}
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
  siteDimensionType: 'Even',
  siteDimension: '',
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
  onFocus,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onFocus?: (info: { y: number; height: number }) => void;
  returnKeyType?: 'next' | 'done' | 'go' | 'default';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);

  return (
    <VStack className="mb-3">
      <Text className="text-[12px] font-semibold mb-1.5" style={{ color: '#334155' }}>
        {label}
      </Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        onFocus={() => {
          // Delay so keyboard height is known, then report field screen position.
          setTimeout(() => {
            inputRef.current?.measureInWindow((_x, y, _w, h) => {
              onFocus?.({ y, height: h || 44 });
            });
          }, Platform.OS === 'ios' ? 50 : 100);
        }}
        returnKeyType={returnKeyType ?? 'next'}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit ?? false}
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
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<RNScrollView>(null);
  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const [zone, setZone] = useState<MyZoneMeta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<SiteDimensionOption[]>([]);
  const [dimOpen, setDimOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const h = e.endCoordinates?.height ?? 0;
        keyboardHeightRef.current = h;
        setKeyboardHeight(h);
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardHeightRef.current = 0;
        setKeyboardHeight(0);
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  /**
   * Nudge scroll so the focused field sits just above the keyboard.
   * Do NOT scrollToEnd / jump to top — that was shoving the whole form away.
   */
  const ensureVisible = useCallback((anchorYInWindow?: number, fieldHeight = 44) => {
    if (anchorYInWindow == null) return;
    const scroll = scrollRef.current as unknown as {
      measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
      scrollTo: (opts: { y: number; animated?: boolean }) => void;
    } | null;
    if (!scroll?.measureInWindow) return;

    scroll.measureInWindow((_sx, sy, _sw, sh) => {
      const kb = keyboardHeightRef.current;
      const screenH = Dimensions.get('window').height;
      const keyboardTop = kb > 0 ? screenH - kb : sy + sh;
      const fieldBottom = anchorYInWindow + fieldHeight + 12;
      const visibleBottom = Math.min(sy + sh, keyboardTop) - 12;
      if (fieldBottom <= visibleBottom) return;
      const delta = fieldBottom - visibleBottom;
      scroll.scrollTo({
        y: Math.max(0, scrollYRef.current + delta),
        animated: true,
      });
    });
  }, []);

  const onFieldFocus = useCallback(
    (info: { y: number; height: number }) => {
      ensureVisible(info.y, info.height);
    },
    [ensureVisible],
  );

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

    fetchSiteDimensions(accessToken)
      .then(setDimensions)
      .catch(() => setDimensions([]));
  }, [accessToken]);

  const engineers = useMemo(
    () =>
      (zone?.engineers ?? [])
        .map((e) => ({
          ...e,
          userId: String(e.userId ?? '').trim(),
        }))
        .filter((e) => Boolean(e.userId)),
    [zone?.engineers],
  );

  // Single engineer in zone → auto-assign (list alone is not a selection).
  useEffect(() => {
    if (engineers.length !== 1) return;
    const onlyId = engineers[0].userId;
    setForm((f) =>
      f.assignedEngineerUserId === onlyId
        ? f
        : { ...f, assignedEngineerUserId: onlyId },
    );
  }, [engineers]);

  const onSubmit = async () => {
    if (!accessToken) return;
    if (!form.siteNo.trim()) return Alert.alert('Validation', 'Site no is required');
    if (!form.siteDimension.trim()) {
      return Alert.alert('Validation', 'Site dimension is required (e.g. 20*40)');
    }
    if (!form.addressArea.trim() || !form.addressBlock.trim() || !form.addressPincode.trim()) {
      return Alert.alert('Validation', 'Area, block and pincode are mandatory');
    }
    if (form.siteDimensionType === 'Odd' && !form.siteDimensionComment?.trim()) {
      return Alert.alert('Validation', 'Comment is required for Odd site type');
    }
    if (!String(form.assignedEngineerUserId || '').trim()) {
      return Alert.alert('Validation', 'Tap an engineer to assign the task');
    }

    setSaving(true);
    try {
      const created = await createApplication(accessToken, {
        ...form,
        siteNo: form.siteNo.trim(),
        addressArea: form.addressArea.trim(),
        addressBlock: form.addressBlock.trim(),
        addressPincode: form.addressPincode.trim(),
        siteDimension: form.siteDimension.trim(),
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
      {/*
        iOS: light padding avoidance.
        Android: do NOT use behavior="height" — it shrinks the whole page upward.
        Use keyboard-height padding + scroll only the focused field into view.
      */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Math.max(40 + insets.bottom, keyboardHeight + 24),
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          showsVerticalScrollIndicator
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
        >
          {loading ? (
            <ScreenLoader text="Loading zone configuration…" minHeight={180} />
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
                Site type <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>*</Text>
              </Text>
              <HStack className="gap-2 mb-3">
                {(['Even', 'Odd'] as const).map((opt) => {
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

              <Text className="text-[12px] font-semibold mb-1.5" style={{ color: '#334155' }}>
                Site dimension <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>*</Text>
              </Text>
              <Pressable
                onPress={() => setDimOpen((o) => !o)}
                style={{
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 12,
                  justifyContent: 'center',
                  marginBottom: dimOpen ? 8 : 12,
                }}
              >
                <Text style={{ fontSize: 14, color: form.siteDimension ? '#0F172A' : '#94A3B8' }}>
                  {form.siteDimension || 'Select site dimension'}
                </Text>
              </Pressable>
              {dimOpen ? (
                <Box
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    backgroundColor: '#FFFFFF',
                    marginBottom: 12,
                    overflow: 'hidden',
                    maxHeight: 220,
                  }}
                >
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {dimensions.length === 0 ? (
                      <Text style={{ padding: 12, color: '#94A3B8', fontSize: 13 }}>
                        No master dimensions loaded. Enter below.
                      </Text>
                    ) : (
                      dimensions.map((d) => (
                        <Pressable
                          key={d.id || d.label}
                          onPress={() => {
                            setForm((f) => ({ ...f, siteDimension: d.label }));
                            setDimOpen(false);
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F1F5F9',
                            backgroundColor:
                              form.siteDimension === d.label ? '#EFF6FF' : '#FFFFFF',
                          }}
                        >
                          <Text style={{ fontSize: 14, color: '#0F172A', fontWeight: '600' }}>
                            {d.label}
                          </Text>
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                </Box>
              ) : null}
              <Field
                label="Or enter dimension (e.g. 20*40)"
                value={form.siteDimension}
                onChange={(v) => setForm((f) => ({ ...f, siteDimension: v }))}
                placeholder="20*40"
              />

              <Field
                label="Area *"
                value={form.addressArea}
                onChange={(v) => setForm((f) => ({ ...f, addressArea: v }))}
              />
              <Field
                label="Block *"
                value={form.addressBlock}
                onChange={(v) => setForm((f) => ({ ...f, addressBlock: v }))}
                onFocus={onFieldFocus}
              />
              <Field
                label="Pincode *"
                value={form.addressPincode}
                onChange={(v) => setForm((f) => ({ ...f, addressPincode: v }))}
                onFocus={onFieldFocus}
                returnKeyType="next"
              />
              <Field
                label={form.siteDimensionType === 'Odd' ? 'Comments *' : 'Comments'}
                value={form.siteDimensionComment || ''}
                onChange={(v) => setForm((f) => ({ ...f, siteDimensionComment: v }))}
                onFocus={onFieldFocus}
              />

              <Text className="text-[13px] font-bold mb-2 mt-1" style={{ color: '#0F172A' }}>
                Schedule (site around)
              </Text>
              <Field
                label="North"
                value={form.scheduleNorth || ''}
                onChange={(v) => setForm((f) => ({ ...f, scheduleNorth: v }))}
                onFocus={onFieldFocus}
              />
              <Field
                label="South"
                value={form.scheduleSouth || ''}
                onChange={(v) => setForm((f) => ({ ...f, scheduleSouth: v }))}
                onFocus={onFieldFocus}
              />
              <Field
                label="West"
                value={form.scheduleWest || ''}
                onChange={(v) => setForm((f) => ({ ...f, scheduleWest: v }))}
                onFocus={onFieldFocus}
              />
              <Field
                label="East"
                value={form.scheduleEast || ''}
                onChange={(v) => setForm((f) => ({ ...f, scheduleEast: v }))}
                onFocus={onFieldFocus}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={() => Keyboard.dismiss()}
              />

              <Text className="text-[12px] font-semibold mb-1.5" style={{ color: '#334155' }}>
                Assign engineer <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>*</Text> (zone {zone?.zoneCode})
              </Text>
              <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
                Tap to select who receives this task
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
                          setForm((f) => ({
                            ...f,
                            assignedEngineerUserId: eng.userId,
                          }))
                        }
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          backgroundColor: on ? '#EFF6FF' : '#FFFFFF',
                          borderBottomWidth: 1,
                          borderBottomColor: '#F1F5F9',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: on ? '#1D4ED8' : '#CBD5E1',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {on ? (
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: '#1D4ED8',
                              }}
                            />
                          ) : null}
                        </View>
                        <Text
                          className="text-[13px] font-semibold"
                          style={{ color: on ? '#1D4ED8' : '#0F172A', flex: 1 }}
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
                    <ButtonLoader color="#FFFFFF" />
                  ) : (
                    <Text className="font-bold text-white">Submit</Text>
                  )}
                </Pressable>
              </HStack>
            </VStack>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

export function ZcDetailScreen({ go }: { go: Go }) {
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
    <ScreenShell className="bg-[#F3F4F6]">
      <AppHeader title="View Application" onBack={() => go('zc_home')} gradient={false} go={go} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator
      >
        {loading ? (
          <ScreenLoader text="Loading application details…" />
        ) : error || !app ? (
          <Text style={{ color: '#DC2626' }}>{error || 'Not found'}</Text>
        ) : (
          <ApplicationRecordDetails app={app} showEmptyEngineer={false} />
        )}
      </ScrollView>
    </ScreenShell>
  );
}
