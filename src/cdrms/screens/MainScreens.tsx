import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Edit3,
  FileText,
  Files,
  Filter,
  FolderOpen,
  HelpCircle,
  Layers,
  Lock,
  LogOut,
  MapPin,
  MapPinned,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Undo2,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, TextInput, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  AppCard,
  AppHeader,
  BottomNav,
  GradientHeader,
  IconBox,
  ScreenShell,
  StatusChip,
} from '@/src/cdrms/components/primitives';
import { SAMPLE_APPS, NOTIFS, SITE_IMAGES, imageForProject } from '@/src/cdrms/data';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { COLORS } from '@/src/cdrms/theme';
import { TERMS } from '@/src/cdrms/terminology';
import type { Go, Screen } from '@/src/cdrms/types';

const NOTIF_CARD_WIDTH = 280;
const NOTIF_GAP = 12;

const NOTIF_STYLE = {
  success: {
    colors: ['#059669', '#34D399'] as const,
    icon: CheckCircle2,
  },
  warning: {
    colors: ['#EA580C', '#FBBF24'] as const,
    icon: AlertTriangle,
  },
  info: {
    colors: ['#2563EB', '#3B82F6'] as const,
    icon: Bell,
  },
} as const;

function NotificationsCarousel({ onSeeAll }: { onSeeAll: () => void }) {
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const step = NOTIF_CARD_WIDTH + NOTIF_GAP;
  const unread = NOTIFS.filter((n) => n.unread).length;

  useEffect(() => {
    if (paused || NOTIFS.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % NOTIFS.length;
        scrollRef.current?.scrollTo({ x: next * step, animated: true });
        return next;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, [paused, step]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / step);
    setIndex(Math.max(0, Math.min(NOTIFS.length - 1, next)));
  };

  return (
    <Box className="mt-6">
      <HStack className="items-center justify-between px-4 mb-3">
        <VStack className="flex-1 min-w-0">
          <Text className="text-[16px] font-bold" style={{ color: '#0F172A' }}>
            Notifications
          </Text>
          <Text className="text-[12px] mt-0.5" style={{ color: '#94A3B8' }}>
            {unread} unread · swipe for more
          </Text>
        </VStack>
        <Pressable
          onPress={onSeeAll}
          className="flex-row items-center active:opacity-70"
        >
          <Text className="text-[12px] font-semibold" style={{ color: COLORS.primary }}>
            See all
          </Text>
          <ChevronRight size={13} color={COLORS.primary} />
        </Pressable>
      </HStack>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={step}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: NOTIF_GAP,
          paddingRight: 28,
        }}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => setPaused(true)}
        onMomentumScrollEnd={(e) => {
          onScrollEnd(e);
          setPaused(false);
        }}
        onScrollEndDrag={onScrollEnd}
      >
        {NOTIFS.map((n) => {
          const style = NOTIF_STYLE[n.type];
          const Icon = style.icon;
          return (
            <Pressable
              key={n.id}
              onPress={onSeeAll}
              className="active:opacity-90"
              style={{
                width: NOTIF_CARD_WIDTH,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 14,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                opacity: n.unread ? 1 : 0.78,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <LinearGradient
                colors={[...style.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18} color="#FFFFFF" strokeWidth={2.3} />
              </LinearGradient>

              <Box className="flex-1 min-w-0">
                <HStack className="items-center justify-between gap-2">
                  <Text
                    className="font-bold text-[13px] flex-1"
                    style={{ color: '#0F172A' }}
                    numberOfLines={1}
                  >
                    {n.title}
                  </Text>
                  <Text className="text-[11px] font-medium shrink-0" style={{ color: '#94A3B8' }}>
                    {n.time}
                  </Text>
                </HStack>
                <Text
                  className="text-[11px] mt-1 leading-4"
                  style={{ color: '#64748B' }}
                  numberOfLines={2}
                >
                  {n.body}
                </Text>
              </Box>

              {n.unread ? (
                <Box
                  className="rounded-full mt-1.5"
                  style={{ width: 8, height: 8, backgroundColor: COLORS.primary }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <HStack className="items-center justify-center gap-1.5 mt-3">
        {NOTIFS.map((n, i) => (
          <Box
            key={n.id}
            style={{
              width: i === index ? 14 : 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: i === index ? COLORS.primary : '#D1D5DB',
            }}
          />
        ))}
      </HStack>
    </Box>
  );
}

export function Dashboard({ go }: { go: Go }) {
  const insets = useSafeAreaInsets();
  const { startNewProject, openApplication } = useProject();

  const openNewProject = () => {
    startNewProject();
    go('project');
  };

  const openAppDetails = (id: string) => {
    openApplication(id);
    go('details');
  };

  const stats = [
    { label: 'Draft', value: 3, bg: '#EFF6FF', fg: '#2563EB', icon: FileText },
    { label: 'Submitted', value: 12, bg: '#DBEAFE', fg: '#2563EB', icon: ClipboardCheck },
    { label: 'Verified', value: 28, bg: '#D1FAE5', fg: '#059669', icon: CheckCircle2 },
    { label: 'Returned', value: 2, bg: '#FFEDD5', fg: '#EA580C', icon: AlertTriangle },
  ];

  const actions: Array<{
    icon: typeof Plus;
    watermark: typeof Plus;
    label: string;
    desc: string;
    to: Screen;
    primary?: boolean;
    iconBg: string;
    iconColor: string;
    watermarkColor: string;
  }> = [
    {
      icon: Plus,
      watermark: FolderOpen,
      label: TERMS.dashboard.createApplication,
      desc: TERMS.dashboard.createApplicationDesc,
      to: 'project',
      primary: true,
      iconBg: 'rgba(255,255,255,0.22)',
      iconColor: '#FFFFFF',
      watermarkColor: 'rgba(255,255,255,0.18)',
    },
    {
      icon: Edit3,
      watermark: FileText,
      label: TERMS.dashboard.continueDraft,
      desc: '3 pending drafts',
      to: 'project',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      watermarkColor: 'rgba(99,102,241,0.12)',
    },
    {
      icon: ClipboardCheck,
      watermark: ClipboardCheck,
      label: TERMS.dashboard.startSurvey,
      desc: TERMS.dashboard.startSurveyDesc,
      to: 'bandi',
      iconBg: '#D1FAE5',
      iconColor: '#059669',
      watermarkColor: 'rgba(16,185,129,0.12)',
    },
    {
      icon: FileText,
      watermark: Files,
      label: TERMS.dashboard.viewHistory,
      desc: TERMS.dashboard.viewHistoryDesc,
      to: 'history',
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
      watermarkColor: 'rgba(37,99,235,0.12)',
    },
  ];

  const progressFor = (status: string) => {
    if (status === 'Verified' || status === 'Approved') return 100;
    if (status === 'Submitted') return 60;
    if (status === 'Returned') return 40;
    if (status === 'Draft') return 20;
    return 30;
  };

  return (
    <ScreenShell className="bg-[#F3F4F6]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#1E40AF', '#2563EB', '#3B82F6']}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingBottom: 56,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            overflow: 'hidden',
          }}
        >
          <Box
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -80,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.14)',
            }}
          />
          <Box
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -40,
              right: 10,
              width: 140,
              height: 140,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          />

          <Box className="px-5" style={{ paddingTop: insets.top + 8 }}>
            <HStack className="items-center justify-between">
              <HStack className="items-center gap-3 flex-1 min-w-0">
                <Pressable
                  onPress={() => go('profile')}
                  className="active:opacity-85"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    padding: 2,
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Image
                    source={require('../../../assets/officer-avatar.png')}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#E2E8F0',
                    }}
                    resizeMode="cover"
                  />
                </Pressable>
                <VStack className="flex-1 min-w-0">
                  <Text className="text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Welcome back,
                  </Text>
                  <Text className="font-bold text-[17px] text-white" numberOfLines={1}>
                    Er. Ravi Shankar 👋
                  </Text>
                </VStack>
              </HStack>
              <Pressable
                onPress={() => go('notifications')}
                className="relative items-center justify-center active:opacity-80"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.25)',
                }}
              >
                <Bell size={18} color={COLORS.white} />
                <Box
                  className="absolute rounded-full"
                  style={{
                    top: 8,
                    right: 9,
                    width: 8,
                    height: 8,
                    backgroundColor: '#FBBF24',
                    borderWidth: 1.5,
                    borderColor: '#2563EB',
                  }}
                />
              </Pressable>
            </HStack>

            <HStack className="mt-4 items-center flex-wrap" style={{ gap: 6 }}>
              <Clock size={13} color="rgba(255,255,255,0.85)" />
              <Text className="text-[11px]" style={{ color: 'rgba(255,255,255,0.88)' }}>
                Friday, 24 July 2026
              </Text>
              <Text className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                ·
              </Text>
              <MapPin size={13} color="rgba(255,255,255,0.85)" />
              <Text className="text-[11px] flex-1" style={{ color: 'rgba(255,255,255,0.88)' }} numberOfLines={1}>
                Devanahalli, KA-BLR-R-02
              </Text>
            </HStack>

            <LinearGradient
              colors={['#1E40AF', '#2563EB', '#3B82F6']}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                marginTop: 16,
                borderRadius: 24,
                paddingVertical: 16,
                paddingHorizontal: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.28)',
              }}
            >
              {/* Diagonal line texture */}
              <Box
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  right: -20,
                  top: -40,
                  bottom: -40,
                  width: '70%',
                  opacity: 0.22,
                  transform: [{ rotate: '28deg' }],
                }}
              >
                {Array.from({ length: 18 }).map((_, i) => (
                  <Box
                    key={i}
                    style={{
                      height: 1.5,
                      marginBottom: 10,
                      backgroundColor: 'rgba(255,255,255,0.55)',
                      borderRadius: 999,
                    }}
                  />
                ))}
              </Box>

              <HStack className="items-center justify-between" style={{ zIndex: 2 }}>
                <VStack className="flex-1 min-w-0">
                  <Text className="text-[11px] font-medium" style={{ color: 'rgba(219,234,254,0.95)' }}>
                    Today&apos;s Applications
                  </Text>
                  <HStack className="items-end gap-1.5 mt-1">
                    <Text className="text-[34px] font-extrabold text-white leading-none">4</Text>
                    <Text
                      className="text-[13px] font-medium mb-1.5"
                      style={{ color: 'rgba(219,234,254,0.9)' }}
                    >
                      in progress
                    </Text>
                  </HStack>

                  {/* Wave sparkline */}
                  <Box className="mt-2" style={{ width: 120, height: 22 }}>
                    <Svg width="120" height="22" viewBox="0 0 120 22">
                      <Path
                        d="M0 14 C12 14, 14 6, 24 6 C34 6, 36 16, 48 16 C60 16, 62 4, 74 4 C86 4, 88 15, 100 15 C108 15, 112 10, 120 10"
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Box>
                </VStack>

                <Pressable
                  onPress={openNewProject}
                  className="flex-row items-center gap-1 active:opacity-90"
                  style={{
                    height: 40,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#1E3A8A',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <Plus size={15} color="#1D4ED8" strokeWidth={2.6} />
                  <Text className="text-[13px] font-bold" style={{ color: '#1D4ED8' }}>
                    New
                  </Text>
                </Pressable>
              </HStack>
            </LinearGradient>
          </Box>
        </LinearGradient>

        {/* Stats card overlapping header */}
        <Box className="px-4" style={{ marginTop: -28 }}>
          <Box
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              paddingVertical: 16,
              paddingHorizontal: 10,
              shadowColor: '#1E3A8A',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <HStack className="justify-between">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <Pressable
                    key={s.label}
                    onPress={() => go('history')}
                    className="flex-1 items-center active:opacity-80"
                  >
                    <Box
                      className="items-center justify-center rounded-full"
                      style={{ width: 44, height: 44, backgroundColor: s.bg }}
                    >
                      <Icon size={18} color={s.fg} strokeWidth={2.3} />
                    </Box>
                    <Text className="mt-2 text-[18px] font-extrabold" style={{ color: '#0F172A' }}>
                      {s.value}
                    </Text>
                    <Text className="text-[11px] font-semibold" style={{ color: '#94A3B8' }}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box className="px-4 mt-5">
          <HStack className="items-center justify-between mb-3">
            <Text className="text-[16px] font-bold" style={{ color: '#0F172A' }}>
              Quick Actions
            </Text>
            <Pressable className="flex-row items-center gap-1 active:opacity-70">
              <Settings size={12} color={COLORS.primary} />
              <Text className="text-[12px] font-semibold" style={{ color: COLORS.primary }}>
                Customize
              </Text>
            </Pressable>
          </HStack>

          <Box className="flex-row flex-wrap" style={{ gap: 12 }}>
            {actions.map((a) => {
              const Icon = a.icon;
              const Watermark = a.watermark;
              const watermark = (
                <Box
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    right: -18,
                    top: 8,
                    opacity: 1,
                    transform: [{ rotate: '18deg' }],
                  }}
                >
                  <Watermark size={110} color={a.watermarkColor} strokeWidth={1.2} />
                </Box>
              );

              if (a.primary) {
                return (
                  <Pressable
                    key={a.label}
                    onPress={openNewProject}
                    className="overflow-hidden active:opacity-90"
                    style={{
                      width: '47.5%',
                      borderRadius: 24,
                      shadowColor: '#1D4ED8',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.28,
                      shadowRadius: 14,
                      elevation: 5,
                    }}
                  >
                    <LinearGradient
                      colors={['#1D4ED8', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ padding: 16, minHeight: 138, overflow: 'hidden' }}
                    >
                      {watermark}
                      <Box
                        className="items-center justify-center"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 14,
                          backgroundColor: a.iconBg,
                          zIndex: 1,
                        }}
                      >
                        <Icon size={20} color={a.iconColor} strokeWidth={2.4} />
                      </Box>
                      <Text className="mt-5 font-bold text-[13px] text-white" style={{ zIndex: 1 }}>
                        {a.label}
                      </Text>
                      <Text
                        className="text-[11px] mt-0.5"
                        style={{ color: 'rgba(255,255,255,0.8)', zIndex: 1 }}
                      >
                        {a.desc}
                      </Text>
                      <Box
                        className="absolute bottom-3.5 right-3.5 items-center justify-center rounded-full"
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: 'rgba(255,255,255,0.22)',
                          zIndex: 2,
                        }}
                      >
                        <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.6} />
                      </Box>
                    </LinearGradient>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={a.label}
                  onPress={() => go(a.to)}
                  className="overflow-hidden active:opacity-90"
                  style={{
                    width: '47.5%',
                    minHeight: 138,
                    borderRadius: 24,
                    padding: 16,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.06,
                    shadowRadius: 14,
                    elevation: 3,
                  }}
                >
                  {watermark}
                  <Box
                    className="items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      backgroundColor: a.iconBg,
                      zIndex: 1,
                    }}
                  >
                    <Icon size={18} color={a.iconColor} strokeWidth={2.3} />
                  </Box>
                  <Text
                    className="mt-5 font-bold text-[13px]"
                    style={{ color: '#0F172A', zIndex: 1 }}
                  >
                    {a.label}
                  </Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: '#94A3B8', zIndex: 1 }}>
                    {a.desc}
                  </Text>
                  <Box
                    className="absolute bottom-3.5 right-3.5 items-center justify-center rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      shadowColor: '#0F172A',
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      zIndex: 2,
                    }}
                  >
                    <ChevronRight size={14} color="#2563EB" strokeWidth={2.4} />
                  </Box>
                </Pressable>
              );
            })}
          </Box>
        </Box>

        <NotificationsCarousel onSeeAll={() => go('notifications')} />

        {/* Recent Activity */}
        <Box className="px-4 mt-6">
          <HStack className="items-center justify-between mb-3">
            <Text className="text-[16px] font-bold" style={{ color: '#0F172A' }}>
              Recent Activity
            </Text>
            <Pressable
              onPress={() => go('history')}
              className="flex-row items-center active:opacity-70"
            >
              <Text className="text-[12px] font-semibold" style={{ color: COLORS.primary }}>
                See all
              </Text>
              <ChevronRight size={13} color={COLORS.primary} />
            </Pressable>
          </HStack>

          <VStack space="sm">
            {SAMPLE_APPS.slice(0, 3).map((a) => {
              const pct = progressFor(a.status);
              return (
                <Pressable
                  key={a.id}
                  onPress={() => openAppDetails(a.id)}
                  className="active:opacity-90"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 22,
                    padding: 14,
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-start gap-3">
                    <Box
                      className="items-center justify-center rounded-full"
                      style={{ width: 42, height: 42, backgroundColor: '#EFF6FF' }}
                    >
                      <FileText size={18} color={COLORS.primary} />
                    </Box>
                    <VStack className="flex-1 min-w-0">
                      <HStack className="items-start justify-between gap-2">
                        <VStack className="flex-1 min-w-0">
                          <Text
                            className="font-bold text-[13px]"
                            style={{ color: '#0F172A' }}
                            numberOfLines={1}
                          >
                            {a.project}
                          </Text>
                          <Text className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
                            {a.id} · {a.date}
                          </Text>
                        </VStack>
                        <HStack className="items-center gap-1.5">
                          <StatusChip status={a.status} />
                          <MoreVertical size={16} color="#94A3B8" />
                        </HStack>
                      </HStack>

                      <HStack className="items-center gap-2 mt-3">
                        <Box
                          className="flex-1 rounded-full overflow-hidden"
                          style={{ height: 6, backgroundColor: '#EFF6FF' }}
                        >
                          <Box
                            style={{
                              width: `${pct}%`,
                              height: 6,
                              borderRadius: 999,
                              backgroundColor: COLORS.primary,
                            }}
                          />
                        </Box>
                        <Text className="text-[10px] font-bold" style={{ color: COLORS.primary }}>
                          {pct}%
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
        </Box>
      </ScrollView>

      <BottomNav active="home" onNav={go} onPlus={openNewProject} />
    </ScreenShell>
  );
}

export function NotificationsScreen({ go }: { go: Go }) {
  return (
    <ScreenShell>
      <AppHeader
        title="Notifications"
        subtitle="2 unread"
        right={
          <Pressable className="h-10 w-10 rounded-full bg-white/15 items-center justify-center">
            <Filter size={16} color={COLORS.white} />
          </Pressable>
        }
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Box className="px-5 pt-4">
          <HStack className="items-center gap-3 h-12 px-4 rounded-2xl bg-card shadow-sm">
            <Search size={16} color="#6B7289" />
            <TextInput
              placeholder="Search notifications"
              placeholderTextColor="#6B7289"
              className="flex-1 text-sm text-foreground"
            />
          </HStack>

          <VStack className="mt-4" space="sm">
            {NOTIFS.map((n) => {
              const colorClass =
                n.type === 'success'
                  ? 'bg-success/10'
                  : n.type === 'warning'
                    ? 'bg-warning/15'
                    : 'bg-primary/10';
              const iconColor =
                n.type === 'success'
                  ? COLORS.success
                  : n.type === 'warning'
                    ? COLORS.warning
                    : COLORS.primary;
              const Icon =
                n.type === 'success'
                  ? CheckCircle2
                  : n.type === 'warning'
                    ? AlertTriangle
                    : Bell;

              return (
                <AppCard
                  key={n.id}
                  className={`p-4 ${n.unread ? '' : 'opacity-70'}`}
                >
                  <HStack className="items-start gap-3">
                    <IconBox className={colorClass}>
                      <Icon size={20} color={iconColor} />
                    </IconBox>
                    <VStack className="flex-1 min-w-0">
                      <HStack className="items-center justify-between gap-2">
                        <Text
                          className="font-semibold text-sm text-foreground flex-1"
                          numberOfLines={1}
                        >
                          {n.title}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground shrink-0">
                          {n.time}
                        </Text>
                      </HStack>
                      <Text className="text-xs text-muted-foreground">{n.body}</Text>
                    </VStack>
                    {n.unread ? (
                      <Box className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                    ) : null}
                  </HStack>
                </AppCard>
              );
            })}
          </VStack>
        </Box>
      </ScrollView>
      <BottomNav active="notif" onNav={go} />
    </ScreenShell>
  );
}

const APP_STATUS_ACCENT: Record<string, string> = {
  Submitted: '#10B981',
  Verified: '#059669',
  Approved: '#10B981',
  Returned: '#F97316',
  Rejected: '#EF4444',
  Draft: '#3B82F6',
};

const APP_FILTERS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: 'All', label: 'All', icon: Layers },
  { key: 'Draft', label: 'Draft', icon: FileText },
  { key: 'Submitted', label: 'Submitted', icon: Send },
  { key: 'Returned', label: 'Returned', icon: Undo2 },
  { key: 'Verified', label: 'Verified', icon: CheckCircle2 },
  { key: 'Rejected', label: 'Rejected', icon: XCircle },
];

