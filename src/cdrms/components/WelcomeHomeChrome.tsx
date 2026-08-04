import { Clock } from 'lucide-react-native';
import { Image, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { displayName } from '@/src/auth/roles';
import type { AuthUser } from '@/src/auth/AuthContext';
import {
  ProfileMenu,
  ZoneTag,
} from '@/src/cdrms/components/primitives';
import { HeaderMeshBackground, MeshSheetEdge, WaveSheetEdge } from '@/src/cdrms/components/WaveDecor';
import {
  COLORS,
  DESIGN,
  FONTS,
  GRADIENT_HEADER,
  gradientStops,
  headerFg,
  hexAlpha,
  isMeshDesign,
  isWaveDesign,
  usesLightHeader,
  usesNormalHeader,
  usesSolidHeader,
} from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

/** Soft transparent BDA seal behind Welcome / list pages (all themes). */
export function BdaPageWatermark() {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width * 0.88, 360);
  const opacity = usesLightHeader() ? 0.16 : 0.14;
  // Keep well below the welcome header and above the solid footer bar.
  const topPad = Math.max(220, height * 0.28);
  const bottomPad = 110;
  return (
    <Box
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: topPad,
        bottom: bottomPad,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
        elevation: -1,
      }}
    >
      <Image
        pointerEvents="none"
        source={require('../../../assets/bda-logo-transparent.png')}
        style={{ width: size, height: size, opacity }}
        resizeMode="contain"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </Box>
  );
}

/** Welcome activity cards — light fill so BDA watermark shows through. */
export const WELCOME_CARD_PASTELS = [
  'rgba(236,253,245,0.48)',
  'rgba(238,242,255,0.48)',
  'rgba(254,243,199,0.48)',
  'rgba(252,231,243,0.48)',
] as const;

export function welcomeCardSurface(index = 0) {
  const plain = usesLightHeader();
  return {
    backgroundColor: plain
      ? WELCOME_CARD_PASTELS[index % WELCOME_CARD_PASTELS.length]
      : 'rgba(255,255,255,0.72)',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 } as const,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: hexAlpha(COLORS.primary, 0.55),
    // Do not set overflow:'hidden' here — it clips the border on Android.
  };
}

/**
 * Shared Welcome header — same chrome for Engineer / ZC / CAO.
 * Plain / Ocean Blue: no wave edge.
 * Wave: continuous glass wave edge.
 * Mesh: soft rounded shell + scalloped lobes (not Wave).
 * Teal / Violet: opaque wave sheet.
 */
