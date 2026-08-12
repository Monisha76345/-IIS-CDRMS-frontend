import {
  Building2,
  Crosshair,
  Eye,
  FileText,
  Grid3X3,
  Hash,
  Layers,
  MapPinned,
  MessageSquareText,
  Shield,
} from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import {
  computeBoundaryArea,
  siteDimensionToFormDims,
} from '@/src/cdrms/lib/resolveBoundaryDims';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import {
  CARDINAL_ACCENT,
  COLORS,
  FONTS,
  GRADIENT_PRIMARY,
  SPACE,
  gradientStops,
  hexAlpha,
} from '@/src/cdrms/theme';

const CARDINALS = [
  { k: 'N' as const, label: 'North', color: CARDINAL_ACCENT.N },
  { k: 'E' as const, label: 'East', color: CARDINAL_ACCENT.E },
  { k: 'S' as const, label: 'South', color: CARDINAL_ACCENT.S },
  { k: 'W' as const, label: 'West', color: CARDINAL_ACCENT.W },
];

const BLUE_BORDER = 'rgba(26,86,219,0.18)';
const BLUE_SOFT = '#EEF4FF';
const BLUE_CARD = '#F5F8FF';

/**
 * Step 1 — ZC assigned site details (view-only).
 * Compact blue-shade layout matching the ZC details mock.
 */
export function EngineerStickyHeader() {
  const { draft } = useProject();
  const liveSiteDimension = draft.siteDimensionMaster?.trim() || '—';
  const appNo = draft.applicationNumber?.trim() || '—';
  const siteNo = draft.siteNo?.trim() || '—';
  const zone = draft.zoneCode?.trim() || '—';
  const siteType = draft.siteDimensionType || '—';
  const comment = draft.siteDimensionComment?.trim() || '—';

  const parsed = siteDimensionToFormDims(draft.siteDimensionMaster);
  const n = Number(parsed?.north) || 0;
  const s = Number(parsed?.south) || 0;
  const e = Number(parsed?.east) || 0;
  const w = Number(parsed?.west) || 0;
  const hasDiagram = n > 0 && s > 0 && e > 0 && w > 0;
  const totalArea = hasDiagram
    ? computeBoundaryArea({ north: n, south: s, east: e, west: w })
    : null;
  const isOdd = siteType === 'Odd';

  return (
    <VStack style={{ gap: 8, paddingHorizontal: SPACE.gutter }}>
      {/* Capsule-bordered ZC assigned panel — all ZC fields from draft/API */}
      <Box
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 28,
          padding: 10,
          borderWidth: 1.5,
          borderColor: hexAlpha(COLORS.primary, 0.28),
          shadowColor: COLORS.primaryDeep,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        <HStack className="items-center justify-between" style={{ marginBottom: 8 }}>
          <HStack className="items-center" style={{ gap: 6 }}>
            <Box
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                backgroundColor: BLUE_SOFT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={12} color={COLORS.primary} strokeWidth={2.4} />
            </Box>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 13,
                letterSpacing: 0.7,
                color: '#1A368E',
                textTransform: 'uppercase',
              }}
            >
               APPLICATION DETAILS
            </Text>
          </HStack>
          <HStack
            className="items-center"
            style={{
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: BLUE_SOFT,
              borderWidth: 1,
              borderColor: hexAlpha(COLORS.primary, 0.28),
            }}
          >
            <Eye size={11} color={COLORS.primary} strokeWidth={2.4} />
            <Text
              style={{
                fontFamily: FONTS.semibold,
                fontSize: 10,
                color: COLORS.primary,
              }}
            >
              View only
            </Text>
          </HStack>
        </HStack>

        <HStack style={{ gap: 8, alignItems: 'stretch' }}>
          <Box style={{ flex: 1.2, borderRadius: 18, overflow: 'hidden' }}>
            <LinearGradient
              colors={gradientStops(GRADIENT_PRIMARY)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                paddingHorizontal: 12,
                paddingTop: 10,
                paddingBottom: 10,
                overflow: 'hidden',
              }}
            >
              <VStack style={{ flex: 1, justifyContent: 'space-between' }}>
                <VStack style={{ gap: 3 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 10,
                      letterSpacing: 0.6,
                      color: 'rgba(255,255,255,0.85)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Site no
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 30,
                      lineHeight: 34,
                      color: COLORS.white,
                      letterSpacing: -0.4,
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                  >
                    {siteNo}
                  </Text>
                </VStack>

                <Box
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: 'rgba(255,255,255,0.35)',
                    marginVertical: 8,
                  }}
                />

                <VStack style={{ gap: 3 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 10,
                      letterSpacing: 0.5,
                      color: 'rgba(255,255,255,0.8)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Application no
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 15,
                      lineHeight: 19,
                      color: COLORS.white,
                    }}
                    numberOfLines={2}
                  >
                    {appNo}
                  </Text>
                </VStack>

                <HStack
                  className="items-center justify-end"
                  style={{ marginTop: 10 }}
                >
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.28)',
                    }}
                  >
                    <FileText size={20} color={COLORS.white} strokeWidth={2.2} />
                  </Box>
                </HStack>
              </VStack>
            </LinearGradient>
          </Box>

          <VStack style={{ flex: 0.8, gap: 6 }}>
            <SideStat
              icon={MapPinned}
              iconBg="#DCFCE7"
              iconFg="#059669"
              label="Zone"
              value={zone}
            />
            <SideStat
              icon={Layers}
              iconBg="#EDE9FE"
              iconFg="#7C3AED"
              label="Type"
              value={siteType}
            />
            <SideStat
              icon={Crosshair}
              iconBg={BLUE_SOFT}
              iconFg={COLORS.primary}
              label="Dimension"
              value={liveSiteDimension}
            />
          </VStack>
        </HStack>
      </Box>

      <HStack style={{ gap: 8 }}>
        <MetaTile
          icon={FileText}
          iconBg={BLUE_SOFT}
          iconFg={COLORS.primary}
          label="E-office"
          value={draft.eOfficeNumber?.trim() || '—'}
        />
        <MetaTile
          icon={MapPinned}
          iconBg="#DCFCE7"
          iconFg="#059669"
          label="Area"
          value={draft.addressArea?.trim() || '—'}
        />
      </HStack>
      <HStack style={{ gap: 8 }}>
        <MetaTile
          icon={Grid3X3}
          iconBg="#EDE9FE"
          iconFg="#7C3AED"
          label="Block"
          value={draft.addressBlock?.trim() || '—'}
        />
        <MetaTile
          icon={Hash}
          iconBg="#FFEDD5"
          iconFg="#C2410C"
          label="Pincode"
          value={draft.addressPincode?.trim() || '—'}
        />
      </HStack>
      <MetaTile
        icon={MessageSquareText}
        iconBg={BLUE_SOFT}
        iconFg={COLORS.primary}
        label="Comment"
        value={comment}
        full
      />

      {hasDiagram ? (
        <Box
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 10,
            borderWidth: 1,
            borderColor: BLUE_BORDER,
            shadowColor: COLORS.primaryDeep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <HStack className="items-center justify-between" style={{ marginBottom: 8, gap: 8 }}>
            <HStack className="items-center" style={{ gap: 8, flex: 1 }}>
              <Box
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  backgroundColor: BLUE_SOFT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Crosshair size={15} color={COLORS.primary} strokeWidth={2.3} />
              </Box>
              <VStack style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: '#1A368E' }}>
                  Dimension sketch
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.semibold,
                    fontSize: 12,
                    color: '#475569',
                    lineHeight: 16,
                  }}
                >
                  Plot outline · ZC schedules
                </Text>
              </VStack>
            </HStack>
            <Box
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: BLUE_SOFT,
              }}
            >
              <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: COLORS.primary }}>
                {liveSiteDimension}
              </Text>
            </Box>
          </HStack>

          <Box
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: BLUE_CARD,
              borderWidth: 1,
              borderColor: BLUE_BORDER,
            }}
          >
            <BoundariesDiagram
              north={n}
              south={s}
              east={e}
              west={w}
              odd={isOdd}
              siteNo={draft.siteNo}
              totalArea={totalArea}
              scheduleNorth={draft.zcDirections?.N}
              scheduleSouth={draft.zcDirections?.S}
              scheduleEast={draft.zcDirections?.E}
              scheduleWest={draft.zcDirections?.W}
              embedded
            />
          </Box>
        </Box>
      ) : (
        <Box
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 10,
            borderWidth: 1,
            borderColor: BLUE_BORDER,
          }}
        >
          <HStack className="items-center" style={{ gap: 6, marginBottom: 8 }}>
            <Building2 size={14} color={COLORS.primary} strokeWidth={2.3} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
              Site Schedules
            </Text>
          </HStack>
          <HStack style={{ flexWrap: 'wrap', gap: 6 }}>
            {CARDINALS.map(({ k, label, color }) => (
              <Box
                key={k}
                style={{
                  width: '47%',
                  flexGrow: 1,
                  borderRadius: 12,
                  padding: 8,
                  backgroundColor: hexAlpha(color, 0.08),
                  borderWidth: 1,
                  borderColor: hexAlpha(color, 0.2),
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 11,
                    color,
                    marginBottom: 2,
                  }}
                >
                  {label}
                </Text>
                <Text
                  style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}
                  numberOfLines={2}
                >
                  {draft.zcDirections?.[k]?.trim() || '—'}
                </Text>
              </Box>
            ))}
          </HStack>
        </Box>
      )}
    </VStack>
  );
}

