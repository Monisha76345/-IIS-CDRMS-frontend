import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
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
import { ENGINEER_SURVEY_STEPS, SURVEY_STEPS } from '@/src/cdrms/terminology';
import { COLORS, FONTS, GRADIENT_HEADER, GRADIENT_PRIMARY, SPACE, TYPE } from '@/src/cdrms/theme';
import type { Go } from '@/src/cdrms/types';

function stepsForTotal(total: number) {
  return total === 4 ? ENGINEER_SURVEY_STEPS : SURVEY_STEPS;
}

const COMPACT_SCROLL_THRESHOLD = 64;

/** Icon + label step tabs — sits in the rounded white sheet under the hero. */
export function StepRail({ step, total = 5 }: { step: number; total?: number }) {
  const steps = stepsForTotal(total);
  return (
    <Box
      style={{
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingHorizontal: SPACE[2],
        paddingTop: SPACE[3],
      }}
    >
      <HStack className="items-stretch justify-between">
        {steps.map((item, i) => {
          const active = i === step - 1;
          const Icon = item.icon;
          return (
            <Box key={item.label} className="flex-1 items-center" style={{ position: 'relative' }}>
              <VStack className="items-center" style={{ paddingBottom: SPACE[3], gap: 4 }}>
                <Icon
                  size={16}
                  color={active ? COLORS.primary : COLORS.slate}
                  strokeWidth={active ? 2.4 : 2}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    ...TYPE.caption,
                    fontFamily: FONTS.bold,
                    fontSize: 11,
                    textAlign: 'center',
                    color: active ? COLORS.primary : COLORS.slate,
                  }}
                >
                  {item.short}
                </Text>
              </VStack>
              {active ? (
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '18%',
                    right: '18%',
                    height: 3,
                    borderRadius: 999,
                    backgroundColor: COLORS.primary,
                  }}
                />
              ) : null}
            </Box>
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
  return (
    <Box
      className={`bg-white ${className}`}
      style={{
        marginHorizontal: SPACE.gutter,
        borderRadius: SPACE.radiusLg,
        overflow: 'hidden',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 4,
      }}
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
}) {
  const insets = useSafeAreaInsets();
  const steps = stepsForTotal(total);
  const stepLine =
    step != null
      ? `Step ${step} of ${total} · ${steps[step - 1]?.title ?? 'Survey'}`
      : undefined;
  const underTitle = subtitle || stepLine;

  return (
    <Box>
      <LinearGradient
        colors={[...GRADIENT_HEADER]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + SPACE[3],
          paddingBottom: showSteps && step ? SPACE[7] : SPACE[5],
          paddingHorizontal: SPACE.gutter,
          overflow: 'hidden',
        }}
      >
        <Box
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        />

        {watermark === 'compass' ? (
          <Box
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -4,
              top: insets.top,
              opacity: 0.14,
            }}
          >
            <Compass size={100} color="#FFFFFF" strokeWidth={1.1} />
          </Box>
        ) : null}

        <HStack className="items-start" style={{ zIndex: 2, gap: SPACE[3] }}>
          <Pressable
            onPress={onBack}
            hitSlop={10}
            className="items-center justify-center active:opacity-75"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.16)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.28)',
              marginTop: 2,
            }}
          >
            <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.3} />
          </Pressable>

          <VStack className="flex-1 min-w-0" style={{ gap: 4 }}>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 18,
                lineHeight: 24,
                color: COLORS.white,
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {underTitle ? (
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  lineHeight: 17,
                  color: 'rgba(255,255,255,0.82)',
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
            marginTop: -18,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          <StepRail step={step} total={total} />
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
  const steps = stepsForTotal(total);

  return (
    <Box
      className="absolute top-0 left-0 right-0"
      style={{
        zIndex: 40,
        elevation: 12,
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      }}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={[GRADIENT_HEADER[0], GRADIENT_HEADER[1]]}
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
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.45)',
            }}
          >
            <ArrowLeft size={16} color="#fff" strokeWidth={2.2} />
          </Pressable>
          <VStack className="flex-1 min-w-0">
            <Text className="text-white text-[14px] font-bold" numberOfLines={1}>
              {title}
            </Text>
            {step ? (
              <Text className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>
                Step {step} of {total} · {steps[step - 1]?.title ?? 'Survey'}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      </LinearGradient>
    </Box>
  );
}

export function StickyBar({
  children,
  compactBottom = false,
}: {
  children: ReactNode;
  /** Drop home-indicator padding when keyboard is open — avoids a large gap above the keyboard. */
  compactBottom?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Box
      style={{
        paddingHorizontal: SPACE.gutter,
        paddingTop: SPACE[2],
        paddingBottom: compactBottom ? 2 : Math.max(insets.bottom, SPACE[3]),
        backgroundColor: COLORS.soft,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
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
  return (
    <Pressable
      disabled={blocked}
      onPress={onPress}
      className={blocked ? '' : 'active:opacity-90'}
      style={{
        height: 44,
        borderRadius: 12,
        overflow: 'hidden',
        opacity: blocked ? 0.45 : 1,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <LinearGradient
        colors={[...GRADIENT_PRIMARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 14,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: 14,
            color: COLORS.white,
          }}
          numberOfLines={1}
        >
          {loading ? 'Saving…' : label}
        </Text>
        {!loading ? <ArrowRight size={16} color="#fff" strokeWidth={2.5} /> : null}
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
}) {
  const insets = useSafeAreaInsets();
  const [compact, setCompact] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const keyboardOpenRef = useRef(false);

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
    <ScreenShell className="bg-background">
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
            paddingBottom: 40 + insets.bottom,
            flexGrow: 1,
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
            <View style={{ flexGrow: 1 }}>
              <SurveyHero
                title={title}
                subtitle={subtitle}
                onBack={onBack}
                step={step}
                total={total}
                badge={badge ?? 'Auto-saved'}
                showSteps={showSteps}
                watermark={watermark}
              />

              <Box style={{ gap: SPACE[4], paddingTop: SPACE[4], backgroundColor: COLORS.soft }}>
                {children}
              </Box>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        {footer ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View>
              <StickyBar compactBottom={keyboardOpen}>{footer}</StickyBar>
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
        paddingTop: SPACE[4],
        paddingBottom: SPACE[3],
      }}
    >
      <HStack className="items-start" style={{ gap: SPACE[3] }}>
        <Box
          className="items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
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
              borderRadius: 8,
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
