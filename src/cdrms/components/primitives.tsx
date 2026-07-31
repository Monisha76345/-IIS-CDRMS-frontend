import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Bell,
  Check,
  FileText,
  Home,
  LogOut,
  Plus,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { type ReactNode, forwardRef, useState } from 'react';
import {
  Modal,
  Platform,
  TextInput,
  useWindowDimensions,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { KeyboardAvoidingView } from '@/components/ui/keyboard-avoiding-view';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/src/auth/AuthContext';
import { COLORS, FONTS, GRADIENT_HEADER, GRADIENT_PRIMARY, SPACE, TYPE } from '@/src/cdrms/theme';
import type { Go, NavTab, Screen } from '@/src/cdrms/types';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { NotificationBell } from '@/src/cdrms/components/NotificationBell';

/** Edge-pinned tab bar — soft U-notch cradles the center + */
const BAR_H = 64;
const FAB_SIZE = 54;
const FAB_GAP = 7;
const NOTCH_R = FAB_SIZE / 2 + FAB_GAP;
const TOP_RADIUS = 20;

export function ScreenShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  // Keep this a plain full-screen shell. Form screens add KeyboardAvoidingView
  // inside SurveyScaffold (iOS-only) so KAV does not fight every screen.
  return <Box className={`flex-1 bg-background ${className}`}>{children}</Box>;
}

export function GradientHeader({
  children,
  className = '',
  rounded = true,
}: {
  children: ReactNode;
  className?: string;
  rounded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[...GRADIENT_HEADER]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + SPACE[2],
        borderBottomLeftRadius: rounded ? SPACE.radiusLg : 0,
        borderBottomRightRadius: rounded ? SPACE.radiusLg : 0,
      }}
      className={className}
    >
      {children}
    </LinearGradient>
  );
}

export function AppHeader({
  title,
  onBack,
  right,
  gradient = true,
  subtitle,
  go,
  showLogout = true,
  showNotifications = true,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  gradient?: boolean;
  subtitle?: string;
  go?: Go;
  showLogout?: boolean;
  showNotifications?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { logout, isAuthenticated } = useAuth();
  const canLogout = Boolean(showLogout && isAuthenticated && go);

  const onLogout = async () => {
    await logout();
    go?.('login');
  };

  const logoutBtn = canLogout ? (
    <Pressable
      onPress={() => void onLogout()}
      accessibilityRole="button"
      accessibilityLabel="Logout"
      className="flex-row items-center gap-1.5 active:opacity-85"
      style={
        gradient
          ? {
              height: 36,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
            }
          : {
              height: 36,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
            }
      }
    >
      <LogOut size={14} color={gradient ? COLORS.white : COLORS.destructive} />
      <Text
        style={{
          ...TYPE.caption,
          fontFamily: FONTS.bold,
          color: gradient ? '#FFFFFF' : COLORS.destructive,
        }}
      >
        Logout
      </Text>
    </Pressable>
  ) : null;

  const notifBell =
    go && showNotifications ? (
      <NotificationBell go={go} variant={gradient ? 'header' : 'plain'} />
    ) : null;

  const rightSlot =
    right || notifBell || logoutBtn ? (
      <HStack className="items-center gap-2">
        {right}
        {notifBell}
        {logoutBtn}
      </HStack>
    ) : null;

  if (!gradient) {
    return (
      <Box
        className="bg-card border-b border-border"
        style={{ paddingTop: insets.top + SPACE[2], paddingHorizontal: SPACE.gutter, paddingBottom: SPACE[4] }}
      >
        <HStack className="items-center justify-between" style={{ gap: SPACE[3] }}>
          <HStack className="items-center flex-1 min-w-0" style={{ gap: SPACE[2] }}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                className="items-center justify-center active:opacity-80"
                style={{ height: 44, width: 44, borderRadius: 12, backgroundColor: COLORS.muted }}
              >
                <ArrowLeft size={20} color={COLORS.primaryDeep} />
              </Pressable>
            ) : null}
            <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
              <Text style={TYPE.screen} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={TYPE.caption} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </VStack>
          </HStack>
          {rightSlot}
        </HStack>
      </Box>
    );
  }

  return (
    <GradientHeader>
      <Box style={{ paddingHorizontal: SPACE.gutter, paddingBottom: SPACE[6] }}>
        <HStack className="items-center justify-between" style={{ paddingTop: SPACE[1], gap: SPACE[3] }}>
          <HStack className="items-center flex-1 min-w-0" style={{ gap: SPACE[3] }}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                className="items-center justify-center active:opacity-80"
                style={{
                  height: 44,
                  width: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.22)',
                }}
              >
                <ArrowLeft size={20} color={COLORS.white} />
              </Pressable>
            ) : null}
            <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
              <Text
                style={{ ...TYPE.screen, color: COLORS.white, fontFamily: FONTS.bold }}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={{ ...TYPE.caption, color: 'rgba(255,255,255,0.82)' }}
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              ) : null}
            </VStack>
          </HStack>
          {rightSlot}
        </HStack>
      </Box>
    </GradientHeader>
  );
}

