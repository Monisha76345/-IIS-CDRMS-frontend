import { Check, Ellipsis } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable as RNPressable,
  View as RNView,
} from 'react-native';

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
  layoutIdForTheme,
  getLayoutOption,
  type LayoutId,
} from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeId } from '@/src/cdrms/themePresets';
import type { Go } from '@/src/cdrms/types';

/** Profile grid groups — Ocean Blue, Navy, Azure, Sky. */
const PROFILE_THEME_GROUPS: ReadonlyArray<{
  id: LayoutId;
  title: string;
  ids: readonly ThemeId[];
}> = [
  { id: 'classic', title: 'App Themes', ids: ['blue', 'navy', 'azure', 'sky'] },
];

/**
 * Header theme control:
 * - Opens menu with 3 quick colors
 * - Extra “More” opens Profile → full theme list
 */
export function ThemeToggleButton({
  variant = 'header',
  go,
}: {
  variant?: 'header' | 'plain';
  go?: Go;
}) {
  const { themeId, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<ThemeId | null>(null);
  const [dropTop, setDropTop] = useState(100);
  const btnRef = useRef<RNView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;

  const onHeader = variant === 'header';
  const quickOptions = HEADER_THEME_OPTIONS;
  const active = getThemeOption(themeId);
  const activeIsQuick = quickOptions.some((o) => o.id === themeId);

  const openMenu = () => {
    btnRef.current?.measure((_fx, _fy, _w, h, _px, py) => {
      setDropTop(py + h + 4);
    });
    setOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 320,
      }),
    ]).start();
  };

  const closeMenu = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -8, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      cb?.();
    });
  };

  const pickTheme = (id: ThemeId) => {
    if (id === themeId || saving) return;
    void (async () => {
      setSaving(id);
      try {
        await setTheme(id);
        closeMenu();
      } finally {
        setSaving(null);
      }
    })();
  };

  const openMoreThemes = () => {
    closeMenu(() => {
      requestFocusProfileTheme();
      go?.('profile');
    });
  };

  return (
    <>
      <Pressable
        ref={btnRef as any}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel="Quick themes"
        className="active:opacity-80"
        style={{
          height: 38,
          minWidth: 46,
          paddingHorizontal: 7,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: onHeader ? 'rgba(255,255,255,0.18)' : COLORS.white,
          borderWidth: 1.5,
          borderColor: activeIsQuick
            ? onHeader
              ? 'rgba(255,255,255,0.5)'
              : COLORS.border
            : active.swatch,
        }}
      >
        {/* Three quick-theme dots — active one is larger */}
        <HStack style={{ alignItems: 'center', height: 18 }}>
          {quickOptions.map((opt, i) => {
            const selected = themeId === opt.id;
            const size = selected ? 14 : 11;
            return (
              <Box
                key={opt.id}
                style={{
                  width: size,
                  height: size,
                  borderRadius: 999,
                  backgroundColor: opt.swatch,
                  marginLeft: i === 0 ? 0 : -4,
                  borderWidth: selected ? 2 : 1.5,
                  borderColor: onHeader ? '#FFFFFF' : COLORS.white,
                  zIndex: selected ? 3 : 3 - i,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.18,
                  shadowRadius: 2,
                  elevation: selected ? 3 : 1,
                }}
              />
            );
          })}
          {!activeIsQuick ? (
            <Box
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                backgroundColor: active.swatch,
                marginLeft: -3,
                borderWidth: 2,
                borderColor: onHeader ? '#FFFFFF' : COLORS.white,
                zIndex: 4,
              }}
            />
          ) : null}
        </HStack>
      </Pressable>

      <Modal transparent animationType="none" visible={open} onRequestClose={() => closeMenu()}>
        <RNPressable
          style={{ flex: 1 }}
          onPress={() => closeMenu()}
          accessibilityRole="button"
          accessibilityLabel="Close theme menu"
        />

        <Animated.View
          style={{
            position: 'absolute',
            top: dropTop,
            right: 16,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            minWidth: 228,
            borderRadius: 16,
            backgroundColor: COLORS.white,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.14,
            shadowRadius: 18,
            elevation: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink, marginBottom: 2 }}>
            Quick themes
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 11,
              color: COLORS.slate,
              marginBottom: 10,
            }}
          >
            Tap a color to switch theme
          </Text>

          <HStack style={{ gap: 8, alignItems: 'flex-start' }}>
            {quickOptions.map((opt) => {
              const selected = themeId === opt.id;
              const busy = saving === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => pickTheme(opt.id)}
                  disabled={Boolean(saving)}
                  className="active:opacity-85"
                  accessibilityLabel={`${opt.label} theme`}
                  style={{ alignItems: 'center', gap: 4, flex: 1 }}
                >
                  <Box
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      backgroundColor: opt.swatch,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: selected ? 2.5 : 0,
                      borderColor: COLORS.white,
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : selected ? (
                      <Check size={16} color="#FFFFFF" strokeWidth={3} />
                    ) : null}
                  </Box>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: selected ? FONTS.bold : FONTS.medium,
                      fontSize: 9,
                      color: selected ? COLORS.ink : COLORS.slate,
                      textAlign: 'center',
                    }}
                  >
                    {opt.label.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>
        </Animated.View>
      </Modal>
    </>
  );
}

/** Full theme grid for Profile — ordered by design family. */
export function ThemePicker() {
  const { themeId, setTheme, themeOptions } = useTheme();
  const [saving, setSaving] = useState<ThemeId | null>(null);
  const layout = getLayoutOption(layoutIdForTheme(themeId));
  const byId = new Map(themeOptions.map((o) => [o.id, o]));

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
    <VStack style={{ gap: 6 }}>
      <Text
        style={{
          fontFamily: FONTS.regular,
          fontSize: 11,
          color: COLORS.slate,
          lineHeight: 14,
        }}
      >
        Color + layout style change together across the app.
      </Text>
      <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.primary }}>
        Design: {layout.label} — {layout.blurb}
      </Text>

      {PROFILE_THEME_GROUPS.map((group) => (
        <VStack key={group.id} style={{ gap: 4 }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 10,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: COLORS.slate,
            }}
          >
            {group.title}
          </Text>
          <HStack style={{ flexWrap: 'wrap', gap: 6 }}>
            {group.ids.map((id) => {
              const opt = byId.get(id);
              if (!opt) return null;
              const selected = themeId === opt.id;
              const busy = saving === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => pick(opt.id)}
                  className="active:opacity-90"
                  style={{ width: '23%', flexGrow: 0 }}
                >
                  <Box
                    style={{
                      borderRadius: 10,
                      paddingVertical: 8,
                      paddingHorizontal: 6,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? opt.swatch : COLORS.border,
                      backgroundColor: COLORS.white,
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Box
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        backgroundColor: opt.swatch,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : selected ? (
                        <Check size={11} color="#FFFFFF" strokeWidth={3} />
                      ) : null}
                    </Box>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: selected ? FONTS.bold : FONTS.medium,
                        fontSize: 10,
                        color: selected ? COLORS.ink : COLORS.slate,
                        textAlign: 'center',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </HStack>
        </VStack>
      ))}

      <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.slate }}>
        Current: {getThemeOption(themeId).label}
      </Text>
    </VStack>
  );
}
