import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react-native';
import React, { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ScreenShell } from '@/src/cdrms/components/primitives';
import { useHardwareBack } from '@/src/cdrms/hooks/useHardwareBack';
import { ENGINEER_SURVEY_STEPS, SURVEY_STEPS } from '@/src/cdrms/terminology';
import { COLORS, DESIGN, FONTS, GRADIENT_HEADER, GRADIENT_PRIMARY, GLASS, SPACE, TYPE, gradientStops, hexAlpha } from '@/src/cdrms/theme';
import { cardSurfaceStyle } from '@/src/cdrms/lib/cardSurface';
import type { Go } from '@/src/cdrms/types';
import { useTheme } from '@/src/theme/ThemeContext';

function stepsForTotal(total: number) {
  return total === 4 ? ENGINEER_SURVEY_STEPS : SURVEY_STEPS;
}

const COMPACT_SCROLL_THRESHOLD = 48;
/** Sticky bar: top pad + continue btn */
const STICKY_FOOTER_HEIGHT = 52;
const FOOTER_SCROLL_BUFFER = 2;

/** Geometric completed-step mark — not a generic lucide check. */
function StepDoneMark({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  const short = size * 0.32;
  const long = size * 0.62;
  const thickness = Math.max(2.4, size * 0.18);
  return (
    <Box style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Short arm */}
      <Box
        style={{
          position: 'absolute',
          width: short,
          height: thickness,
          borderRadius: thickness,
          backgroundColor: color,
          left: size * 0.12,
          top: size * 0.5,
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* Long arm */}
      <Box
        style={{
          position: 'absolute',
          width: long,
          height: thickness,
          borderRadius: thickness,
          backgroundColor: color,
          left: size * 0.28,
          top: size * 0.42,
          transform: [{ rotate: '-48deg' }],
        }}
      />
    </Box>
  );
}

/** Five distinct steppers — one per design family (Classic / Soft / Bold / Nature / Minimal). */
export function StepRail({
  step,
  total = 5,
  variant = 'default',
}: {
  step: number;
  total?: number;
  variant?: 'default' | 'premium';
}) {
  const steps = stepsForTotal(total);
  const isPremium = variant === 'premium';
  const { themeId } = useTheme();
  /** Prefer layout family so each of the 5 designs is unmistakable. */
  const family = DESIGN.id;

  // ── Minimal — text tabs + underline only (no icons) ─────────────────────
  if (family === 'minimal') {
    return (
      <Box
        key={themeId}
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          paddingHorizontal: 4,
        }}
      >
        <HStack>
          {steps.map((item, i) => {
            const active = i === step - 1;
            const done = i < step - 1;
            return (
              <Box
                key={item.label}
                className="flex-1 items-center"
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: active ? 2.5 : 0,
                  borderBottomColor: COLORS.primary,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 12,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: active ? COLORS.primary : done ? COLORS.ink : COLORS.slate,
                  }}
                >
                  {item.short}
                </Text>
              </Box>
            );
          })}
        </HStack>
      </Box>
    );
  }

  // ── Bold — numbered square chips in a solid row ─────────────────────────
  if (family === 'bold') {
    return (
      <Box
        key={themeId}
        style={{
          backgroundColor: isPremium ? GLASS.card : COLORS.white,
          paddingHorizontal: SPACE[3],
          paddingVertical: SPACE[3],
        }}
      >
        <HStack style={{ gap: 6 }}>
          {steps.map((item, i) => {
            const active = i === step - 1;
            const done = i < step - 1;
            return (
              <Box
                key={item.label}
                className="flex-1"
                style={{
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: active
                    ? COLORS.primary
                    : done
                      ? hexAlpha(COLORS.success, 0.12)
                      : hexAlpha(COLORS.primary, 0.06),
                  borderTopWidth: 3,
                  borderTopColor: active
                    ? COLORS.primaryDeep
                    : done
                      ? COLORS.success
                      : hexAlpha(COLORS.primary, 0.25),
                }}
              >
                {done && !active ? (
                  <StepDoneMark size={16} color={COLORS.success} />
                ) : (
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 16,
                      color: active ? COLORS.white : COLORS.primaryDeep,
                    }}
                  >
                    {i + 1}
                  </Text>
                )}
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 12,
                    color: active
                      ? COLORS.white
                      : done
                        ? COLORS.success
                        : COLORS.primaryDeep,
                  }}
                >
                  {item.short}
                </Text>
              </Box>
            );
          })}
        </HStack>
      </Box>
    );
  }

  // ── Soft — large floating circular icons only (pill tray) ───────────────
  if (family === 'soft') {
    return (
      <Box
        key={themeId}
        style={{
          backgroundColor: 'transparent',
          paddingHorizontal: SPACE[3],
          paddingTop: SPACE[2],
          paddingBottom: SPACE[2],
        }}
      >
        <HStack
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 10,
            gap: 4,
            shadowColor: GLASS.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 18,
            elevation: 4,
            alignItems: 'center',
          }}
        >
          {steps.map((item, i) => {
            const active = i === step - 1;
            const done = i < step - 1;
            const Icon = item.icon;
            return (
              <Box key={item.label} className="flex-1 items-center" style={{ gap: 5 }}>
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active
                      ? COLORS.primary
                      : done
                        ? COLORS.success
                        : hexAlpha(COLORS.primary, 0.08),
                    shadowColor: active ? COLORS.primaryDeep : 'transparent',
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: active ? 0.35 : 0,
                    shadowRadius: 8,
                    elevation: active ? 5 : 0,
                  }}
                >
                  {done && !active ? (
                    <StepDoneMark size={16} color="#FFFFFF" />
                  ) : (
                    <Icon
                      size={18}
                      color={active ? COLORS.white : COLORS.primary}
                      strokeWidth={2.4}
                    />
                  )}
                </Box>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 11,
                    color: active ? COLORS.primary : done ? COLORS.ink : COLORS.slate,
                  }}
                >
                  {item.short}
                </Text>
              </Box>
            );
          })}
        </HStack>
      </Box>
    );
  }

  // ── Nature — organic trail: rounded nodes + dashed connectors ───────────
  if (family === 'nature') {
    return (
      <Box
        key={themeId}
        style={{
          backgroundColor: hexAlpha(COLORS.primary, 0.05),
          paddingHorizontal: SPACE[3],
          paddingTop: SPACE[3],
          paddingBottom: SPACE[2],
        }}
      >
        <HStack className="items-center">
          {steps.map((item, i) => {
            const active = i === step - 1;
            const done = i < step - 1;
            const Icon = item.icon;
            const last = i === steps.length - 1;
            return (
              <React.Fragment key={item.label}>
                <VStack className="items-center" style={{ flex: 1, gap: 6 }}>
                  <Box
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active
                        ? COLORS.primary
                        : done
                          ? COLORS.success
                          : COLORS.white,
                      borderWidth: active || done ? 0 : 2,
                      borderColor: hexAlpha(COLORS.primary, 0.3),
                      transform: [{ rotate: active ? '0deg' : '0deg' }],
                    }}
                  >
                    {done && !active ? (
                      <StepDoneMark size={15} color="#FFFFFF" />
                    ) : (
                      <Icon
                        size={15}
                        color={active ? COLORS.white : COLORS.primary}
                        strokeWidth={2.3}
                      />
                    )}
                  </Box>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 12,
                      color: active ? COLORS.primaryDeep : COLORS.slate,
                    }}
                  >
                    {item.short}
                  </Text>
                </VStack>
                {!last ? (
                  <HStack style={{ width: 16, marginBottom: 18, gap: 3, justifyContent: 'center' }}>
                    {[0, 1, 2].map((d) => (
                      <Box
                        key={d}
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: 999,
                          backgroundColor:
                            done || active
                              ? hexAlpha(COLORS.primary, 0.55)
                              : hexAlpha(COLORS.ink, 0.18),
                        }}
                      />
                    ))}
                  </HStack>
                ) : null}
              </React.Fragment>
            );
          })}
        </HStack>
      </Box>
    );
  }

  // ── Classic — numbered circles + solid connector line ───────────────────
  return (
    <Box
      key={`${themeId}-rail`}
      style={{
        backgroundColor: isPremium ? GLASS.card : COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: isPremium ? GLASS.borderSoft : COLORS.border,
        paddingHorizontal: SPACE[3],
        paddingTop: SPACE[3],
        paddingBottom: SPACE[2],
      }}
    >
      <HStack className="items-center">
        {steps.map((item, i) => {
          const active = i === step - 1;
          const done = i < step - 1;
          const Icon = item.icon;
          const last = i === steps.length - 1;
          return (
            <React.Fragment key={item.label}>
              <VStack className="items-center" style={{ flex: 1, gap: 6 }}>
                <Box
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active
                      ? COLORS.primary
                      : done
                        ? COLORS.success
                        : COLORS.muted,
                    borderWidth: done && !active ? 2.5 : active ? 0 : 2,
                    borderColor:
                      done && !active ? '#BBF7D0' : active ? 'transparent' : COLORS.border,
                  }}
                >
                  {done && !active ? (
                    <StepDoneMark size={15} color="#FFFFFF" />
                  ) : active ? (
                    <Icon size={15} color={COLORS.white} strokeWidth={2.5} />
                  ) : (
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.slate }}>
                      {i + 1}
                    </Text>
                  )}
                </Box>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 12,
                    color: active ? COLORS.primary : done ? COLORS.ink : COLORS.slate,
                  }}
                >
                  {item.short}
                </Text>
              </VStack>
              {!last ? (
                <Box
                  style={{
                    height: 2,
                    width: 16,
                    marginBottom: 20,
                    borderRadius: 999,
                    backgroundColor: done ? COLORS.success : hexAlpha(COLORS.ink, 0.14),
                  }}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </HStack>
    </Box>
  );
}

