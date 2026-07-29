import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Compass,
  type LucideIcon,
} from 'lucide-react-native';
import { type ReactNode, useEffect, useRef, useState } from 'react';
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
import { SURVEY_STEPS } from '@/src/cdrms/terminology';
import { COLORS, GRADIENT_HEADER } from '@/src/cdrms/theme';

const STEPS = SURVEY_STEPS;

const COMPACT_SCROLL_THRESHOLD = 64;

/** Icon + label step tabs — sits in the rounded white sheet under the hero. */
export function StepRail({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <Box
      style={{
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingHorizontal: 4,
        paddingTop: 12,
      }}
    >
      <HStack className="items-stretch justify-between">
        {STEPS.slice(0, total).map((item, i) => {
          const active = i === step - 1;
          const Icon = item.icon;
          return (
            <Box key={item.label} className="flex-1 items-center" style={{ position: 'relative' }}>
              <VStack className="items-center pb-3" space="xs">
                <Icon
                  size={16}
                  color={active ? COLORS.primary : '#94A3B8'}
                  strokeWidth={active ? 2.4 : 2}
                />
                <Text
                  className="text-[9px] font-bold text-center"
                  numberOfLines={1}
                  style={{ color: active ? COLORS.primary : '#94A3B8' }}
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
  accent = '#2563EB',
}: {
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <HStack className="items-start gap-2.5 mb-1">
      <Box className="w-1 self-stretch rounded-full mt-0.5" style={{ backgroundColor: accent }} />
      <VStack className="flex-1">
        <Text className="text-[14px] font-extrabold text-foreground tracking-tight">{title}</Text>
        {subtitle ? (
          <Text className="text-[11px] text-muted-foreground mt-0.5 leading-4">{subtitle}</Text>
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
      className={`mx-4 bg-white ${className}`}
      style={{
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
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
}) {
  const insets = useSafeAreaInsets();
  const stepLine =
    step != null
      ? `Step ${step} of ${total} · ${STEPS[step - 1]?.title ?? 'Survey'}`
      : undefined;
  const underTitle = subtitle || stepLine;

  const badgeText = badge?.includes('Auto-saved') ? 'Auto-saved' : badge;

  return (
    <Box>
      <LinearGradient
        colors={[...GRADIENT_HEADER]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 6,
          paddingBottom: showSteps && step ? 28 : 22,
          paddingHorizontal: 14,
          overflow: 'hidden',
        }}
      >
        {/* Soft curved light trails */}
        <Box
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -90,
            right: -50,
            width: 220,
            height: 220,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.16)',
          }}
        />
        <Box
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -55,
            right: -20,
            width: 160,
            height: 160,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        />
        <Box
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -20,
            right: 10,
            width: 100,
            height: 100,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        />

        {watermark === 'compass' ? (
          <Box
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -8,
              top: insets.top - 4,
              opacity: 0.18,
            }}
          >
            <Compass size={118} color="#FFFFFF" strokeWidth={1.15} />
          </Box>
        ) : null}

        <HStack className="items-center gap-2.5" style={{ zIndex: 2 }}>
          <Pressable
            onPress={onBack}
            hitSlop={10}
            className="items-center justify-center active:opacity-75"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.45)',
            }}
          >
            <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>

          <VStack className="flex-1 min-w-0">
            <Text
              className={`text-white font-bold tracking-tight ${
                showSteps && step ? 'text-[17px] leading-5' : 'text-[20px] leading-6'
              }`}
              numberOfLines={1}
            >
              {title}
            </Text>
            {underTitle ? (
              <Text
                className={`font-medium mt-0.5 ${
                  showSteps && step ? 'text-[11px]' : 'text-[12px]'
                }`}
                style={{ color: 'rgba(255,255,255,0.9)' }}
                numberOfLines={2}
              >
                {underTitle}
              </Text>
            ) : null}
          </VStack>

          {badgeText ? (
            <Box
              className="px-2.5 py-1.5 rounded-full flex-row items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(30, 64, 175, 0.4)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
              }}
            >
              <Box
                className="rounded-full"
                style={{ width: 6, height: 6, backgroundColor: '#22C55E' }}
              />
              <Text className="text-[10px] font-semibold text-white">{badgeText}</Text>
            </Box>
          ) : null}
        </HStack>
      </LinearGradient>

      {showSteps && step ? (
        <Box
          style={{
            marginTop: -20,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
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
  badge,
}: {
  title: string;
  onBack: () => void;
  step?: number;
  total?: number;
  badge?: string;
}) {
  const insets = useSafeAreaInsets();
  const badgeText = badge?.includes('Auto-saved') ? 'Auto-saved' : badge;

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
        <Box
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -70,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.14)',
          }}
        />
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
                Step {step} of {total} · {STEPS[step - 1]?.title ?? 'Survey'}
              </Text>
            ) : null}
          </VStack>
          {badgeText ? (
            <Box
              className="px-2 py-1 rounded-full flex-row items-center gap-1"
              style={{
                backgroundColor: 'rgba(30, 64, 175, 0.4)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
              }}
            >
              <Box
                className="rounded-full"
                style={{ width: 5, height: 5, backgroundColor: '#22C55E' }}
              />
              <Text className="text-[10px] font-semibold text-white">{badgeText}</Text>
            </Box>
          ) : null}
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
      className="px-4 pt-3"
      style={{
        // In-flow footer — absolute overlay stole taps / fought keyboard layout.
        paddingBottom: compactBottom ? 2 : Math.max(insets.bottom, 14),
        backgroundColor: '#F3F4F6',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
      }}
    >
      {children}
    </Box>
  );
}

export function SurveyScaffold({
  title,
  subtitle,
  onBack,
  step,
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
  badge?: string;
  showSteps?: boolean;
  watermark?: 'compass';
  children: ReactNode;
  footer?: ReactNode;
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
    <ScreenShell className="bg-[#F3F4F6]">
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
          <CompactSurveyHeader title={title} onBack={onBack} step={step} badge={badge} />
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
                badge={badge ?? 'Auto-saved'}
                showSteps={showSteps}
                watermark={watermark}
              />

              <Box style={{ gap: 14, paddingTop: 14, backgroundColor: '#F3F4F6' }}>
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
  stepLabel,
  iconBg = '#2563EB',
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  stepLabel?: string;
  iconBg?: string;
}) {
  return (
    <Box style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 }}>
      <HStack className="items-center gap-2.5">
        <Box
          className="items-center justify-center"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: iconBg,
          }}
        >
          <Icon size={18} color="#fff" strokeWidth={2.3} />
        </Box>
        <VStack className="flex-1 min-w-0">
          <Text className="text-[14px] font-bold text-foreground tracking-tight" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }} numberOfLines={1}>
            {subtitle}
          </Text>
        </VStack>
        {stepLabel ? (
          <Box
            className="px-2 py-1 rounded-lg"
            style={{ backgroundColor: '#EFF6FF' }}
          >
            <Text className="text-[9px] font-extrabold" style={{ color: '#2563EB' }}>
              {stepLabel}
            </Text>
          </Box>
        ) : null}
      </HStack>
    </Box>
  );
}
