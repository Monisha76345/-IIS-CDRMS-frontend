import { Building2 } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { SurveyCard, WorkspaceHeader } from '@/src/cdrms/components/SurveyLayout';
import { useProject } from '@/src/cdrms/project/ProjectContext';

/**
 * Persistent on every engineer backend step (web parity):
 * Zonal Commissioner details only.
 * Schedules (site around) live on Step 3 — Dimensions.
 */
export function EngineerStickyHeader() {
  const { draft } = useProject();
  const isOdd = draft.siteDimensionType === 'Odd';
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

  return (
    <SurveyCard>
      <WorkspaceHeader
        icon={Building2}
        title="Zonal Commissioner details"
        subtitle={draft.applicationNumber || draft.id}
        stepLabel="ZC"
        iconBg="#1D4ED8"
      />
      <VStack space="sm" className="px-[14px] pb-4">
        <HStack className="justify-between gap-3">
          <VStack className="flex-1 min-w-0">
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Address
            </Text>
            <Text className="mt-0.5 text-[13px] font-bold text-slate-900" numberOfLines={2}>
              {[draft.addressArea, draft.addressBlock, draft.addressPincode]
                .filter(Boolean)
                .join(', ') || '—'}
            </Text>
          </VStack>
          <VStack className="items-end">
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Site type
            </Text>
            <Text className="mt-0.5 text-[13px] font-bold text-slate-900">
              {draft.siteDimensionType}
            </Text>
          </VStack>
        </HStack>
        <HStack className="justify-between gap-3">
          <VStack className="flex-1 min-w-0">
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Site dimension
            </Text>
            <Text className="mt-0.5 text-[13px] font-bold text-slate-900">{liveSiteDimension}</Text>
          </VStack>
          <VStack className="min-w-0 flex-1 items-end">
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Comment
            </Text>
            <Text className="mt-0.5 text-[13px] font-bold text-slate-900" numberOfLines={2}>
              {draft.siteDimensionComment || '—'}
            </Text>
          </VStack>
        </HStack>
        {draft.caoRemarks ? (
          <Box className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
              CAO remarks
            </Text>
            <Text className="mt-1 text-[12px] font-semibold text-amber-950">{draft.caoRemarks}</Text>
          </Box>
        ) : null}
      </VStack>
    </SurveyCard>
  );
}