export function WelcomeHomeHeader({
  user,
  zoneLabel,
  go: _go,
  tagline = 'Manage your field surveys',
  eyebrow = 'Field survey',
  onLogout,
}: {
  user: AuthUser | null | undefined;
  zoneLabel?: string | null;
  go: Go;
  tagline?: string;
  eyebrow?: string;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();
  const firstName = displayName(user).split(' ')[0] || 'there';
  const fg = headerFg();
  const resolvedZone =
    zoneLabel?.trim() || user?.activePost?.zoneCode?.trim() || null;

  const dateLabel = new Date().toLocaleString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dateRow = (
    <HStack className="items-center" style={{ gap: 6, marginTop: usesLightHeader() ? 12 : 16 }}>
      <Clock size={13} color={fg.icon} />
      <Text className="text-[11px]" style={{ color: fg.muted }}>
        {dateLabel}
      </Text>
    </HStack>
  );

  /** Date sits inside the wave band (follows the wave flow under Welcome). */
  const waveDateRow = (
    <HStack
      pointerEvents="none"
      className="items-center"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 10,
        zIndex: 25,
        gap: 6,
      }}
    >
      <Clock size={12} color={COLORS.primaryDeep} strokeWidth={2.3} />
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: FONTS.semibold,
          fontSize: 11,
          lineHeight: 14,
          color: COLORS.ink,
        }}
      >
        {dateLabel}
      </Text>
    </HStack>
  );

  const profile = (
    <HStack
      className="items-center gap-2"
      style={{ zIndex: 40, elevation: 12, position: 'relative' }}
    >
      {resolvedZone ? <ZoneTag zone={resolvedZone} onGradient={!usesLightHeader()} /> : null}
      <ProfileMenu
        gradient={!usesLightHeader()}
        userName={displayName(user)}
        roleName={user?.roleName}
        loginId={user?.officer?.personUniqueId || user?.loginId}
        photoUrl={user?.profilePhoto || user?.officer?.profilePhoto}
        zoneLabel={resolvedZone}
        onLogout={onLogout}
      />
    </HStack>
  );

  if (usesLightHeader()) {
    return (
      <Box
        style={{
          backgroundColor: COLORS.white,
          paddingBottom: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 8,
          zIndex: 30,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: 'rgba(15,23,42,0.08)',
        }}
      >
        <Box className="px-5" style={{ paddingTop: insets.top + 8 }}>
          <HStack className="items-center justify-between">
            <VStack className="flex-1 min-w-0" style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: FONTS.displayBold,
                  fontSize: 26,
                  lineHeight: 32,
                  letterSpacing: -0.4,
                  color: fg.title,
                }}
                numberOfLines={1}
              >
                Hey, {firstName}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 14,
                  lineHeight: 18,
                  color: fg.muted,
                }}
                numberOfLines={1}
              >
                {tagline}
              </Text>
            </VStack>
            {profile}
          </HStack>
          {dateRow}
        </Box>
      </Box>
    );
  }

  if (usesSolidHeader()) {
    return (
      <LinearGradient
        colors={gradientStops(GRADIENT_HEADER)}
        start={DESIGN.headerStart}
        end={DESIGN.headerEnd}
        style={{ paddingBottom: 16, zIndex: 30, elevation: 8 }}
      >
        <Box className="px-5" style={{ paddingTop: insets.top + 8, zIndex: 2 }}>
          <HStack className="items-center justify-between">
            <VStack className="flex-1 min-w-0" style={{ gap: 3 }}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  lineHeight: 16,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: fg.muted,
                }}
                numberOfLines={1}
              >
                {eyebrow}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.displayBold,
                  fontSize: 26,
                  lineHeight: 32,
                  letterSpacing: -0.4,
                  color: fg.title,
                }}
                numberOfLines={1}
              >
                Welcome
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 14,
                  lineHeight: 18,
                  letterSpacing: 0.1,
                  color: fg.soft,
                }}
                numberOfLines={1}
              >
                {displayName(user)}
              </Text>
            </VStack>
            {profile}
          </HStack>
          {dateRow}
        </Box>
      </LinearGradient>
    );
  }

  // Mesh — soft asymmetric shell + scallop lobes (not Wave’s continuous edge)
  if (isMeshDesign()) {
    const r = DESIGN.headerRadius || 40;
    return (
      <Box style={{ zIndex: 30, elevation: 8 }}>
        <Box
          style={{
            overflow: 'hidden',
            zIndex: 1,
            borderBottomLeftRadius: r,
            borderBottomRightRadius: Math.round(r * 0.35),
          }}
        >
          <HeaderMeshBackground />
          <Box
            className="px-5"
            style={{
              paddingTop: insets.top + 10,
              zIndex: 2,
              paddingBottom: 18,
            }}
          >
            <HStack className="items-start justify-between" style={{ gap: 12 }}>
              <VStack className="flex-1 min-w-0" style={{ gap: 8 }}>
                <Box
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: hexAlpha('#FFFFFF', 0.22),
                    borderWidth: 1,
                    borderColor: hexAlpha('#FFFFFF', 0.35),
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 11,
                      lineHeight: 14,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: fg.title,
                    }}
                    numberOfLines={1}
                  >
                    {eyebrow}
                  </Text>
                </Box>
                <Text
                  style={{
                    fontFamily: FONTS.displayBold,
                    fontSize: 28,
                    lineHeight: 34,
                    letterSpacing: -0.5,
                    color: fg.title,
                  }}
                  numberOfLines={1}
                >
                  Hi, {firstName}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 13,
                    lineHeight: 17,
                    color: fg.soft,
                  }}
                  numberOfLines={1}
                >
                  {tagline}
                </Text>
                <HStack
                  className="items-center"
                  style={{
                    alignSelf: 'flex-start',
                    gap: 6,
                    marginTop: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: hexAlpha('#FFFFFF', 0.2),
                    borderWidth: 1,
                    borderColor: hexAlpha('#FFFFFF', 0.28),
                  }}
                >
                  <Clock size={12} color={fg.icon} strokeWidth={2.3} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 11,
                      lineHeight: 14,
                      color: fg.title,
                      maxWidth: 220,
                    }}
                  >
                    {dateLabel}
                  </Text>
                </HStack>
              </VStack>
              {profile}
            </HStack>
          </Box>
        </Box>
        <Box style={{ position: 'relative', zIndex: 20 }}>
          <MeshSheetEdge height={70} pullUp={26} fill={COLORS.white} />
        </Box>
      </Box>
    );
  }

  return (
    <Box style={{ zIndex: 30, elevation: 8 }}>
      {/* Wave / Teal / Violet — title / name; date in wave band */}
      <Box style={{ overflow: 'hidden', zIndex: 1 }}>
        <HeaderMeshBackground />
        <Box
          className="px-5"
          style={{
            paddingTop: insets.top + 8,
            zIndex: 2,
            paddingBottom: 6,
          }}
        >
          <HStack className="items-center justify-between">
            <VStack className="flex-1 min-w-0" style={{ gap: 3 }}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  lineHeight: 16,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: fg.muted,
                }}
                numberOfLines={1}
              >
                {eyebrow}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.displayBold,
                  fontSize: 26,
                  lineHeight: 32,
                  letterSpacing: -0.4,
                  color: fg.title,
                }}
                numberOfLines={1}
              >
                Welcome
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 14,
                  lineHeight: 18,
                  letterSpacing: 0.1,
                  color: fg.soft,
                }}
                numberOfLines={1}
              >
                {displayName(user)}
              </Text>
            </VStack>
            {profile}
          </HStack>
        </Box>
      </Box>
      <Box style={{ position: 'relative', zIndex: 20 }}>
        <WaveSheetEdge
          height={72}
          pullUp={28}
          fill={COLORS.white}
          variant={isWaveDesign() ? 'glass' : 'sheet'}
        />
        {waveDateRow}
      </Box>
    </Box>
  );
}

export function welcomeFilterGap() {
  // Mesh scallops sit closer; Wave date band needs a bit more air
  if (isMeshDesign()) return 6;
  return usesNormalHeader() ? 12 : 8;
}
