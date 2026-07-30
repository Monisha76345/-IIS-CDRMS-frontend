import { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Ruler } from 'lucide-react-native';
import { View } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { LiveCompassDial } from '@/src/cdrms/components/LiveCompassDial';
import { AppBtn, Field } from '@/src/cdrms/components/primitives';
import {
  SurveyCard,
  SurveyScaffold,
  WorkspaceHeader,
  FooterContinueBtn,
} from '@/src/cdrms/components/SurveyLayout';
import { siteDimensionToFormDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { alertDraftError } from '@/src/cdrms/project/draft-api';
import { DIRECTION_META, type Cardinal } from '@/src/cdrms/project/types';
import { COLORS, FONTS, SPACE, TYPE } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

const CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];

/** Compact horizontal road strip for schedule chips. */
function RoadChipIcon() {
  return (
    <View
      style={{
        width: 30,
        height: 14,
        borderRadius: 3,
        backgroundColor: '#4B5563',
        borderWidth: 0.5,
        borderColor: '#1F2937',
        justifyContent: 'center',
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          height: 2,
          borderRadius: 1,
          backgroundColor: '#FBBF24',
          opacity: 0.95,
        }}
      />
    </View>
  );
}

function scheduleLabel(
  note: string | undefined,
  zc: string | undefined,
  isRoad: boolean,
): string {
  const eng = (note || '').trim();
  const zcNote = (zc || '').trim();
  const base = eng || zcNote;
  if (isRoad && base) return `Road · ${base}`;
  if (isRoad) return 'Road';
  return base;
}

