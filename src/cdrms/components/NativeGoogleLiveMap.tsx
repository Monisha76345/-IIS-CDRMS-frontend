import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { latitudeDeltaFromZoom } from '@/src/cdrms/components/osmMapUrl';
import type { LiveGeoMapProps } from './LiveGeoMap.types';

/**
 * Native Google Maps SDK via react-native-maps (dev client / production builds).
 */
export function NativeGoogleLiveMap({
  height = 280,
  rounded = 20,
  latitude,
  longitude,
  outside = false,
  recenterKey = 0,
  zoom = 18,
  latitudeDelta,
  accuracyMeters,
  interactive = true,
  showBrandBadge = true,
}: LiveGeoMapProps) {
  const mapRef = useRef<MapView>(null);
  const latDelta = latitudeDelta ?? latitudeDeltaFromZoom(zoom);
  const lngDelta = latDelta;

  useEffect(() => {
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      },
      280,
    );
  }, [latitude, longitude, latDelta, lngDelta, recenterKey]);

  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius: rounded,
        overflow: 'hidden',
        backgroundColor: '#E8EEF5',
      }}
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }}
        mapType="standard"
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        toolbarEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        loadingEnabled
        userInterfaceStyle="light"
      >
        {accuracyMeters != null && accuracyMeters > 0 ? (
          <Circle
            center={{ latitude, longitude }}
            radius={accuracyMeters}
            strokeColor={outside ? 'rgba(220,38,38,0.55)' : 'rgba(75,73,172,0.45)'}
            fillColor={outside ? 'rgba(220,38,38,0.12)' : 'rgba(75,73,172,0.1)'}
          />
        ) : null}
      </MapView>

      {showBrandBadge ? (
        <Box
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: 'rgba(15,23,42,0.72)',
            zIndex: 3,
          }}
        >
          <Text className="text-[9px] font-bold text-white">Google Maps</Text>
        </Box>
      ) : null}
    </View>
  );
}