function ApplicationThumb({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <Box
      className="overflow-hidden"
      style={{
        width: 72,
        height: 72,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
      }}
    >
      <Image
        source={{ uri: failed ? SITE_IMAGES.default : uri }}
        style={{ width: 72, height: 72 }}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    </Box>
  );
}

function ApplicationListCard({
  id,
  project,
  status,
  village,
  date,
  image,
  onPress,
}: {
  id: string;
  project: string;
  status: string;
  village: string;
  date: string;
  image: string;
  onPress: () => void;
}) {
  const accent = APP_STATUS_ACCENT[status] || COLORS.primary;

  return (
    <Pressable onPress={onPress} className="active:opacity-92">
      <Box
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 22,
          overflow: 'hidden',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.07,
          shadowRadius: 16,
          elevation: 3,
        }}
      >
        <HStack>
          <Box style={{ width: 4, backgroundColor: accent, alignSelf: 'stretch' }} />
          <VStack className="flex-1" style={{ padding: 14 }}>
            <HStack className="items-center justify-between mb-3">
              <Text className="text-[11px] font-semibold" style={{ color: '#94A3B8' }}>
                {id}
              </Text>
              <StatusChip status={status} />
            </HStack>

            <HStack className="items-start gap-3">
              <ApplicationThumb uri={image} />
              <VStack className="flex-1 min-w-0">
                <Text
                  className="text-[15px] font-extrabold leading-5"
                  style={{ color: '#0F172A' }}
                  numberOfLines={2}
                >
                  {project}
                </Text>

                <HStack className="items-center mt-2.5 flex-wrap" style={{ gap: 12 }}>
                  <HStack className="items-center gap-1">
                    <MapPin size={13} color="#94A3B8" strokeWidth={2.3} />
                    <Text className="text-[12px] font-medium" style={{ color: '#64748B' }}>
                      {village}
                    </Text>
                  </HStack>
                  <HStack className="items-center gap-1">
                    <CalendarDays size={13} color="#94A3B8" strokeWidth={2.3} />
                    <Text className="text-[12px] font-medium" style={{ color: '#64748B' }}>
                      {date}
                    </Text>
                  </HStack>
                </HStack>

                <HStack className="justify-end mt-3">
                  <HStack className="items-center gap-0.5">
                    <Text className="text-[13px] font-bold" style={{ color: COLORS.primary }}>
                      Open
                    </Text>
                    <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.6} />
                  </HStack>
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </HStack>
      </Box>
    </Pressable>
  );
}

