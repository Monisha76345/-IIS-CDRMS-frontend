import { createElement } from 'react';
import type { LiveGeoMapProps } from './LiveGeoMap.types';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export type { LiveGeoMapProps };

function embedUrl(latitude: number, longitude: number, zoom = 18): string {
  const z = Math.min(21, Math.max(1, zoom));
  const key = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
  if (key) {
    return (
      `https://www.google.com/maps/embed/v1/place` +
      `?key=${encodeURIComponent(key)}` +
      `&q=${latitude}%2C${longitude}&zoom=${z}&maptype=roadmap`
    );
  }
  return `https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=${z}&hl=en&output=embed`;
}

/** Web — Google Maps iframe on live GPS. */
export function LiveGeoMap({
  height = 236,
  rounded = 20,
  latitude,
  longitude,
  placeLabel,
  zoom = 18,
  showBrandBadge = true,
}: LiveGeoMapProps) {
  const src = embedUrl(latitude, longitude, zoom);
  return (
    <View style={{ width: '100%', height, borderRadius: rounded, overflow: 'hidden' }}>
      {createElement('iframe', {
        title: 'Google Maps',
        src,
        style: { width: '100%', height: '100%', border: 0 },
        allowFullScreen: true,
        loading: 'eager',
        referrerPolicy: 'no-referrer-when-downgrade',
      })}
      {showBrandBadge ? (
      <Box
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 10,
          bottom: 10,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: 'rgba(15,23,42,0.72)',
          maxWidth: '70%',
        }}
      >
        <Text className="text-[9px] font-bold text-white" numberOfLines={2}>
          {placeLabel || 'Google Maps · Live GPS'}
        </Text>
      </Box>
      ) : null}
    </View>
  );
}
