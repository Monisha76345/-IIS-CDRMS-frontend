import { Check, Ellipsis } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable as RNPressable,
  useWindowDimensions,
  View as RNView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { requestFocusProfileTheme } from '@/src/cdrms/officeSelection';
import {
  COLORS,
  FONTS,
  getThemeOption,
  HEADER_THEME_OPTIONS,
  THEME_OPTIONS,
  layoutIdForTheme,
  getLayoutOption,
  gradientStops,
  hexAlpha,
} from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeId } from '@/src/cdrms/themePresets';
import { buildThemePreset } from '@/src/cdrms/themePresets';
import type { Go } from '@/src/cdrms/types';

/** Designs on Profile — Ocean Blue only */
const DESIGN_IDS: readonly ThemeId[] = ['ocean'] as const;

function DesignPreviewStrip({ themeId }: { themeId: ThemeId }) {
  const preset = buildThemePreset(themeId);
  const layout = getLayoutOption(layoutIdForTheme(themeId));
  // Mesh uses silk stops; Plain preview uses soft pastels; others use header
  const colors =
    layout.headerWave === 'mesh' && preset.GRADIENT_MESH.length >= 3
      ? preset.GRADIENT_MESH
      : layout.headerWave === 'plain' && preset.GRADIENT_MESH.length >= 3
        ? preset.GRADIENT_MESH
        : preset.GRADIENT_HEADER;
  const { width } = useWindowDimensions();
  const w = Math.min(width - 48, 320);
  const h = 44;
  const wave = layout.headerWave;
  const soft = preset.COLORS.soft;

  let wavePath = `M0 ${h * 0.55} Q ${w * 0.5} ${h * 1.1} ${w} ${h * 0.55} L ${w} ${h} L 0 ${h} Z`;
  if (wave === 'asymmetric') {
    wavePath = `M0 0 L ${w} 0 L ${w} ${h * 0.25} C ${w * 0.65} ${h * 0.2}, ${w * 0.4} ${h}, ${w * 0.15} ${h * 0.7} L 0 ${h} Z`;
  } else if (wave === 'swoop') {
    wavePath = `M0 0 L ${w} 0 L ${w} ${h} C ${w * 0.7} ${h * 0.2}, ${w * 0.35} ${h * 0.45}, 0 ${h * 0.55} Z`;
  } else if (wave === 'mesh') {
    // Scallop lobes preview — Mesh identity
    const lobe = w / 4;
    wavePath = `M0 ${h} L0 ${h * 0.28}`;
    for (let i = 0; i < 4; i++) {
      const x1 = (i + 0.5) * lobe;
      const x2 = (i + 1) * lobe;
      const dip = i % 2 === 0 ? h * 0.92 : h * 0.78;
      wavePath += ` Q ${x1} ${dip} ${x2} ${h * 0.28}`;
    }
    wavePath += ` L ${w} ${h} Z`;
  } else if (wave === 'plain') {
    wavePath = `M0 ${h * 0.7} Q ${w * 0.5} ${h * 0.45} ${w} ${h * 0.7} L ${w} ${h} L 0 ${h} Z`;
  } else if (wave === 'solid') {
    // Flat bottom — Ocean Blue has no wave header
    wavePath = `M0 ${h} L ${w} ${h} L ${w} ${h} L 0 ${h} Z`;
  }

  return (
    <Box
      style={{
        height: 56,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: soft,
      }}
    >
      <LinearGradient
        colors={gradientStops([...colors])}
        start={layout.headerStart}
        end={layout.headerEnd}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Svg
        width="100%"
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
        preserveAspectRatio="none"
      >
        <Path d={wavePath} fill={soft} />
      </Svg>
      {/* Mini stepper dots preview */}
      <HStack
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 10,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            style={{
              width: i === 1 ? 10 : 8,
              height: i === 1 ? 10 : 8,
              borderRadius: 999,
              backgroundColor: i <= 1 ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.9)',
            }}
          />
        ))}
      </HStack>
    </Box>
  );
}

/**
 * Header theme control:
 * - Opens menu with quick colors
 * - Extra “More” opens Profile → full design list
 */
