import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Edit3,
  FileText,
  Home,
  Lock,
  MapPin,
  Play,
  RefreshCw,
  Route,
  Ruler,
  Send,
  ShieldCheck,
  Sparkles,
  WifiOff,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
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
  IconBox,
  ScreenShell,
  StatusChip,
} from '@/src/cdrms/components/primitives';
import {
  SurveyCard,
  SurveyScaffold,
  WorkspaceHeader,
} from '@/src/cdrms/components/SurveyLayout';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { formatCoords } from '@/src/cdrms/project/types';
import { validateDraft, validationSummary } from '@/src/cdrms/project/validation';
import { COLORS, FONTS, GRADIENT_SUBTLE, SPACE } from '@/src/cdrms/theme';
import { TERMS } from '@/src/cdrms/terminology';
import type { Go } from '@/src/cdrms/types';

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
  const items = useMemo(() => validateDraft(draft), [draft]);
  const summary = useMemo(() => validationSummary(items), [items]);

  return (
    <SurveyScaffold
      title={TERMS.workflow.validate}
      subtitle={TERMS.workflow.validateSubtitle}
      onBack={() => go('video')}
      showSteps={false}
      badge={summary.allOk ? 'Ready' : `${summary.failed.length} to fix`}
      footer={
        <AppBtn
          disabled={!summary.allOk}
          onPress={() => go('review')}
          icon={ArrowRight}
        >
          {summary.allOk ? 'Continue to Review' : 'Fix issues to continue'}
        </AppBtn>
      }
          go={go}
    >
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
    </SurveyScaffold>
  );
}