export function SectionTitle({
  title,
  subtitle,
  accent = COLORS.primary,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <HStack className="items-start" style={{ gap: SPACE[3], marginBottom: SPACE[2] }}>
      <Box
        style={{
          width: 3,
          alignSelf: 'stretch',
          borderRadius: 999,
          marginTop: 3,
          backgroundColor: accent,
        }}
      />
      <VStack className="flex-1" style={{ gap: 4 }}>
        <Text style={TYPE.title}>{title}</Text>
        {subtitle ? (
          <Text style={{ ...TYPE.caption, lineHeight: 18 }}>{subtitle}</Text>
        ) : null}
      </VStack>
    </HStack>
  );
}

export function SurveyCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const { themeId } = useTheme();
  return (
    <Box
      key={themeId}
      className={className}
      style={cardSurfaceStyle({ marginHorizontal: SPACE.gutter })}
    >
      {children}
    </Box>
  );
}

export function SurveyHero({
  title,
  subtitle,
  onBack,
  step,
  badge = 'Auto-saved',
  showSteps = true,
  total = 5,
  watermark,
  go,
  variant = 'default',
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  step?: number;
  badge?: string;
  showSteps?: boolean;
  total?: number;
  watermark?: 'compass';
  go?: Go;
  variant?: 'default' | 'premium';
}) {
  const insets = useSafeAreaInsets();
  const isPremium = variant === 'premium';
  const displayTitle = step != null ? `Step ${step} - ${title}` : title;
  const underTitle = subtitle;
  const { themeId } = useTheme();

  return (
    <Box key={themeId}>
      <LinearGradient
        colors={gradientStops(GRADIENT_HEADER)}
        locations={[0, 1]}
        start={DESIGN.headerStart}
        end={DESIGN.headerEnd}
        style={{
          paddingTop: insets.top + SPACE[2],
          paddingBottom: showSteps && step ? SPACE[4] : SPACE[3],
          paddingHorizontal: SPACE.gutter,
          overflow: 'hidden',
        }}
      >
        <HStack className="items-start" style={{ zIndex: 2, gap: SPACE[3] }}>
          <Pressable
            onPress={onBack}
            hitSlop={10}
            className="active:opacity-75"
            style={{
              width: 42,
              height: 42,
              borderRadius: DESIGN.buttonRadius > 40 ? 21 : DESIGN.buttonRadius,
              backgroundColor: COLORS.primaryDeep,
              marginTop: 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.3} />
          </Pressable>

          <VStack className="flex-1 min-w-0" style={{ gap: 6 }}>
            {step != null ? (
              <HStack className="items-center" style={{ gap: 8 }}>
                <Box
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: DESIGN.chipRadius,
                    backgroundColor: COLORS.primaryDeep,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 12,
                      letterSpacing: 0.6,
                      color: COLORS.white,
                      textTransform: 'uppercase',
                    }}
                  >
                    Step {step} / {total}
                  </Text>
                </Box>
                {badge ? (
                  <Text
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 12,
                      color: '#DBEAFE',
                    }}
                    numberOfLines={1}
                  >
                    {badge}
                  </Text>
                ) : null}
              </HStack>
            ) : null}
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 20,
                lineHeight: 26,
                color: COLORS.white,
                letterSpacing: -0.35,
              }}
              numberOfLines={2}
            >
              {step != null ? title : displayTitle}
            </Text>
            {underTitle ? (
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  lineHeight: 17,
                  color: '#DBEAFE',
                }}
                numberOfLines={3}
              >
                {underTitle}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      </LinearGradient>

      {showSteps && step ? (
        <Box
          style={{
            marginTop: SPACE[2],
            marginHorizontal: DESIGN.id === 'bold' ? SPACE[3] : 0,
            borderTopLeftRadius: DESIGN.radiusLg,
            borderTopRightRadius: DESIGN.radiusLg,
            borderBottomLeftRadius: DESIGN.id === 'bold' ? DESIGN.radiusLg : 0,
            borderBottomRightRadius: DESIGN.id === 'bold' ? DESIGN.radiusLg : 0,
            backgroundColor: isPremium ? GLASS.card : '#FFFFFF',
            overflow: 'hidden',
            borderBottomWidth: 0,
            borderColor: GLASS.border,
            ...(DESIGN.id === 'bold'
              ? {
                  shadowColor: COLORS.primaryDeep,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.12,
                  shadowRadius: 16,
                  elevation: 4,
                }
              : null),
          }}
        >
          <StepRail step={step} total={total} variant={isPremium ? 'premium' : 'default'} />
        </Box>
      ) : null}
    </Box>
  );
}

