import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { buildOsmEmbedUrl } from '@/src/cdrms/components/osmMapUrl';
import { KARNATAKA } from '@/src/cdrms/location';
import type { KarnatakaMapProps } from './KarnatakaMap.types';

/** Web-only: OpenStreetMap embed with explicit pixel size for mobile browsers. */
export function KarnatakaMap({
  height = 180,
  fill = false,
  mode = 'site',
  showBadge = true,
  badgeText = 'Karnataka, India',
  rounded = 0,
  latitude: latitudeProp,
  longitude: longitudeProp,
  latitudeDelta: latitudeDeltaProp,
  interactive = false,
  recenterKey = 0,
}: KarnatakaMapProps) {
  const latitude = latitudeProp ?? KARNATAKA.site.latitude;
  const longitude = longitudeProp ?? KARNATAKA.site.longitude;
  const src = buildOsmEmbedUrl({
    mode,
    latitude,
    longitude,
    latitudeDelta: latitudeDeltaProp,
  });

  return (
    <Box
      className="relative w-full"
      pointerEvents={interactive ? 'auto' : 'none'}
      style={{
        ...(fill ? { flex: 1, minHeight: '100%' as unknown as number } : { height }),
        backgroundColor: '#E8EEF5',
        borderRadius: rounded,
        overflow: 'hidden',
      }}
    >
      <iframe
        title="Karnataka map"
        key={`${src}-${recenterKey}`}
        src={src}
        width="100%"
        height={fill ? '100%' : height}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          display: 'block',
          width: '100%',
          minWidth: '100%',
          height: fill ? '100%' : height,
          minHeight: fill ? '100%' : height,
          border: 0,
          borderRadius: rounded,
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      />
      {showBadge ? (
        <Box
          className="absolute top-2 left-2 px-2.5 py-1 rounded-full z-10"
          style={{ backgroundColor: 'rgba(15,23,42,0.75)' }}
          pointerEvents="none"
        >
          <Text className="text-white text-[10px] font-bold">{badgeText}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
