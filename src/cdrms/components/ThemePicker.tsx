import { Check, Palette } from 'lucide-react-native';
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
import { COLORS, FONTS, getThemeOption } from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeId } from '@/src/cdrms/themePresets';

export function ThemeToggleButton({ variant = 'header' }: { variant?: 'header' | 'plain' }) {
  const { themeId, setTheme, themeOptions } = useTheme();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<ThemeId | null>(null);
  const [dropTop, setDropTop] = useState(100);
  const btnRef = useRef<RNView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;

  const onHeader = variant === 'header';
  const active = getThemeOption(themeId);

  const openMenu = () => {
    btnRef.current?.measure((_fx, _fy, _w, h, _px, py) => {
      setDropTop(py + h + 4);
    });
    setOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 320 }),
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

  return (
    <>
      <Pressable
        ref={btnRef as any}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel="Change app theme"
        className="active:opacity-80"
        style={{
          height: 38,
          width: 38,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: onHeader ? 'rgba(255,255,255,0.22)' : COLORS.muted,
          borderWidth: 1.5,
          borderColor: onHeader ? 'rgba(255,255,255,0.45)' : COLORS.border,
        }}
      >
        <Box
          style={{
            position: 'absolute',
            width: 14,
            height: 14,
            borderRadius: 999,
            backgroundColor: active.swatch,
            bottom: 6,
            right: 6,
            borderWidth: 1.5,
            borderColor: onHeader ? 'rgba(255,255,255,0.85)' : COLORS.white,
          }}
        />
        <Palette size={17} color={onHeader ? COLORS.white : COLORS.primary} strokeWidth={2.3} />
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
            minWidth: 220,
            borderRadius: 16,
            backgroundColor: COLORS.white,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.14,
            shadowRadius: 18,
            elevation: 8,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink, marginBottom: 2 }}>
            App theme
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 11,
              color: COLORS.slate,
              marginBottom: 10,
            }}
          >
            Saved to your account
          </Text>
          <HStack style={{ gap: 8, justifyContent: 'space-between' }}>
            {themeOptions.map((opt) => {
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
                      borderColor: COLORS.ink,
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

/** Full-width picker for profile/settings screens */
export function ThemePicker() {
  const { themeId, setTheme, themeOptions } = useTheme();
  const [saving, setSaving] = useState<ThemeId | null>(null);

  return (
    <VStack style={{ gap: 10 }}>
      <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
        App theme
      </Text>
      <Text
        style={{
          fontFamily: FONTS.regular,
          fontSize: 12,
          color: COLORS.slate,
          lineHeight: 17,
        }}
      >
        Choose a color theme for the entire app. Saved to your account.
      </Text>
      <HStack style={{ flexWrap: 'wrap', gap: 10 }}>
        {themeOptions.map((opt) => {
          const selected = themeId === opt.id;
          const busy = saving === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => {
                if (selected || busy) return;
                void (async () => {
                  setSaving(opt.id);
                  try {
                    await setTheme(opt.id);
                  } finally {
                    setSaving(null);
                  }
                })();
              }}
              className="active:opacity-90"
              style={{ width: '47%', flexGrow: 1 }}
            >
              <Box
                style={{
                  borderRadius: 14,
                  padding: 12,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? opt.swatch : COLORS.border,
                  backgroundColor: COLORS.white,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: selected ? 0.1 : 0.05,
                  shadowRadius: 8,
                  elevation: selected ? 3 : 1,
                }}
              >
                <HStack style={{ alignItems: 'center', gap: 10 }}>
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      backgroundColor: opt.swatch,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : selected ? (
                      <Check size={16} color="#FFFFFF" strokeWidth={3} />
                    ) : null}
                  </Box>
                  <VStack style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
                      {opt.label}
                    </Text>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 10, color: COLORS.slate }}>
                      {selected ? 'Active' : 'Tap to apply'}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </Pressable>
          );
        })}
      </HStack>
      <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: COLORS.slate }}>
        Current: {getThemeOption(themeId).label}
      </Text>
    </VStack>
  );
}
