import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Edit3,
  FileText,
  Lock,
  RefreshCw,
  Ruler,
  Send,
  ShieldCheck,
  WifiOff,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  AppBtn,
  AppCard,
  AppHeader,
  AppSheet,
  ButtonLoader,
  IconBox,
  ScreenLoader,
  ScreenShell,
  StatusChip,
  useMinimumLoading,
} from '@/src/cdrms/components/primitives';
import {
  FooterContinueBtn,
  PremiumStepCard,
  SurveyCard,
  SurveyScaffold,
  WorkspaceHeader,
} from '@/src/cdrms/components/SurveyLayout';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { CreateApplicationHeader } from '@/src/cdrms/components/CreateApplicationHeader';
import { ReviewMediaPanel } from '@/src/cdrms/components/ReviewMediaPanel';
import { ReviewSchedulesPanel } from '@/src/cdrms/components/ReviewSchedulesPanel';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';
import { formatApplicationDateTime, engineerReviewStatusBadge } from '@/src/api/applications';
import { captureCurrentLocation } from '@/src/cdrms/hooks/useDeviceLocation';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { formatCoords, type Cardinal } from '@/src/cdrms/project/types';
import { validateDraft, validationSummary } from '@/src/cdrms/project/validation';
import { setSelectedOfficeAppId } from '@/src/cdrms/officeSelection';
import {
  COLORS,
  FONTS,
  GRADIENT_PRIMARY,
  GRADIENT_SUBTLE,
  SPACE,
  gradientStops,
  hexAlpha,
} from '@/src/cdrms/theme';
import { TERMS } from '@/src/cdrms/terminology';
import type { Go } from '@/src/cdrms/types';

const REVIEW_CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];
const BLUE_SOFT = '#EEF4FF';
const BLUE_BORDER = 'rgba(26,54,142,0.28)';
const REVIEW_ACCENT = {
  blue: { fg: '#1A368E', bg: '#E8F0FE' },
  green: { fg: '#15803D', bg: '#DCFCE7' },
  purple: { fg: '#6D28D9', bg: '#EDE9FE' },
  sky: { fg: '#1D4ED8', bg: '#DBEAFE' },
} as const;
type ReviewAccent = keyof typeof REVIEW_ACCENT;

function PremiumPillBadge({
  label,
  tone = 'blue',
}: {
  label: string;
  tone?: 'blue' | 'green' | 'orange' | 'red';
}) {
  const styles =
    tone === 'green'
      ? { bg: '#ECFDF5', border: '#A7F3D0', fg: '#047857' }
      : tone === 'orange'
        ? { bg: '#FFF7ED', border: '#FDBA74', fg: '#C2410C' }
        : tone === 'red'
          ? { bg: '#FEF2F2', border: '#FECACA', fg: '#B91C1C' }
          : { bg: BLUE_SOFT, border: BLUE_BORDER, fg: COLORS.primary };
  return (
    <Box
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: styles.bg,
        borderWidth: 1,
        borderColor: styles.border,
      }}
    >
      <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: styles.fg }}>{label}</Text>
    </Box>
  );
}

function plotScheduleLabel(note: string | undefined, isRoad: boolean): string {
  // Engineer review plot: only engineer notes + Road checkbox — never ZC text.
  const base = (note || '').trim();
  if (isRoad && base) return `Road · ${base}`;
  if (isRoad) return 'Road';
  return base;
}

export function DraftScreen({ go }: { go: Go }) {
  const { draft, saveDraft } = useProject();

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  const name = draft.projectName.trim() || 'Untitled application';
  const savedAt = new Date(draft.updatedAt).toLocaleString();

  return (
    <ScreenShell>
      <VStack className="flex-1">
        <VStack className="flex-1 items-center justify-center px-8">
          <Box className="h-28 w-28 rounded-full bg-primary/10 items-center justify-center">
            <FileText size={56} color={COLORS.primary} strokeWidth={1.8} />
          </Box>
          <Text className="mt-8 text-2xl font-extrabold text-foreground text-center">
            Draft Saved Successfully
          </Text>
          <Text className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
            Your progress on <Text className="font-bold text-foreground">{name}</Text> is safe on
            this device. You can resume anytime.
          </Text>
          <AppCard className="mt-6 w-full">
            <HStack className="items-center justify-between">
              <Text className="text-xs text-muted-foreground">Draft ID</Text>
              <Text className="text-xs font-bold text-foreground">{draft.id}</Text>
            </HStack>
            <HStack className="mt-2 items-center justify-between">
              <Text className="text-xs text-muted-foreground">Saved {savedAt}</Text>
              <CheckCircle2 size={16} color={COLORS.success} />
            </HStack>
          </AppCard>
        </VStack>
        <VStack space="md" className="p-5">
          <AppBtn onPress={() => go('project')} icon={ArrowRight}>
            Resume Now
          </AppBtn>
          <AppBtn variant="outline" onPress={() => go('dashboard')}>
            Go to Dashboard
          </AppBtn>
          <Pressable onPress={() => go('dashboard')} className="py-2 items-center">
            <Text className="text-sm text-muted-foreground font-medium">Continue later</Text>
          </Pressable>
        </VStack>
      </VStack>
    </ScreenShell>
  );
}

