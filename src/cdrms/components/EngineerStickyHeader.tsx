import {
  Building2,
  FileText,
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
} from '@/src/cdrms/components/GlassSurface';
import { cardBodyStyle } from '@/src/cdrms/lib/cardSurface';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import {
  CARDINAL_ACCENT,
  COLORS,
  DESIGN,
  FONTS,
  SPACE,
  TYPE,
  hexAlpha,
  usesLightHeader,
} from '@/src/cdrms/theme';

const CARDINALS = [
  { k: 'N' as const, label: 'North', color: CARDINAL_ACCENT.N },
  { k: 'S' as const, label: 'South', color: CARDINAL_ACCENT.S },
  { k: 'E' as const, label: 'East', color: CARDINAL_ACCENT.E },
  { k: 'W' as const, label: 'West', color: CARDINAL_ACCENT.W },
];

/** Soft pastel fills for Plain (smart-home) field tiles. */
const PASTEL_TILES = [
  { bg: '#ECFDF5', fg: '#059669' },
  { bg: '#EEF2FF', fg: '#4F46E5' },
  { bg: '#E0F2FE', fg: '#0284C7' },
  { bg: '#FEF3C7', fg: '#D97706' },
  { bg: '#FCE7F3', fg: '#DB2777' },
  { bg: '#F3E8FF', fg: '#7C3AED' },
] as const;

/**
 * Step 1 — ZC assigned site details (view-only).
 * Chrome follows active theme (Plain pastels · Wave/Mesh accents · Ocean elevated).
 */
export function EngineerStickyHeader() {
  const { draft } = useProject();
  const liveSiteDimension = draft.siteDimensionMaster?.trim() || '—';
  const appNo = draft.applicationNumber?.trim() || '—';
  const plain = usesLightHeader();
  let tile = 0;
  const nextPastel = () => PASTEL_TILES[tile++ % PASTEL_TILES.length]!;

  return (
    <GlassCard>
      <GlassCardHeader
        title="ZC site details"
        subtitle="Assigned by Zonal Commissioner"
        icon={Building2}
        badge={
          <GlassHeaderBadge tone="neutral">
            <Lock size={10} color={COLORS.slate} strokeWidth={2.5} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.slate }}>
              View only
            </Text>
          </GlassHeaderBadge>
        }
      />

      <VStack
        style={{
          padding: plain ? SPACE[2] : SPACE[3],
          gap: plain ? 10 : SPACE[2],
          ...cardBodyStyle(),
        }}
      >
        <StatBlock
          icon={FileText}
          label="E-office number"
          value={draft.eOfficeNumber?.trim() || '—'}
          accent={COLORS.primary}
          pastel={plain ? nextPastel() : undefined}
          fullWidth
          inline
        />

        <HStack style={{ gap: SPACE[2] }}>
          <StatBlock
            icon={Hash}
            label="Application number"
            value={appNo}
            accent={COLORS.primaryGlow}
            pastel={plain ? nextPastel() : undefined}
            wrap
          />
          <StatBlock
            icon={MapPinned}
            label="Zone"
            value={draft.zoneCode?.trim() || '—'}
            accent={COLORS.primary}
            pastel={plain ? nextPastel() : undefined}
          />
        </HStack>

        <HStack style={{ gap: SPACE[2] }}>
          <StatBlock
            icon={Hash}
            label="Site no"
            value={draft.siteNo?.trim() || '—'}
            accent={COLORS.primary}
            pastel={plain ? nextPastel() : undefined}
          />
          <StatBlock
            icon={Building2}
            label="Site type"
            value={draft.siteDimensionType || '—'}
            accent={COLORS.primaryGlow}
            pastel={plain ? nextPastel() : undefined}
          />
        </HStack>

        <StatBlock
          icon={MapPinned}
          label="Area"
          value={draft.addressArea?.trim() || '—'}
          accent={COLORS.primary}
          pastel={plain ? nextPastel() : undefined}
          fullWidth
        />

        <HStack style={{ gap: SPACE[2] }}>
          <StatBlock
            icon={MapPinned}
            label="Block"
            value={draft.addressBlock?.trim() || '—'}
            accent={COLORS.primary}
            pastel={plain ? nextPastel() : undefined}
          />
          <StatBlock
            icon={Hash}
            label="Pincode"
            value={draft.addressPincode?.trim() || '—'}
            accent={COLORS.primaryGlow}
            pastel={plain ? nextPastel() : undefined}
          />
        </HStack>

        <StatBlock
          icon={Ruler}
          label="Dimension"
          value={liveSiteDimension}
          accent={COLORS.primaryGlow}
          pastel={plain ? nextPastel() : undefined}
          fullWidth
        />

        <FieldRow
          icon={MessageSquareText}
          label="Comment"
          value={draft.siteDimensionComment?.trim() || '—'}
          plain={plain}
        />

        <VStack style={{ gap: SPACE[2] }}>
          <Text style={{ ...TYPE.label, color: COLORS.slate, fontSize: 12, letterSpacing: 0.6 }}>
            Site Schedules
          </Text>
          <HStack style={{ flexWrap: 'wrap', gap: 6 }}>
            {CARDINALS.map(({ k, label, color }) => (
              <CompassCell
                key={k}
                letter={k}
                label={label}
                value={draft.zcDirections?.[k]?.trim() || '—'}
                color={color}
                plain={plain}
              />
            ))}
          </HStack>
        </VStack>
      </VStack>
    </GlassCard>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  accent,
  pastel,
  fullWidth,
  inline,
  wrap,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  accent: string;
  pastel?: { bg: string; fg: string };
  fullWidth?: boolean;
  inline?: boolean;
  /** Allow long values (e.g. application number) to wrap instead of truncating. */
  wrap?: boolean;
}) {
  const radius = Math.max(10, DESIGN.cardRadius - 4);
  const fg = pastel?.fg ?? accent;
  const fill = pastel?.bg ?? hexAlpha(COLORS.primary, 0.05);
  const maxLines = fullWidth || wrap ? 4 : 1;

  return (
    <Box
      style={{
        flex: fullWidth ? undefined : 1,
        width: fullWidth ? '100%' : undefined,
        // Required so flex children can shrink and Text can wrap.
        minWidth: fullWidth ? undefined : 0,
      }}
    >
      <Box
        style={{
          borderRadius: radius,
          padding: inline ? SPACE[3] : SPACE[2],
          backgroundColor: fill,
          borderWidth: pastel ? 0 : 1,
          borderColor: pastel ? 'transparent' : hexAlpha(accent, 0.18),
          borderTopWidth: pastel ? 0 : 2,
          borderTopColor: pastel ? 'transparent' : accent,
        }}
      >
        {inline ? (
          <HStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <HStack style={{ alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Icon size={14} color={fg} strokeWidth={2.2} />
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 12,
                  color: fg,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                {label}
              </Text>
            </HStack>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 16,
                color: COLORS.ink,
                letterSpacing: 0.3,
                flex: 1,
                flexShrink: 1,
                textAlign: 'right',
              }}
              numberOfLines={maxLines}
            >
              {value}
            </Text>
          </HStack>
        ) : (
          <>
            <HStack style={{ alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Icon size={12} color={fg} strokeWidth={2.2} />
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 12,
                  color: pastel ? fg : COLORS.slate,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                {label}
              </Text>
            </HStack>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: wrap ? 14 : 16,
                color: COLORS.ink,
                letterSpacing: -0.3,
                lineHeight: wrap ? 18 : undefined,
                flexShrink: 1,
              }}
              numberOfLines={maxLines}
            >
              {value}
            </Text>
          </>
        )}
      </Box>
    </Box>
  );
}

