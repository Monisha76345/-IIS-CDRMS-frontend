import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  cardBodyStyle,
  cardPlainHeaderStyle,
  cardShowsGradientHeader,
  cardSurfaceStyle,
} from '@/src/cdrms/lib/cardSurface';
import { COLORS, DESIGN, FONTS, GLASS, GRADIENT_CARD_HEADER, SPACE, gradientStops, hexAlpha } from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';

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
 * Nested panel — follows theme card family (elevated / soft / outline / tinted / flat).
 */
export function FrostedGlass({
  children,
  style,
  borderRadius,
  padding = 0,
  fill,
  sheen: _sheen = false,
}: FrostedProps) {
  const { themeId } = useTheme();
  const surface = cardSurfaceStyle({ nested: true });
  return (
    <View
      key={themeId}
      style={[
        surface,
        borderRadius != null ? { borderRadius } : null,
        fill != null ? { backgroundColor: fill } : null,
        style,
      ]}
    >
      <View style={{ padding, zIndex: 1 }}>{children}</View>
    </View>
  );
}

type GlassSurfaceProps = {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
};

export function GlassSurface({ children, style, padding = SPACE[2] }: GlassSurfaceProps) {
  return (
    <FrostedGlass
      borderRadius={DESIGN.cardRadius}
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
  color = COLORS.primary,
  size = 15,
}: {
  icon: LucideIcon;
  color?: string;
  size?: number;
}) {
  const { themeId } = useTheme();
  return (
    <View
      key={themeId}
      style={{
        width: DESIGN.stepSize - 4,
        height: DESIGN.stepSize - 4,
        borderRadius: DESIGN.stepRadius > 40 ? 999 : Math.max(8, DESIGN.stepRadius - 2),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: GLASS.iconBg,
        borderWidth: DESIGN.borderWidth,
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
  const { themeId } = useTheme();
  return (
    <View
      key={themeId}
      style={[cardSurfaceStyle({ marginHorizontal: SPACE.gutter }), style]}
    >
      {children}
    </View>
  );
}

/** Pill badge for section headers — always high-contrast on primary. */
const HEADER_BADGE_TONES = {
  /** Solid on gradient — for icons / short metrics. */
  default: { bg: COLORS.primaryDeep, fg: '#FFFFFF', border: 'transparent' },
  success: { bg: '#ECFDF5', fg: '#047857', border: '#A7F3D0' },
  warning: { bg: '#FFF7ED', fg: '#C2410C', border: '#FDBA74' },
  danger: { bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA' },
  info: { bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE' },
  neutral: { bg: '#F8FAFC', fg: '#334155', border: '#E2E8F0' },
} as const;

export type HeaderBadgeTone = keyof typeof HEADER_BADGE_TONES;

export function GlassHeaderBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: HeaderBadgeTone;
}) {
  const t = HEADER_BADGE_TONES[tone] ?? HEADER_BADGE_TONES.default;
  return (
    <HStack
      style={{
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: t.bg,
        borderWidth: tone === 'default' ? 0 : 1.5,
        borderColor: t.border,
      }}
    >
      {children}
    </HStack>
  );
}

/** Colored status chip for card headers (Empty / Occupied / Done / …). */
export function HeaderStatusBadge({
  label,
  tone: toneOverride,
}: {
  label: string;
  tone?: HeaderBadgeTone;
}) {
  const key = label.trim().toLowerCase();
  const tone: HeaderBadgeTone =
    toneOverride ??
    (key === 'empty' || key === 'done' || key === 'ready' || key === 'even'
      ? 'success'
      : key === 'occupied'
        ? 'warning'
        : key === 'odd'
          ? 'danger'
          : 'info');
  const fg = HEADER_BADGE_TONES[tone].fg;
  return (
    <GlassHeaderBadge tone={tone}>
      <Text
        style={{
          fontFamily: FONTS.bold,
          fontSize: 12,
          color: fg,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </GlassHeaderBadge>
  );
}

/** Pill badge for site dimension type — readable on gradient headers. */
export function DimTypeBadge({ type }: { type: 'Even' | 'Odd' | string | null }) {
  if (!type || type === '—') {
    return <HeaderStatusBadge label="Enter dims" />;
  }
  return <HeaderStatusBadge label={type === 'Odd' ? 'Odd' : 'Even'} />;
}

/** Solid theme gradient for section headers — no transparent orbs / overlays. */
export function PremiumGradientBackground({
  colors = GRADIENT_CARD_HEADER,
}: {
  colors?: readonly string[] | string[];
}) {
  const { themeId } = useTheme();

  return (
    <Box key={themeId} pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={gradientStops(colors)}
        start={DESIGN.cardHeaderStart}
        end={DESIGN.cardHeaderEnd}
        style={StyleSheet.absoluteFill}
      />
    </Box>
  );
}

function SectionHeaderTitle({
  title,
  subtitle,
  icon: Icon,
  badge,
  onDark,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge?: ReactNode;
  onDark: boolean;
}) {
  const required = title.trimEnd().endsWith('*');
  const label = required ? title.replace(/\s*\*\s*$/, '') : title;
  const titleColor = onDark ? '#FFFFFF' : COLORS.ink;
  const subColor = onDark ? '#E2E8F0' : COLORS.slate;
  /** Always vivid red so * stays visible on gradient and light headers. */
  const starColor = COLORS.destructive;
  const iconBg = onDark ? COLORS.primaryDeep : COLORS.primary;
  const iconFg = '#FFFFFF';

  return (
    <HStack
      style={{
        alignItems: 'center',
        gap: SPACE[2],
        zIndex: 2,
      }}
    >
      <Box
        style={{
          width: DESIGN.stepSize - 2,
          height: DESIGN.stepSize - 2,
          borderRadius: DESIGN.stepRadius > 40 ? 999 : DESIGN.stepRadius,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconBg,
        }}
      >
        <Icon size={17} color={iconFg} strokeWidth={2} />
      </Box>
      <VStack style={{ flex: 1, gap: 1 }}>
        <HStack style={{ alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 15,
              color: titleColor,
              letterSpacing: -0.2,
            }}
          >
            {label}
          </Text>
          {required ? (
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 16,
                color: starColor,
                letterSpacing: -0.2,
              }}
            >
              *
            </Text>
          ) : null}
        </HStack>
        {subtitle ? (
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 13,
              color: subColor,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </VStack>
      {badge ?? null}
    </HStack>
  );
}

/** Section header — gradient for Classic/Bold; plain/soft/tint for Soft/Nature/Minimal. */
export function GlassCardHeader({
  title,
  subtitle,
  icon,
  badge,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge?: ReactNode;
}) {
  const { themeId } = useTheme();
  const useGradient = cardShowsGradientHeader();

  if (useGradient) {
    return (
      <Box key={themeId} style={{ overflow: 'hidden' }}>
        <PremiumGradientBackground />
        <Box
          style={{
            paddingHorizontal: SPACE[2],
            paddingVertical: SPACE[2],
          }}
        >
          <SectionHeaderTitle
            title={title}
            subtitle={subtitle}
            icon={icon}
            badge={badge}
            onDark
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box key={themeId} style={cardPlainHeaderStyle()}>
      <SectionHeaderTitle
        title={title}
        subtitle={subtitle}
        icon={icon}
        badge={badge}
        onDark={false}
      />
    </Box>
  );
}

/** Survey / detail section — chrome follows theme card family. */
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
  const { themeId } = useTheme();
  return (
    <GlassCard key={themeId}>
      <GlassCardHeader title={title} subtitle={subtitle} icon={icon} badge={badge} />
      <VStack
        style={[
          {
            padding: DESIGN.cardVariant === 'flat' ? SPACE[1] : SPACE[2],
            gap: SPACE[1],
            ...cardBodyStyle(),
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

/** Solid soft page wash — no transparent mesh artwork. */
export function GlassMeshOrbs() {
  return (
    <Box
      style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.soft }]}
    />
  );
}