function CompactSurveyHeader({
  title,
  onBack,
  step,
  total = 5,
}: {
  title: string;
  onBack: () => void;
  step?: number;
  total?: number;
  badge?: string;
  go?: Go;
}) {
  const insets = useSafeAreaInsets();
  const displayTitle = step != null ? `Step ${step} - ${title}` : title;

  return (
    <Box
      className="absolute top-0 left-0 right-0"
      style={{
        zIndex: 40,
        elevation: 12,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      }}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={gradientStops(GRADIENT_HEADER)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          paddingHorizontal: 12,
          overflow: 'hidden',
        }}
      >
        <HStack className="items-center gap-2.5">
          <Pressable
            onPress={onBack}
            hitSlop={10}
            className="items-center justify-center active:opacity-75"
            style={{
              width: 32,
              height: 32,
              borderRadius: DESIGN.stepRadius > 40 ? 999 : DESIGN.stepRadius,
              backgroundColor: COLORS.primaryDeep,
            }}
          >
            <ArrowLeft size={16} color="#fff" strokeWidth={2.2} />
          </Pressable>
          <VStack className="flex-1 min-w-0">
            <Text className="text-white text-[14px] font-bold" numberOfLines={1}>
              {displayTitle}
            </Text>
          </VStack>
        </HStack>
      </LinearGradient>
    </Box>
  );
}