export function ReviewScreen({ go }: { go: Go }) {
  const { draft, submitApplication } = useProject();
  const [terms, setTerms] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const items = useMemo(() => validateDraft(draft), [draft]);
  const summary = useMemo(() => validationSummary(items), [items]);

  const dirsFilled = (['N', 'S', 'E', 'W'] as const).filter((k) =>
    draft.directions[k].trim() || draft.surroundingPhotos[k]
  ).length;
  const coords = draft.gps
    ? formatCoords(draft.gps.latitude, draft.gps.longitude).short
    : 'No GPS';

  const isResubmit = Boolean(draft.resubmitOfId);
  const canSubmit = terms && summary.allOk && !submitting;
  const photoCount = draft.photos.length;
  const videoCount = draft.video ? 1 : 0;
  const isBackendTask = Boolean(draft.backendApplicationId);

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

  const roadDisplay = (() => {
    const sides = (['N', 'S', 'E', 'W'] as const).filter((k) => draft.roadFlags?.[k]);
    if (sides.length) return `Road · ${sides.join(', ')}`;
    return draft.roadType.trim() || 'No road flagged';
  })();

  const onConfirmSubmit = async () => {
    if (!summary.allOk) {
      Alert.alert('Incomplete', 'Fix validation issues before submitting.');
      setConfirm(false);
      go('validate');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitApplication();
      setConfirm(false);
      if (!result) {
        Alert.alert('Submit blocked', 'Checklist is incomplete. Return to Validate.');
        go('validate');
        return;
      }
      go('success');
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Submit failed. Check network and try again.';
      Alert.alert('Submit failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const infoTiles = [
    {
      label: 'Village',
      val: draft.village.trim() || draft.addressArea.trim() || '—',
      icon: Home,
      bg: '#EFF6FF',
      fg: '#2563EB',
    },
    {
      label: 'Dimension',
      val: dimDisplay,
      icon: Ruler,
      bg: '#EEF2FF',
      fg: '#4F46E5',
    },
    {
      label: 'Location',
      val: coords,
      icon: MapPin,
      bg: '#ECFDF5',
      fg: '#059669',
    },
    {
      label: 'Road',
      val: roadDisplay,
      icon: Route,
      bg: '#FFF7ED',
      fg: '#EA580C',
    },
  ];

  const mediaCards = [
    {
      key: 'photos',
      label: 'Photos',
      value: String(photoCount),
      icon: Camera,
      color: '#2563EB',
      soft: '#EFF6FF',
      bar: '#2563EB',
      progress: Math.min(photoCount / Math.max(isBackendTask ? 1 : 3, 1), 1),
      onPress: () => go('photos'),
    },
    {
      key: 'video',
      label: 'Video',
      value: String(videoCount),
      icon: Play,
      color: '#DB2777',
      soft: '#FDF2F8',
      bar: '#EC4899',
      progress: videoCount >= 1 ? 1 : 0,
      onPress: () => go('video'),
    },
    {
      key: 'directions',
      label: 'Schedules',
      value: `${dirsFilled}/4`,
      icon: Compass,
      color: '#0D9488',
      soft: '#F0FDFA',
      bar: '#14B8A6',
      progress: dirsFilled / 4,
      onPress: () => go('bandi'),
    },
  ];

  return (
    <SurveyScaffold
      title={TERMS.workflow.reviewSubmit}
      subtitle={TERMS.workflow.reviewSubmitSubtitle}
      onBack={() => go('validate')}
      showSteps={false}
      badge={summary.allOk ? 'Ready to submit' : 'Incomplete'}
      footer={
        <VStack space="sm" className="items-stretch">
          <Pressable
            disabled={!canSubmit}
            onPress={() => setConfirm(true)}
            className="w-full overflow-hidden active:opacity-90"
            style={{
              height: 54,
              borderRadius: 16,
              opacity: canSubmit ? 1 : 0.48,
              shadowColor: '#1D4ED8',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: canSubmit ? 0.28 : 0,
              shadowRadius: 14,
              elevation: canSubmit ? 5 : 0,
            }}
          >
            <LinearGradient
              colors={['#1E3A8A', '#2563EB', '#3B82F6']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 18,
              }}
            >
              <HStack className="items-center gap-2.5">
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Box
                    className="items-center justify-center rounded-xl"
                    style={{
                      width: 34,
                      height: 34,
                      backgroundColor: 'rgba(255,255,255,0.18)',
                    }}
                  >
                    <Send size={16} color="#fff" strokeWidth={2.4} />
                  </Box>
                )}
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 15,
                    color: '#FFFFFF',
                    letterSpacing: 0.2,
                  }}
                >
                  {submitting
                    ? 'Submitting…'
                    : isResubmit
                      ? 'Resubmit Application'
                      : 'Submit Application'}
                </Text>
              </HStack>
              <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
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
      {/* Project summary */}
      <SurveyCard>
        <WorkspaceHeader
          icon={ClipboardList}
          title="Project summary"
          subtitle={
            draft.createdByZcName.trim()
              ? `Assigned by ${draft.createdByZcName.trim()}`
              : 'Final check before CAO review'
          }
          stepLabel={draft.status === 'submitted' ? 'SUBMITTED' : 'DRAFT'}
          iconBg={COLORS.primary}
        />

        <VStack
          style={{
            paddingHorizontal: SPACE[4],
            paddingBottom: SPACE[4],
            gap: SPACE[3],
          }}
        >
          <HStack className="items-start" style={{ gap: 12 }}>
            {draft.photos[0]?.uri ? (
              <Box
                className="overflow-hidden"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <ApiMediaImage
                  uri={draft.photos[0].uri}
                  style={{ width: 64, height: 64 }}
                  resizeMode="cover"
                />
              </Box>
            ) : (
              <Box
                className="items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Camera size={22} color={COLORS.primary} strokeWidth={2.2} />
              </Box>
            )}
            <VStack className="flex-1 min-w-0" style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 18,
                  color: COLORS.ink,
                  lineHeight: 24,
                }}
                numberOfLines={2}
              >
                {titleId}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  color: COLORS.ink,
                }}
                numberOfLines={1}
              >
                {surveyLine || 'Field survey ready for submission'}
              </Text>
              <HStack className="items-center" style={{ gap: 6, marginTop: 2 }}>
                <Box
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor:
                      draft.occupancy === 'Occupied' ? '#FEF3C7' : '#DCFCE7',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 10,
                      color:
                        draft.occupancy === 'Occupied' ? '#B45309' : '#15803D',
                    }}
                  >
                    {draft.occupancy || 'Empty'}
                  </Text>
                </Box>
                {draft.compassReading.trim() ? (
                  <Box
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 999,
                      backgroundColor: '#EFF6FF',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 10,
                        color: COLORS.primary,
                      }}
                    >
                      {draft.compassReading.trim()}
                    </Text>
                  </Box>
                ) : null}
              </HStack>
            </VStack>
          </HStack>

          <Box
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
              overflow: 'hidden',
              backgroundColor: COLORS.white,
            }}
          >
            <Box className="flex-row" style={{ borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              {infoTiles.slice(0, 2).map((item, i) => {
                const Icon = item.icon;
                return (
                  <HStack
                    key={item.label}
                    className="items-center flex-1"
                    style={{
                      gap: 10,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRightWidth: i === 0 ? 1 : 0,
                      borderRightColor: COLORS.border,
                    }}
                  >
                    <Box
                      className="items-center justify-center"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: item.bg,
                      }}
                    >
                      <Icon size={15} color={item.fg} strokeWidth={2.3} />
                    </Box>
                    <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.bold,
                          fontSize: 10,
                          color: COLORS.slate,
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.bold,
                          fontSize: 13,
                          color: COLORS.ink,
                        }}
                        numberOfLines={1}
                      >
                        {item.val}
                      </Text>
                    </VStack>
                  </HStack>
                );
              })}
            </Box>
            <Box className="flex-row">
              {infoTiles.slice(2, 4).map((item, i) => {
                const Icon = item.icon;
                return (
                  <HStack
                    key={item.label}
                    className="items-center flex-1"
                    style={{
                      gap: 10,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRightWidth: i === 0 ? 1 : 0,
                      borderRightColor: COLORS.border,
                    }}
                  >
                    <Box
                      className="items-center justify-center"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: item.bg,
                      }}
                    >
                      <Icon size={15} color={item.fg} strokeWidth={2.3} />
                    </Box>
                    <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.bold,
                          fontSize: 10,
                          color: COLORS.slate,
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.bold,
                          fontSize: 13,
                          color: COLORS.ink,
                        }}
                        numberOfLines={1}
                      >
                        {item.val}
                      </Text>
                    </VStack>
                  </HStack>
                );
              })}
            </Box>
          </Box>
        </VStack>
      </SurveyCard>

      {/* Capture readiness */}
      <HStack className="mx-4" style={{ gap: 10 }}>
        {mediaCards.map((m) => {
          const Icon = m.icon;
          const fillPct = Math.min(Math.max(m.progress, 0), 1) * 100;
          return (
            <Pressable
              key={m.key}
              onPress={m.onPress}
              className="flex-1 active:opacity-90"
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                overflow: 'hidden',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <VStack className="items-center" style={{ paddingTop: 14, paddingBottom: 12, gap: 4 }}>
                <Box
                  className="items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: m.soft,
                  }}
                >
                  <Icon size={17} color={m.color} strokeWidth={2.3} />
                </Box>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 22,
                    color: m.color,
                    lineHeight: 26,
                  }}
                >
                  {m.value}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.semibold,
                    fontSize: 11,
                    color: COLORS.ink,
                  }}
                >
                  {m.label}
                </Text>
              </VStack>
              <Box style={{ height: 3, backgroundColor: '#E2E8F0' }}>
                <Box
                  style={{
                    height: 3,
                    width: `${fillPct}%`,
                    backgroundColor: m.bar,
                  }}
                />
              </Box>
            </Pressable>
          );
        })}
      </HStack>

      {!summary.allOk ? (
        <Pressable
          onPress={() => go('validate')}
          className="mx-4 active:opacity-90"
          style={{
            backgroundColor: '#FFFBEB',
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: '#FCD34D',
          }}
        >
          <HStack className="items-center" style={{ gap: 12 }}>
            <Box
              className="items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#FEF3C7',
              }}
            >
              <AlertTriangle size={17} color="#B45309" strokeWidth={2.3} />
            </Box>
            <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 13,
                  color: '#92400E',
                }}
              >
                {summary.failed.length} checklist item
                {summary.failed.length === 1 ? '' : 's'} incomplete
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 11,
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
          className="mx-4"
          style={{
            backgroundColor: '#ECFDF5',
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: '#A7F3D0',
          }}
        >
          <HStack className="items-center" style={{ gap: 12 }}>
            <Box
              className="items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#D1FAE5',
              }}
            >
              <CheckCircle2 size={18} color="#059669" strokeWidth={2.3} />
            </Box>
            <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 13,
                  color: '#065F46',
                }}
              >
                Validation complete
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 11,
                  color: '#047857',
                }}
              >
                All required particulars are ready for CAO
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* Certification */}
      <Pressable
        onPress={() => setTerms((t) => !t)}
        className="mx-4 active:opacity-95"
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          paddingVertical: 16,
          paddingHorizontal: 14,
          borderWidth: 1.5,
          borderColor: terms ? '#6EE7B7' : COLORS.border,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <HStack className="items-center" style={{ gap: 12 }}>
          <Box
            className="items-center justify-center"
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: terms ? '#D1FAE5' : '#F0FDF4',
            }}
          >
            <ShieldCheck
              size={24}
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
              color: COLORS.ink,
            }}
          >
            I certify that all information is accurate and captured on-site. I understand false
            reporting is subject to disciplinary action under{' '}
            <Text style={{ fontFamily: FONTS.bold, color: '#059669' }}>CDRMS-2019</Text>.
          </Text>
        </HStack>
      </Pressable>

      <AppSheet
        open={confirm}
        onClose={() => !submitting && setConfirm(false)}
        title={isResubmit ? 'Resubmit application?' : 'Submit application?'}
      >
        <Text className="text-sm text-muted-foreground">
          Once submitted, this report for{' '}
          <Text className="font-bold text-foreground">{titleId}</Text> will be marked as
          submitted for CAO verification. You cannot edit after submission.
        </Text>
        {submitting ? (
          <HStack className="mt-6 items-center justify-center gap-3 py-4">
            <ActivityIndicator color={COLORS.primary} />
            <Text className="font-bold text-foreground">Submitting…</Text>
          </HStack>
        ) : (
          <HStack space="md" className="mt-4">
            <Box className="flex-1">
              <AppBtn variant="outline" onPress={() => setConfirm(false)}>
                Cancel
              </AppBtn>
            </Box>
            <Box className="flex-1">
              <AppBtn onPress={onConfirmSubmit}>
                {isResubmit ? 'Confirm & Resubmit' : 'Confirm & Submit'}
              </AppBtn>
            </Box>
          </HStack>
        )}
      </AppSheet>
    </SurveyScaffold>
  );
}