export function ValidateScreen({ go }: { go: Go }) {
  const { draft } = useProject();
  const pageLoading = useMinimumLoading(true, 300);
  const items = useMemo(() => validateDraft(draft), [draft]);
  const summary = useMemo(() => validationSummary(items), [items]);
  const isBackendTask = Boolean(draft.backendApplicationId);

  return (
    <SurveyScaffold
      title={TERMS.workflow.validate}
      subtitle={TERMS.workflow.validateSubtitle}
      onBack={() => go(isBackendTask ? 'photos' : 'video')}
      showSteps={false}
      showHeroArt={false}
      surface="default"
      loading={pageLoading}
      badge={summary.allOk ? 'Ready' : `${summary.failed.length} to fix`}
      footer={
        isBackendTask ? (
          <FooterContinueBtn
            disabled={!summary.allOk}
            label={summary.allOk ? 'Continue to Review' : 'Fix issues to continue'}
            onPress={() => go('review')}
          />
        ) : (
          <AppBtn
            disabled={!summary.allOk}
            onPress={() => go('review')}
            icon={ArrowRight}
          >
            {summary.allOk ? 'Continue to Review' : 'Fix issues to continue'}
          </AppBtn>
        )
      }
      go={go}
    >
      {isBackendTask ? (
        <>
          <PremiumStepCard
            icon={ClipboardCheck}
            title={summary.allOk ? 'All checks passed' : 'Checklist incomplete'}
            subtitle={
              summary.allOk
                ? 'Application is complete and ready to submit.'
                : `${summary.failed.length} item${summary.failed.length === 1 ? '' : 's'} still need attention.`
            }
            badge={
              <PremiumPillBadge
                label={summary.allOk ? `${summary.percent}%` : `${summary.passed}/${summary.total}`}
                tone={summary.allOk ? 'green' : 'orange'}
              />
            }
          >
            <Box
              style={{
                borderRadius: 16,
                backgroundColor: summary.allOk ? '#ECFDF5' : '#FFF7ED',
                borderWidth: 1,
                borderColor: summary.allOk ? '#A7F3D0' : '#FDBA74',
                padding: 12,
              }}
            >
              <HStack className="items-center" style={{ gap: 12 }}>
                <Box
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: COLORS.white,
                    borderWidth: 3,
                    borderColor: summary.allOk ? '#10B981' : '#F59E0B',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 16,
                      color: summary.allOk ? '#047857' : '#B45309',
                    }}
                  >
                    {summary.percent}%
                  </Text>
                </Box>
                <VStack style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 13,
                      letterSpacing: 0.3,
                      color: COLORS.ink,
                      textTransform: 'uppercase',
                    }}
                  >
                    {summary.allOk ? 'No issues found' : 'Requirements'}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: 13,
                      lineHeight: 16,
                      color: COLORS.ink,
                    }}
                  >
                    {summary.passed} of {summary.total} checks passed
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </PremiumStepCard>

          <PremiumStepCard
            icon={ClipboardList}
            title={TERMS.sections.checklist}
            subtitle={`${summary.passed} / ${summary.total} requirements met`}
            badge={
              <PremiumPillBadge
                label={summary.allOk ? 'Ready' : 'Fix'}
                tone={summary.allOk ? 'green' : 'orange'}
              />
            }
          >
            <VStack style={{ gap: 8 }}>
              {items.map((it) => (
                <Box
                  key={it.key}
                  style={{
                    borderRadius: 16,
                    padding: 10,
                    backgroundColor: COLORS.white,
                    borderWidth: 1.5,
                    borderColor: it.ok ? hexAlpha('#10B981', 0.35) : hexAlpha('#DC2626', 0.3),
                    shadowColor: COLORS.primaryDeep,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 5,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-center" style={{ gap: 10 }}>
                    <Box
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: it.ok ? '#D1FAE5' : '#FEE2E2',
                      }}
                    >
                      {it.ok ? (
                        <Check size={16} color="#059669" strokeWidth={3} />
                      ) : (
                        <X size={16} color="#DC2626" strokeWidth={3} />
                      )}
                    </Box>
                    <VStack style={{ flex: 1, minWidth: 0, gap: 0 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.bold,
                          fontSize: 13,
                          color: COLORS.ink,
                        }}
                        numberOfLines={2}
                      >
                        {it.label}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.medium,
                          fontSize: 12,
                          lineHeight: 15,
                          color: COLORS.ink,
                        }}
                        numberOfLines={2}
                      >
                        {it.detail}
                      </Text>
                    </VStack>
                    {it.ok ? (
                      <PremiumPillBadge label="Passed" tone="green" />
                    ) : (
                      <Pressable
                        onPress={() => go(it.fixScreen)}
                        className="active:opacity-80"
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: '#FEF2F2',
                          borderWidth: 1,
                          borderColor: '#FECACA',
                        }}
                      >
                        <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: '#DC2626' }}>
                          Fix
                        </Text>
                      </Pressable>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          </PremiumStepCard>
        </>
      ) : (
        <>
          <SurveyCard>
            <LinearGradient
              colors={summary.allOk ? ['#ECFDF5', '#FFFFFF'] : ['#FEF3C7', '#FFFFFF']}
              style={{ padding: 18 }}
            >
              <HStack className="items-center gap-4">
                <Box
                  className="h-20 w-20 rounded-full items-center justify-center"
                  style={{
                    borderWidth: 5,
                    borderColor: summary.allOk ? '#10B981' : '#F59E0B',
                    backgroundColor: summary.allOk ? '#D1FAE5' : '#FEF3C7',
                  }}
                >
                  <Text
                    className="font-black text-lg"
                    style={{ color: summary.allOk ? '#047857' : '#B45309' }}
                  >
                    {summary.percent}%
                  </Text>
                </Box>
                <VStack className="flex-1">
                  <Text className="text-lg font-black text-foreground">
                    {summary.allOk ? 'All checks passed' : 'Checklist incomplete'}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {summary.allOk
                      ? 'Application is complete and ready to submit.'
                      : `${summary.failed.length} item${summary.failed.length === 1 ? '' : 's'} still need attention.`}
                  </Text>
                  <Box
                    className="self-start mt-2 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: summary.allOk ? '#D1FAE5' : '#FDE68A' }}
                  >
                    <Text
                      className="text-[10px] font-extrabold"
                      style={{ color: summary.allOk ? '#047857' : '#92400E' }}
                    >
                      {summary.allOk
                        ? 'NO ISSUES FOUND'
                        : `${summary.passed} / ${summary.total} PASSED`}
                    </Text>
                  </Box>
                </VStack>
              </HStack>
            </LinearGradient>
          </SurveyCard>

          <SurveyCard>
            <WorkspaceHeader
              icon={ClipboardCheck}
              title={TERMS.sections.checklist}
              subtitle={`${summary.passed} / ${summary.total} requirements met`}
              iconBg={summary.allOk ? '#059669' : '#D97706'}
            />
            <VStack>
              {items.map((it, i) => (
                <HStack
                  key={it.key}
                  className={`items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <Box
                    className="h-10 w-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: it.ok ? '#D1FAE5' : '#FEE2E2' }}
                  >
                    {it.ok ? (
                      <Check size={18} color="#059669" strokeWidth={3} />
                    ) : (
                      <X size={18} color="#DC2626" strokeWidth={3} />
                    )}
                  </Box>
                  <VStack className="flex-1 min-w-0">
                    <Text className="font-bold text-sm text-foreground">{it.label}</Text>
                    <Text className="text-[11px] text-muted-foreground mt-0.5" numberOfLines={1}>
                      {it.detail}
                    </Text>
                  </VStack>
                  {it.ok ? (
                    <Text className="text-[11px] font-bold" style={{ color: '#059669' }}>
                      Passed
                    </Text>
                  ) : (
                    <Pressable onPress={() => go(it.fixScreen)} className="active:opacity-70">
                      <Text className="text-xs text-destructive font-semibold">Fix</Text>
                    </Pressable>
                  )}
                </HStack>
              ))}
            </VStack>
          </SurveyCard>
        </>
      )}
    </SurveyScaffold>
  );
}

function reviewStepBadge(stepLabel: string, total = 4) {
  const n = Number(stepLabel.replace(/\D/g, ''));
  return Number.isFinite(n) && n > 0 ? `${n}/${total}` : stepLabel;
}

function reviewRowSpansFullWidth(label: string, value: string) {
  const text = value.trim();
  if (
    label === 'ZC comments' ||
    label === 'Engineer comments' ||
    label === 'Address line 1' ||
    label === 'Address line 2'
  ) {
    return true;
  }
  return text.length > 34;
}

function ReviewPremiumField({
  label,
  value,
  accent = 'blue',
}: {
  label: string;
  value: string;
  accent?: ReviewAccent;
}) {
  const display = value.trim() || '—';
  const tone = REVIEW_ACCENT[accent];

  return (
    <VStack style={{ minWidth: 0, gap: 4 }}>
      <Text
        style={{
          fontFamily: FONTS.bold,
          fontSize: 13,
          color: '#1A368E',
          letterSpacing: 0.1,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Box
        style={{
          minHeight: 38,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: hexAlpha(tone.fg, 0.42),
          backgroundColor: COLORS.white,
          paddingHorizontal: 10,
          paddingVertical: 8,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 13,
            color: '#0F172A',
            lineHeight: 17,
          }}
          numberOfLines={4}
        >
          {display}
        </Text>
      </Box>
    </VStack>
  );
}

function ReviewDetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const display = value.trim() || '—';

  return (
    <HStack
      className="items-start"
      style={{
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#F1F5F9',
      }}
    >
      <Text
        style={{
          width: 118,
          fontFamily: FONTS.bold,
          fontSize: 13,
          color: COLORS.ink,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          fontFamily: FONTS.regular,
          fontSize: 15,
          color: COLORS.ink,
          lineHeight: 21,
        }}
      >
        {display}
      </Text>
    </HStack>
  );
}

function filterReviewRows(rows: { label: string; value: string }[]) {
  return rows.filter((row) => row.value.trim() && row.value !== '—');
}

function ReviewSectionCard({
  stepLabel,
  icon: Icon,
  title,
  subtitle,
  iconBg,
  rows,
  footer,
  variant = 'default',
  stepTotal = 4,
  accent = 'blue',
  rowsAfterFooter = false,
}: {
  stepLabel: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  iconBg: string;
  rows: { label: string; value: string }[];
  footer?: ReactNode;
  variant?: 'default' | 'premium';
  stepTotal?: number;
  accent?: ReviewAccent;
  /** Put detail rows after footer (e.g. comments after media). */
  rowsAfterFooter?: boolean;
}) {
  if (!rows.length && !footer) return null;
  const tone = REVIEW_ACCENT[accent];

  const premiumRows =
    rows.length > 0 ? (
      <Box
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 8,
          columnGap: 8,
        }}
      >
        {rows.map((row) => {
          const fullWidth = reviewRowSpansFullWidth(row.label, row.value);
          return (
            <Box
              key={`${stepLabel}-${row.label}`}
              style={{
                width: fullWidth ? '100%' : '48%',
                minWidth: 0,
              }}
            >
              <ReviewPremiumField label={row.label} value={row.value} accent={accent} />
            </Box>
          );
        })}
      </Box>
    ) : null;

  if (variant === 'premium') {
    return (
      <Box style={{ paddingHorizontal: SPACE.gutter }}>
        <Box
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            borderWidth: 1.75,
            borderColor: hexAlpha(tone.fg, 0.38),
            overflow: 'hidden',
            shadowColor: tone.fg,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.07,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <HStack
            className="items-center"
            style={{ gap: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' }}
          >
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: tone.bg,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={16} color={tone.fg} strokeWidth={2.4} />
            </Box>
            <VStack style={{ flex: 1, minWidth: 0, flexShrink: 1, gap: 2, justifyContent: 'center' }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 15,
                  lineHeight: 18,
                  color: '#0F172A',
                  letterSpacing: -0.2,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 12,
                  lineHeight: 15,
                  color: '#64748B',
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            </VStack>
            <Box style={{ flexShrink: 0 }}>
              <PremiumPillBadge label={reviewStepBadge(stepLabel, stepTotal)} />
            </Box>
          </HStack>

          <VStack style={{ paddingHorizontal: 12, paddingBottom: 10, paddingTop: 0, gap: 8 }}>
            {rowsAfterFooter ? null : premiumRows}
            {footer ? (
              <Box style={{ marginTop: !rowsAfterFooter && rows.length ? 2 : 0 }}>{footer}</Box>
            ) : null}
            {rowsAfterFooter ? premiumRows : null}
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <SurveyCard>
      <WorkspaceHeader icon={Icon} title={title} subtitle={subtitle} iconBg={iconBg} />
      <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] }}>
        {rowsAfterFooter
          ? null
          : rows.map((row) => (
              <ReviewDetailRow key={`${stepLabel}-${row.label}`} label={row.label} value={row.value} />
            ))}
        {footer}
        {rowsAfterFooter
          ? rows.map((row) => (
              <ReviewDetailRow key={`${stepLabel}-${row.label}`} label={row.label} value={row.value} />
            ))
          : null}
      </VStack>
    </SurveyCard>
  );
}

export function ReviewScreen({ go }: { go: Go }) {
  const { draft, submitApplication, reloadBackendDraft, setGps } = useProject();
  const pageLoading = useMinimumLoading(true, 300);
  const [terms, setTerms] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const isBackendTask = Boolean(draft.backendApplicationId);

  useEffect(() => {
    if (!isBackendTask) return;
    void (async () => {
      setRefreshing(true);
      try {
        await reloadBackendDraft();
      } catch {
        /* keep local draft */
      } finally {
        setRefreshing(false);
      }
    })();
  }, [isBackendTask, reloadBackendDraft]);

  // Fetch live GPS + reverse-geocoded place when Review & Submit opens.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setFetchingLocation(true);
      setLocationError(null);
      try {
        const loc = await captureCurrentLocation(true);
        if (cancelled) return;
        if (!loc?.gps) {
          setLocationError('Could not read GPS. Enable location and pull to refresh.');
          return;
        }
        setGps(loc.gps, {
          displayName: loc.address.displayName,
          village: loc.address.village,
          taluk: loc.address.taluk,
          district: loc.address.district,
          state: loc.address.state,
          street: loc.address.street,
          name: loc.address.name,
          layoutName: loc.address.layoutName,
          area: loc.address.area,
          block: loc.address.block,
          postalCode: loc.address.postalCode,
          country: loc.address.country,
        });
      } catch {
        if (!cancelled) {
          setLocationError('Location fetch failed. Check GPS permission and try again.');
        }
      } finally {
        if (!cancelled) setFetchingLocation(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setGps]);

  const refreshLocation = async () => {
    setFetchingLocation(true);
    setLocationError(null);
    try {
      const loc = await captureCurrentLocation(false);
      if (!loc?.gps) {
        setLocationError('Could not read GPS. Enable location and try again.');
        return;
      }
      setGps(loc.gps, {
        displayName: loc.address.displayName,
        village: loc.address.village,
        taluk: loc.address.taluk,
        district: loc.address.district,
        state: loc.address.state,
        street: loc.address.street,
        name: loc.address.name,
        layoutName: loc.address.layoutName,
        area: loc.address.area,
        block: loc.address.block,
        postalCode: loc.address.postalCode,
        country: loc.address.country,
      });
    } catch {
      setLocationError('Location fetch failed. Check GPS permission and try again.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const items = useMemo(() => validateDraft(draft), [draft]);
  const summary = useMemo(() => validationSummary(items), [items]);

  const coords = draft.gps
    ? formatCoords(draft.gps.latitude, draft.gps.longitude).short
    : '';
  const latitudeLabel = draft.gps ? draft.gps.latitude.toFixed(6) : '';
  const longitudeLabel = draft.gps ? draft.gps.longitude.toFixed(6) : '';
  const locationDetails =
    draft.geoAddress?.displayName?.trim() ||
    [draft.geoAddress?.village, draft.geoAddress?.taluk, draft.geoAddress?.district, draft.geoAddress?.state]
      .filter(Boolean)
      .join(', ') ||
    '';
  const accuracyLabel =
    draft.gps?.accuracy != null && Number.isFinite(draft.gps.accuracy)
      ? `±${Math.round(draft.gps.accuracy)} m`
      : '';

  const locationRows = useMemo(
    () =>
      filterReviewRows([
        { label: 'Location', value: fetchingLocation ? 'Fetching…' : locationDetails },
        { label: 'Latitude', value: fetchingLocation ? 'Fetching…' : latitudeLabel },
        { label: 'Longitude', value: fetchingLocation ? 'Fetching…' : longitudeLabel },
        { label: 'GPS', value: fetchingLocation ? 'Fetching…' : coords },
        { label: 'Accuracy', value: fetchingLocation ? 'Fetching…' : accuracyLabel },
      ]),
    [
      fetchingLocation,
      locationDetails,
      latitudeLabel,
      longitudeLabel,
      coords,
      accuracyLabel,
    ],
  );

  const isResubmit = Boolean(draft.resubmitOfId);
  const canSubmit = terms && summary.allOk && !submitting;
  const reviewStatusBadge = useMemo(() => engineerReviewStatusBadge(draft), [draft]);

  const titleId =
    draft.applicationNumber?.trim() ||
    draft.projectName.trim() ||
    'Untitled project';
  const surveyLine = [
    draft.siteNo.trim() || draft.surveyNo.trim()
      ? `Site ${draft.siteNo.trim() || draft.surveyNo.trim()}`
      : null,
    draft.zoneCode.trim() ? `Zone ${draft.zoneCode.trim()}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const dimDisplay = (() => {
    const n = Number(draft.dimNorth);
    const s = Number(draft.dimSouth);
    const e = Number(draft.dimEast);
    const w = Number(draft.dimWest);
    if ([n, s, e, w].every((v) => Number.isFinite(v) && v > 0)) {
      return `${((n + s) / 2).toFixed(1)} × ${((e + w) / 2).toFixed(1)}`;
    }
    return draft.siteDimensionMaster.trim() || draft.dimensionArea.trim() || '—';
  })();

  const fullDimDisplay = (() => {
    const n = draft.dimNorth.trim();
    const s = draft.dimSouth.trim();
    const e = draft.dimEast.trim();
    const w = draft.dimWest.trim();
    if (n && s && e && w) return `${n} × ${e} × ${s} × ${w}`;
    return dimDisplay;
  })();

  const plotDimsReady = [draft.dimNorth, draft.dimSouth, draft.dimEast, draft.dimWest].every(
    (v) => Number(v) > 0,
  );

  const schedulesAround = useMemo(() => {
    const out: Record<Cardinal, string> = { N: '', S: '', E: '', W: '' };
    for (const k of REVIEW_CARDINALS) {
      out[k] = plotScheduleLabel(draft.directions[k], Boolean(draft.roadFlags?.[k]));
    }
    return out;
  }, [draft.directions, draft.roadFlags]);

  const reviewSections = useMemo(() => {
    if (isBackendTask) {
      return [
        {
          stepLabel: 'STEP 01',
          icon: Building2,
          title: 'Assigned site',
          subtitle: draft.createdByZcName.trim()
            ? `Assigned by ${draft.createdByZcName.trim()}`
            : 'ZC site particulars',
          iconBg: COLORS.primary,
          accent: 'blue' as ReviewAccent,
          rows: [
            { label: 'E-office no', value: draft.eOfficeNumber.trim() || '—' },
            { label: 'Application', value: draft.applicationNumber?.trim() || titleId || '—' },
            { label: 'Site no', value: draft.siteNo.trim() || draft.surveyNo.trim() || '—' },
            { label: 'Site type', value: draft.siteDimensionType || '—' },
            { label: 'ZC dimension', value: draft.siteDimensionMaster.trim() || '—' },
            { label: 'Zone', value: draft.zoneCode.trim() || '—' },
            { label: 'Address line 1', value: draft.addressLine1.trim() || '—' },
            { label: 'Address line 2', value: draft.addressLine2.trim() || '—' },
            { label: 'Block', value: draft.addressBlock.trim() || '—' },
            { label: 'City', value: draft.addressCity.trim() || '—' },
            { label: 'State', value: draft.addressState.trim() || '—' },
            { label: 'Pincode', value: draft.addressPincode.trim() || '—' },
            { label: 'Schedule north', value: draft.zcDirections.N.trim() || '—' },
            { label: 'Schedule south', value: draft.zcDirections.S.trim() || '—' },
            { label: 'Schedule west', value: draft.zcDirections.W.trim() || '—' },
            { label: 'Schedule east', value: draft.zcDirections.E.trim() || '—' },
            { label: 'ZC comments', value: draft.siteDimensionComment.trim() || '—' },
            { label: 'Created by ZC', value: draft.createdByZcName.trim() || '—' },
            {
              label: 'Assigned on',
              value: formatApplicationDateTime(draft.backendAssignedAt) || '—',
            },
            { label: 'Assigned engineer', value: draft.assignedEngineerName.trim() || '—' },
          ],
        },
        {
          stepLabel: 'STEP 02',
          icon: Compass,
          title: 'Compass & schedule',
          subtitle: 'Facing, GPS, occupancy & schedules',
          iconBg: COLORS.primary,
          accent: 'green' as ReviewAccent,
          rows: filterReviewRows([
            { label: 'Compass', value: draft.compassReading.trim() },
            {
              label: 'Occupancy',
              value:
                draft.occupancy === 'Occupied'
                  ? `Occupied · ${draft.occupancyReason.trim() || '—'}`
                  : draft.occupancy || '',
            },
            ...locationRows,
          ]),
          showSchedules: true,
        },
        {
          stepLabel: 'STEP 03',
          icon: Ruler,
          title: 'Dimensions',
          subtitle: 'Site measurements',
          iconBg: '#4F46E5',
          accent: 'purple' as ReviewAccent,
          rows: filterReviewRows([
            { label: 'Dim North', value: draft.dimNorth.trim() },
            { label: 'Dim South', value: draft.dimSouth.trim() },
            { label: 'Dim East', value: draft.dimEast.trim() },
            { label: 'Dim West', value: draft.dimWest.trim() },
          ]),
          plot: plotDimsReady,
        },
        {
          stepLabel: 'STEP 04',
          icon: Camera,
          title: 'Media & comments',
          subtitle: 'Selfie, photos, comments & video',
          iconBg: '#DB2777',
          accent: 'sky' as ReviewAccent,
          rows: filterReviewRows([
            { label: 'Engineer comments', value: draft.engineerComments.trim() },
          ]),
          showMediaPreview: true,
        },
      ];
    }

    return [
      {
        stepLabel: 'STEP 01',
        icon: Building2,
        title: 'Project details',
        subtitle: 'Work name & site particulars',
        iconBg: COLORS.primary,
        rows: filterReviewRows([
          { label: 'Project', value: draft.projectName.trim() },
          { label: 'Survey no', value: draft.surveyNo.trim() },
          { label: 'Khatedar', value: draft.khatedarName.trim() },
          { label: 'Plot no', value: draft.plotNo.trim() },
          { label: 'Village', value: draft.village.trim() },
          { label: 'District', value: draft.district.trim() },
        ]),
      },
      {
        stepLabel: 'STEP 02',
        icon: Compass,
        title: 'Compass & boundaries',
        subtitle: 'Check Bandi & boundary directions',
        iconBg: COLORS.primary,
        rows: filterReviewRows([
          { label: 'Compass', value: draft.compassReading.trim() },
          ...locationRows,
          { label: 'North boundary', value: draft.directions.N.trim() },
          { label: 'South boundary', value: draft.directions.S.trim() },
          { label: 'East boundary', value: draft.directions.E.trim() },
          { label: 'West boundary', value: draft.directions.W.trim() },
          {
            label: 'Approach road',
            value: [draft.approachRoadName.trim(), draft.approachRoadWidth.trim()]
              .filter(Boolean)
              .join(' · '),
          },
          { label: 'Remarks', value: draft.approachNotes.trim() },
        ]),
      },
      {
        stepLabel: 'STEP 03',
        icon: Camera,
        title: 'Media',
        subtitle: 'Photos & walkthrough video',
        iconBg: '#DB2777',
        rows: [],
        showMediaPreview: true,
      },
    ];
  }, [
    draft,
    titleId,
    locationRows,
    fullDimDisplay,
    isBackendTask,
    plotDimsReady,
  ]);

  const onConfirmSubmit = async () => {
    if (!summary.allOk) {
      showAppDialog({
        variant: 'warning',
        title: 'Incomplete',
        message: 'Fix validation issues before submitting.',
        hideCancel: true,
        confirmLabel: 'OK',
      });
      setConfirm(false);
      go('validate');
      return;
    }

    setConfirm(false);
    setSubmitting(true);
    try {
      const result = await submitApplication();
      if (!result) {
        showAppDialog({
          variant: 'warning',
          title: 'Submit blocked',
          message: 'Checklist is incomplete. Return to Validate.',
          hideCancel: true,
          confirmLabel: 'OK',
        });
        go('validate');
        return;
      }
      go('success');
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Submit failed. Check network and try again.';
      showAppDialog({
        variant: 'error',
        title: 'Submit failed',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const plotDiagram = plotDimsReady ? (
    <BoundariesDiagram
      embedded={isBackendTask}
      north={Number(draft.dimNorth) || 0}
      south={Number(draft.dimSouth) || 0}
      east={Number(draft.dimEast) || 0}
      west={Number(draft.dimWest) || 0}
      odd={draft.siteDimensionType === 'Odd'}
      siteNo={draft.siteNo.trim() || draft.surveyNo.trim() || null}
      scheduleNorth={schedulesAround.N || null}
      scheduleSouth={schedulesAround.S || null}
      scheduleEast={schedulesAround.E || null}
      scheduleWest={schedulesAround.W || null}
      roadNorth={Boolean(draft.roadFlags?.N)}
      roadSouth={Boolean(draft.roadFlags?.S)}
      roadEast={Boolean(draft.roadFlags?.E)}
      roadWest={Boolean(draft.roadFlags?.W)}
    />
  ) : null;

  const reviewVariant: 'default' | 'premium' = isBackendTask ? 'premium' : 'default';
  const reviewStepTotal = isBackendTask ? 4 : 3;

  return (
    <SurveyScaffold
      title={TERMS.workflow.reviewSubmit}
      subtitle={TERMS.workflow.reviewSubmitSubtitle}
      onBack={() => go('validate')}
      showSteps={false}
      surface={isBackendTask ? 'premium' : 'default'}
      badge={summary.allOk ? 'Ready to submit' : 'Incomplete'}
      loading={pageLoading || submitting}
      hero={
        isBackendTask ? (
          <CreateApplicationHeader
            onBack={() => go('validate')}
            zone={draft.zoneCode}
            title={TERMS.workflow.reviewSubmit}
            subtitle={TERMS.workflow.reviewSubmitSubtitle}
          />
        ) : undefined
      }
      footer={
        <VStack space="sm" className="items-stretch">
          <Pressable
            disabled={!canSubmit}
            onPress={() => setConfirm(true)}
            className="w-full overflow-hidden active:opacity-90"
            style={{
              height: 44,
              borderRadius: 12,
              opacity: canSubmit ? 1 : 0.45,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: canSubmit ? 0.2 : 0,
              shadowRadius: 8,
              elevation: canSubmit ? 3 : 0,
            }}
          >
            <LinearGradient
              colors={gradientStops(GRADIENT_PRIMARY)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingHorizontal: 14,
              }}
            >
              {submitting ? (
                <ButtonLoader color="#fff" />
              ) : (
                <Send size={16} color="#fff" strokeWidth={2.4} />
              )}
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 15,
                  color: COLORS.white,
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                {submitting
                  ? 'Submitting…'
                  : isResubmit
                    ? 'Resubmit Report'
                    : 'Submit Report'}
              </Text>
            </LinearGradient>
          </Pressable>
          <HStack className="items-center justify-center gap-1.5">
            <Lock size={11} color="#64748B" strokeWidth={2.3} />
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 11,
                color: '#64748B',
              }}
            >
              Your data is secure and encrypted
            </Text>
          </HStack>
        </VStack>
      }
      go={go}
    >
      {isBackendTask ? (
        <Box style={{ paddingHorizontal: SPACE.gutter }}>
          <Box
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 20,
              borderWidth: 1.75,
              borderColor: hexAlpha('#1A368E', 0.38),
              overflow: 'hidden',
              shadowColor: '#1A368E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.07,
              shadowRadius: 12,
              elevation: 3,
              padding: 12,
              gap: 8,
            }}
          >
            <HStack className="items-center" style={{ gap: 10 }}>
              <Box
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: '#E8F0FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardList size={16} color="#1A368E" strokeWidth={2.4} />
              </Box>
              <VStack style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 16,
                    color: '#0F172A',
                    letterSpacing: -0.2,
                  }}
                  numberOfLines={1}
                >
                  {titleId}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.semibold,
                    fontSize: 12,
                    color: '#475569',
                    lineHeight: 15,
                  }}
                  numberOfLines={2}
                >
                  {refreshing
                    ? 'Refreshing from server…'
                    : surveyLine || 'Final check before CAO review'}
                </Text>
              </VStack>
              <PremiumPillBadge
                label={reviewStatusBadge.label}
                tone={
                  reviewStatusBadge.tone === 'success'
                    ? 'green'
                    : reviewStatusBadge.tone === 'warning'
                      ? 'orange'
                      : 'blue'
                }
              />
            </HStack>
            <HStack style={{ flexWrap: 'wrap', gap: 8 }}>
              {draft.siteNo.trim() || draft.surveyNo.trim() ? (
                <PremiumPillBadge
                  label={`Site ${draft.siteNo.trim() || draft.surveyNo.trim()}`}
                />
              ) : null}
              {draft.zoneCode.trim() ? (
                <PremiumPillBadge label={`Zone ${draft.zoneCode.trim()}`} />
              ) : null}
              <PremiumPillBadge
                label={summary.allOk ? 'Validation passed' : `${summary.failed.length} to fix`}
                tone={summary.allOk ? 'green' : 'orange'}
              />
            </HStack>
          </Box>
        </Box>
      ) : (
        <SurveyCard>
          <WorkspaceHeader
            icon={ClipboardList}
            title={titleId}
            subtitle={
              refreshing
                ? 'Refreshing from server…'
                : surveyLine || 'Final check before CAO review'
            }
            badge={reviewStatusBadge.label}
            iconBg={COLORS.primary}
          />
        </SurveyCard>
      )}

      <Box
        style={{
          marginHorizontal: isBackendTask ? SPACE.gutter : 16,
          borderRadius: isBackendTask ? 14 : 14,
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: locationError
            ? '#FEF2F2'
            : draft.gps
              ? '#ECFDF5'
              : isBackendTask
                ? BLUE_SOFT
                : '#EFF6FF',
          borderWidth: 1.5,
          borderColor: locationError
            ? '#FECACA'
            : draft.gps
              ? '#A7F3D0'
              : isBackendTask
                ? BLUE_BORDER
                : '#BFDBFE',
        }}
      >
        <HStack className="items-center justify-between" style={{ gap: 10 }}>
          <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 14,
                color: locationError ? '#B91C1C' : draft.gps ? '#047857' : '#1A368E',
              }}
            >
              {fetchingLocation
                ? 'Fetching location…'
                : locationError
                  ? 'Location unavailable'
                  : draft.gps
                    ? 'Location captured'
                    : 'Waiting for GPS'}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.semibold,
                fontSize: 12,
                lineHeight: 16,
                color: locationError ? '#991B1B' : '#475569',
              }}
              numberOfLines={2}
            >
              {fetchingLocation
                ? 'Reading latitude, longitude and place details'
                : locationError
                  ? locationError
                  : draft.gps
                    ? `${latitudeLabel}, ${longitudeLabel}${locationDetails ? ` · ${locationDetails}` : ''}`
                    : 'Enable GPS to continue'}
            </Text>
          </VStack>
          <Pressable
            onPress={() => void refreshLocation()}
            disabled={fetchingLocation}
            className="active:opacity-70"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 999,
              backgroundColor: COLORS.white,
              borderWidth: 1.5,
              borderColor: BLUE_BORDER,
              opacity: fetchingLocation ? 0.6 : 1,
            }}
          >
            {fetchingLocation ? (
              <ActivityIndicator size="small" color="#1A368E" />
            ) : (
              <RefreshCw size={14} color="#1A368E" strokeWidth={2.4} />
            )}
            <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#1A368E' }}>
              Refresh
            </Text>
          </Pressable>
        </HStack>
      </Box>

      {reviewSections.map((section) => {
        const plot = 'plot' in section && section.plot;
        const showSchedules = 'showSchedules' in section && section.showSchedules;
        const showMediaPreview = 'showMediaPreview' in section && section.showMediaPreview;

        let footer: ReactNode = null;
        if (plot) footer = plotDiagram;
        if (showSchedules) footer = <ReviewSchedulesPanel variant={reviewVariant} />;
        if (showMediaPreview) footer = <ReviewMediaPanel variant={reviewVariant} />;

        return (
          <ReviewSectionCard
            key={section.stepLabel}
            stepLabel={section.stepLabel}
            icon={section.icon}
            title={section.title}
            subtitle={section.subtitle}
            iconBg={section.iconBg}
            rows={section.rows}
            footer={footer}
            variant={reviewVariant}
            stepTotal={reviewStepTotal}
            accent={'accent' in section ? section.accent : 'blue'}
            rowsAfterFooter={Boolean(showMediaPreview)}
          />
        );
      })}

      {!summary.allOk ? (
        <Pressable
          onPress={() => go('validate')}
          className={isBackendTask ? undefined : 'mx-4'}
          style={{
            marginHorizontal: isBackendTask ? SPACE.gutter : undefined,
            backgroundColor: COLORS.white,
            borderRadius: 14,
            padding: 10,
            borderWidth: 1.5,
            borderColor: '#FDBA74',
          }}
        >
          <HStack className="items-center" style={{ gap: 10 }}>
            <Box
              className="items-center justify-center"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#FFF7ED',
              }}
            >
              <AlertTriangle size={16} color="#B45309" strokeWidth={2.3} />
            </Box>
            <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 14,
                  color: '#92400E',
                }}
              >
                {summary.failed.length} checklist item
                {summary.failed.length === 1 ? '' : 's'} incomplete
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 12,
                  color: '#A16207',
                }}
              >
                Tap to return to Validate and fix
              </Text>
            </VStack>
            <ChevronRight size={18} color="#B45309" />
          </HStack>
        </Pressable>
      ) : (
        <Box
          className={isBackendTask ? undefined : 'mx-4'}
          style={{
            marginHorizontal: isBackendTask ? SPACE.gutter : undefined,
            backgroundColor: COLORS.white,
            borderRadius: 14,
            padding: 10,
            borderWidth: 1.5,
            borderColor: '#A7F3D0',
          }}
        >
          <HStack className="items-center" style={{ gap: 10 }}>
            <Box
              className="items-center justify-center"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#D1FAE5',
              }}
            >
              <CheckCircle2 size={16} color="#059669" strokeWidth={2.3} />
            </Box>
            <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 14,
                  color: '#065F46',
                }}
              >
                Validation complete
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 12,
                  color: '#047857',
                }}
              >
                Ready for CAO submission
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* Certification */}
      <Pressable
        onPress={() => setTerms((t) => !t)}
        className={isBackendTask ? undefined : 'mx-4'}
        style={{
          marginHorizontal: isBackendTask ? SPACE.gutter : undefined,
          backgroundColor: COLORS.white,
          borderRadius: 14,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderWidth: 1.75,
          borderColor: terms ? hexAlpha('#15803D', 0.45) : BLUE_BORDER,
        }}
      >
        <HStack className="items-center" style={{ gap: 10 }}>
          <Box
            className="items-center justify-center"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: terms ? '#D1FAE5' : '#F0FDF4',
            }}
          >
            <ShieldCheck
              size={16}
              color={terms ? '#059669' : '#34D399'}
              strokeWidth={2.2}
            />
          </Box>
          <Box
            className="items-center justify-center"
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: terms ? '#10B981' : '#CBD5E1',
              backgroundColor: terms ? '#10B981' : '#FFFFFF',
            }}
          >
            {terms ? <Check size={13} color="#fff" strokeWidth={3.2} /> : null}
          </Box>
          <Text
            className="flex-1"
            style={{
              fontFamily: FONTS.medium,
              fontSize: 13,
              lineHeight: 19,
              color: '#0F172A',
            }}
          >
            I hereby certify that all information provided is true, accurate, and was captured
            on site. 
            {/* <Text style={{ fontFamily: FONTS.bold, color: '#059669' }}>CDRMS-2019</Text>. */}
          </Text>
        </HStack>
      </Pressable>

      <AppSheet
        open={confirm}
        onClose={() => !submitting && setConfirm(false)}
        title={isResubmit ? 'Resubmit report?' : 'Submit report?'}
      >
        <VStack style={{ gap: 14 }}>
          <Box
            style={{
              borderRadius: 16,
              backgroundColor: '#ECFDF5',
              borderWidth: 1.5,
              borderColor: '#A7F3D0',
              padding: 14,
            }}
          >
            <HStack className="items-start" style={{ gap: 12 }}>
              <Box
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#D1FAE5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={20} color="#047857" strokeWidth={2.4} />
              </Box>
              <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: '#0F172A' }}>
                  {isResubmit ? 'Confirm resubmission' : 'Ready to send to CAO'}
                </Text>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: '#475569', lineHeight: 18 }}>
                  Application{' '}
                  <Text style={{ fontFamily: FONTS.bold, color: '#1A368E' }}>{titleId}</Text>
                  {isResubmit
                    ? ' will be resubmitted for review.'
                    : ' will be submitted for CAO verification.'}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {submitting ? (
            <ScreenLoader text="Submitting report…" minHeight={100} />
          ) : (
            <VStack style={{ gap: 8 }}>
              <AppBtn onPress={onConfirmSubmit} icon={ShieldCheck}>
                {isResubmit ? 'Confirm & Resubmit' : 'Confirm & Submit'}
              </AppBtn>
              <AppBtn variant="outline" onPress={() => setConfirm(false)}>
                Cancel
              </AppBtn>
            </VStack>
          )}
        </VStack>
      </AppSheet>
    </SurveyScaffold>
  );
}

