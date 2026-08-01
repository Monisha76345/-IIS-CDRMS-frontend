import { useEffect, useMemo, useRef, useState } from 'react';
import { Ruler } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { GlassHeaderBadge, GlassSectionCard } from '@/src/cdrms/components/GlassSurface';
import { Field } from '@/src/cdrms/components/primitives';
import {
  SurveyScaffold,
  FooterContinueBtn,
} from '@/src/cdrms/components/SurveyLayout';
import { siteDimensionToFormDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { alertDraftError } from '@/src/cdrms/project/draft-api';
import { type Cardinal } from '@/src/cdrms/project/types';
import { CARDINAL_ACCENT, COLORS, FONTS, GLASS, SPACE } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

const CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];

const DIM_FIELDS: Array<{ side: Cardinal; label: string; key: 'dimNorth' | 'dimSouth' | 'dimEast' | 'dimWest' }> = [
  { side: 'N', label: 'North', key: 'dimNorth' },
  { side: 'S', label: 'South', key: 'dimSouth' },
  { side: 'E', label: 'East', key: 'dimEast' },
  { side: 'W', label: 'West', key: 'dimWest' },
];

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

function DimSideField({
  side,
  label,
  value,
  onChangeText,
}: {
  side: Cardinal;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  const accent = CARDINAL_ACCENT[side];

  return (
    <Box style={{ flex: 1 }}>
      <Box
        style={{
          borderRadius: 12,
          padding: SPACE[2],
          backgroundColor: GLASS.surfaceSolid,
          borderWidth: 1,
          borderColor: GLASS.border,
          borderTopWidth: 2,
          borderTopColor: accent,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <HStack style={{ alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Box
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: GLASS.tintBlue,
              borderWidth: 1,
              borderColor: '#BFDBFE',
            }}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: accent }}>{side}</Text>
          </Box>
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 10,
              color: COLORS.slate,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
        </HStack>
        <Field
          compact
          label=" "
          value={value}
          onChangeText={onChangeText}
          placeholder={`Enter ${side}`}
          keyboardType="decimal-pad"
          showCheck={false}
        />
      </Box>
    </Box>
  );
}

/** Step 3 — Dimensions (web parity) for ZC-assigned engineer tasks. */
export function DimensionsScreen({ go }: { go: Go }) {
  const { draft, setDimSide, persistBackendStep, reloadBackendDraft } = useProject();
  const isBackendTask = Boolean(draft.backendApplicationId);
  const isOdd = draft.siteDimensionType === 'Odd';
  const [stepSaving, setStepSaving] = useState(false);
  const clearedZcSeed = useRef(false);

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

  const filledCount = [draft.dimNorth, draft.dimSouth, draft.dimEast, draft.dimWest].filter(
    (v) => Number(v) > 0,
  ).length;

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
      </SurveyScaffold>
    );
  }

  return (
    <SurveyScaffold
      title="Site Dimension Sketch"
      subtitle="N / S / E / W · live plot updates"
      surface="premium"
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
      badge={liveSiteDimension !== '—' ? liveSiteDimension : undefined}
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
      <GlassSectionCard
        icon={Ruler}
        title="Site Dimension Sketch *"
        subtitle={
          dimsReady
            ? `Live plot · ${liveSiteDimension}`
            : `${filledCount}/4 sides · plot updates as you type`
        }
        badge={
          <GlassHeaderBadge>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: '#FFFFFF' }}>
              {isOdd ? 'Odd' : 'Even'}
            </Text>
          </GlassHeaderBadge>
        }
      >
        <VStack style={{ gap: SPACE[2] }}>
          <HStack style={{ gap: SPACE[2] }}>
            {DIM_FIELDS.filter(({ side }) => side === 'N' || side === 'S').map(
              ({ side, label, key }) => (
                <DimSideField
                  key={side}
                  side={side}
                  label={label}
                  value={draft[key]}
                  onChangeText={(t) => setDimSide(side, t)}
                />
              ),
            )}
          </HStack>
          <HStack style={{ gap: SPACE[2] }}>
            {DIM_FIELDS.filter(({ side }) => side === 'E' || side === 'W').map(
              ({ side, label, key }) => (
                <DimSideField
                  key={side}
                  side={side}
                  label={label}
                  value={draft[key]}
                  onChangeText={(t) => setDimSide(side, t)}
                />
              ),
            )}
          </HStack>

          <BoundariesDiagram
            embedded
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
        </VStack>
      </GlassSectionCard>
    </SurveyScaffold>
  );
}
