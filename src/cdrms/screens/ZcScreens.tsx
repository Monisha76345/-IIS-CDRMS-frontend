import {
  ChevronDown,
  ClipboardList,
  Compass,
  FilePlus2,
  Hourglass,
  Layers,
  MapPin,
  Plus,
  Ruler,
  Send,
  Search,
  UserCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
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
  applicationCardDateLine,
  countZcBuckets,
  createApplication,
  createSiteDimension,
  fetchApplication,
  fetchMyZoneMeta,
  fetchSiteDimensions,
  fetchZcApplications,
  normalizeApplicationStatus,
  type CreateApplicationInput,
  type MobileApplication,
  type MyZoneMeta,
  type SiteDimensionOption,
} from '@/src/api/applications';
import { ApplicationRecordDetails } from '@/src/cdrms/components/ApplicationRecordDetails';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';
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
import { COLORS, FONTS, GLASS, GRADIENT_PRIMARY, SPACE, themeStatColors, gradientStops } from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Go } from '@/src/cdrms/types';

type ZcTab =
  | 'all'
  | 'assigned'
  | 'in_progress'
  | 'submitted';

const ZC_STATUS_FILTERS: { key: ZcTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'submitted', label: 'Submitted' },
];

function villageLine(app: MobileApplication) {
  const village = app.addressArea || '—';
  const taluka = app.addressBlock || '—';
  const district = app.zoneCode || '—';
  return `${village} (${taluka}, ${district})`;
}

export function ZcHomeScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
  const { accessToken, user } = useAuth();
  const [apps, setApps] = useState<MobileApplication[]>([]);
  const [zoneLabel, setZoneLabel] = useState<string | null>(null);
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

  const counts = useMemo(() => countZcBuckets(apps), [apps]);

  const statColors = themeStatColors();
  const countItems: StatusCountItem[] = [
    {
      key: 'all',
      label: 'Total',
      count: counts.total,
      icon: Layers,
      ...statColors,
    },
    {
      key: 'submitted',
      label: 'Submitted',
      count: counts.submitted,
      icon: Send,
      ...statColors,
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
    <ScreenShell className="bg-background">
      <ScrollView
        key={themeId}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          title="Welcome"
          subtitle={displayName(user)}
          welcome
          zoneLabel={zoneLabel}
          go={go}
        />

        <Box className="px-4 mt-4">
          <HStack className="items-center justify-between mb-3">
            <Text className="text-[16px] font-bold flex-1" style={{ color: COLORS.ink }}>
              Application overview
            </Text>
            <Pressable
              onPress={() => go('zc_create')}
              className="flex-row items-center gap-1.5 active:opacity-90"
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <FilePlus2 size={15} color={COLORS.white} />
              <Text className="text-[12px] font-bold text-white">Create</Text>
            </Pressable>
          </HStack>

          <StatusCountGrid
            items={countItems}
            activeKey={tab}
            columns={2}
            onSelect={(key) => setTab(key as ZcTab)}
          />

          <Box
            className="mt-4 flex-row items-center"
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <Search size={16} color={COLORS.slate} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search by application no, site, engineer…"
              placeholderTextColor={COLORS.slate}
              style={{ flex: 1, marginLeft: 8, fontSize: 13, color: COLORS.ink }}
            />
          </Box>



          <HStack className="items-center justify-between mt-4 mb-2">
            <Text className="text-[15px] font-bold" style={{ color: COLORS.ink }}>
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
            <Text className="text-[13px] mt-4" style={{ color: COLORS.destructive }}>
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
                siteNo={app.siteNo}
                zoneCode={app.zoneCode}
                engineerName={app.assignedEngineerName}
                status={app.status}
                dateLine={applicationCardDateLine(app)}
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
  style,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onFocus?: (info: { y: number; height: number }) => void;
  returnKeyType?: 'next' | 'done' | 'go' | 'default';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  style?: object;
  required?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);

  return (
    <VStack style={[{ marginBottom: 0 }, style]}>
      <Text
        style={{
          fontFamily: FONTS.semibold,
          fontSize: 11,
          color: COLORS.slate,
          marginBottom: 5,
          letterSpacing: 0.2,
        }}
      >
        {label}
        {required ? <Text style={{ color: COLORS.destructive, fontFamily: FONTS.bold }}> *</Text> : null}
      </Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.slate}
        onFocus={() => {
          setTimeout(() => {
            inputRef.current?.measureInWindow((_x, y, _w, h) => {
              onFocus?.({ y, height: h || 40 });
            });
          }, Platform.OS === 'ios' ? 50 : 100);
        }}
        returnKeyType={returnKeyType ?? 'next'}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit ?? false}
        style={{
          height: 40,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.white,
          paddingHorizontal: 12,
          fontSize: 13,
          color: COLORS.ink,
          fontFamily: FONTS.medium,
        }}
      />
    </VStack>
  );
}

