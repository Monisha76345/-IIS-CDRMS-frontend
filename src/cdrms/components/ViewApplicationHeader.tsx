import { ArrowLeft, MapPin } from 'lucide-react-native';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { FONTS, SPACE } from '@/src/cdrms/theme';

const VIEW_APP_HERO = require('../../../assets/illustrations/view-application-hero-v3.png');

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
