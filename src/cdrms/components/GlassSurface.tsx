import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { COLORS, FONTS, GLASS, GRADIENT_CARD_HEADER, GRADIENT_MESH, SPACE } from '@/src/cdrms/theme';

type FrostedProps = {
  children: ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
  padding?: number;
  /** Base fill — same hex on emulator + real phone */
  fill?: string;
  /** Top reflection sheen — off for inner content panels */
  sheen?: boolean;
};

/**
 * Deterministic frosted glass — fixed colors + optional reflection sheen.
 */
export function FrostedGlass({
  children,
  style,
  borderRadius = 14,
  padding = 0,
  fill = GLASS.card,
  sheen = true,
}: FrostedProps) {
  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          backgroundColor: fill,
          borderWidth: 1,
          borderColor: GLASS.border,
          shadowColor: GLASS.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.08,
          shadowRadius: 16,
          elevation: 4,
        },
        style,
      ]}
    >
      {sheen ? <ReflectionSheen borderRadius={borderRadius} /> : null}
      <View style={{ padding, zIndex: 1 }}>{children}</View>
    </View>
  );
}

/** Top-edge light reflection */
function ReflectionSheen({ borderRadius }: { borderRadius: number }) {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(255,255,255,0.35)',
          'rgba(255,255,255,0.08)',
          'rgba(255,255,255,0)',
        ]}
        locations={[0, 0.25, 0.55]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 1,
          left: 16,
          right: 16,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.9)',
        }}
      />
    </>
  );
}

type GlassSurfaceProps = {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
};

export function GlassSurface({ children, style, padding = SPACE[3] }: GlassSurfaceProps) {
  return (
    <FrostedGlass
      borderRadius={14}
      padding={padding}
      fill={GLASS.surfaceSolid}
      sheen={false}
      style={style}
    >
      {children}
    </FrostedGlass>
  );
}

export function GlassIcon({
  icon: Icon,
  color = '#2563EB',
  size = 15,
}: {
  icon: LucideIcon;
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: GLASS.iconBg,
        borderWidth: 1,
        borderColor: GLASS.borderSoft,
      }}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </View>
  );
}

export function GlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          marginHorizontal: SPACE.gutter,
          marginBottom: 0,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: GLASS.cardSolid,
          borderWidth: 1,
          borderColor: GLASS.border,
          shadowColor: GLASS.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.07,
          shadowRadius: 18,
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Pill badge for gradient card headers */
export function GlassHeaderBadge({ children }: { children: ReactNode }) {
  return (
    <HStack
      style={{
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
      }}
    >
      {children}
    </HStack>
  );
}

/** Blue mesh-shader card header — cyan → blue gradient + soft orbs */
export function GlassCardHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge?: ReactNode;
}) {
  return (
    <Box style={{ overflow: 'hidden' }}>
      <LinearGradient
        colors={[...GRADIENT_CARD_HEADER]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Box
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -28,
          right: -20,
          width: 110,
          height: 110,
          borderRadius: 999,
          backgroundColor: 'rgba(34,211,238,0.2)',
        }}
      />
      <Box
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -35,
          left: -25,
          width: 100,
          height: 100,
          borderRadius: 999,
          backgroundColor: 'rgba(29,78,216,0.25)',
        }}
      />
      <Box
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 20,
          left: '42%',
          width: 70,
          height: 70,
          borderRadius: 999,
          backgroundColor: 'rgba(99,102,241,0.14)',
        }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(15,23,42,0.12)']}
        start={{ x: 0.5, y: 0.4 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <HStack
        style={{
          alignItems: 'center',
          gap: SPACE[2],
          paddingHorizontal: SPACE[3],
          paddingVertical: SPACE[3],
          zIndex: 2,
        }}
      >
        <Box
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.14)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
            shadowColor: '#0EA5E9',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.18,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Icon size={17} color="#FFFFFF" strokeWidth={2} />
        </Box>
        <VStack style={{ flex: 1, gap: 1 }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 15,
              color: '#FFFFFF',
              letterSpacing: -0.2,
              textShadowColor: 'rgba(15,23,42,0.25)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 11,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            {subtitle}
          </Text>
        </VStack>
        {badge ?? null}
      </HStack>
    </Box>
  );
}

/** Premium survey section — gradient header + white body */
export function GlassSectionCard({
  title,
  subtitle,
  icon,
  badge,
  children,
  bodyStyle,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge?: ReactNode;
  children: ReactNode;
  bodyStyle?: ViewStyle;
}) {
  return (
    <GlassCard>
      <GlassCardHeader title={title} subtitle={subtitle} icon={icon} badge={badge} />
      <VStack
        style={[
          {
            padding: SPACE[3],
            gap: SPACE[2],
            backgroundColor: GLASS.cardSolid,
          },
          bodyStyle,
        ]}
      >
        {children}
      </VStack>
    </GlassCard>
  );
}

export function GlassDivider() {
  return (
    <Box
      style={{
        height: 1,
        backgroundColor: GLASS.divider,
        marginHorizontal: SPACE[4],
      }}
    />
  );
}

/** Rich blue mesh — soft background */
export function GlassMeshOrbs() {
  return (
    <LinearGradient
      colors={[...GRADIENT_MESH]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