export function AppCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`bg-card ${className}`}
      style={{
        borderRadius: SPACE.radiusLg,
        padding: SPACE.cardPad,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 3,
      }}
    >
      {children}
    </Card>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'danger' | 'success';

export function AppBtn({
  children,
  onPress,
  variant = 'primary',
  className = '',
  disabled,
  icon: Icon,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: BtnVariant;
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
}) {
  if (variant === 'primary') {
    return (
      <Pressable
        disabled={disabled}
        onPress={onPress}
        className={`w-full overflow-hidden active:opacity-90 ${disabled ? 'opacity-50' : ''} ${className}`}
        style={{
          height: SPACE.touch,
          borderRadius: SPACE.radius,
          shadowColor: COLORS.primaryDeep,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 14,
          elevation: 5,
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
            gap: SPACE[2],
            paddingHorizontal: SPACE[4],
          }}
        >
          {Icon ? <Icon size={18} color={COLORS.white} strokeWidth={2.5} /> : null}
          <Text style={{ ...TYPE.button, color: COLORS.white }}>{children}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  const styles: Record<Exclude<BtnVariant, 'primary'>, string> = {
    ghost: 'bg-transparent',
    outline: 'bg-card border border-border',
    danger: 'bg-destructive',
    success: 'bg-success',
  };
  const textColor: Record<Exclude<BtnVariant, 'primary'>, string> = {
    ghost: COLORS.primary,
    outline: COLORS.ink,
    danger: COLORS.white,
    success: COLORS.white,
  };
  const iconColor: Record<Exclude<BtnVariant, 'primary'>, string> = {
    ghost: COLORS.primary,
    outline: COLORS.primaryDeep,
    danger: COLORS.white,
    success: COLORS.white,
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`w-full flex-row items-center justify-center active:opacity-90 ${disabled ? 'opacity-50' : ''} ${styles[variant]} ${className}`}
      style={{
        height: SPACE.touch,
        borderRadius: SPACE.radius,
        gap: SPACE[2],
        paddingHorizontal: SPACE[4],
      }}
    >
      {Icon ? <Icon size={16} color={iconColor[variant]} /> : null}
      <Text style={{ ...TYPE.button, color: textColor[variant] }}>{children}</Text>
    </Pressable>
  );
}

export const Field = forwardRef<
  TextInput,
  {
    label: string;
    icon?: LucideIcon;
    showCheck?: boolean;
    endAdornment?: ReactNode;
    /** Smaller control for dense forms (e.g. Step 3 dimensions). */
    compact?: boolean;
  } & TextInputProps
>(function Field(
  {
    label,
    icon: Icon,
    showCheck = true,
    endAdornment,
    compact = false,
    style,
    value,
    defaultValue,
    blurOnSubmit,
    ...props
  },
  ref
) {
  // No setState on focus — any re-render during focus can dismiss the keyboard
  // on Expo Go when parents restyle. Keep this tree static while typing.
  const normalize = (v: unknown) => {
    if (v == null) return '';
    const s = String(v);
    return s === 'undefined' || s === 'null' ? '' : s;
  };
  const displayValue = normalize(value);
  const hasValue = Boolean(displayValue || normalize(defaultValue));
  const isEditable = props.editable ?? true;

  return (
    <View style={{ gap: compact ? 4 : SPACE[2] }} collapsable={false}>
      <Text style={compact ? { ...TYPE.label, fontSize: 10 } : TYPE.label}>{label}</Text>
      <View
        collapsable={false}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? SPACE[2] : SPACE[3],
          minHeight: compact ? 36 : SPACE.touch,
          paddingHorizontal: compact ? SPACE[2] : SPACE[3],
          borderRadius: compact ? 10 : SPACE.radius,
          borderWidth: 1.5,
          backgroundColor: COLORS.white,
          borderColor: COLORS.border,
        }}
      >
        {Icon ? (
          <View
            pointerEvents="none"
            style={{
              height: compact ? 28 : 36,
              width: compact ? 28 : 36,
              borderRadius: 10,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={compact ? 12 : 15} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        ) : null}
        <TextInput
          {...props}
          ref={ref}
          value={displayValue}
          editable={isEditable}
          showSoftInputOnFocus
          blurOnSubmit={blurOnSubmit ?? false}
          autoCorrect={props.autoCorrect ?? false}
          autoCapitalize={props.autoCapitalize ?? 'sentences'}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          placeholderTextColor="#94A3A0"
          underlineColorAndroid="transparent"
          style={[
            {
              flex: 1,
              minWidth: 0,
              minHeight: compact ? 32 : 44,
              paddingVertical: compact ? 6 : 12,
              paddingHorizontal: 0,
              fontSize: compact ? 14 : 15,
              fontFamily: FONTS.semibold,
              color: COLORS.ink,
              ...(Platform.OS === 'web'
                ? ({ outlineStyle: 'none', cursor: 'text' } as object)
                : null),
            },
            style,
          ]}
        />
        {endAdornment ? (
          endAdornment
        ) : showCheck && hasValue ? (
          <View
            pointerEvents="none"
            style={{
              width: compact ? 18 : 22,
              height: compact ? 18 : 22,
              borderRadius: compact ? 9 : 11,
              backgroundColor: COLORS.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={compact ? 10 : 12} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : null}
      </View>
    </View>
  );
});

function NotchedBarBg({
  width,
  height,
  notchR,
  topRadius,
}: {
  width: number;
  height: number;
  notchR: number;
  topRadius: number;
}) {
  const cx = width / 2;
  const r = topRadius;
  const bowl = notchR + 2;
  // Full-bleed bar: rounded top corners; optional U cutout for the +.
  const d =
    notchR <= 0
      ? [
          `M0,${r}`,
          `Q0,0 ${r},0`,
          `L${width - r},0`,
          `Q${width},0 ${width},${r}`,
          `L${width},${height}`,
          `L0,${height}`,
          'Z',
        ].join(' ')
      : [
          `M0,${r}`,
          `Q0,0 ${r},0`,
          `L${cx - notchR - 12},0`,
          `C${cx - notchR - 2},0 ${cx - notchR + 6},${bowl * 0.85} ${cx},${bowl}`,
          `C${cx + notchR - 6},${bowl * 0.85} ${cx + notchR + 2},0 ${cx + notchR + 12},0`,
          `L${width - r},0`,
          `Q${width},0 ${width},${r}`,
          `L${width},${height}`,
          `L0,${height}`,
          'Z',
        ].join(' ');

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Path d={d} fill="#FFFFFF" />
    </Svg>
  );
}

export function BottomNav({
  active,
  onNav,
  onPlus,
  homeTarget = 'dashboard',
  appsTarget = 'history',
  hidePlus = false,
  hideAlerts = false,
}: {
  active: NavTab;
  onNav: Go;
  onPlus?: () => void;
  homeTarget?: Screen;
  appsTarget?: Screen;
  hidePlus?: boolean;
  hideAlerts?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { startNewProject } = useProject();

  const bottomPad = Math.max(insets.bottom, 8);
  const barH = BAR_H + bottomPad;
  // FAB sits so ~55% is above the bar top.
  const fabOverhang = hidePlus ? 0 : FAB_SIZE * 0.55;

  const handlePlus = () => {
    if (onPlus) {
      onPlus();
      return;
    }
    startNewProject();
    onNav('project');
  };

  const leftItems: Array<{
    k: NavTab;
    label: string;
    icon: LucideIcon;
    target: Screen;
    badge?: number;
  }> = [
    { k: 'home', label: 'Home', icon: Home, target: homeTarget },
    { k: 'apps', label: 'Apps', icon: FileText, target: appsTarget },
  ];
  const rightItems: Array<{
    k: NavTab;
    label: string;
    icon: LucideIcon;
    target: Screen;
    badge?: number;
  }> = [
    ...(hideAlerts
      ? []
      : [{ k: 'notif' as const, label: 'Alerts', icon: Bell, target: 'notifications' as Screen }]),
    { k: 'profile', label: 'Profile', target: 'profile', icon: User },
  ];

  const renderTab = (it: (typeof leftItems)[number]) => {
    const Icon = it.icon;
    const on = active === it.k;
    return (
      <Pressable
        key={it.k}
        onPress={() => onNav(it.target)}
        accessibilityRole="button"
        accessibilityLabel={it.label}
        accessibilityState={{ selected: on }}
        className="flex-1 items-center justify-center active:opacity-70"
        style={{ height: BAR_H }}
      >
        <Box className="items-center justify-center relative" style={{ height: 28, width: 44 }}>
          <Icon
            size={22}
            color={on ? COLORS.primary : '#A0AEC0'}
            strokeWidth={on ? 2.4 : 1.9}
          />
          {it.badge ? (
            <Box
              className="absolute items-center justify-center rounded-full"
              style={{
                top: -2,
                right: 4,
                minWidth: 15,
                height: 15,
                paddingHorizontal: 3,
                backgroundColor: '#EF4444',
                borderWidth: 1.5,
                borderColor: '#FFFFFF',
              }}
            >
              <Text className="text-[8px] font-extrabold text-white">{it.badge}</Text>
            </Box>
          ) : null}
        </Box>
        <Box
          style={{
            marginTop: 5,
            width: on ? 18 : 0,
            height: 3,
            borderRadius: 999,
            backgroundColor: COLORS.primary,
          }}
        />
      </Pressable>
    );
  };

  return (
    <Box
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: fabOverhang + 4,
      }}
    >
      <Box
        style={{
          width,
          height: barH,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 16,
        }}
      >
        <NotchedBarBg
          width={width}
          height={barH}
          notchR={hidePlus ? 0 : NOTCH_R}
          topRadius={TOP_RADIUS}
        />

        <HStack style={{ height: BAR_H, alignItems: 'center' }}>
          {leftItems.map(renderTab)}
          {hidePlus ? null : <Box style={{ width: NOTCH_R * 2 }} />}
          {rightItems.map(renderTab)}
        </HStack>
      </Box>

      {/* Center + nestled in the U */}
      {hidePlus ? null : (
      <Pressable
        onPress={handlePlus}
        accessibilityRole="button"
        accessibilityLabel="New application"
        className="absolute items-center justify-center active:opacity-90"
        style={{
          top: 4,
          left: (width - FAB_SIZE) / 2,
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: COLORS.border,
          shadowColor: COLORS.primaryDeep,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 14,
          elevation: 18,
          zIndex: 20,
        }}
      >
        <Box
          className="items-center justify-center"
          style={{
            width: FAB_SIZE - 10,
            height: FAB_SIZE - 10,
            borderRadius: 999,
            backgroundColor: COLORS.muted,
          }}
        >
          <Plus size={24} color={COLORS.primary} strokeWidth={2.4} />
        </Box>
      </Pressable>
      )}
    </Box>
  );
}

export function StatusChip({ status }: { status: string }) {
  const styles: Record<string, { bg: string; fg: string }> = {
    Submitted: { bg: '#D1FAE5', fg: '#047857' },
    Verified: { bg: '#D1FAE5', fg: '#059669' },
    Approved: { bg: '#D1FAE5', fg: '#047857' },
    Returned: { bg: '#FFEDD5', fg: '#C2410C' },
    Rejected: { bg: '#FEE2E2', fg: '#DC2626' },
    Draft: { bg: '#EFF6FF', fg: '#1D4ED8' },
    'In progress': { bg: '#F1F5F9', fg: '#334155' },
    Assigned: { bg: '#EFF6FF', fg: '#2563EB' },
  };
  const s = styles[status] || { bg: '#F1F5F9', fg: '#0F172A' };
  return (
    <Box
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: s.bg,
      }}
    >
      <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: s.fg }}>
        {status}
      </Text>
    </Box>
  );
}

