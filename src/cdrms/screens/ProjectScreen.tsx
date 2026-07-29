import {
  ArrowRight,
  Building2,
  MapPin,
  Ruler,
  Save,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { GpsSiteCard } from '@/src/cdrms/components/GpsSiteCard';
import { AppBtn, Field } from '@/src/cdrms/components/primitives';
import {
  SectionTitle,
  SurveyCard,
  SurveyScaffold,
  WorkspaceHeader,
} from '@/src/cdrms/components/SurveyLayout';
import { useDeviceLocation } from '@/src/cdrms/hooks/useDeviceLocation';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { TERMS } from '@/src/cdrms/terminology';
import { COLORS } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

function PulseBar({
  height = 44,
  width = '100%' as number | `${number}%`,
  delay = 0,
}: {
  height?: number;
  width?: number | `${number}%`;
  delay?: number;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.85]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.985, 1]) }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(320)} style={{ height, width }}>
      <Animated.View
        style={[
          {
            height,
            width: '100%',
            borderRadius: 12,
            backgroundColor: '#E2E8F0',
          },
          style,
        ]}
      />
    </Animated.View>
  );
}

function SiteLoadingCards() {
  const spin = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false
    );
    ring.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [ring, spin]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 1], [0.55, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.75, 1.45]) }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(280)} style={{ gap: 14 }}>
      <SurveyCard>
        <WorkspaceHeader
          icon={MapPin}
          title={TERMS.sections.siteLocation}
          subtitle="Capturing GPS…"
          stepLabel="STEP 01"
          iconBg="#0F766E"
        />
        <Box className="mx-[14px] mb-4 overflow-hidden" style={{ borderRadius: 18, height: 200 }}>
          <Box
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: '#ECFDF5' }}
          >
            <Box className="items-center justify-center" style={{ width: 88, height: 88 }}>
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 88,
                    height: 88,
                    borderRadius: 44,
                    borderWidth: 2,
                    borderColor: '#34D399',
                  },
                  ringStyle,
                ]}
              />
              <Animated.View
                style={[
                  {
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    borderWidth: 3,
                    borderColor: '#A7F3D0',
                    borderTopColor: '#0F766E',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                  },
                  spinStyle,
                ]}
              />
              <Box
                style={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <MapPin size={18} color="#0F766E" strokeWidth={2.4} />
              </Box>
            </Box>
            <Text className="mt-4 text-[13px] font-bold" style={{ color: '#0F766E' }}>
              Locating site…
            </Text>
            <Text className="mt-1 text-[11px]" style={{ color: '#64748B' }}>
              Please wait while GPS loads
            </Text>
          </Box>
        </Box>
      </SurveyCard>

      <SurveyCard>
        <WorkspaceHeader
          icon={Building2}
          title={TERMS.sections.projectWorkspace}
          subtitle="Filling site particulars…"
          stepLabel="STEP 01"
          iconBg="#2563EB"
        />
        <VStack space="md" className="px-[14px] pb-5">
          <HStack className="items-center gap-2.5 mb-1">
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text className="text-[12px] font-semibold" style={{ color: '#2563EB' }}>
              Auto-filling from GPS…
            </Text>
          </HStack>

          <PulseBar height={52} delay={40} />
          <HStack space="sm">
            <Box className="flex-1">
              <PulseBar height={52} delay={80} />
            </Box>
            <Box className="flex-1">
              <PulseBar height={52} delay={120} />
            </Box>
          </HStack>
          <HStack space="sm">
            <Box className="flex-1">
              <PulseBar height={52} delay={160} />
            </Box>
            <Box className="flex-1">
              <PulseBar height={52} delay={200} />
            </Box>
          </HStack>
          <PulseBar height={1} delay={220} />
          <HStack space="sm">
            <Box className="flex-1">
              <PulseBar height={52} delay={240} />
            </Box>
            <Box className="flex-1">
              <PulseBar height={52} delay={280} />
            </Box>
          </HStack>
          <PulseBar height={52} delay={320} />
          <PulseBar height={52} delay={360} />
        </VStack>
      </SurveyCard>
    </Animated.View>
  );
}

