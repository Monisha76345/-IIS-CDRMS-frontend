import {
  Building2,
  Hash,
  Lock,
  MapPinned,
  MessageSquareText,
  Ruler,
} from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  GlassCard,
  GlassCardHeader,
  GlassHeaderBadge,
  GlassIcon,
  GlassSurface,
  FrostedGlass,
} from '@/src/cdrms/components/GlassSurface';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { CARDINAL_ACCENT, COLORS, FONTS, GLASS, SPACE, TYPE } from '@/src/cdrms/theme';

const CARDINALS = [
  { k: 'N' as const, label: 'North', color: CARDINAL_ACCENT.N },
  { k: 'S' as const, label: 'South', color: CARDINAL_ACCENT.S },
  { k: 'E' as const, label: 'East', color: CARDINAL_ACCENT.E },
  { k: 'W' as const, label: 'West', color: CARDINAL_ACCENT.W },
];

/**
 * Step 1 — ZC assigned site details (view-only).
 * Blue gradient header only · neutral fields below.
 */
export function EngineerStickyHeader() {
  const { draft } = useProject();
  const liveSiteDimension = draft.siteDimensionMaster?.trim() || '—';
  const address =
    [draft.addressArea, draft.addressBlock, draft.addressPincode].filter(Boolean).join(', ') ||
    '—';
  const refId = draft.applicationNumber || draft.siteNo || 'Assigned site';

  return (
    <GlassCard>
      <GlassCardHeader
        title="ZC site details"
        subtitle="Assigned by Zonal Commissioner"
        icon={Building2}
        badge={
          <GlassHeaderBadge>
            <Lock size={10} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 10, color: '#FFFFFF' }}>
              View only
            </Text>
          </GlassHeaderBadge>
        }
      />

      {/* Body — solid white, fully separated from header shader */}
      <VStack
        style={{
          padding: SPACE[3],
          gap: SPACE[2],
          backgroundColor: GLASS.cardSolid,
        }}
      >
        <HStack style={{ flexWrap: 'wrap', gap: 6 }}>
          <Chip icon={Hash} label={refId} primary />
          {draft.zoneCode ? <Chip label={draft.zoneCode} /> : null}
        </HStack>

        <GlassSurface padding={SPACE[2]}>
          <HStack style={{ alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <GlassIcon icon={MapPinned} color={COLORS.primary} size={13} />
            <Text style={{ ...TYPE.label, color: COLORS.slate, fontSize: 10, letterSpacing: 0.6 }}>
              Address
            </Text>
          </HStack>
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 15,
              color: COLORS.ink,
              lineHeight: 21,
            }}
            numberOfLines={4}
          >
            {address}
          </Text>
        </GlassSurface>

        <HStack style={{ gap: SPACE[2] }}>
          <StatBlock
            icon={Building2}
            label="Site type"
            value={draft.siteDimensionType || '—'}
            color={COLORS.primary}
          />
          <StatBlock icon={Ruler} label="Dimension" value={liveSiteDimension} color="#0891B2" />
        </HStack>

        <FieldRow
          icon={MessageSquareText}
          label="Comment"
          value={draft.siteDimensionComment?.trim() || '—'}
        />

        <VStack style={{ gap: SPACE[2] }}>
          <Text style={{ ...TYPE.label, color: COLORS.slate, fontSize: 10, letterSpacing: 0.8 }}>
            Schedules around site
          </Text>
          <HStack style={{ flexWrap: 'wrap', gap: 6 }}>
            {CARDINALS.map(({ k, label, color }) => (
              <CompassCell
                key={k}
                letter={k}
                label={label}
                value={draft.zcDirections?.[k]?.trim() || '—'}
                color={color}
              />
            ))}
          </HStack>
        </VStack>
      </VStack>
    </GlassCard>
  );
}

function Chip({
  icon: Icon,
  label,
  primary = false,
}: {
  icon?: typeof Hash;
  label: string;
  primary?: boolean;
}) {
  return (
    <HStack
      style={{
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: primary ? GLASS.tintBlue : GLASS.surface,
        borderWidth: 1,
        borderColor: primary ? '#BFDBFE' : GLASS.borderSoft,
      }}
    >
      {Icon ? <Icon size={11} color={COLORS.primary} strokeWidth={2.3} /> : null}
      <Text
        style={{
          fontFamily: FONTS.bold,
          fontSize: 12,
          color: primary ? '#1D4ED8' : COLORS.ink,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </HStack>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Box style={{ flex: 1 }}>
      <FrostedGlass
        borderRadius={12}
        padding={SPACE[2]}
        fill={GLASS.surfaceSolid}
        sheen={false}
        style={{ borderTopWidth: 2, borderTopColor: color }}
      >
        <HStack style={{ alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <Icon size={12} color={color} strokeWidth={2.2} />
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 10,
              color: COLORS.slate,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            {label}
          </Text>
        </HStack>
        <Text
          style={{ fontFamily: FONTS.bold, fontSize: 16, color: COLORS.ink, letterSpacing: -0.3 }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </FrostedGlass>
    </Box>
  );
}

function FieldRow({
  icon,
  label,
  value,
}: {
  icon: typeof MessageSquareText;
  label: string;
  value: string;
}) {
  return (
    <HStack style={{ alignItems: 'flex-start', gap: SPACE[2] }}>
      <GlassIcon icon={icon} color={COLORS.slate} size={13} />
      <VStack style={{ flex: 1, gap: 2 }}>
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
        <Text
          style={{ fontFamily: FONTS.medium, fontSize: 13, color: COLORS.ink, lineHeight: 18 }}
          numberOfLines={3}
        >
          {value}
        </Text>
      </VStack>
    </HStack>
  );
}

function CompassCell({
  letter,
  label,
  value,
  color,
}: {
  letter: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Box style={{ width: '47%', flexGrow: 1 }}>
      <FrostedGlass
        borderRadius={12}
        padding={SPACE[2]}
        fill={GLASS.surfaceSolid}
        sheen={false}
        style={{ borderTopWidth: 2, borderTopColor: color }}
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
            <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color }}>{letter}</Text>
          </Box>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 10,
              color: COLORS.slate,
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}
          >
            {label}
          </Text>
        </HStack>
        <Text
          numberOfLines={2}
          style={{ fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.ink, lineHeight: 16 }}
        >
          {value}
        </Text>
      </FrostedGlass>
    </Box>
  );
}
