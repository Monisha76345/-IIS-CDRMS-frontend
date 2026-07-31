import { MapPin, RefreshCw } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { GeoAddress } from '@/src/cdrms/hooks/useDeviceLocation';
import type { GpsFix } from '@/src/cdrms/project/types';
import { COLORS, FONTS, SPACE, TYPE } from '@/src/cdrms/theme';

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
};

/**
 * Live phone GPS — white shadow tile + black text (Step 1 alignment).
 */
export function LiveGpsPanel({
  gps,
  address,
  loading = false,
  error,
  onRefresh,
  syNo,
  siteNo,
  layoutName,
  title = 'Live location',
  hideTitleHeader = false,
}: LiveGpsPanelProps) {
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

  return (
    <VStack style={{ gap: SPACE[2] }}>
      {showOuterHeader ? (
        <HStack className="items-center justify-between" style={{ minHeight: 32 }}>
          <Text style={{ ...TYPE.label, color: COLORS.ink }}>{title}</Text>
          <Pressable
            onPress={onRefresh}
            accessibilityLabel="Refresh live location"
            className="active:opacity-80"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: COLORS.white,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.ink} />
            ) : (
              <RefreshCw size={15} color={COLORS.ink} strokeWidth={2.4} />
            )}
          </Pressable>
        </HStack>
      ) : null}

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
        <HStack className="items-center" style={{ gap: SPACE[2] }}>
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: COLORS.white,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <MapPin size={18} color={COLORS.primary} strokeWidth={2.4} />
          </Box>

          <VStack className="flex-1 min-w-0" style={{ gap: 3 }}>
            <HStack className="items-center" style={{ gap: SPACE[2] }}>
              <Box
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: hasFix ? COLORS.success : COLORS.warning,
                }}
              />
              <Text
                style={{
                  ...TYPE.caption,
                  fontFamily: FONTS.bold,
                  color: COLORS.ink,
                }}
              >
                {hasFix
                  ? 'LIVE LOCATION'
                  : loading
                    ? 'Finding location…'
                    : error || 'Waiting for location'}
              </Text>
              {accuracyLabel ? (
                <Text style={{ ...TYPE.caption, fontFamily: FONTS.semibold, color: COLORS.ink }}>
                  {accuracyLabel}
                </Text>
              ) : null}
            </HStack>

            <Text
              style={{ ...TYPE.bodyStrong, fontSize: 13, color: COLORS.ink }}
              numberOfLines={2}
            >
              {placeLabel ||
                (hasFix ? 'Your current location' : 'Allow Location on this phone')}
            </Text>

            {areaLine ? (
              <Text style={{ ...TYPE.caption, color: COLORS.ink }} numberOfLines={1}>
                {areaLine}
                {pinCode ? ` · ${pinCode}` : ''}
              </Text>
            ) : null}
          </VStack>

          {!showOuterHeader ? (
            <Pressable
              onPress={onRefresh}
              accessibilityLabel="Refresh live location"
              className="active:opacity-80"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: COLORS.white,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.ink} />
              ) : (
                <RefreshCw size={15} color={COLORS.ink} strokeWidth={2.4} />
              )}
            </Pressable>
          ) : null}
        </HStack>
      </Box>
    </VStack>
  );
}