export function ProjectScreen({ go }: { go: Go }) {
  const { draft, updateField, setGps, saveDraft } = useProject();
  const { refresh, loading } = useDeviceLocation();
  const autoStarted = useRef(false);
  const isResubmit = Boolean(draft.resubmitOfId);
  // Keep loader up until GPS + auto-filled fields are written — not just while GPS fetches.
  const willAutoFill = !isResubmit && !draft.surveyNo.trim();
  const [filling, setFilling] = useState(willAutoFill);
  const showLoader = filling || loading;

  const applyLocation = async (silent = false) => {
    setFilling(true);
    try {
      const result = await refresh({ silent });
      if (!result) return;
      setGps(result.gps, result.address);
      if (!(draft.projectName ?? '').trim()) {
        updateField(
          'projectName',
          `Survey · ${result.address.village || 'Site'} · ${new Date().toLocaleDateString()}`
        );
      }
    } finally {
      // Dismiss only after form fields have been updated from GPS.
      setFilling(false);
    }
  };

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    // Don't overwrite returned-app data with a fresh GPS fill.
    if (draft.resubmitOfId || draft.surveyNo.trim()) {
      setFilling(false);
      return;
    }
    // Defer GPS so permission / state updates don't race the first TextInput focus.
    const t = setTimeout(() => {
      void applyLocation(true);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on open
  }, []);

  return (
    <SurveyScaffold
      title={isResubmit ? TERMS.workflow.fixResubmit : TERMS.workflow.newApplication}
      subtitle={
        isResubmit
          ? TERMS.workflow.fixResubmitSubtitle
          : TERMS.workflow.newApplicationSubtitle
      }
      onBack={() => go(isResubmit ? 'history' : 'dashboard')}
      step={1}
      badge={
        isResubmit
          ? 'Resubmit'
          : showLoader
            ? 'Locating…'
            : draft.gps
              ? 'GPS locked'
              : 'Locating…'
      }
      footer={
        <HStack space="md" className="items-center">
          <Pressable
            onPress={() => {
              saveDraft();
              go('draft');
            }}
            disabled={showLoader}
            className="h-14 w-14 rounded-2xl items-center justify-center active:opacity-80"
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#DBEAFE',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 3,
              opacity: showLoader ? 0.5 : 1,
            }}
          >
            <Save size={20} color={COLORS.primary} />
          </Pressable>
          <Box className="flex-1">
            <AppBtn
              onPress={() => go('bandi')}
              icon={ArrowRight}
              className="h-14 rounded-2xl"
              disabled={showLoader}
            >
              {TERMS.workflow.continueToCheckBandi}
            </AppBtn>
          </Box>
        </HStack>
      }
    >
      {draft.caoRemarks ? (
        <Box
          className="mx-4 p-4"
          style={{
            backgroundColor: '#FFFBEB',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#FCD34D',
          }}
        >
          <Text className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#B45309' }}>
            {TERMS.workflow.fixCaoRemarks}
          </Text>
          <Text className="text-[13px] mt-1.5 leading-5" style={{ color: '#78350F' }}>
            {draft.caoRemarks}
          </Text>
        </Box>
      ) : null}

      {showLoader ? (
        <SiteLoadingCards />
      ) : (
        <Animated.View entering={FadeInUp.duration(420)} style={{ gap: 14 }}>
          <SurveyCard>
            <WorkspaceHeader
              icon={MapPin}
              title={TERMS.sections.siteLocation}
              subtitle={
                draft.district
                  ? `${draft.district}, ${draft.state || 'Karnataka'}`
                  : 'Tap refresh to capture GPS'
              }
              stepLabel="STEP 01"
              iconBg="#0F766E"
            />
            <GpsSiteCard
              height={200}
              variant="padded"
              gps={draft.gps}
              villageLabel={draft.village || undefined}
              refreshing={loading}
              onRefresh={() => void applyLocation(false)}
              liveMap
              allowMapGestures={false}
            />
          </SurveyCard>

          <SurveyCard>
            <WorkspaceHeader
              icon={Building2}
              title={TERMS.sections.projectWorkspace}
              subtitle={draft.id}
              stepLabel="STEP 01"
              iconBg="#2563EB"
            />

            <VStack space="md" className="px-[14px] pb-5">
              <SectionTitle
                title={TERMS.sections.siteParticulars}
                subtitle={
                  isResubmit
                    ? 'Loaded from returned report — edit fields flagged by CAO'
                    : 'GPS fills jurisdiction — enter survey particulars manually'
                }
                accent="#2563EB"
              />

              <Field
                label={TERMS.fields.projectName}
                icon={Building2}
                value={draft.projectName}
                onChangeText={(t) => updateField('projectName', t)}
                placeholder="e.g. Village Road Widening"
              />

              <Field
                label={TERMS.fields.khatedarName}
                icon={UserRound}
                value={draft.khatedarName}
                onChangeText={(t) => updateField('khatedarName', t)}
                placeholder="e.g. Sri Ramesh Gowda"
              />

              <HStack space="sm">
                <Box className="flex-1">
                  <Field
                    label={TERMS.fields.surveyNo}
                    value={draft.surveyNo}
                    onChangeText={(t) => updateField('surveyNo', t)}
                    placeholder="e.g. 48/2A"
                  />
                </Box>
                <Box className="flex-1">
                  <Field
                    label={TERMS.fields.plotNo}
                    value={draft.plotNo}
                    onChangeText={(t) => updateField('plotNo', t)}
                    placeholder="e.g. P-112"
                  />
                </Box>
              </HStack>

              <HStack space="sm">
                <Box className="flex-1">
                  <Field
                    label={TERMS.fields.dimensionArea}
                    icon={Ruler}
                    value={draft.dimensionArea}
                    onChangeText={(t) => updateField('dimensionArea', t)}
                    placeholder="e.g. 1,240 sqm"
                  />
                </Box>
                <Box className="flex-1">
                  <Field
                    label={TERMS.fields.roadType}
                    value={draft.roadType}
                    onChangeText={(t) => updateField('roadType', t)}
                    placeholder="e.g. Approach Road"
                  />
                </Box>
              </HStack>

              <Box className="h-px my-1" style={{ backgroundColor: '#EFF6FF' }} />

              <SectionTitle
                title={TERMS.sections.administrativeArea}
                subtitle="Auto-filled from GPS — edit if required"
                accent="#0891B2"
              />

              <HStack space="sm">
                <Box className="flex-1">
                  <Field
                    label={TERMS.fields.village}
                    value={draft.village}
                    onChangeText={(t) => updateField('village', t)}
                    placeholder={TERMS.fields.village}
                  />
                </Box>
                <Box className="flex-1">
                  <Field
                    label={TERMS.fields.taluk}
                    value={draft.taluk}
                    onChangeText={(t) => updateField('taluk', t)}
                    placeholder={TERMS.fields.taluk}
                  />
                </Box>
              </HStack>
              <Field
                label={TERMS.fields.district}
                value={draft.district}
                onChangeText={(t) => updateField('district', t)}
                placeholder={TERMS.fields.district}
              />
              <Field
                label={TERMS.fields.state}
                value={draft.state}
                onChangeText={(t) => updateField('state', t)}
                placeholder={TERMS.fields.state}
              />
            </VStack>
          </SurveyCard>
        </Animated.View>
      )}
    </SurveyScaffold>
  );
}
