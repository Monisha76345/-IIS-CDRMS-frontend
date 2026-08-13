import { ArrowLeft, MapPin } from 'lucide-react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { FONTS, SPACE, hexAlpha } from '@/src/cdrms/theme';

function CreateHeroArt() {
  return (
    <Box pointerEvents="none" style={{ width: 132, height: 118, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Svg width={132} height={118} viewBox="0 0 120 110">
        <Ellipse cx={60} cy={100} rx={42} ry={9} fill={hexAlpha('#1A368E', 0.08)} />
        <Rect x={18} y={52} width={24} height={44} rx={4} fill="#BFDBFE" />
        <Rect x={40} y={30} width={30} height={66} rx={4} fill="#60A5FA" />
        <Rect x={66} y={42} width={24} height={54} rx={4} fill="#93C5FD" />
        <Rect x={24} y={58} width={5} height={5} rx={1} fill="#EFF6FF" />
        <Rect x={32} y={58} width={5} height={5} rx={1} fill="#EFF6FF" />
        <Rect x={24} y={68} width={5} height={5} rx={1} fill="#EFF6FF" />
        <Rect x={32} y={68} width={5} height={5} rx={1} fill="#EFF6FF" />
        <Rect x={47} y={40} width={6} height={6} rx={1} fill="#DBEAFE" />
        <Rect x={57} y={40} width={6} height={6} rx={1} fill="#DBEAFE" />
        <Rect x={47} y={52} width={6} height={6} rx={1} fill="#DBEAFE" />
        <Rect x={57} y={52} width={6} height={6} rx={1} fill="#DBEAFE" />
        <Rect x={47} y={64} width={6} height={6} rx={1} fill="#DBEAFE" />
        <Rect x={57} y={64} width={6} height={6} rx={1} fill="#DBEAFE" />
        <Rect x={72} y={52} width={5} height={5} rx={1} fill="#EFF6FF" />
        <Rect x={80} y={52} width={5} height={5} rx={1} fill="#EFF6FF" />
        <Rect x={72} y={62} width={5} height={5} rx={1} fill="#EFF6FF" />
        <Rect x={80} y={62} width={5} height={5} rx={1} fill="#EFF6FF" />
        <Ellipse cx={14} cy={88} rx={8} ry={10} fill="#4ADE80" />
        <Rect x={12.5} y={92} width={3} height={8} rx={1} fill="#16A34A" />
        <Ellipse cx={98} cy={90} rx={9} ry={11} fill="#22C55E" />
        <Rect x={96.5} y={94} width={3} height={8} rx={1} fill="#15803D" />
        <Ellipse cx={88} cy={94} rx={6} ry={7} fill="#86EFAC" />
        <Path
          d="M58 6 C47 6 38 15 38 26 C38 40 58 60 58 60 C58 60 78 40 78 26 C78 15 69 6 58 6 Z"
          fill="#2563EB"
        />
        <Circle cx={58} cy={25} r={7} fill="#FFFFFF" />
      </Svg>
    </Box>
  );
}

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
          width: 140,
          justifyContent: 'center',
          alignItems: 'flex-end',
          zIndex: 0,
        }}
      >
        <CreateHeroArt />
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