export function ThemeToggleButton({
  variant = 'header',
  go,
}: {
  variant?: 'header' | 'plain' | 'profilePill';
  go?: Go;
}) {
  const { themeId, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropTop, setDropTop] = useState(100);
  const btnRef = useRef<RNView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  const quickOptions = HEADER_THEME_OPTIONS;
  const active = getThemeOption(themeId);
  const activeIsQuick = quickOptions.some((o) => o.id === themeId);
  /** Visual swatches for profile header pill (matches ref mock). */
  const profilePillDots = ['#1A56DB', '#60A5FA', '#1E3A8A', '#22D3EE'] as const;

  const openMenu = () => {
    btnRef.current?.measure((_fx, _fy, _w, h, _px, py) => {
      setDropTop(py + h + 4);
    });
    setOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 300 }),
    ]).start();
  };

  const closeMenu = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -10, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      cb?.();
    });
  };

  const pick = (id: ThemeId) => {
    if (id === themeId || saving) return;
    void (async () => {
      setSaving(true);
      try {
        await setTheme(id);
      } finally {
        setSaving(false);
        closeMenu();
      }
    })();
  };

  return (
    <>
      <RNPressable
        ref={btnRef}
        onPress={openMenu}
        style={
          variant === 'profilePill'
            ? { paddingVertical: 4, paddingHorizontal: 2 }
            : { padding: 6 }
        }
        accessibilityLabel="Theme"
      >
        {variant === 'profilePill' ? (
          <Box
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: 'rgba(26,86,219,0.18)',
              shadowColor: '#1A368E',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            {profilePillDots.map((c) => (
              <Box
                key={c}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: c,
                }}
              />
            ))}
          </Box>
        ) : (
          <Box
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              backgroundColor: active.swatch,
              borderWidth: 2,
              borderColor: variant === 'header' ? '#FFFFFF' : COLORS.border,
            }}
          />
        )}
      </RNPressable>
      <Modal visible={open} transparent animationType="none" onRequestClose={() => closeMenu()}>
        <RNPressable style={{ flex: 1 }} onPress={() => closeMenu()}>
          <Animated.View
            style={{
              position: 'absolute',
              top: dropTop,
              right: 12,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: COLORS.white,
              borderRadius: 14,
              padding: 10,
              minWidth: 180,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
              gap: 6,
            }}
          >
            {quickOptions.map((opt) => {
              const selected = themeId === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => pick(opt.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 4,
                  }}
                >
                  <Box
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      backgroundColor: opt.swatch,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected ? <Check size={10} color="#FFF" strokeWidth={3} /> : null}
                  </Box>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: COLORS.ink }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
            {!activeIsQuick ? (
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: COLORS.slate }}>
                Current: {active.label}
              </Text>
            ) : null}
            {go ? (
              <Pressable
                onPress={() =>
                  closeMenu(() => {
                    requestFocusProfileTheme();
                    go('profile');
                  })
                }
                style={{
                  marginTop: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: COLORS.border,
                }}
              >
                <Ellipsis size={14} color={COLORS.primary} />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.primary }}>
                  All designs
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </RNPressable>
      </Modal>
    </>
  );
}

/** Profile — select one complete design (color + layout + waves + stepper). */
export function ThemePicker() {
  const { themeId, setTheme } = useTheme();
  const [saving, setSaving] = useState<ThemeId | null>(null);
  const layout = getLayoutOption(layoutIdForTheme(themeId));

  const pick = (id: ThemeId) => {
    if (id === themeId || saving === id) return;
    void (async () => {
      setSaving(id);
      try {
        await setTheme(id);
      } finally {
        setSaving(null);
      }
    })();
  };

  return (
    <VStack style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: FONTS.regular,
          fontSize: 12,
          color: COLORS.slate,
          lineHeight: 16,
        }}
      >
        Choose one design on Profile. Only the selected look applies across the app.
      </Text>
      <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.primary }}>
        Active: {getThemeOption(themeId).label} — {layout.blurb}
      </Text>

      <VStack style={{ gap: 10 }}>
        {DESIGN_IDS.map((id) => {
          const opt = THEME_OPTIONS.find((t) => t.id === id) ?? getThemeOption(id);
          const layoutOpt = getLayoutOption(layoutIdForTheme(id));
          const selected = themeId === id;
          const busy = saving === id;
          return (
            <Pressable
              key={id}
              onPress={() => pick(id)}
              className="active:opacity-92"
              disabled={busy}
            >
              <Box
                style={{
                  borderRadius: 16,
                  borderWidth: selected ? 2.5 : 1,
                  borderColor: selected ? opt.swatch : COLORS.border,
                  backgroundColor: COLORS.white,
                  overflow: 'hidden',
                  padding: 10,
                  gap: 8,
                  shadowColor: selected ? opt.swatch : '#0F172A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: selected ? 0.18 : 0.04,
                  shadowRadius: selected ? 12 : 6,
                  elevation: selected ? 4 : 1,
                }}
              >
                <DesignPreviewStrip themeId={id} />
                <HStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <VStack style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 14,
                        color: COLORS.ink,
                      }}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: 11,
                        color: COLORS.slate,
                        lineHeight: 14,
                      }}
                    >
                      {layoutOpt.blurb}
                    </Text>
                  </VStack>
                  <Box
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      backgroundColor: selected ? opt.swatch : hexAlpha(opt.swatch, 0.15),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : selected ? (
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <Box
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: opt.swatch,
                        }}
                      />
                    )}
                  </Box>
                </HStack>
              </Box>
            </Pressable>
          );
        })}
      </VStack>
    </VStack>
  );
}