/** Step 3 — Dimensions (web parity) for ZC-assigned engineer tasks. */
export function DimensionsScreen({ go }: { go: Go }) {
  const { draft, setDimSide, persistBackendStep, reloadBackendDraft } = useProject();
  const isBackendTask = Boolean(draft.backendApplicationId);
  const isOdd = draft.siteDimensionType === 'Odd';
  const [stepSaving, setStepSaving] = useState(false);
  const clearedZcSeed = useRef(false);

  // Strip accidental ZC siteDimension copies so engineer must enter manually (web parity).
  useEffect(() => {
    if (!isBackendTask || clearedZcSeed.current) return;
    const zc = siteDimensionToFormDims(draft.siteDimensionMaster);
    if (!zc) return;
    const matchesZc =
      draft.dimNorth.trim() === zc.north &&
      draft.dimSouth.trim() === zc.south &&
      draft.dimEast.trim() === zc.east &&
      draft.dimWest.trim() === zc.west;
    if (!matchesZc) return;
    clearedZcSeed.current = true;
    setDimSide('N', '');
    setDimSide('S', '');
    setDimSide('E', '');
    setDimSide('W', '');
  }, [
    isBackendTask,
    draft.siteDimensionMaster,
    draft.dimNorth,
    draft.dimSouth,
    draft.dimEast,
    draft.dimWest,
    setDimSide,
  ]);

  const liveSiteDimension = (() => {
    const n = draft.dimNorth.trim();
    const s = draft.dimSouth.trim();
    const e = draft.dimEast.trim();
    const w = draft.dimWest.trim();
    if (!n && !s && !e && !w) return '—';
    if (!isOdd && n && e && n === s && e === w) return `${n}*${e}`;
    if (n && s && e && w) return `${n}*${e}*${s}*${w}`;
    return [n || '—', e || '—', s || '—', w || '—'].join('*');
  })();

  const dimsReady = [draft.dimNorth, draft.dimSouth, draft.dimEast, draft.dimWest].every(
    (v) => Number(v) > 0,
  );

  const schedulesAround = useMemo(() => {
    const out: Record<Cardinal, string> = { N: '', S: '', E: '', W: '' };
    for (const k of CARDINALS) {
      out[k] = scheduleLabel(
        draft.directions[k],
        draft.zcDirections[k],
        Boolean(draft.roadFlags?.[k]),
      );
    }
    return out;
  }, [draft.directions, draft.zcDirections, draft.roadFlags]);

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
        <FooterContinueBtn
          disabled={!dimsReady || stepSaving}
          loading={stepSaving}
          label={dimsReady ? 'Continue' : 'Enter all 4 dimensions'}
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
        />
      }
      go={go}
    >
      <SurveyCard>
        <WorkspaceHeader
          icon={Compass}
          title="Facing direction"
          subtitle="Tap N / NE / E / SE / S / SW / W / NW"
          stepLabel="STEP 03"
          iconBg={COLORS.primary}
        />
        <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], alignItems: 'center' }}>
          <LiveCompassDial />
        </VStack>
      </SurveyCard>

      <SurveyCard>
        <WorkspaceHeader
          icon={Ruler}
          title="Site dimensions"
          subtitle={`Live plot: ${liveSiteDimension}`}
          stepLabel="STEP 03"
          iconBg={COLORS.primary}
        />
        <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] }}>
          <HStack style={{ gap: SPACE[2] }}>
            {(
              [
                ['North', 'N', draft.dimNorth],
                ['South', 'S', draft.dimSouth],
              ] as const
            ).map(([label, side, value]) => (
              <Box key={side} style={{ flex: 1, maxWidth: 140 }}>
                <Field
                  compact
                  label={label}
                  value={value}
                  onChangeText={(t) => setDimSide(side, t)}
                  placeholder={side}
                  keyboardType="decimal-pad"
                />
              </Box>
            ))}
          </HStack>
          <HStack style={{ gap: SPACE[2] }}>
            {(
              [
                ['East', 'E', draft.dimEast],
                ['West', 'W', draft.dimWest],
              ] as const
            ).map(([label, side, value]) => (
              <Box key={side} style={{ flex: 1, maxWidth: 140 }}>
                <Field
                  compact
                  label={label}
                  value={value}
                  onChangeText={(t) => setDimSide(side, t)}
                  placeholder={side}
                  keyboardType="decimal-pad"
                />
              </Box>
            ))}
          </HStack>

          <BoundariesDiagram
            north={Number(draft.dimNorth) || 0}
            south={Number(draft.dimSouth) || 0}
            east={Number(draft.dimEast) || 0}
            west={Number(draft.dimWest) || 0}
            odd={isOdd}
            scheduleNorth={schedulesAround.N || null}
            scheduleSouth={schedulesAround.S || null}
            scheduleEast={schedulesAround.E || null}
            scheduleWest={schedulesAround.W || null}
            roadNorth={Boolean(draft.roadFlags?.N)}
            roadSouth={Boolean(draft.roadFlags?.S)}
            roadEast={Boolean(draft.roadFlags?.E)}
            roadWest={Boolean(draft.roadFlags?.W)}
          />

          <VStack style={{ gap: SPACE[2] }}>
            <Text style={{ ...TYPE.label, color: COLORS.ink }}>Scheduled sites (around)</Text>
            <HStack style={{ flexWrap: 'wrap', gap: 8 }}>
              {CARDINALS.map((k) => {
                const label = schedulesAround[k] || '—';
                const isRoad = Boolean(draft.roadFlags?.[k]);
                return (
                  <Box
                    key={`sched-chip-${k}`}
                    style={{
                      width: '47%',
                      flexGrow: 1,
                      borderRadius: 12,
                      backgroundColor: COLORS.white,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      shadowColor: '#0F172A',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 10,
                        letterSpacing: 0.4,
                        color: COLORS.ink,
                        textTransform: 'uppercase',
                      }}
                    >
                      {DIRECTION_META[k].label}
                    </Text>
                    <HStack className="items-center" style={{ gap: 6, marginTop: 4 }}>
                      {isRoad ? <RoadChipIcon /> : null}
                      <Text
                        numberOfLines={2}
                        style={{
                          flex: 1,
                          fontFamily: FONTS.semibold,
                          fontSize: 13,
                          color: COLORS.ink,
                        }}
                      >
                        {label}
                      </Text>
                    </HStack>
                  </Box>
                );
              })}
            </HStack>
          </VStack>
        </VStack>
      </SurveyCard>
    </SurveyScaffold>
  );
}
