import { CalendarDays, Clock } from 'lucide-react-native';
import { Image, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { displayName, roleDisplayTitle } from '@/src/auth/roles';
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
  headerFg,
  hexAlpha,
  isMeshDesign,
  isWaveDesign,
  usesLightHeader,
  usesNormalHeader,
  usesSolidHeader,
} from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

const BDA_BUILDING = require('../../../assets/bda-building.png');

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

/** Application list cards — single subtle border (no stacked cardSurface + welcome borders). */
export function listCardSurface(index = 0) {
  const plain = usesLightHeader();
  return {
    backgroundColor: plain
      ? WELCOME_CARD_PASTELS[index % WELCOME_CARD_PASTELS.length]
      : 'rgba(255,255,255,0.92)',
    borderRadius: DESIGN.cardRadius,
    marginBottom: 8,
    padding: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.1)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 } as const,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  };
}

/** Inner clip radius — keeps left status rail flush with card corners. */
export function listCardInnerRadius() {
  return Math.max(DESIGN.cardRadius - 1, 0);
}

export function listCardInnerClipStyle() {
  const radius = listCardInnerRadius();
  return {
    alignItems: 'stretch' as const,
    overflow: 'hidden' as const,
    borderRadius: radius,
  };
}

export function listCardStatusRailStyle(color: string, width = 5) {
  const radius = listCardInnerRadius();
  return {
    width,
    backgroundColor: color,
    alignSelf: 'stretch' as const,
    borderTopLeftRadius: radius,
    borderBottomLeftRadius: radius,
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
  eyebrow,
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
  const headerEyebrow = eyebrow ?? roleDisplayTitle(user);
  const fg = headerFg();
  const resolvedZone =
    zoneLabel?.trim() || user?.activePost?.zoneCode?.trim() || null;

  const now = new Date();
  const dateLabel = now.toLocaleString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const compactDateLabel = now
    .toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(',', ' •');
  const hour = now.getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';

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
      <Box style={{ position: 'relative' }}>
        <ProfileMenu
          gradient={!usesLightHeader()}
          userName={displayName(user)}
          roleName={roleDisplayTitle(user)}
          loginId={user?.officer?.personUniqueId || user?.loginId}
          photoUrl={user?.profilePhoto || user?.officer?.profilePhoto}
          zoneLabel={resolvedZone}
          onLogout={onLogout}
        />
        {!usesLightHeader() ? (
          <Box
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 1,
              bottom: 1,
              width: 11,
              height: 11,
              borderRadius: 999,
              backgroundColor: '#22C55E',
              borderWidth: 2,
              borderColor: COLORS.white,
              zIndex: 60,
            }}
          />
        ) : null}
      </Box>
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
      <Box style={{ zIndex: 30, elevation: 8, overflow: 'hidden' }}>
        <Image
          source={BDA_BUILDING}
          style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(15,23,42,0.62)', 'rgba(15,23,42,0.32)', 'rgba(15,23,42,0.5)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <Box
          className="px-5"
          style={{
            paddingTop: insets.top + 10,
            paddingBottom: 18,
            zIndex: 2,
          }}
        >
          <HStack className="items-center justify-between" style={{ gap: 10 }}>
            <HStack
              className="items-center"
              style={{
                flexShrink: 1,
                minWidth: 0,
                maxWidth: '58%',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.4)',
              }}
            >
              <Box
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: '#60A5FA',
                  flexShrink: 0,
                }}
              />
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 11,
                  lineHeight: 14,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  color: COLORS.white,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {headerEyebrow}
              </Text>
            </HStack>
            <Box style={{ flexShrink: 0 }}>{profile}</Box>
          </HStack>

          <VStack style={{ gap: 2, marginTop: 22 }}>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 16,
                lineHeight: 22,
                color: 'rgba(255,255,255,0.92)',
              }}
              numberOfLines={1}
            >
              {timeGreeting}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 28,
                lineHeight: 34,
                letterSpacing: -0.3,
                color: COLORS.white,
              }}
              numberOfLines={1}
            >
              {displayName(user)}
            </Text>
            <Box
              style={{
                marginTop: 6,
                width: 36,
                height: 3,
                borderRadius: 999,
                backgroundColor: '#3B82F6',
              }}
            />
          </VStack>

          <HStack
            className="items-center"
            style={{
              alignSelf: 'flex-start',
              gap: 8,
              marginTop: 18,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: COLORS.white,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.14,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <CalendarDays size={14} color={COLORS.primary} strokeWidth={2.4} />
            <Text
              style={{
                fontFamily: FONTS.semibold,
                fontSize: 12,
                lineHeight: 16,
                color: COLORS.primaryDeep,
              }}
              numberOfLines={1}
            >
              {compactDateLabel}
            </Text>
          </HStack>
        </Box>
      </Box>
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
                    {headerEyebrow}
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
                {headerEyebrow}
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
  // Mesh scallops sit closer; photo header needs a small air gap before status cards
  if (isMeshDesign()) return 6;
  if (usesSolidHeader()) return 12;
  return usesNormalHeader() ? 12 : 8;
}