function PlainSectionCard({
  title,
  subtitle,
  icon: Icon,
  required,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      style={{
        marginHorizontal: SPACE.gutter,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: GLASS.cardSolid,
        borderWidth: 1,
        borderColor: GLASS.border,
        shadowColor: GLASS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: Platform.OS === 'ios' ? 0.07 : 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <Box
        style={{
          overflow: 'hidden',
          borderBottomWidth: 1,
          borderBottomColor: GLASS.border,
          backgroundColor: `${COLORS.primary}22`,
        }}
      >
        <HStack
          className="items-center"
          style={{
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: GLASS.border,
            }}
          >
            <Icon size={15} color={COLORS.primary} strokeWidth={2.5} />
          </Box>
          <VStack style={{ flex: 1, gap: 1 }}>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 13,
                color: COLORS.ink,
                letterSpacing: -0.1,
              }}
              numberOfLines={1}
            >
              {title}
              {required ? (
                <Text style={{ color: COLORS.destructive, fontFamily: FONTS.bold }}> *</Text>
              ) : null}
            </Text>
            {subtitle ? (
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 11,
                  color: COLORS.slate,
                }}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      </Box>
      <Box style={{ padding: 12, backgroundColor: GLASS.cardSolid }}>{children}</Box>
    </Box>
  );
}