export function HistoryScreen({ go }: { go: Go }) {
  const { applications, draft, openApplication, statusOverrides } = useProject();
  const [tab, setTab] = useState('All');

  const openDetails = (id: string, status: string, live: boolean) => {
    if (status === 'Draft' && live) {
      go('project');
      return;
    }
    openApplication(id);
    go('details');
  };

  const liveApps = useMemo(() => {
    const submitted = applications.map((a) => ({
      id: a.applicationId,
      project: a.projectName,
      status: 'Submitted' as string,
      date: new Date(a.submittedAt).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      village: a.village,
      image: imageForProject(a.projectName, a.coverImage),
      live: true as const,
    }));

    const draftPhoto =
      draft.photos[0]?.uri ||
      draft.surroundingPhotos.N?.uri ||
      draft.surroundingPhotos.S?.uri ||
      draft.surroundingPhotos.E?.uri ||
      draft.surroundingPhotos.W?.uri ||
      null;

    const draftRow =
      draft.status === 'draft' &&
      (draft.projectName.trim() || draft.surveyNo.trim() || draft.gps)
        ? [
            {
              id: draft.id,
              project: draft.projectName.trim() || 'Untitled draft',
              status: 'Draft' as string,
              date: new Date(draft.updatedAt).toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              village: draft.village.trim() || '—',
              image: imageForProject(draft.projectName, draftPhoto),
              live: true as const,
            },
          ]
        : [];

    const submittedIds = new Set(submitted.map((s) => s.id));

    const sample = SAMPLE_APPS.map((a) => {
      const status = statusOverrides[a.id] || a.status;
      return {
        id: a.id,
        project: a.project,
        status: status as string,
        date: a.date,
        village: a.village,
        image: a.image,
        live: false as const,
      };
    }).filter((a) => !(a.status === 'Submitted' && submittedIds.has(a.id)));

    return [...draftRow, ...submitted, ...sample];
  }, [applications, draft, statusOverrides]);

  const filtered = tab === 'All' ? liveApps : liveApps.filter((a) => a.status === tab);

  return (
    <ScreenShell className="bg-[#F3F4F6]">
      <AppHeader
        title="Applications"
        subtitle="All your CDRMS reports"
        right={
          <Pressable className="h-10 w-10 rounded-full bg-white/15 border border-white/25 items-center justify-center">
            <Search size={16} color={COLORS.white} />
          </Pressable>
        }
      />

      <Box style={{ backgroundColor: '#F3F4F6' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="grow-0"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 10,
            gap: 8,
          }}
        >
          {APP_FILTERS.map((f) => {
            const Icon = f.icon;
            const on = tab === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setTab(f.key)}
                className="flex-row items-center gap-1.5 active:opacity-85"
                style={{
                  height: 38,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: on ? COLORS.primary : '#FFFFFF',
                  borderWidth: on ? 0 : 1,
                  borderColor: '#E2E8F0',
                  shadowColor: on ? COLORS.primary : '#0F172A',
                  shadowOffset: { width: 0, height: on ? 6 : 2 },
                  shadowOpacity: on ? 0.28 : 0.04,
                  shadowRadius: on ? 10 : 4,
                  elevation: on ? 4 : 1,
                }}
              >
                <Icon
                  size={14}
                  color={on ? '#FFFFFF' : '#64748B'}
                  strokeWidth={on ? 2.4 : 2.1}
                />
                <Text
                  className="text-[12px] font-bold"
                  style={{ color: on ? '#FFFFFF' : '#64748B' }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Box>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack className="px-4" space="md">
          {filtered.length === 0 ? (
            <Box
              className="items-center py-14 px-6"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                shadowColor: '#0F172A',
                shadowOpacity: 0.05,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Box
                className="h-16 w-16 rounded-full items-center justify-center"
                style={{ backgroundColor: '#EFF6FF' }}
              >
                <FileText size={28} color={COLORS.primary} />
              </Box>
              <Text className="mt-4 font-extrabold text-foreground text-[16px]">
                No applications
              </Text>
              <Text className="text-xs text-muted-foreground mt-1 text-center">
                Nothing in this category yet.
              </Text>
            </Box>
          ) : null}

          {filtered.map((a) => (
            <ApplicationListCard
              key={`${a.id}-${a.status}`}
              id={a.id}
              project={a.project}
              status={a.status}
              village={a.village}
              date={a.date}
              image={a.image}
              onPress={() => openDetails(a.id, a.status, a.live)}
            />
          ))}
        </VStack>
      </ScrollView>
      <BottomNav active="apps" onNav={go} />
    </ScreenShell>
  );
}

export function ProfileScreen({ go }: { go: Go }) {
  const infoRows = [
    { icon: Phone, label: 'Phone', val: '+91 98765 43210' },
    { icon: MapPinned, label: 'Assigned Area', val: 'Bengaluru Rural · Karnataka' },
    { icon: Building2, label: 'Office', val: 'PWD Regional Office, Bengaluru' },
  ] as const;

  const menuRows = [
    { icon: Lock, label: 'Change Password' },
    { icon: HelpCircle, label: 'Help & Support' },
    { icon: Settings, label: 'App Settings' },
    { icon: ShieldCheck, label: 'About CDRMS' },
  ] as const;

  return (
    <ScreenShell>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <GradientHeader rounded>
          <Box className="px-5 pb-10">
            <HStack className="items-center gap-2 pt-2">
              <Pressable
                onPress={() => go('dashboard')}
                className="h-10 w-10 rounded-full items-center justify-center"
              >
                <ArrowLeft size={20} color={COLORS.white} />
              </Pressable>
              <Text className="text-lg font-bold text-white">Profile</Text>
            </HStack>

            <VStack className="mt-6 items-center">
              <Box
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 28,
                  padding: 3,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.22,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <Image
                  source={require('../../../assets/officer-avatar.png')}
                  style={{
                    width: 98,
                    height: 98,
                    borderRadius: 25,
                    backgroundColor: '#E2E8F0',
                  }}
                  resizeMode="cover"
                />
              </Box>
              <Text className="mt-4 font-extrabold text-xl text-white">
                Er. Ravi Shankar
              </Text>
              <Text className="text-sm text-white/85">Assistant Engineer · CDRMS</Text>
              <HStack className="mt-3 items-center gap-2">
                <Box className="bg-white/15 px-2.5 py-1 rounded-full">
                  <Text className="text-[11px] text-white">ID · ENG-4821</Text>
                </Box>
                <Box className="bg-white/15 px-2.5 py-1 rounded-full">
                  <Text className="text-[11px] text-white">Zone · KA-BLR-R-02</Text>
                </Box>
              </HStack>
            </VStack>
          </Box>
        </GradientHeader>

        <VStack className="px-5 -mt-5" space="sm">
          <AppCard className="p-0 overflow-hidden">
            {infoRows.map((r, i) => {
              const Icon = r.icon;
              return (
                <HStack
                  key={r.label}
                  className={`items-center gap-3 p-4 ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <IconBox className="bg-primary/10">
                    <Icon size={20} color={COLORS.primary} />
                  </IconBox>
                  <VStack className="flex-1">
                    <Text className="text-[11px] uppercase font-semibold text-muted-foreground">
                      {r.label}
                    </Text>
                    <Text className="font-semibold text-sm text-foreground">{r.val}</Text>
                  </VStack>
                </HStack>
              );
            })}
          </AppCard>

          <AppCard className="p-0 overflow-hidden">
            {menuRows.map((r, i) => {
              const Icon = r.icon;
              return (
                <Pressable
                  key={r.label}
                  className={`flex-row items-center gap-3 p-4 active:opacity-80 ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <IconBox className="bg-muted">
                    <Icon size={20} color={COLORS.primaryDeep} />
                  </IconBox>
                  <Text className="flex-1 font-semibold text-sm text-foreground">
                    {r.label}
                  </Text>
                  <ChevronRight size={16} color="#6B7289" />
                </Pressable>
              );
            })}
          </AppCard>

          <Pressable
            onPress={() => go('login')}
            className="w-full h-14 rounded-2xl bg-destructive/10 flex-row items-center justify-center gap-2 active:opacity-90"
          >
            <LogOut size={20} color={COLORS.destructive} />
            <Text className="font-bold text-destructive">Logout</Text>
          </Pressable>

          <Text className="text-center text-[11px] text-muted-foreground pt-2">
            CDRMS Engineer · v 4.2.1 (build 20260724)
          </Text>
        </VStack>
      </ScrollView>
      <BottomNav active="profile" onNav={go} />
    </ScreenShell>
  );
}
