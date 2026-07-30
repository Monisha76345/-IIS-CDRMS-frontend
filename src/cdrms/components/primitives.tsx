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
import { type ReactNode, useState } from 'react';
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
import { COLORS, GRADIENT_HEADER, GRADIENT_PRIMARY } from '@/src/cdrms/theme';
import type { Go, NavTab, Screen } from '@/src/cdrms/types';
import { useProject } from '@/src/cdrms/project/ProjectContext';

/** Edge-pinned tab bar — soft U-notch cradles the center + */
const BAR_H = 64;
const FAB_SIZE = 54;
const FAB_GAP = 7;
const NOTCH_R = FAB_SIZE / 2 + FAB_GAP;
const TOP_RADIUS = 24;

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
        paddingTop: insets.top + 8,
        borderBottomLeftRadius: rounded ? 32 : 0,
        borderBottomRightRadius: rounded ? 32 : 0,
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
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  gradient?: boolean;
  subtitle?: string;
  go?: Go;
  showLogout?: boolean;
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
        className="text-[12px] font-bold"
        style={{ color: gradient ? '#FFFFFF' : COLORS.destructive }}
      >
        Logout
      </Text>
    </Pressable>
  ) : null;

  const rightSlot =
    right || logoutBtn ? (
      <HStack className="items-center gap-2">
        {right}
        {logoutBtn}
      </HStack>
    ) : null;

  if (!gradient) {
    return (
      <Box
        className="bg-card border-b border-border px-5 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-2 flex-1 min-w-0">
            {onBack ? (
              <Pressable
                onPress={onBack}
                className="h-10 w-10 rounded-full items-center justify-center"
              >
                <ArrowLeft size={20} color={COLORS.primaryDeep} />
              </Pressable>
            ) : null}
            <VStack className="flex-1 min-w-0">
              <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text className="text-xs text-muted-foreground">{subtitle}</Text>
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
      <Box className="px-5 pb-7">
        <HStack className="items-center justify-between pt-1">
          <HStack className="items-center gap-3 flex-1 min-w-0">
            {onBack ? (
              <Pressable
                onPress={onBack}
                className="h-10 w-10 rounded-full bg-white/15 border border-white/20 items-center justify-center active:opacity-80"
              >
                <ArrowLeft size={20} color={COLORS.white} />
              </Pressable>
            ) : null}
            <VStack className="flex-1 min-w-0">
              <Text className="text-xl font-extrabold text-white tracking-tight" numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text className="text-xs text-white/75 font-medium mt-0.5">{subtitle}</Text>
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
      className={`bg-card rounded-3xl p-5 border border-border/60 ${className}`}
      style={{
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
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
        className={`w-full h-14 rounded-2xl overflow-hidden active:opacity-90 ${disabled ? 'opacity-50' : ''} ${className}`}
        style={{
          shadowColor: '#1D4ED8',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        <LinearGradient
          colors={['#2563EB', '#3B82F6', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {Icon ? <Icon size={18} color={COLORS.white} strokeWidth={2.5} /> : null}
          <Text className="text-[15px] font-extrabold text-white tracking-wide">{children}</Text>
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
  const textStyles: Record<Exclude<BtnVariant, 'primary'>, string> = {
    ghost: 'text-primary',
    outline: 'text-foreground',
    danger: 'text-destructive-foreground',
    success: 'text-success-foreground',
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
      className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90 ${disabled ? 'opacity-50' : ''} ${styles[variant]} ${className}`}
    >
      {Icon ? <Icon size={16} color={iconColor[variant]} /> : null}
      <Text className={`text-[15px] font-semibold ${textStyles[variant]}`}>{children}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  icon: Icon,
  showCheck = true,
  endAdornment,
  style,
  value,
  defaultValue,
  ...props
}: {
  label: string;
  icon?: LucideIcon;
  showCheck?: boolean;
  endAdornment?: ReactNode;
} & TextInputProps) {
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
    <View style={{ gap: 4 }} collapsable={false}>
      <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[1.2px]">
        {label}
      </Text>
      <View
        collapsable={false}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 52,
          paddingHorizontal: 12,
          borderRadius: 16,
          borderWidth: 1,
          backgroundColor: '#F3F4F6',
          borderColor: 'transparent',
        }}
      >
        {Icon ? (
          <View
            pointerEvents="none"
            style={{
              height: 36,
              width: 36,
              borderRadius: 12,
              backgroundColor: '#2563EB',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={15} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        ) : null}
        <TextInput
          {...props}
          value={displayValue}
          editable={isEditable}
          showSoftInputOnFocus
          blurOnSubmit={false}
          autoCorrect={props.autoCorrect ?? false}
          autoCapitalize={props.autoCapitalize ?? 'sentences'}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          placeholderTextColor="#94A3B8"
          underlineColorAndroid="transparent"
          style={[
            {
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              paddingVertical: 12,
              paddingHorizontal: 0,
              fontSize: 14,
              fontWeight: '700',
              color: '#1E293B',
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
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#22C55E',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

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
  // Full-bleed bar: rounded top corners only, smooth U cutout for the +.
  const d = [
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
}: {
  active: NavTab;
  onNav: Go;
  onPlus?: () => void;
  homeTarget?: Screen;
  appsTarget?: Screen;
  hidePlus?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { startNewProject } = useProject();

  const bottomPad = Math.max(insets.bottom, 8);
  const barH = BAR_H + bottomPad;
  // FAB sits so ~55% is above the bar top.
  const fabOverhang = FAB_SIZE * 0.55;

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
    { k: 'notif', label: 'Alerts', icon: Bell, target: 'notifications' },
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
          notchR={NOTCH_R}
          topRadius={TOP_RADIUS}
        />

        <HStack style={{ height: BAR_H, alignItems: 'center' }}>
          {leftItems.map(renderTab)}
          <Box style={{ width: NOTCH_R * 2 }} />
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
          borderColor: 'rgba(15, 23, 42, 0.04)',
          shadowColor: '#1E3A8A',
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
            backgroundColor: '#EFF6FF',
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
    Draft: { bg: '#F1F5F9', fg: '#64748B' },
  };
  const s = styles[status] || { bg: '#F1F5F9', fg: '#64748B' };
  return (
    <Box
      className="px-2.5 py-1 rounded-full"
      style={{ backgroundColor: s.bg }}
    >
      <Text className="text-[11px] font-bold" style={{ color: s.fg }}>
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