export function ZcCreateScreen({ go }: { go: Go }) {
  const { themeId } = useTheme();
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
  const [addingDim, setAddingDim] = useState(false);
  const [newDimValue, setNewDimValue] = useState('');
  const [savingDim, setSavingDim] = useState(false);
  const [engOpen, setEngOpen] = useState(false);
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

  const saveNewDimension = async () => {
    if (!accessToken) return;
    const normalized = newDimValue.trim().replace(/\s+/g, '');
    if (!/^\d+(\*\d+)+$/.test(normalized)) {
      showAppDialog({
        variant: 'warning',
        title: 'Validation',
        message: 'Enter dimensions like 20*40 or 20*40*50*40',
        hideCancel: true,
        confirmLabel: 'OK',
      });
      return;
    }
    const exists = dimensions.some(
      (d) => d.label.toLowerCase() === normalized.toLowerCase(),
    );
    if (exists) {
      setForm((f) => ({ ...f, siteDimension: normalized }));
      setAddingDim(false);
      setNewDimValue('');
      setDimOpen(false);
      return;
    }
    setSavingDim(true);
    try {
      const row = await createSiteDimension(accessToken, normalized);
      setDimensions((prev) => {
        if (prev.some((d) => d.label.toLowerCase() === row.label.toLowerCase())) {
          return prev;
        }
        return [...prev, row].sort((a, b) => a.label.localeCompare(b.label));
      });
      setForm((f) => ({ ...f, siteDimension: row.label }));
      setAddingDim(false);
      setNewDimValue('');
      setDimOpen(false);
      showAppDialog({
        variant: 'success',
        title: 'Dimension saved',
        message: `${row.label} was added to the dropdown.`,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } catch (e) {
      showAppDialog({
        variant: 'error',
        title: 'Could not save',
        message: e instanceof ApiError ? e.message : 'Failed to save dimension',
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      setSavingDim(false);
    }
  };

  const selectedEngineer = engineers.find((e) => e.userId === form.assignedEngineerUserId);

  const onSubmit = async () => {
    if (!accessToken) return;
    if (!form.siteNo.trim()) {
      return showAppDialog({
        variant: 'warning',
        title: 'Validation',
        message: 'Site no is required',
        hideCancel: true,
        confirmLabel: 'OK',
      });
    }
    if (!form.siteDimension.trim()) {
      return showAppDialog({
        variant: 'warning',
        title: 'Validation',
        message: 'Site dimension is required (e.g. 20*40)',
        hideCancel: true,
        confirmLabel: 'OK',
      });
    }
    if (!form.addressArea.trim() || !form.addressBlock.trim() || !form.addressPincode.trim()) {
      return showAppDialog({
        variant: 'warning',
        title: 'Validation',
        message: 'Area, block and pincode are mandatory',
        hideCancel: true,
        confirmLabel: 'OK',
      });
    }
    if (form.siteDimensionType === 'Odd' && !form.siteDimensionComment?.trim()) {
      return showAppDialog({
        variant: 'warning',
        title: 'Validation',
        message: 'Comment is required for Odd site type',
        hideCancel: true,
        confirmLabel: 'OK',
      });
    }
    if (!String(form.assignedEngineerUserId || '').trim()) {
      return showAppDialog({
        variant: 'warning',
        title: 'Validation',
        message: 'Assign engineer is required',
        hideCancel: true,
        confirmLabel: 'OK',
      });
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
      setForm(emptyForm);
      showAppDialog({
        variant: 'success',
        title: 'Application created',
        message: 'The application was assigned to the engineer successfully.',
        highlightLabel: 'Application number',
        highlight: created.applicationNumber,
        cancelLabel: 'Cancel',
        confirmLabel: 'Done',
        onConfirm: () => go('zc_home'),
      });
    } catch (e) {
      showAppDialog({
        variant: 'error',
        title: 'Could not create',
        message: e instanceof ApiError ? e.message : 'Failed to create application',
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell className="bg-background">
      <AppHeader
        title="Create application"
        subtitle={zone ? `Zone ${zone.zoneCode}` : undefined}
        onBack={() => go('zc_home')}
        gradient
        compact
        go={go}
        showNotifications={false}
        showLogout={false}
      />
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
          key={themeId}
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: Math.max(24 + insets.bottom, keyboardHeight + 12),
            gap: 12,
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
              className="mx-4 rounded-2xl border px-4 py-4"
              style={{
                backgroundColor: `${COLORS.destructive}0D`,
                borderColor: `${COLORS.destructive}40`,
              }}
            >
              <Text style={{ color: COLORS.destructive, fontSize: 13, fontFamily: FONTS.medium }}>
                {zoneError}
              </Text>
            </Box>
          ) : (
            <VStack style={{ gap: 12 }}>
              <PlainSectionCard title="Site details" icon={Ruler}>
                <HStack style={{ gap: 8, marginBottom: 10 }}>
                  <Field
                    label="Site no"
                    required
                    value={form.siteNo}
                    onChange={(v) => setForm((f) => ({ ...f, siteNo: v }))}
                    style={{ flex: 1 }}
                  />
                  <VStack style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.semibold,
                        fontSize: 11,
                        color: COLORS.slate,
                        marginBottom: 5,
                        letterSpacing: 0.2,
                      }}
                    >
                      Site type
                      <Text style={{ color: COLORS.destructive, fontFamily: FONTS.bold }}> *</Text>
                    </Text>
                    <HStack style={{ gap: 14, height: 40, alignItems: 'center' }}>
                      {(['Even', 'Odd'] as const).map((opt) => {
                        const on = form.siteDimensionType === opt;
                        return (
                          <Pressable
                            key={opt}
                            onPress={() => setForm((f) => ({ ...f, siteDimensionType: opt }))}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}
                          >
                            <View
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 9,
                                borderWidth: 2,
                                borderColor: on ? COLORS.primary : COLORS.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {on ? (
                                <View
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: COLORS.primary,
                                  }}
                                />
                              ) : null}
                            </View>
                            <Text
                              style={{
                                fontFamily: FONTS.semibold,
                                fontSize: 13,
                                color: on ? COLORS.primary : COLORS.ink,
                              }}
                            >
                              {opt}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </HStack>
                  </VStack>
                </HStack>

                <Text
                  style={{
                    fontFamily: FONTS.semibold,
                    fontSize: 11,
                    color: COLORS.slate,
                    marginBottom: 5,
                    letterSpacing: 0.2,
                  }}
                >
                  Site dimension
                  <Text style={{ color: COLORS.destructive, fontFamily: FONTS.bold }}> *</Text>
                </Text>
                <HStack style={{ gap: 8, marginBottom: dimOpen || addingDim ? 6 : 0, alignItems: 'center' }}>
                  <Pressable
                    onPress={() => {
                      setDimOpen((o) => !o);
                      setAddingDim(false);
                      setEngOpen(false);
                    }}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.white,
                      paddingHorizontal: 11,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontFamily: FONTS.medium,
                        color: form.siteDimension ? COLORS.ink : COLORS.slate,
                      }}
                      numberOfLines={1}
                    >
                      {form.siteDimension || 'Select site dimension'}
                    </Text>
                    <ChevronDown size={16} color={COLORS.slate} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setAddingDim(true);
                      setDimOpen(false);
                      setNewDimValue('');
                    }}
                    style={{
                      height: 40,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <LinearGradient
                      colors={gradientStops(GRADIENT_PRIMARY)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        gap: 4,
                      }}
                    >
                      <Plus size={15} color={COLORS.white} strokeWidth={2.5} />
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.white }}>Add</Text>
                    </LinearGradient>
                  </Pressable>
                </HStack>

                {dimOpen ? (
                  <Box
                    style={{
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.white,
                      marginBottom: 0,
                      overflow: 'hidden',
                      maxHeight: 180,
                    }}
                  >
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {dimensions.length === 0 ? (
                        <Text style={{ padding: 10, color: COLORS.slate, fontSize: 12 }}>
                          No dimensions yet. Tap Add to create one.
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
                              paddingHorizontal: 11,
                              paddingVertical: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: GLASS.divider,
                              backgroundColor:
                                form.siteDimension === d.label ? GLASS.tintBlue : COLORS.white,
                            }}
                          >
                            <Text style={{ fontSize: 13, color: COLORS.ink, fontFamily: FONTS.semibold }}>
                              {d.label}
                            </Text>
                          </Pressable>
                        ))
                      )}
                    </ScrollView>
                  </Box>
                ) : null}

                {addingDim ? (
                  <HStack style={{ gap: 8, marginTop: dimOpen ? 8 : 0, alignItems: 'center' }}>
                    <TextInput
                      value={newDimValue}
                      onChangeText={setNewDimValue}
                      placeholder="e.g. 20*40"
                      placeholderTextColor={COLORS.slate}
                      autoFocus
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.white,
                        paddingHorizontal: 12,
                        fontSize: 13,
                        color: COLORS.ink,
                        fontFamily: FONTS.medium,
                      }}
                    />
                    <Pressable
                      onPress={() => void saveNewDimension()}
                      disabled={savingDim}
                      style={{
                        height: 40,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        backgroundColor: COLORS.success,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: savingDim ? 0.7 : 1,
                      }}
                    >
                      {savingDim ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.white }}>
                          Save
                        </Text>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setAddingDim(false);
                        setNewDimValue('');
                      }}
                      style={{
                        height: 40,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.white,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.slate }}>
                        Cancel
                      </Text>
                    </Pressable>
                  </HStack>
                ) : null}
              </PlainSectionCard>

              <PlainSectionCard title="Address" icon={MapPin}>
                <HStack style={{ gap: 8, marginBottom: 10 }}>
                  <Field
                    label="Area"
                    required
                    value={form.addressArea}
                    onChange={(v) => setForm((f) => ({ ...f, addressArea: v }))}
                    style={{ flex: 1 }}
                  />
                  <Field
                    label="Block"
                    required
                    value={form.addressBlock}
                    onChange={(v) => setForm((f) => ({ ...f, addressBlock: v }))}
                    onFocus={onFieldFocus}
                    style={{ flex: 1 }}
                  />
                </HStack>
                <HStack style={{ gap: 8 }}>
                  <Field
                    label="Pincode"
                    required
                    value={form.addressPincode}
                    onChange={(v) => setForm((f) => ({ ...f, addressPincode: v }))}
                    onFocus={onFieldFocus}
                    returnKeyType="next"
                    style={{ flex: 1 }}
                  />
                  <Field
                    label={form.siteDimensionType === 'Odd' ? 'Comments' : 'Comments'}
                    required={form.siteDimensionType === 'Odd'}
                    value={form.siteDimensionComment || ''}
                    onChange={(v) => setForm((f) => ({ ...f, siteDimensionComment: v }))}
                    onFocus={onFieldFocus}
                    style={{ flex: 1 }}
                  />
                </HStack>
              </PlainSectionCard>

              <PlainSectionCard title="Site Schedules" icon={Compass}>
                <HStack style={{ gap: 8, marginBottom: 10 }}>
                  <Field
                    label="North"
                    value={form.scheduleNorth || ''}
                    onChange={(v) => setForm((f) => ({ ...f, scheduleNorth: v }))}
                    onFocus={onFieldFocus}
                    style={{ flex: 1 }}
                  />
                  <Field
                    label="South"
                    value={form.scheduleSouth || ''}
                    onChange={(v) => setForm((f) => ({ ...f, scheduleSouth: v }))}
                    onFocus={onFieldFocus}
                    style={{ flex: 1 }}
                  />
                </HStack>
                <HStack style={{ gap: 8 }}>
                  <Field
                    label="West"
                    value={form.scheduleWest || ''}
                    onChange={(v) => setForm((f) => ({ ...f, scheduleWest: v }))}
                    onFocus={onFieldFocus}
                    style={{ flex: 1 }}
                  />
                  <Field
                    label="East"
                    value={form.scheduleEast || ''}
                    onChange={(v) => setForm((f) => ({ ...f, scheduleEast: v }))}
                    onFocus={onFieldFocus}
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={() => Keyboard.dismiss()}
                    style={{ flex: 1 }}
                  />
                </HStack>
              </PlainSectionCard>

              <PlainSectionCard
                title="Assign engineer"
                icon={UserCheck}
                required
              >
                <Pressable
                  onPress={() => {
                    if (engineers.length === 0) return;
                    setEngOpen((o) => !o);
                    setDimOpen(false);
                    setAddingDim(false);
                  }}
                  style={{
                    height: 40,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.white,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontFamily: FONTS.medium,
                      color: selectedEngineer ? COLORS.ink : COLORS.slate,
                    }}
                    numberOfLines={1}
                  >
                    {selectedEngineer
                      ? `${selectedEngineer.name}${selectedEngineer.postName ? ` · ${selectedEngineer.postName}` : ''}`
                      : engineers.length === 0
                        ? 'No engineers in this zone'
                        : 'Select engineer'}
                  </Text>
                  <ChevronDown size={16} color={COLORS.slate} />
                </Pressable>
                {engOpen && engineers.length > 0 ? (
                  <Box
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.white,
                      marginTop: 6,
                      overflow: 'hidden',
                      maxHeight: 180,
                    }}
                  >
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {engineers.map((eng) => {
                        const on = form.assignedEngineerUserId === eng.userId;
                        return (
                          <Pressable
                            key={eng.userId}
                            onPress={() => {
                              setForm((f) => ({
                                ...f,
                                assignedEngineerUserId: eng.userId,
                              }));
                              setEngOpen(false);
                            }}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: GLASS.divider,
                              backgroundColor: on ? GLASS.tintBlue : COLORS.white,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontFamily: FONTS.semibold,
                                color: on ? COLORS.primary : COLORS.ink,
                              }}
                            >
                              {eng.name}
                              {eng.postName ? ` · ${eng.postName}` : ''}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </Box>
                ) : null}
                {engineers.length === 0 ? (
                  <Text style={{ marginTop: 6, color: COLORS.warning, fontSize: 11, fontFamily: FONTS.medium }}>
                    No engineers with an active post mapping in this zone.
                  </Text>
                ) : null}
              </PlainSectionCard>

              <HStack style={{ gap: 10, marginHorizontal: SPACE.gutter, marginTop: 4 }}>
                <Pressable
                  onPress={() => go('zc_home')}
                  className="flex-1 active:opacity-90"
                  style={{
                    height: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.white,
                  }}
                >
                  <Text style={{ fontFamily: FONTS.semibold, color: COLORS.ink }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void onSubmit()}
                  disabled={saving}
                  className="flex-1 overflow-hidden active:opacity-90"
                  style={{
                    borderRadius: 14,
                    opacity: saving ? 0.7 : 1,
                    shadowColor: COLORS.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.22,
                    shadowRadius: 10,
                    elevation: 4,
                  }}
                >
                  <LinearGradient
                    colors={gradientStops(GRADIENT_PRIMARY)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      height: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {saving ? (
                      <ButtonLoader color={COLORS.white} />
                    ) : (
                      <Text style={{ fontFamily: FONTS.bold, color: COLORS.white }}>Submit</Text>
                    )}
                  </LinearGradient>
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
      <AppHeader
        title="View Application"
        subtitle={app?.applicationNumber || 'Application details'}
        onBack={() => go('zc_home')}
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
          <Box className="mx-4 rounded-2xl border px-4 py-6" style={{ borderColor: `${COLORS.destructive}40`, backgroundColor: `${COLORS.destructive}0D` }}>
            <Text style={{ color: COLORS.destructive, fontFamily: FONTS.medium, fontSize: 13, textAlign: 'center' }}>
              {error || 'Not found'}
            </Text>
          </Box>
        ) : (
          <ApplicationRecordDetails app={app} showEmptyEngineer={false} />
        )}
      </ScrollView>
    </ScreenShell>
  );
}