export function StickyBar({
  children,
  compactBottom = false,
  variant = 'default',
}: {
  children: ReactNode;
  compactBottom?: boolean;
  variant?: 'default' | 'premium';
}) {
  const insets = useSafeAreaInsets();

  return (
    <Box
      style={{
        paddingHorizontal: SPACE.gutter,
        paddingTop: SPACE[1],
        paddingBottom: compactBottom ? 2 : Math.max(insets.bottom, SPACE[2]),
        backgroundColor: variant === 'premium' ? GLASS.card : COLORS.white,
        borderTopWidth: 1,
        borderTopColor: variant === 'premium' ? GLASS.border : COLORS.border,
        shadowColor: COLORS.ink,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      {children}
    </Box>
  );
}

/** Compact full-width Continue — same size across all survey steppers. */
export function FooterContinueBtn({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const blocked = Boolean(disabled || loading);
  const { themeId } = useTheme();
  return (
    <Pressable
      key={themeId}
      disabled={blocked}
      onPress={onPress}
      className={blocked ? '' : 'active:opacity-92'}
      style={{
        height: DESIGN.ctaHeight,
        borderRadius: DESIGN.buttonRadius,
        overflow: 'hidden',
        opacity: blocked ? 0.42 : 1,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: DESIGN.shadowOpacity + 0.12,
        shadowRadius: DESIGN.shadowRadius,
        elevation: DESIGN.elevation + 2,
      }}
    >
      <LinearGradient
        colors={gradientStops(GRADIENT_PRIMARY)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: 15,
            letterSpacing: 0.2,
            color: COLORS.white,
          }}
          numberOfLines={1}
        >
          {loading ? 'Saving…' : label}
        </Text>
        {!loading ? <ArrowRight size={17} color={COLORS.white} strokeWidth={2.6} /> : null}
      </LinearGradient>
    </Pressable>
  );
}

export function SurveyScaffold({
  title,
  subtitle,
  onBack,
  step,
  total = 5,
  badge,
  showSteps = true,
  watermark,
  children,
  footer,
  go,
  surface = 'default',
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  step?: number;
  total?: number;
  badge?: string;
  showSteps?: boolean;
  watermark?: 'compass';
  children: ReactNode;
  footer?: ReactNode;
  go?: Go;
  /** Cleaner engineer flow styling */
  surface?: 'default' | 'premium';
}) {
  const insets = useSafeAreaInsets();
  const [compact, setCompact] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const keyboardOpenRef = useRef(false);
  const isPremium = surface === 'premium';
  const { themeId } = useTheme();
  /** Device back button mirrors the survey header back control. */
  useHardwareBack(onBack);

  useEffect(() => {
    // keyboardWill* fires before layout settles — freeze compact header early.
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        keyboardOpenRef.current = true;
        setKeyboardOpen(true);
      }
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardOpenRef.current = false;
        setKeyboardOpen(false);
      }
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (keyboardOpenRef.current) return;
    const y = e.nativeEvent.contentOffset.y;
    const next = y > COMPACT_SCROLL_THRESHOLD;
    setCompact((prev) => (prev === next ? prev : next));
  };

  return (
    <ScreenShell key={themeId} className="bg-background">
      {/*
        Plain style (no Uniwind className), wrapping scroll + footer.
        iOS: padding. Android: height only while keyboard is open (avoids Expo 54 sticky gap).
        Do not combine with automaticallyAdjustKeyboardInsets — that remounts focus.
      */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios' ? 'padding' : keyboardOpen ? 'height' : undefined
        }
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 24}
      >
        {/* Always mounted — toggling mount remounts the tree and blurs inputs */}
        <Box
          pointerEvents={compact ? 'box-none' : 'none'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            opacity: compact ? 1 : 0,
          }}
        >
          <CompactSurveyHeader title={title} onBack={onBack} step={step} total={total} />
        </Box>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: footer
              ? STICKY_FOOTER_HEIGHT + Math.max(insets.bottom, SPACE[2]) + FOOTER_SCROLL_BUFFER
              : 24 + insets.bottom,
            ...(!footer ? { flexGrow: 1 } : {}),
          }}
          showsVerticalScrollIndicator={false}
          // "handled" = taps on TextInput keep keyboard; taps on empty space dismiss.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          scrollEventThrottle={32}
          onScroll={onScroll}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View>
              <SurveyHero
                title={title}
                subtitle={subtitle}
                onBack={onBack}
                step={step}
                total={total}
                badge={badge ?? 'Auto-saved'}
                showSteps={showSteps}
                watermark={watermark}
                go={go}
                variant={isPremium ? 'premium' : 'default'}
              />

              <Box
                style={{
                  gap: DESIGN.sectionGap,
                  paddingTop: Math.max(14, DESIGN.headerCardGap ?? 14),
                  backgroundColor: COLORS.soft,
                  paddingBottom: DESIGN.sectionGap,
                }}
              >
                <Box style={{ gap: DESIGN.sectionGap }}>
                  {children}
                </Box>
              </Box>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        {footer ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View>
              <StickyBar compactBottom={keyboardOpen} variant={isPremium ? 'premium' : 'default'}>
                {footer}
              </StickyBar>
            </View>
          </TouchableWithoutFeedback>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

export function WorkspaceHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  iconBg = COLORS.primary,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: string;
  iconBg?: string;
}) {
  return (
    <Box
      style={{
        paddingHorizontal: SPACE.gutter,
        paddingTop: SPACE[2],
        paddingBottom: SPACE[2],
      }}
    >
      <HStack className="items-start" style={{ gap: SPACE[2] }}>
        <Box
          className="items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: DESIGN.stepRadius > 40 ? 999 : DESIGN.stepRadius,
            backgroundColor: iconBg,
            marginTop: 2,
          }}
        >
          <Icon size={18} color="#fff" strokeWidth={2.3} />
        </Box>
        <VStack className="flex-1 min-w-0" style={{ gap: 3, paddingRight: badge ? SPACE[1] : 0 }}>
          {typeof title === 'string' && title.includes('*') ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
              <Text
                style={{ ...TYPE.title, color: COLORS.ink, flexShrink: 1 }}
                numberOfLines={2}
              >
                {title.replace(/\s*\*\s*/g, '')}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#DC2626', lineHeight: 22 }}>*</Text>
            </View>
          ) : (
            <Text style={{ ...TYPE.title, color: COLORS.ink }} numberOfLines={2}>
              {title}
            </Text>
          )}
          <Text style={{ ...TYPE.caption, color: COLORS.ink }} numberOfLines={3}>
            {subtitle}
          </Text>
        </VStack>
        {badge ? (
          <Box
            style={{
              flexShrink: 0,
              marginTop: 2,
              paddingHorizontal: SPACE[2],
              paddingVertical: SPACE[1],
              borderRadius: DESIGN.chipRadius,
              backgroundColor: COLORS.white,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text
              style={{
                ...TYPE.caption,
                fontFamily: FONTS.bold,
                color: COLORS.ink,
              }}
            >
              {badge}
            </Text>
          </Box>
        ) : null}
      </HStack>
    </Box>
  );
}
