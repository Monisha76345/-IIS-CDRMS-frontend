import { useState } from 'react';
import { ArrowRight, Ruler, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { EngineerStickyHeader } from '@/src/cdrms/components/EngineerStickyHeader';
import { SchedulesEditorCard } from '@/src/cdrms/components/SchedulesEditorCard';
import { AppBtn, Field } from '@/src/cdrms/components/primitives';
import {
  SectionTitle,
  SurveyCard,
  SurveyScaffold,
  WorkspaceHeader,
} from '@/src/cdrms/components/SurveyLayout';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { alertDraftError } from '@/src/cdrms/project/draft-api';
import { COLORS } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

/** Step 3 — Dimensions (web parity) for ZC-assigned engineer tasks. */
export function DimensionsScreen({ go }: { go: Go }) {
  const { draft, setDimSide, saveDraft, persistBackendStep, reloadBackendDraft } = useProject();
  const isBackendTask = Boolean(draft.backendApplicationId);
  const isOdd = draft.siteDimensionType === 'Odd';
  const [stepSaving, setStepSaving] = useState(false);

  const liveSiteDimension = (() => {
    const n = draft.dimNorth.trim();
    const s = draft.dimSouth.trim();
    const e = draft.dimEast.trim();
    const w = draft.dimWest.trim();
    if (!n && !s && !e && !w) return draft.siteDimensionMaster || draft.dimensionArea || '—';
    if (!isOdd && n && e && n === s && e === w) return `${n}*${e}`;
    if (n && s && e && w) return `${n}*${e}*${s}*${w}`;
    return [n || '—', e || '—', s || '—', w || '—'].join('*');
  })();

  const dimsReady = [draft.dimNorth, draft.dimSouth, draft.dimEast, draft.dimWest].every(
    (v) => Number(v) > 0,
  );

  if (!isBackendTask) {
    return (
      <SurveyScaffold title="Dimensions" subtitle="" onBack={() => go('bandi')} step={3} total={4} go={go}>
        <Text className="px-4 py-8 text-center text-slate-500">
          Dimensions step is for assigned ZC tasks.
        </Text>
        <AppBtn onPress={() => go('bandi')}>Back</AppBtn>
      </SurveyScaffold>
    );
  }

  return (
    <SurveyScaffold
      title="Step 3 — Dimensions"
      subtitle="N / S / E / W · live plot updates"
      onBack={() => {
        void (async () => {
          try {
            await reloadBackendDraft();
          } catch {
            /* still navigate */
          }
          go('bandi');
        })();
      }}
      step={3}
      total={4}
      badge={liveSiteDimension}
      footer={
        <HStack space="md" className="items-center">
          <Pressable
            onPress={() => {
              void (async () => {
                try {
                  await saveDraft();
                  go('draft');
                } catch (err) {
                  alertDraftError(err);
                }
              })();
            }}
            disabled={stepSaving}
            className="h-14 w-14 items-center justify-center rounded-2xl active:opacity-85"
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#DBEAFE',
              opacity: stepSaving ? 0.5 : 1,
            }}
          >
            <Save size={20} color={COLORS.primary} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            disabled={!dimsReady || stepSaving}
            onPress={() => {
              void (async () => {
                setStepSaving(true);
                try {
                  await persistBackendStep('dimensions');
                  go('photos');
                } catch (err) {
                  alertDraftError(err);
                } finally {
                  setStepSaving(false);
                }
              })();
            }}
            className={`h-14 flex-1 overflow-hidden rounded-2xl ${
              dimsReady && !stepSaving ? 'active:opacity-90' : 'opacity-45'
            }`}
          >
            <LinearGradient
              colors={['#2563EB', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <Text className="text-[15px] font-extrabold tracking-wide text-white">
                {stepSaving
                  ? 'Saving…'
                  : dimsReady
                    ? 'Continue to media'
                    : 'Enter all 4 dimensions'}
              </Text>
              <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        </HStack>
      }
      go={go}
    >
      <EngineerStickyHeader />
      <SchedulesEditorCard />

      <SurveyCard>
        <WorkspaceHeader
          icon={Ruler}
          title="Step 3 — Dimensions"
          subtitle={
            draft.siteDimensionMaster
              ? `Prefills from ${draft.siteDimensionMaster}${isOdd ? '' : ' · Even sync'}`
              : 'Enter N / S / E / W'
          }
          stepLabel="STEP 03"
          iconBg="#2563EB"
        />
        <VStack space="md" className="px-[14px] pb-5">
          <SectionTitle
            title="Site dimensions (N / S / E / W)"
            subtitle={`Live: ${liveSiteDimension}`}
            accent="#2563EB"
          />
          <HStack space="sm">
            <Box className="flex-1">
              <Field
                label="North"
                value={draft.dimNorth}
                onChangeText={(t) => setDimSide('N', t)}
                placeholder="N"
                keyboardType="decimal-pad"
              />
            </Box>
            <Box className="flex-1">
              <Field
                label="South"
                value={draft.dimSouth}
                onChangeText={(t) => setDimSide('S', t)}
                placeholder="S"
                keyboardType="decimal-pad"
              />
            </Box>
          </HStack>
          <HStack space="sm">
            <Box className="flex-1">
              <Field
                label="East"
                value={draft.dimEast}
                onChangeText={(t) => setDimSide('E', t)}
                placeholder="E"
                keyboardType="decimal-pad"
              />
            </Box>
            <Box className="flex-1">
              <Field
                label="West"
                value={draft.dimWest}
                onChangeText={(t) => setDimSide('W', t)}
                placeholder="W"
                keyboardType="decimal-pad"
              />
            </Box>
          </HStack>
          <BoundariesDiagram
            north={Number(draft.dimNorth) || 0}
            south={Number(draft.dimSouth) || 0}
            east={Number(draft.dimEast) || 0}
            west={Number(draft.dimWest) || 0}
          />
        </VStack>
      </SurveyCard>
    </SurveyScaffold>
  );
}