function SideStat({
  icon: Icon,
  iconBg,
  iconFg,
  label,
  value,
}: {
  icon: typeof MapPinned;
  iconBg: string;
  iconFg: string;
  label: string;
  value: string;
}) {
  return (
    <Box
      style={{
        flex: 1,
        borderRadius: 12,
        paddingHorizontal: 7,
        paddingVertical: 4,
        backgroundColor: BLUE_CARD,
        borderWidth: 1,
        borderColor: BLUE_BORDER,
        justifyContent: 'center',
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <HStack className="items-center" style={{ gap: 6 }}>
        <Box
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={10} color={iconFg} strokeWidth={2.3} />
        </Box>
        <VStack style={{ flex: 1, minWidth: 0, gap: 0 }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 11,
              letterSpacing: 0.3,
              color: '#1A368E',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 13,
              color: '#0F172A',
            }}
            numberOfLines={1}
          >
            {value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

function MetaTile({
  icon: Icon,
  iconBg,
  iconFg,
  label,
  value,
  full,
}: {
  icon: typeof FileText;
  iconBg: string;
  iconFg: string;
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <Box
      style={{
        flex: full ? undefined : 1,
        width: full ? '100%' : undefined,
        minWidth: full ? undefined : 0,
        borderRadius: full ? 18 : 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: hexAlpha(COLORS.primary, 0.22),
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <HStack className="items-center" style={{ gap: 7 }}>
        <Box
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={12} color={iconFg} strokeWidth={2.3} />
        </Box>
        <VStack style={{ flex: 1, minWidth: 0, gap: 0 }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 12,
              letterSpacing: 0.3,
              color: '#1A368E',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 13,
              color: '#0F172A',
              lineHeight: 17,
            }}
            numberOfLines={full ? 3 : 1}
          >
            {value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}