function FieldRow({
  icon,
  label,
  value,
  plain,
}: {
  icon: typeof MessageSquareText;
  label: string;
  value: string;
  plain: boolean;
}) {
  return (
    <HStack
      style={{
        alignItems: 'flex-start',
        gap: SPACE[2],
        padding: plain ? SPACE[2] : 0,
        borderRadius: plain ? Math.max(10, DESIGN.cardRadius - 4) : 0,
        backgroundColor: plain ? '#F8FAFC' : 'transparent',
      }}
    >
      <GlassIcon icon={icon} color={COLORS.slate} size={13} />
      <VStack style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 12,
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
  plain,
}: {
  letter: string;
  label: string;
  value: string;
  color: string;
  plain: boolean;
}) {
  const radius = Math.max(10, DESIGN.cardRadius - 4);
  return (
    <Box style={{ width: '47%', flexGrow: 1 }}>
      <Box
        style={{
          borderRadius: radius,
          padding: SPACE[2],
          backgroundColor: plain ? hexAlpha(color, 0.1) : hexAlpha(COLORS.primary, 0.04),
          borderWidth: plain ? 0 : 1,
          borderColor: plain ? 'transparent' : hexAlpha(color, 0.22),
          borderTopWidth: plain ? 0 : 2,
          borderTopColor: plain ? 'transparent' : color,
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
              backgroundColor: plain ? hexAlpha(color, 0.18) : hexAlpha(COLORS.primary, 0.1),
              borderWidth: plain ? 0 : 1,
              borderColor: plain ? 'transparent' : hexAlpha(color, 0.35),
            }}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color }}>{letter}</Text>
          </Box>
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 12,
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
      </Box>
    </Box>
  );
}
