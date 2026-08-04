import { MapPin } from 'lucide-react-native';
import { View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

type Props = {
  height?: number;
  rounded?: number;
  showBadge?: boolean;
  badgeText?: string;
  latitude?: number;
  longitude?: number;
};

/**
 * Non-interactive map stand-in for screens with TextInputs.
 * Live MapView on the same screen steals first-responder on iOS/Expo Go.
 */
export function StaticMapPreview({
  height = 180,
  rounded = 0,
  showBadge = true,
  badgeText = 'Karnataka, India',
  latitude,
  longitude,
}: Props) {
  return (
    <View
      pointerEvents="none"
      style={{
        width: '100%',
        height,
        borderRadius: rounded,
        backgroundColor: '#DCE7F0',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          top: -40,
          left: -30,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: 'rgba(148, 163, 184, 0.25)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: -50,
          right: -20,
          width: 200,
          height: 200,
          borderRadius: 999,
          backgroundColor: 'rgba(45, 212, 191, 0.18)',
        }}
      />
      <Box
        className="items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          backgroundColor: 'rgba(15, 118, 110, 0.12)',
          borderWidth: 2,
          borderColor: 'rgba(15, 118, 110, 0.35)',
        }}
      >
        <MapPin size={22} color="#1D4ED8" strokeWidth={2.4} />
      </Box>
      {latitude != null && longitude != null ? (
        <Text className="text-[10px] font-semibold mt-2" style={{ color: '#64748B' }}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
      ) : null}
      {showBadge ? (
        <Box
          className="absolute top-2 left-2 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(15,23,42,0.75)' }}
        >
          <Text className="text-white text-[10px] font-bold">{badgeText}</Text>
        </Box>
      ) : null}
    </View>
  );
}