export function AppSheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Box className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
          <Box className="bg-card rounded-t-[28px] p-5 pb-8">
            <Box className="self-center h-1.5 w-12 rounded-full bg-muted mb-4" />
            {title ? <Text className="text-lg font-bold text-foreground mb-3">{title}</Text> : null}
            {children}
          </Box>
        </Box>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function StepDots({
  step,
  total = 6,
  label,
}: {
  step: number;
  total?: number;
  label?: string;
}) {
  return (
    <VStack space="sm">
      <HStack className="items-center justify-between">
        <Text className="text-xs font-semibold text-muted-foreground">
          {label ?? `Step ${step} of ${total}`}
        </Text>
        <Box className="px-2.5 py-1 rounded-full bg-primary/10">
          <Text className="text-[11px] font-bold text-primary">
            {step}/{total}
          </Text>
        </Box>
      </HStack>
      <HStack className="items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < step - 1;
          const current = i === step - 1;
          return (
            <Box
              key={i}
              className={`h-1.5 rounded-full flex-1 ${
                done || current ? 'bg-primary' : 'bg-border'
              } ${current ? 'opacity-100' : done ? 'opacity-70' : 'opacity-100'}`}
            />
          );
        })}
      </HStack>
    </VStack>
  );
}

export function IconBox({
  children,
  className = 'bg-primary/10',
  size = 'md',
}: {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizes = {
    sm: 'h-9 w-9 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-11 w-11 rounded-xl',
    xl: 'h-16 w-16 rounded-2xl',
  };
  return (
    <Box className={`${sizes[size]} items-center justify-center ${className}`}>
      {children}
    </Box>
  );
}

export {
  ScreenLoader,
  ListLoader,
  ButtonLoader,
  getScreenLoaderConfig,
  useMinimumLoading,
} from './loaders';