export function SuccessScreen({ go }: { go: Go }) {
  const { lastSubmitted, draft, startNewProject } = useProject();
  const appId = lastSubmitted?.applicationId || draft.applicationId || draft.id;
  const projectName = lastSubmitted?.projectName || draft.projectName.trim() || 'Application';
  const submittedAt = lastSubmitted?.submittedAt || draft.submittedAt;

  return (
    <ScreenShell>
      <LinearGradient
        colors={[...GRADIENT_SUBTLE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <VStack className="flex-1">
          <VStack className="flex-1 items-center justify-center px-8">
            <Box className="relative">
              <Box className="h-32 w-32 rounded-full bg-success/15 items-center justify-center">
                <CheckCircle2 size={64} color={COLORS.success} strokeWidth={2} />
              </Box>
              <Box className="absolute -top-2 -right-2">
                <Sparkles size={24} color={COLORS.warning} />
              </Box>
            </Box>
            <Text className="mt-8 text-2xl font-extrabold text-foreground text-center">
              Application Submitted
            </Text>
            <Text className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
              <Text className="font-bold text-foreground">{projectName}</Text> has been recorded
              for CAO verification.
            </Text>
            <AppCard className="mt-6 w-full">
              <VStack space="md">
                <HStack className="items-center justify-between">
                  <Text className="text-xs text-muted-foreground font-semibold">Application ID</Text>
                  <Text className="font-bold text-foreground">{appId}</Text>
                </HStack>
                <HStack className="items-center justify-between">
                  <Text className="text-xs text-muted-foreground font-semibold">Status</Text>
                  <StatusChip status="Submitted" />
                </HStack>
                <HStack className="items-center justify-between">
                  <Text className="text-xs text-muted-foreground font-semibold">Submitted</Text>
                  <Text className="font-semibold text-sm text-foreground">
                    {submittedAt ? new Date(submittedAt).toLocaleString() : 'Just now'}
                  </Text>
                </HStack>
                <HStack className="items-center justify-between">
                  <Text className="text-xs text-muted-foreground font-semibold">Est. Review</Text>
                  <Text className="font-semibold text-sm text-foreground">2–3 working days</Text>
                </HStack>
              </VStack>
            </AppCard>
          </VStack>
          <VStack space="md" className="p-5">
            <AppBtn
              onPress={() => {
                startNewProject();
                go('dashboard');
              }}
            >
              Back to Dashboard
            </AppBtn>
            <AppBtn variant="outline" onPress={() => go('history')}>
              View Applications
            </AppBtn>
          </VStack>
        </VStack>
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
                      className={`h-4 w-4 rounded-full ${
                        t.warn
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

export function ErrorScreen({ go }: { go: Go }) {
  return (
    <ScreenShell>
      <AppHeader title="Connection Error" onBack={() => go('dashboard')} go={go} />
      <VStack className="flex-1">
        <VStack className="flex-1 items-center justify-center px-8">
          <Box className="h-28 w-28 rounded-full bg-destructive/10 items-center justify-center">
            <WifiOff size={56} color={COLORS.destructive} strokeWidth={1.8} />
          </Box>
          <Text className="mt-8 text-2xl font-extrabold text-foreground text-center">
            Something went wrong
          </Text>
          <Text className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
            We couldn't complete this action. Check your connection and try again.
          </Text>
        </VStack>
        <VStack space="md" className="p-5">
          <AppBtn onPress={() => go('dashboard')} icon={RefreshCw}>
            Retry
          </AppBtn>
          <AppBtn variant="outline" onPress={() => go('dashboard')}>
            Back to Home
          </AppBtn>
        </VStack>
      </VStack>
    </ScreenShell>
  );
}
