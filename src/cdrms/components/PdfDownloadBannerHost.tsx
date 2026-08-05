import { CheckCircle2, FileText, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  handlePdfDownloadBannerPress,
  hidePdfDownloadBanner,
  subscribePdfDownloadBanner,
  type PdfDownloadBannerState,
} from '@/src/cdrms/lib/pdfDownloadBanner';
import { PdfDownloadThinProgress } from '@/src/cdrms/components/PdfDownloadThinProgress';
import { COLORS, FONTS } from '@/src/cdrms/theme';

export function PdfDownloadBannerHost() {
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<PdfDownloadBannerState | null>(null);
  const slide = useRef(new Animated.Value(-120)).current;
  const visible = banner != null;

  useEffect(() => subscribePdfDownloadBanner(setBanner), []);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : -120,
      duration: visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!banner) return null;

  const isComplete = banner.variant === 'complete';
  const isError = banner.variant === 'error';
  const isProgress = banner.variant === 'progress';
  const percent = Math.max(0, Math.min(100, banner.percent ?? (isComplete ? 100 : 0)));

  const accent = isError ? COLORS.destructive : isComplete ? '#16A34A' : COLORS.primary;
  const subtitle = isProgress
    ? banner.body || 'Preparing your PDF…'
    : isError
      ? banner.body
      : 'Tap to open';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 8 : 0),
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <Pressable
        onPress={() => {
          if (isComplete) void handlePdfDownloadBannerPress(banner);
        }}
        disabled={!isComplete}
        style={({ pressed }) => [
          styles.card,
          isComplete && pressed && styles.cardPressed,
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
          {isProgress ? (
            <ActivityIndicator size="small" color={accent} />
          ) : isComplete ? (
            <CheckCircle2 size={20} color={accent} strokeWidth={2.4} />
          ) : (
            <FileText size={20} color={accent} strokeWidth={2.2} />
          )}
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text
            style={[styles.body, isError && styles.bodyError]}
            numberOfLines={isError ? 2 : 1}
          >
            {isError ? subtitle : isProgress ? subtitle : banner.body}
          </Text>
          {isProgress ? (
            <PdfDownloadThinProgress percent={percent} style={{ marginTop: 8 }} />
          ) : null}
          {isComplete ? (
            <Text style={styles.hint}>Open with Drive, Adobe, or another app</Text>
          ) : null}
        </View>

        <Pressable
          onPress={hidePdfDownloadBanner}
          hitSlop={10}
          style={styles.closeBtn}
        >
          <X size={18} color={COLORS.slate} strokeWidth={2.2} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    paddingHorizontal: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.ink,
  },
  body: {
    marginTop: 2,
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.slate,
  },
  bodyError: {
    color: COLORS.destructive,
    fontFamily: FONTS.medium,
  },
  hint: {
    marginTop: 3,
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 4,
  },
});
