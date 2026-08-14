import { ArrowLeft, MapPin } from 'lucide-react-native';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { FONTS, SPACE } from '@/src/cdrms/theme';

const SURVEY_STEP_HERO = require('../../../assets/illustrations/survey-step-hero.png');

export function CreateApplicationHeader({
  onBack,
  zone,
  title = 'Create Application',
  subtitle,
}: {
  onBack: () => void;
  zone?: string | null;
  title?: string;
  subtitle?: string;
}) {
  const insets = useSafeAreaInsets();
  const zoneLabel = (zone || '').trim() || '—';

  return (
    <Box
      style={{
        backgroundColor: '#F0F4F8',
        paddingTop: insets.top + 8,
        paddingHorizontal: SPACE.gutter,
        paddingBottom: 10,
        overflow: 'visible',
        minHeight: insets.top + 128,
      }}
    >
      <Box
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 0,
          top: insets.top,
          bottom: 0,
          width: 148,
          justifyContent: 'center',
          alignItems: 'flex-end',
          zIndex: 0,
        }}
      >
        <Image
          source={SURVEY_STEP_HERO}
          style={{ width: 136, height: 120, marginRight: 2 }}
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

      <VStack style={{ marginTop: 10, gap: 6, zIndex: 1, paddingRight: 120 }}>
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: 28,
            lineHeight: 34,
            color: '#1A368E',
            letterSpacing: -0.4,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 12,
              lineHeight: 16,
              color: '#475569',
            }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
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

/** Compact sticky bar — pins while the large Create Application hero scrolls away. */
export function CompactCreateApplicationHeader({
  onBack,
  zone,
  title = 'Create Application',
}: {
  onBack: () => void;
  zone?: string | null;
  title?: string;
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
            {title}
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
          source={SURVEY_STEP_HERO}
          style={{ width: 58, height: 52, flexShrink: 0 }}
          resizeMode="contain"
        />
      </HStack>
    </Box>
  );
}
