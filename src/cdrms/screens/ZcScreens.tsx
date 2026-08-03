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
  Modal,
  Platform,
  ScrollView as RNNativeScrollView,
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
import { COLORS, FONTS, GLASS, GRADIENT_PRIMARY, SPACE, themeStatColors, gradientStops, DESIGN } from '@/src/cdrms/theme';
import { cardSurfaceStyle } from '@/src/cdrms/lib/cardSurface';
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

        <Box className="px-4 mt-2">
          <HStack className="items-center justify-between mb-3">
            <Text className="text-[16px] font-bold flex-1" style={{ color: COLORS.ink }}>
              Application overview
            </Text>
            <Pressable
              onPress={() => go('zc_create')}
              className="flex-row items-center gap-1.5 active:opacity-90"
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: DESIGN.cardRadius,
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
            className="mt-2 flex-row items-center"
            style={[
              cardSurfaceStyle({ nested: true }),
              { paddingHorizontal: 12, height: 44, overflow: 'hidden' },
            ]}
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



          <HStack className="items-center justify-between mt-2 mb-1">
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
  eOfficeNumber: '',
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
  error,
  multiline,
  numberOfLines,
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
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  const inputRef = useRef<TextInput>(null);
  const inputHeight = multiline ? Math.max(96, (numberOfLines ?? 4) * 22) : 40;

  return (
    <VStack style={[{ marginBottom: 0 }, style]}>
      <Text
        style={{
          fontFamily: FONTS.bold,
          fontSize: 14,
          color: COLORS.ink,
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
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines ?? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        scrollEnabled={multiline ? true : undefined}
        onFocus={() => {
          setTimeout(() => {
            inputRef.current?.measureInWindow((_x, y, _w, h) => {
              onFocus?.({ y, height: h || inputHeight });
            });
          }, Platform.OS === 'ios' ? 50 : 100);
        }}
        returnKeyType={returnKeyType ?? (multiline ? 'default' : 'next')}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit ?? !multiline}
        style={{
          height: inputHeight,
          minHeight: inputHeight,
          maxHeight: inputHeight,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: error ? COLORS.destructive : '#94A3B8',
          backgroundColor: COLORS.white,
          paddingHorizontal: 12,
          paddingTop: multiline ? 10 : undefined,
          paddingBottom: multiline ? 10 : undefined,
          fontSize: 13,
          color: COLORS.ink,
          fontFamily: FONTS.medium,
        }}
      />
      {error ? (
        <Text
          style={{
            marginTop: 4,
            fontSize: 11,
            color: COLORS.destructive,
            fontFamily: FONTS.medium,
          }}
        >
          {error}
        </Text>
      ) : null}
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
        borderRadius: DESIGN.radiusLg,
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
              borderRadius: DESIGN.stepRadius,
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
                fontSize: 16,
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
                  fontFamily: FONTS.semibold,
                  fontSize: 13,
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<SiteDimensionOption[]>([]);
  const [dimOpen, setDimOpen] = useState(false);
  const [addingDim, setAddingDim] = useState(false);
  const [newDimValue, setNewDimValue] = useState('');
  const [savingDim, setSavingDim] = useState(false);
  const [engOpen, setEngOpen] = useState(false);
  const dimTriggerRef = useRef<View>(null);
  const engTriggerRef = useRef<View>(null);
  const [dimAnchor, setDimAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [engAnchor, setEngAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const DROPDOWN_ITEM_H = 41;
  const DROPDOWN_MAX_ITEMS = 5;
  const dropdownListHeight = (count: number) => {
    if (count <= 0) return 44;
    return Math.min(count, DROPDOWN_MAX_ITEMS) * DROPDOWN_ITEM_H;
  };

  const openDimDropdown = () => {
    if (dimOpen) {
      setDimOpen(false);
      return;
    }
    dimTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setDimAnchor({ x, y, width, height });
      setDimOpen(true);
      setAddingDim(false);
      setEngOpen(false);
    });
  };

  const openEngDropdown = () => {
    if (engOpen) {
      setEngOpen(false);
      return;
    }
    engTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setEngAnchor({ x, y, width, height });
      setEngOpen(true);
      setDimOpen(false);
      setAddingDim(false);
    });
  };

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        keyboardHeightRef.current = e.endCoordinates?.height ?? 0;
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardHeightRef.current = 0;
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
      setFieldErrors((prev) => {
        if (!prev.siteDimension) return prev;
        const next = { ...prev };
        delete next.siteDimension;
        return next;
      });
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

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const next: Partial<Record<string, string>> = {};
    const eOffice = form.eOfficeNumber.trim();
    if (!eOffice) {
      next.eOfficeNumber = 'E-office number is required';
    } else if (eOffice.length < 3) {
      next.eOfficeNumber = 'Enter a valid e-office number (min 3 characters)';
    }

    if (!form.siteNo.trim()) {
      next.siteNo = 'Site no is required';
    }

    if (!form.siteDimensionType) {
      next.siteDimensionType = 'Site type is required';
    }

    if (!form.siteDimension.trim()) {
      next.siteDimension = 'Site dimension is required (e.g. 20*40)';
    } else if (!/^\d+(\*\d+)+$/.test(form.siteDimension.trim().replace(/\s+/g, ''))) {
      next.siteDimension = 'Use format like 20*40 or 20*40*50*40';
    }

    if (!form.addressArea.trim()) {
      next.addressArea = 'Area is required';
    }
    if (!form.addressBlock.trim()) {
      next.addressBlock = 'Block is required';
    }

    const pin = form.addressPincode.trim();
    if (!pin) {
      next.addressPincode = 'Pincode is required';
    } else if (!/^\d{4,10}$/.test(pin)) {
      next.addressPincode = 'Enter a valid pincode (4–10 digits)';
    }

    if (form.siteDimensionType === 'Odd' && !form.siteDimensionComment?.trim()) {
      next.siteDimensionComment = 'Comments are required for Odd site type';
    }

    if (!String(form.assignedEngineerUserId || '').trim()) {
      next.assignedEngineerUserId = 'Assign engineer is required';
    }

    setFieldErrors(next);
    const first = Object.values(next)[0];
    if (first) {
      showAppDialog({
        variant: 'warning',
        title: 'Validation',
        message: first,
        hideCancel: true,
        confirmLabel: 'OK',
      });
      return false;
    }
    return true;
  }, [form]);

  const onSubmit = async () => {
    if (!accessToken) return;
    if (!validateForm()) return;

    setSaving(true);
    try {
      const created = await createApplication(accessToken, {
        ...form,
        eOfficeNumber: form.eOfficeNumber.trim(),
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
      setFieldErrors({});
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
      const msg =
        e instanceof ApiError ? e.message : 'Failed to create application';
      if (/e-office/i.test(msg) || /already used/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, eOfficeNumber: msg }));
      }
      showAppDialog({
        variant: 'error',
        title: 'Could not create',
        message: msg,
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
        Avoid stacking KeyboardAvoidingView + live keyboard padding — that
        expands/compresses the form while scrolling when the keyboard dismisses.
        Use a stable bottom inset; scroll focused fields into view via ensureVisible.
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
            paddingBottom: 32 + insets.bottom,
            gap: 12,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
          nestedScrollEnabled
          scrollEnabled={!dimOpen && !engOpen}
          showsVerticalScrollIndicator
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
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
                <Field
                  label="E-office number"
                  required
                  placeholder="Enter e-office number"
                  value={form.eOfficeNumber}
                  error={fieldErrors.eOfficeNumber}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, eOfficeNumber: v }));
                    clearFieldError('eOfficeNumber');
                  }}
                  style={{ marginBottom: 10 }}
                />
                <HStack style={{ gap: 8, marginBottom: 10 }}>
                  <Field
                    label="Site no"
                    required
                    value={form.siteNo}
                    error={fieldErrors.siteNo}
                    onChange={(v) => {
                      setForm((f) => ({ ...f, siteNo: v }));
                      clearFieldError('siteNo');
                    }}
                    style={{ flex: 1 }}
                  />
                  <VStack style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 14,
                        color: COLORS.ink,
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
                            onPress={() => {
                              setForm((f) => ({ ...f, siteDimensionType: opt }));
                              clearFieldError('siteDimensionType');
                              if (opt !== 'Odd') clearFieldError('siteDimensionComment');
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}
                          >
                            <View
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: DESIGN.chipRadius,
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
                    {fieldErrors.siteDimensionType ? (
                      <Text
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color: COLORS.destructive,
                          fontFamily: FONTS.medium,
                        }}
                      >
                        {fieldErrors.siteDimensionType}
                      </Text>
                    ) : null}
                  </VStack>
                </HStack>

                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 14,
                    color: COLORS.ink,
                    marginBottom: 5,
                    letterSpacing: 0.2,
                  }}
                >
                  Site dimension
                  <Text style={{ color: COLORS.destructive, fontFamily: FONTS.bold }}> *</Text>
                </Text>
                <HStack style={{ gap: 8, marginBottom: addingDim ? 6 : 0, alignItems: 'center' }}>
                  <Pressable
                    ref={dimTriggerRef as any}
                    onPress={openDimDropdown}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: fieldErrors.siteDimension ? COLORS.destructive : '#94A3B8',
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
                      borderRadius: 8,
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
                {fieldErrors.siteDimension ? (
                  <Text
                    style={{
                      marginTop: 4,
                      marginBottom: 2,
                      fontSize: 11,
                      color: COLORS.destructive,
                      fontFamily: FONTS.medium,
                    }}
                  >
                    {fieldErrors.siteDimension}
                  </Text>
                ) : null}

                {addingDim ? (
                  <HStack style={{ gap: 8, alignItems: 'center' }}>
                    <TextInput
                      value={newDimValue}
                      onChangeText={setNewDimValue}
                      placeholder="e.g. 20*40"
                      placeholderTextColor={COLORS.slate}
                      autoFocus
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: '#94A3B8',
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
                        borderRadius: 8,
                        overflow: 'hidden',
                        opacity: savingDim ? 0.7 : 1,
                      }}
                    >
                      <LinearGradient
                        colors={gradientStops(GRADIENT_PRIMARY)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          height: 40,
                          paddingHorizontal: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {savingDim ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.white }}>
                            Save
                          </Text>
                        )}
                      </LinearGradient>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setAddingDim(false);
                        setNewDimValue('');
                      }}
                      style={{
                        height: 40,
                        paddingHorizontal: 12,
                        borderRadius: DESIGN.cardRadius,
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
                <Field
                  label="Area"
                  required
                  value={form.addressArea}
                  error={fieldErrors.addressArea}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, addressArea: v }));
                    clearFieldError('addressArea');
                  }}
                  style={{ marginBottom: 10 }}
                />
                <HStack style={{ gap: 8 }}>
                  <Field
                    label="Block"
                    required
                    value={form.addressBlock}
                    error={fieldErrors.addressBlock}
                    onChange={(v) => {
                      setForm((f) => ({ ...f, addressBlock: v }));
                      clearFieldError('addressBlock');
                    }}
                    onFocus={onFieldFocus}
                    style={{ flex: 1 }}
                  />
                  <Field
                    label="Pincode"
                    required
                    value={form.addressPincode}
                    error={fieldErrors.addressPincode}
                    onChange={(v) => {
                      setForm((f) => ({ ...f, addressPincode: v }));
                      clearFieldError('addressPincode');
                    }}
                    onFocus={onFieldFocus}
                    returnKeyType="next"
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
                  ref={engTriggerRef as any}
                  onPress={() => {
                    if (engineers.length === 0) return;
                    openEngDropdown();
                  }}
                  style={{
                    height: 40,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: fieldErrors.assignedEngineerUserId
                      ? COLORS.destructive
                      : '#94A3B8',
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
                {fieldErrors.assignedEngineerUserId ? (
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: COLORS.destructive,
                      fontFamily: FONTS.medium,
                    }}
                  >
                    {fieldErrors.assignedEngineerUserId}
                  </Text>
                ) : null}
                {engineers.length === 0 ? (
                  <Text style={{ marginTop: 6, color: COLORS.warning, fontSize: 11, fontFamily: FONTS.medium }}>
                    No engineers with an active post mapping in this zone.
                  </Text>
                ) : null}
              </PlainSectionCard>

              <PlainSectionCard
                title="Comments"
                icon={ClipboardList}
                required={form.siteDimensionType === 'Odd'}
              >
                <Field
                  label="Comments"
                  required={form.siteDimensionType === 'Odd'}
                  placeholder={
                    form.siteDimensionType === 'Odd'
                      ? 'Required for Odd site type'
                      : 'Optional comments'
                  }
                  value={form.siteDimensionComment || ''}
                  error={fieldErrors.siteDimensionComment}
                  multiline
                  numberOfLines={5}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, siteDimensionComment: v }));
                    clearFieldError('siteDimensionComment');
                  }}
                  onFocus={onFieldFocus}
                />
              </PlainSectionCard>

              <HStack style={{ gap: 10, marginHorizontal: SPACE.gutter, marginTop: 4 }}>
                <Pressable
                  onPress={() => go('zc_home')}
                  className="flex-1 active:opacity-90"
                  style={{
                    height: 48,
                    borderRadius: DESIGN.cardRadius,
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
                    borderRadius: DESIGN.cardRadius,
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

      <Modal
        transparent
        animationType="fade"
        visible={dimOpen}
        onRequestClose={() => setDimOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.2)' }}
          onPress={() => setDimOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close site dimension menu"
        />
        {dimAnchor ? (
          <View
            style={{
              position: 'absolute',
              top: (() => {
                const screenH = Dimensions.get('window').height;
                const h = dropdownListHeight(dimensions.length);
                const below = dimAnchor.y + dimAnchor.height + 4;
                if (below + h > screenH - 12) {
                  return Math.max(12, dimAnchor.y - h - 4);
                }
                return below;
              })(),
              left: dimAnchor.x,
              width: dimAnchor.width,
              height: dropdownListHeight(dimensions.length),
              borderRadius: DESIGN.cardRadius,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.white,
              overflow: 'hidden',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.16,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <RNNativeScrollView
              keyboardShouldPersistTaps="handled"
              bounces={dimensions.length > DROPDOWN_MAX_ITEMS}
              showsVerticalScrollIndicator={dimensions.length > DROPDOWN_MAX_ITEMS}
              nestedScrollEnabled
            >
              {dimensions.length === 0 ? (
                <Text style={{ padding: 12, color: COLORS.slate, fontSize: 12, fontFamily: FONTS.medium }}>
                  No dimensions yet. Tap Add to create one.
                </Text>
              ) : (
                dimensions.map((d, index) => (
                  <Pressable
                    key={d.id || d.label}
                    onPress={() => {
                      setForm((f) => ({ ...f, siteDimension: d.label }));
                      clearFieldError('siteDimension');
                      setDimOpen(false);
                    }}
                    style={{
                      height: DROPDOWN_ITEM_H,
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                      borderBottomWidth: index === dimensions.length - 1 ? 0 : 1,
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
            </RNNativeScrollView>
          </View>
        ) : null}
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={engOpen}
        onRequestClose={() => setEngOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.2)' }}
          onPress={() => setEngOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close engineer menu"
        />
        {engAnchor ? (
          <View
            style={{
              position: 'absolute',
              top: (() => {
                const screenH = Dimensions.get('window').height;
                const h = dropdownListHeight(engineers.length);
                const below = engAnchor.y + engAnchor.height + 4;
                if (below + h > screenH - 12) {
                  return Math.max(12, engAnchor.y - h - 4);
                }
                return below;
              })(),
              left: engAnchor.x,
              width: engAnchor.width,
              height: dropdownListHeight(engineers.length),
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: '#94A3B8',
              backgroundColor: COLORS.white,
              overflow: 'hidden',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.16,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <RNNativeScrollView
              keyboardShouldPersistTaps="handled"
              bounces={engineers.length > DROPDOWN_MAX_ITEMS}
              showsVerticalScrollIndicator={engineers.length > DROPDOWN_MAX_ITEMS}
              nestedScrollEnabled
            >
              {engineers.map((eng, index) => {
                const on = form.assignedEngineerUserId === eng.userId;
                return (
                  <Pressable
                    key={eng.userId}
                    onPress={() => {
                      setForm((f) => ({
                        ...f,
                        assignedEngineerUserId: eng.userId,
                      }));
                      clearFieldError('assignedEngineerUserId');
                      setEngOpen(false);
                    }}
                    style={{
                      height: DROPDOWN_ITEM_H,
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                      borderBottomWidth: index === engineers.length - 1 ? 0 : 1,
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
                      numberOfLines={1}
                    >
                      {eng.name}
                      {eng.postName ? ` · ${eng.postName}` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </RNNativeScrollView>
          </View>
        ) : null}
      </Modal>
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