export function SuccessScreen({ go }: { go: Go }) {
  const { lastSubmitted, draft, startNewProject, openApplication } = useProject();
  const appId = lastSubmitted?.applicationId || draft.applicationId || draft.id;
  const submittedAt = lastSubmitted?.submittedAt || draft.submittedAt;
  const siteNo = draft.siteNo?.trim() || lastSubmitted?.surveyNo?.trim() || '—';
  const zone = draft.zoneCode?.trim() || '—';
  const backendId =
    draft.backendApplicationId || lastSubmitted?.backendApplicationId || null;

  const viewSubmittedApplication = () => {
    if (backendId) {
      setSelectedOfficeAppId(backendId);
      go('engineer_detail');
      return;
    }
    const localId = lastSubmitted?.id || draft.id;
    if (localId) {
      openApplication(localId);
      go('details');
      return;
    }
    go('history');
  };

  const submittedLabel = submittedAt
    ? new Date(submittedAt).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  return (
    <ScreenShell>
      <LinearGradient
        colors={['#071E4A', '#123A8C', '#1A56DB']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}
      >
        <Box
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.22,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <VStack className="items-center" style={{ gap: 10 }}>
            <Box
              style={{
                width: 92,
                height: 92,
                borderRadius: 999,
                backgroundColor: '#ECFDF5',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 6,
                borderColor: '#D1FAE5',
              }}
            >
              <Box
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  backgroundColor: '#10B981',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={34} color="#FFFFFF" strokeWidth={2.6} />
              </Box>
            </Box>

            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 24,
                color: '#0F172A',
                textAlign: 'center',
                letterSpacing: -0.3,
                marginTop: 4,
              }}
            >
              Application Submitted
            </Text>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 13,
                color: '#64748B',
                textAlign: 'center',
                lineHeight: 18,
                paddingHorizontal: 8,
              }}
            >
              Your site report was sent successfully and is now with CAO for verification.
            </Text>

            <Box
              style={{
                marginTop: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: '#EEF4FF',
                borderWidth: 1.5,
                borderColor: 'rgba(26,86,219,0.25)',
              }}
            >
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: '#1A368E' }}>
                {appId}
              </Text>
            </Box>
          </VStack>

          <VStack
            style={{
              marginTop: 18,
              borderRadius: 18,
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: 'rgba(15,23,42,0.08)',
              padding: 14,
              gap: 12,
            }}
          >
            <HStack className="items-center justify-between">
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: '#64748B' }}>
                Status
              </Text>
              <StatusChip status="Submitted" />
            </HStack>
            <HStack className="items-center justify-between">
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: '#64748B' }}>
                Site no
              </Text>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: '#0F172A' }}>
                {siteNo}
              </Text>
            </HStack>
            <HStack className="items-center justify-between">
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: '#64748B' }}>
                Zone
              </Text>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: '#0F172A' }}>
                {zone}
              </Text>
            </HStack>
            <HStack className="items-center justify-between">
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: '#64748B' }}>
                Submitted
              </Text>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: '#0F172A' }}>
                {submittedLabel}
              </Text>
            </HStack>
          </VStack>

          <VStack style={{ marginTop: 18, gap: 10 }}>
            <Pressable
              onPress={() => {
                startNewProject();
                go('dashboard');
              }}
              className="active:opacity-90 overflow-hidden"
              style={{
                borderRadius: 999,
                shadowColor: '#1A56DB',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <LinearGradient
                colors={gradientStops(GRADIENT_PRIMARY)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' }}>
                  Back to Dashboard
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={viewSubmittedApplication}
              className="active:opacity-80"
              style={{
                height: 48,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: 'rgba(26,86,219,0.35)',
                backgroundColor: COLORS.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#1A368E' }}>
                View Application
              </Text>
            </Pressable>
          </VStack>
        </Box>
      </LinearGradient>
    </ScreenShell>
  );
}

export function ReturnedScreen({ go }: { go: Go }) {
  const { loadApplicationForEdit, openApplication } = useProject();
  const returnedId = 'CDR-2026-0831';
  const fieldsToFix = [
    { label: 'North Directional Photo', icon: Camera, screen: 'surroundings' as const },
    { label: 'Approach Road Width', icon: Ruler, screen: 'project' as const },
  ];
  const timeline = [
    { label: 'Submitted', date: '16 Jul', done: true },
    { label: 'Under Review', date: '18 Jul', done: true },
    { label: 'Returned with Remarks', date: '19 Jul', done: true, warn: true },
    { label: 'Awaiting Resubmission', date: '—', done: false },
  ];

  const startFix = (screen: 'project' | 'surroundings' = 'project') => {
    const ok = loadApplicationForEdit(returnedId);
    if (ok) go(screen);
  };

  return (
    <ScreenShell>
      <AppHeader
        title="Returned Application"
        subtitle={returnedId}
        onBack={() => go('history')}
        go={go}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md" className="px-5 pt-5">
          <AppCard className="bg-warning/10 border border-warning/30">
            <HStack className="items-start gap-3">
              <IconBox className="bg-warning/25" size="lg">
                <AlertTriangle size={20} color="#B45309" />
              </IconBox>
              <VStack className="flex-1">
                <Text className="font-bold text-foreground">{TERMS.workflow.returnedByCao}</Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Kindly address the remarks below and resubmit.
                </Text>
              </VStack>
            </HStack>
          </AppCard>

          <AppCard>
            <Text className="text-xs uppercase font-semibold text-muted-foreground mb-2">
              {TERMS.sections.caoRemarks}
            </Text>
            <Box className="border-l-4 border-warning pl-3">
              <Text className="text-sm text-foreground">
                "North boundary photograph is unclear. Please recapture with landmark visible. Also
                update road-width measurement — recorded value does not match survey record."
              </Text>
            </Box>
            <Text className="mt-2 text-[11px] text-muted-foreground">
              — A. Rao, CAO Karnataka · Bengaluru Rural · 19 Jul 2026
            </Text>
          </AppCard>

          <AppCard>
            <Text className="text-xs uppercase font-semibold text-muted-foreground mb-2">
              Fields to Fix
            </Text>
            <VStack space="sm">
              {fieldsToFix.map((f) => {
                const Icon = f.icon;
                return (
                  <Pressable
                    key={f.label}
                    onPress={() => startFix(f.screen)}
                    className="flex-row items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20"
                  >
                    <Box className="h-9 w-9 rounded-lg bg-destructive/15 items-center justify-center">
                      <Icon size={16} color={COLORS.destructive} />
                    </Box>
                    <Text className="flex-1 font-semibold text-sm text-foreground">{f.label}</Text>
                    <ChevronRight size={16} color={COLORS.destructive} />
                  </Pressable>
                );
              })}
            </VStack>
          </AppCard>

          <AppCard>
            <Text className="text-xs uppercase font-semibold text-muted-foreground mb-3">
              Progress Timeline
            </Text>
            <VStack>
              {timeline.map((t, i) => (
                <HStack key={t.label} className="items-start gap-3">
                  <VStack className="items-center">
                    <Box
                      className={`h-4 w-4 rounded-full ${t.warn
                        ? 'bg-warning'
                        : t.done
                          ? 'bg-success'
                          : 'bg-muted border-2 border-border'
                        }`}
                    />
                    {i < timeline.length - 1 ? (
                      <Box className="w-0.5 flex-1 min-h-6 bg-border" />
                    ) : null}
                  </VStack>
                  <VStack className="pb-3">
                    <Text className="text-sm font-semibold text-foreground">{t.label}</Text>
                    <Text className="text-[11px] text-muted-foreground">{t.date}</Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </AppCard>

          <HStack space="md">
            <Box className="flex-1">
              <AppBtn
                variant="outline"
                onPress={() => {
                  openApplication(returnedId);
                  go('details');
                }}
                icon={Edit3}
              >
                View details
              </AppBtn>
            </Box>
            <Box className="flex-1">
              <AppBtn onPress={() => startFix('project')} icon={Send}>
                Fix & resubmit
              </AppBtn>
            </Box>
          </HStack>
        </VStack>
      </ScrollView>
    </ScreenShell>
  );
}

export { ErrorScreen } from '@/src/errors/ErrorScreen';
