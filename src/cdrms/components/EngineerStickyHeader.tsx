import { Building2, Hash, MapPinned, MessageSquareText, Ruler } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  SurveyCard,
  WorkspaceHeader,
} from '@/src/cdrms/components/SurveyLayout';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { COLORS, FONTS, SPACE, TYPE } from '@/src/cdrms/theme';

const CARDINALS = [
  { k: 'N' as const, label: 'North' },
  { k: 'S' as const, label: 'South' },
  { k: 'E' as const, label: 'East' },
  { k: 'W' as const, label: 'West' },
];

/**
 * Step 1 — Zonal Commissioner assigned site details (view-only).
 * Same typography as other steppers: black text on white cards.
 */
export function EngineerStickyHeader() {
  const { draft } = useProject();
  const liveSiteDimension = draft.siteDimensionMaster?.trim() || '—';
  const address =
    [draft.addressArea, draft.addressBlock, draft.addressPincode].filter(Boolean).join(', ') ||
    '—';
  const refId = draft.applicationNumber || draft.siteNo || 'Assigned site';

  return (
    <SurveyCard>
      <WorkspaceHeader
        icon={Building2}
        title="ZC site details"
        subtitle="Assigned by Zonal Commissioner · view only"
        iconBg={COLORS.primary}
      />

      <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] }}>
        <HStack style={{ flexWrap: 'wrap', gap: 8 }}>
          <Chip icon={Hash} text={refId} />
          {draft.zoneCode ? <Chip text={draft.zoneCode} /> : null}
        </HStack>

        <MetaRow icon={MapPinned} label="Address" value={address} />

        <HStack style={{ gap: SPACE[3] }}>
          <Box style={{ flex: 1 }}>
            <MetaRow
              icon={Building2}
              label="Site type"
              value={draft.siteDimensionType || '—'}
            />
          </Box>
          <Box style={{ flex: 1 }}>
            <MetaRow icon={Ruler} label="Dimension" value={liveSiteDimension} />
          </Box>
        </HStack>

        <MetaRow
          icon={MessageSquareText}
          label="Comment"
          value={draft.siteDimensionComment?.trim() || '—'}
        />

        <VStack style={{ gap: SPACE[2] }}>
          <Text style={{ ...TYPE.label, color: COLORS.ink }}>Schedules around site</Text>
          <HStack style={{ flexWrap: 'wrap', gap: 8 }}>
            {CARDINALS.map(({ k, label }) => (
              <Box
                key={`zc-sched-${k}`}
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
                  {label}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: FONTS.semibold,
                    fontSize: 13,
                    color: COLORS.ink,
                    marginTop: 4,
                  }}
                >
                  {draft.zcDirections?.[k]?.trim() || '—'}
                </Text>
              </Box>
            ))}
          </HStack>
        </VStack>


      </VStack>
    </SurveyCard>
  );
}

function Chip({
  icon: Icon,
  text,
}: {
  icon?: typeof Hash;
  text: string;
}) {
  return (
    <Box
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {Icon ? <Icon size={12} color={COLORS.ink} strokeWidth={2.4} /> : null}
      <Text
        style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.ink }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </Box>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPinned;
  label: string;
  value: string;
}) {
  return (
    <Box
      style={{
        borderRadius: 12,
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <HStack className="items-center" style={{ gap: 6, marginBottom: 4 }}>
        <Icon size={12} color={COLORS.ink} strokeWidth={2.3} />
        <Text style={{ ...TYPE.label, color: COLORS.ink }}>{label}</Text>
      </HStack>
      <Text
        style={{ fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.ink, lineHeight: 20 }}
        numberOfLines={4}
      >
        {value}
      </Text>
    </Box>
  );
}
