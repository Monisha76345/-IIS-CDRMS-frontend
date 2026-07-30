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
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { formatCoords } from '@/src/cdrms/project/types';
import { validateDraft, validationSummary } from '@/src/cdrms/project/validation';
import { COLORS, GRADIENT_SUBTLE } from '@/src/cdrms/theme';
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
              className={`items-center gap-3 px-[18px] py-4 ${i > 0 ? 'border-t border-border' : ''}`}
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
      val: draft.village.trim() || '—',
      icon: Home,
      bg: '#EFF6FF',
      fg: '#2563EB',
    },
    {
      label: 'Dimension',
      val: draft.dimensionArea.trim() || '—',
      icon: Ruler,
      bg: '#DBEAFE',
      fg: '#2563EB',
    },
    {
      label: 'Location',
      val: coords,
      icon: MapPin,
      bg: '#D1FAE5',
      fg: '#059669',
    },
    {
      label: 'Road Type',
      val: draft.roadType.trim() || '—',
      icon: Route,
      bg: '#FFEDD5',
      fg: '#EA580C',
    },
  ];

  const mediaCards = [
    {
      key: 'photos',
      label: 'Photos',
      value: String(photoCount),
      icon: Camera,
      color: '#3B82F6',
      soft: '#EFF6FF',
      progress: Math.min(photoCount / 3, 1),
      onPress: () => go('photos'),
    },
    {
      key: 'video',
      label: 'Video',
      value: String(videoCount),
      icon: Play,
      color: '#EC4899',
      soft: '#FCE7F3',
      progress: videoCount >= 1 ? 1 : 0,
      onPress: () => go('video'),
    },
    {
      key: 'directions',
      label: 'Directions',
      value: `${dirsFilled}/4`,
      icon: Compass,
      color: '#14B8A6',
      soft: '#CCFBF1',
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
      badge={summary.allOk ? 'Final review' : 'Incomplete'}
      footer={
        <VStack space="sm" className="items-stretch">
          <Pressable
            disabled={!canSubmit}
            onPress={() => setConfirm(true)}
            className="w-full overflow-hidden active:opacity-90"
            style={{
              height: 56,
              borderRadius: 999,
              opacity: canSubmit ? 1 : 0.5,
              shadowColor: '#1D4ED8',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={['#1E40AF', '#2563EB', '#3B82F6']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
              }}
            >
              <HStack className="items-center gap-2.5">
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Send size={18} color="#fff" strokeWidth={2.4} />
                )}
                <Text className="text-[15px] font-extrabold text-white tracking-wide">
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
            <Lock size={12} color="#3B82F6" strokeWidth={2.3} />
            <Text className="text-[11px] font-semibold" style={{ color: '#3B82F6' }}>
              Your data is secure and encrypted
            </Text>
          </HStack>
        </VStack>
      }
          go={go}
    >
      {/* Project summary — matches design card */}
      <Box
        className="mx-4"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          padding: 18,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 4,
        }}
      >
        <HStack className="items-start justify-between gap-3">
          <HStack className="items-start gap-3 flex-1 min-w-0">
            <Box
              className="items-center justify-center rounded-2xl"
              style={{ width: 44, height: 44, backgroundColor: '#EFF6FF' }}
            >
              <ClipboardList size={22} color="#2563EB" strokeWidth={2.2} />
            </Box>
            <VStack className="flex-1 min-w-0">
              <Text
                className="text-[11px] font-extrabold uppercase tracking-[1.4px]"
                style={{ color: '#3B82F6' }}
              >
                Project summary
              </Text>
              <Text
                className="text-[19px] font-black leading-6 mt-1"
                style={{ color: '#0F172A' }}
                numberOfLines={2}
              >
                {draft.projectName.trim() || 'Untitled project'}
              </Text>
              <Text className="text-[13px] font-medium mt-1" style={{ color: '#94A3B8' }}>
                Survey {draft.surveyNo.trim() || '—'}
                {draft.plotNo.trim() ? ` • Plot ${draft.plotNo.trim()}` : ''}
              </Text>
            </VStack>
          </HStack>
          <Box
            className="px-2.5 py-1 rounded-full"
            style={{ backgroundColor: '#EFF6FF' }}
          >
            <Text className="text-[11px] font-bold" style={{ color: '#2563EB' }}>
              {draft.status === 'submitted' ? 'Submitted' : 'Draft'}
            </Text>
          </Box>
        </HStack>

        <Box className="mt-5" style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <Box className="flex-row" style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            {infoTiles.slice(0, 2).map((item, i) => {
              const Icon = item.icon;
              return (
                <HStack
                  key={item.label}
                  className="items-center gap-2.5 flex-1 py-3.5"
                  style={{
                    paddingRight: i === 0 ? 10 : 0,
                    paddingLeft: i === 1 ? 10 : 0,
                    borderRightWidth: i === 0 ? 1 : 0,
                    borderRightColor: '#F1F5F9',
                  }}
                >
                  <Box
                    className="items-center justify-center rounded-xl"
                    style={{ width: 36, height: 36, backgroundColor: item.bg }}
                  >
                    <Icon size={16} color={item.fg} strokeWidth={2.3} />
                  </Box>
                  <VStack className="flex-1 min-w-0">
                    <Text
                      className="text-[10px] uppercase font-bold tracking-wider"
                      style={{ color: '#94A3B8' }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      className="text-[13px] font-extrabold mt-0.5"
                      style={{ color: '#0F172A' }}
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
                  className="items-center gap-2.5 flex-1 py-3.5"
                  style={{
                    paddingRight: i === 0 ? 10 : 0,
                    paddingLeft: i === 1 ? 10 : 0,
                    borderRightWidth: i === 0 ? 1 : 0,
                    borderRightColor: '#F1F5F9',
                  }}
                >
                  <Box
                    className="items-center justify-center rounded-xl"
                    style={{ width: 36, height: 36, backgroundColor: item.bg }}
                  >
                    <Icon size={16} color={item.fg} strokeWidth={2.3} />
                  </Box>
                  <VStack className="flex-1 min-w-0">
                    <Text
                      className="text-[10px] uppercase font-bold tracking-wider"
                      style={{ color: '#94A3B8' }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      className="text-[13px] font-extrabold mt-0.5"
                      style={{ color: '#0F172A' }}
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
      </Box>

      {/* Photos / Video / Directions — progress cards */}
      <HStack className="mx-4" style={{ gap: 12 }}>
        {mediaCards.map((m) => {
          const Icon = m.icon;
          const fillPct = Math.min(Math.max(m.progress, 0), 1) * 100;
          return (
            <Pressable
              key={m.key}
              onPress={m.onPress}
              className="flex-1 active:opacity-90"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                paddingTop: 14,
                paddingBottom: 0,
                paddingHorizontal: 6,
                overflow: 'hidden',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <VStack className="items-center pb-3">
                <Box
                  className="items-center justify-center rounded-full mb-2"
                  style={{ width: 42, height: 42, backgroundColor: m.soft }}
                >
                  <Icon size={18} color={m.color} strokeWidth={2.2} />
                </Box>
                <Text className="text-[24px] font-black leading-7" style={{ color: m.color }}>
                  {m.value}
                </Text>
                <Text className="text-[12px] font-semibold mt-0.5" style={{ color: '#64748B' }}>
                  {m.label}
                </Text>
              </VStack>
              <Box style={{ height: 3.5, backgroundColor: '#E5E7EB' }}>
                <Box
                  style={{
                    height: 3.5,
                    width: `${fillPct}%`,
                    backgroundColor: m.color,
                    borderTopRightRadius: m.progress < 1 ? 2 : 0,
                    borderBottomRightRadius: m.progress < 1 ? 2 : 0,
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
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: '#FCD34D',
          }}
        >
          <HStack className="items-center gap-3">
            <AlertTriangle size={18} color="#B45309" />
            <VStack className="flex-1 min-w-0">
              <Text className="text-sm font-bold" style={{ color: '#92400E' }}>
                {summary.failed.length} checklist item
                {summary.failed.length === 1 ? '' : 's'} incomplete
              </Text>
              <Text className="text-[11px]" style={{ color: '#A16207' }}>
                Tap to return to Validate and fix
              </Text>
            </VStack>
            <ChevronRight size={18} color="#B45309" />
          </HStack>
        </Pressable>
      ) : null}

      {/* Certification — shield + checkbox + text */}
      <Pressable
        onPress={() => setTerms((t) => !t)}
        className="mx-4 active:opacity-95"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          paddingVertical: 18,
          paddingHorizontal: 16,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        <HStack className="items-center gap-3">
          <Box
            className="items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: '#D1FAE5',
            }}
          >
            <ShieldCheck size={26} color="#059669" strokeWidth={2.2} />
          </Box>
          <Box
            className="items-center justify-center"
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              borderWidth: 2,
              borderColor: terms ? '#10B981' : '#CBD5E1',
              backgroundColor: terms ? '#10B981' : '#FFFFFF',
            }}
          >
            {terms ? <Check size={13} color="#fff" strokeWidth={3.2} /> : null}
          </Box>
          <Text className="flex-1 text-[13px] leading-[19px] font-medium" style={{ color: '#334155' }}>
            I certify that all information is accurate and captured on-site. I understand false
            reporting is subject to disciplinary action under{' '}
            <Text className="font-extrabold" style={{ color: '#059669' }}>
              CDRMS-2019
            </Text>
            .
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
          <Text className="font-bold text-foreground">
            {draft.projectName.trim() || 'this project'}
          </Text>{' '}
          will be marked as submitted for CAO verification. You cannot edit after submission.
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
