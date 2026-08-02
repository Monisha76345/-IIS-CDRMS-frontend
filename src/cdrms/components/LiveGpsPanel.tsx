import { MapPin, RefreshCw } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { FrostedGlass } from '@/src/cdrms/components/GlassSurface';
import type { GeoAddress } from '@/src/cdrms/hooks/useDeviceLocation';
import type { GpsFix } from '@/src/cdrms/project/types';
import { COLORS, FONTS, GLASS, SPACE, TYPE, DESIGN } from '@/src/cdrms/theme';

type LiveGpsPanelProps = {
  gps: GpsFix | null;
  address?: GeoAddress | null;
  loading?: boolean;
  error?: string | null;
  onRefresh: () => void;
  syNo?: string | null;
  siteNo?: string | null;
  layoutName?: string | null;
  /** @deprecated Map removed — kept for call-site compatibility. */
  mapHeight?: number;
  title?: string | null;
  hideTitleHeader?: boolean;
  variant?: 'default' | 'premium';
};

/**
 * Live phone GPS — default tile or premium frosted panel (compass step).
 */
export function LiveGpsPanel({
  gps,
  address,
  loading = false,
  error,
  onRefresh,
  title = 'Live location',
  hideTitleHeader = false,
  variant = 'default',
}: LiveGpsPanelProps) {
  const isPremium = variant === 'premium';
  const hasFix = gps?.latitude != null && gps?.longitude != null;
  const placeLabel =
    address?.displayName?.trim() ||
    address?.village?.trim() ||
    address?.area?.trim() ||
    undefined;
  const accuracyLabel =
    gps?.accuracy != null ? `±${Math.round(gps.accuracy)} m` : null;
  const areaLine = [address?.area, address?.block, address?.district, address?.state]
    .filter(Boolean)
    .join(' · ');
  const pinCode = address?.postalCode?.trim();

  const showOuterHeader = !hideTitleHeader && Boolean(title);

  const refreshBtn = (
    <Pressable
      onPress={onRefresh}
      accessibilityLabel="Refresh live location"
      className="active:opacity-80"
      style={{
        width: 30,
        height: 30,
        borderRadius: DESIGN.stepRadius,
        backgroundColor: isPremium ? GLASS.tintBlue : COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: isPremium ? '#BFDBFE' : COLORS.border,
        ...(isPremium
          ? {}
          : {
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }),
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPremium ? COLORS.primary : COLORS.ink} />
      ) : (
        <RefreshCw
          size={14}
          color={isPremium ? COLORS.primary : COLORS.ink}
          strokeWidth={2.4}
        />
      )}
    </Pressable>
  );

  const panelBody = (
    <HStack className="items-start" style={{ gap: SPACE[2] }}>
      <Box
        style={{
          width: 32,
          height: 32,
          borderRadius: DESIGN.chipRadius,
          backgroundColor: isPremium ? GLASS.tintBlue : COLORS.white,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: isPremium ? 1 : 0,
          borderColor: '#BFDBFE',
          ...(isPremium
            ? {}
            : {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              }),
        }}
      >
        <MapPin size={16} color={COLORS.primary} strokeWidth={2.4} />
      </Box>

      <VStack className="flex-1 min-w-0" style={{ gap: 3 }}>
        <HStack className="items-center" style={{ gap: SPACE[2] }}>
          <Box
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: hasFix ? COLORS.success : COLORS.warning,
            }}
          />
          <Text
            style={{
              ...TYPE.caption,
              fontFamily: FONTS.bold,
              color: COLORS.ink,
              fontSize: isPremium ? 10 : undefined,
            }}
          >
            {hasFix
              ? 'LIVE LOCATION'
              : loading
                ? 'Finding location…'
                : error || 'Waiting for location'}
          </Text>
          {accuracyLabel ? (
            <Text
              style={{
                ...TYPE.caption,
                fontFamily: FONTS.semibold,
                color: isPremium ? COLORS.slate : COLORS.ink,
                fontSize: isPremium ? 10 : undefined,
              }}
            >
              {accuracyLabel}
            </Text>
          ) : null}
        </HStack>

        <Text
          style={{
            ...TYPE.bodyStrong,
            fontSize: isPremium ? 12 : 13,
            color: COLORS.ink,
            lineHeight: isPremium ? 17 : 18,
            flexShrink: 1,
          }}
        >
          {placeLabel ||
            (hasFix ? 'Your current location' : 'Allow Location on this phone')}
        </Text>

        {areaLine ? (
          <Text
            style={{
              ...TYPE.caption,
              color: COLORS.slate,
              fontSize: isPremium ? 11 : undefined,
              lineHeight: isPremium ? 16 : 18,
              flexShrink: 1,
            }}
          >
            {areaLine}
            {pinCode ? ` · ${pinCode}` : ''}
          </Text>
        ) : null}
      </VStack>

      {!showOuterHeader ? (
        <Box style={{ marginTop: 2 }}>{refreshBtn}</Box>
      ) : null}
    </HStack>
  );

  return (
    <VStack style={{ gap: SPACE[2] }}>
      {showOuterHeader ? (
        <HStack className="items-center justify-between" style={{ minHeight: 32 }}>
          <Text style={{ ...TYPE.label, color: COLORS.ink }}>{title}</Text>
          {refreshBtn}
        </HStack>
      ) : null}

      {isPremium ? (
        <FrostedGlass
          borderRadius={12}
          padding={SPACE[2]}
          fill={GLASS.surfaceSolid}
          sheen={false}
          style={{ borderTopWidth: 2, borderTopColor: COLORS.primary }}
        >
          {panelBody}
        </FrostedGlass>
      ) : (
        <Box
          style={{
            borderRadius: DESIGN.cardRadius,
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
          {panelBody}
        </Box>
      )}
    </VStack>
  );
}
