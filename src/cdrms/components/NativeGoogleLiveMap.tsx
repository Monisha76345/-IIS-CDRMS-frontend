import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { latitudeDeltaFromZoom } from '@/src/cdrms/components/osmMapUrl';
import type { LiveGeoMapProps } from './LiveGeoMap.types';

/**
 * Native Google Maps SDK via react-native-maps (dev client / production builds).
 * Camera recenters only on zoom / explicit recenter — not on every GPS tick —
 * so pan/zoom gestures are not cancelled.
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
  zoneRadiusFeet,
  bottomPadding = 0,
  interactive = true,
  showBrandBadge = true,
}: LiveGeoMapProps) {
  const mapRef = useRef<MapView>(null);
  const latDelta = latitudeDelta ?? latitudeDeltaFromZoom(zoom);
  const lngDelta = latDelta;
  const latestCoord = useRef({ latitude, longitude });
  latestCoord.current = { latitude, longitude };
  const fenceMeters =
    zoneRadiusFeet != null && zoneRadiusFeet > 0 ? zoneRadiusFeet * 0.3048 : 0;

  useEffect(() => {
    const { latitude: lat, longitude: lng } = latestCoord.current;
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      },
      280,
    );
    // Intentionally omit live lat/lng — GPS updates must not yank the camera.
  }, [recenterKey, latDelta, lngDelta]);

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
        // Keep blue dot if available, but always draw our own pin below.
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
        moveOnMarkerPress={false}
        // Push camera center into the visible map above the bottom sheet.
        mapPadding={{ top: 12, right: 0, bottom: Math.max(0, bottomPadding), left: 0 }}
      >
        {accuracyMeters != null && accuracyMeters > 0 ? (
          <Circle
            center={{ latitude, longitude }}
            radius={accuracyMeters}
            strokeColor={outside ? 'rgba(220,38,38,0.55)' : 'rgba(34,197,94,0.5)'}
            fillColor={outside ? 'rgba(220,38,38,0.12)' : 'rgba(34,197,94,0.14)'}
          />
        ) : null}

        {fenceMeters > 0 ? (
          <Circle
            center={{ latitude, longitude }}
            radius={Math.max(fenceMeters, 4)}
            strokeColor={outside ? 'rgba(220,38,38,0.85)' : 'rgba(16,185,129,0.85)'}
            fillColor={outside ? 'rgba(220,38,38,0.08)' : 'rgba(16,185,129,0.1)'}
            strokeWidth={2}
          />
        ) : null}

        {/* Default Google red pin + showsUserLocation green/blue live-dot */}
        <Marker
          coordinate={{ latitude, longitude }}
          pinColor="red"
          zIndex={10}
          title="Current location"
        />
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
