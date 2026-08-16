import { ArrowLeft, MapPin } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { FONTS, SPACE } from '@/src/cdrms/theme';
import { BdaPageWatermark } from '@/src/cdrms/components/WelcomeHomeChrome';

const VIEW_APP_HERO = require('../../../assets/illustrations/view-application-hero-v4.png');
const COMPACT_SCROLL_THRESHOLD = 48;

export function ViewApplicationHeader({
  onBack,
  zone,
}: {
  onBack: () => void;
  zone?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const zoneLabel = (zone || '').trim() || '—';

  return (
    <Box
      style={{
        backgroundColor: '#F0F4F8',
        paddingTop: insets.top + 8,
        paddingHorizontal: SPACE.gutter,
        paddingBottom: 22,
        overflow: 'visible',
        minHeight: insets.top + 158,
      }}
    >
      {/* Hero centered vertically in the blue header band */}
      <Box
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 0,
          top: insets.top,
          bottom: 0,
          width: 140,
          justifyContent: 'center',
          alignItems: 'flex-end',
          zIndex: 0,
        }}
      >
        <Image
          source={VIEW_APP_HERO}
          style={{ width: 128, height: 118, marginRight: 4 }}
          resizeMode="contain"
        />
      </Box>

      <Pressable
        onPress={onBack}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="active:opacity-80"
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: '#E6EEF9',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <ArrowLeft size={18} color="#1A368E" strokeWidth={2.4} />
      </Pressable>

      <VStack style={{ marginTop: 18, gap: 10, zIndex: 1, paddingRight: 112 }}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontFamily: FONTS.bold,
            fontSize: 27,
            lineHeight: 26,
            color: '#1A368E',
            letterSpacing: -0.3,
          }}
        >
          View Application
        </Text>
        <HStack
          className="items-center"
          style={{
            alignSelf: 'flex-start',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: '#E6EEF9',
          }}
        >
          <MapPin size={12} color="#1A368E" strokeWidth={2.5} />
          <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#1A368E' }}>
            Zone {zoneLabel}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}

/** Compact sticky bar — pins while the large View Application hero scrolls away. */
export function CompactViewApplicationHeader({
  onBack,
  zone,
}: {
  onBack: () => void;
  zone?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const zoneLabel = (zone || '').trim() || '—';

  return (
    <Box
      style={{
        backgroundColor: '#F7FAFF',
        paddingTop: insets.top + 6,
        paddingBottom: 10,
        paddingHorizontal: SPACE.gutter,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(26,86,219,0.12)',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <HStack className="items-center" style={{ gap: 10 }}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="active:opacity-80"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: 'rgba(26,86,219,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={16} color="#1A368E" strokeWidth={2.3} />
        </Pressable>
        <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 15,
              color: '#1A368E',
            }}
            numberOfLines={1}
          >
            View Application
          </Text>
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 11,
              color: '#475569',
            }}
            numberOfLines={1}
          >
            Zone {zoneLabel}
          </Text>
        </VStack>
        <Image
          source={VIEW_APP_HERO}
          style={{ width: 58, height: 52, flexShrink: 0 }}
          resizeMode="contain"
        />
      </HStack>
    </Box>
  );
}

/**
 * Shared scroll shell for Engineer / ZC / CAO View Application —
 * large hero scrolls; compact header sticks on scroll.
 */
export function ViewApplicationScroll({
  onBack,
  zone,
  children,
  contentContainerStyle,
  scrollKey,
}: {
  onBack: () => void;
  zone?: string | null;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollKey?: string | number;
}) {
  const [compact, setCompact] = useState(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y > COMPACT_SCROLL_THRESHOLD;
    setCompact((prev) => (prev === next ? prev : next));
  };

  return (
    <Box style={{ flex: 1, backgroundColor: 'transparent' }}>
      <BdaPageWatermark />
      {compact ? (
        <Box
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            elevation: 20,
          }}
        >
          <CompactViewApplicationHeader onBack={onBack} zone={zone} />
        </Box>
      ) : null}

      <ScrollView
        key={scrollKey}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        keyboardShouldPersistTaps="handled"
      >
        <ViewApplicationHeader onBack={onBack} zone={zone} />
        {children}
      </ScrollView>
    </Box>
  );
}
