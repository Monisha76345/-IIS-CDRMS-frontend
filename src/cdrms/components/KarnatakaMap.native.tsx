import { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { StaticMapPreview } from '@/src/cdrms/components/StaticMapPreview';
import { buildOsmEmbedUrl } from '@/src/cdrms/components/osmMapUrl';
import { KARNATAKA } from '@/src/cdrms/location';
import type { KarnatakaMapProps } from './KarnatakaMap.types';

export type { KarnatakaMapProps };

/**
 * Native map for iOS + Android using OpenStreetMap in a WebView.
 * Avoids react-native-maps / Google Maps (needs API key, crashes on New Arch
 * in Expo Go). OSM works on Android without extra native config.
 */
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
  const [failed, setFailed] = useState(false);

  const latitude = latitudeProp ?? KARNATAKA.site.latitude;
  const longitude = longitudeProp ?? KARNATAKA.site.longitude;

  const src = useMemo(
    () =>
      buildOsmEmbedUrl({
        mode,
        latitude,
        longitude,
        latitudeDelta: latitudeDeltaProp,
      }),
    [mode, latitude, longitude, latitudeDeltaProp, recenterKey]
  );

  if (failed) {
    return (
      <StaticMapPreview
        height={fill ? height : height}
        rounded={rounded}
        showBadge={showBadge}
        badgeText={badgeText}
        latitude={latitude}
        longitude={longitude}
      />
    );
  }

  return (
    <View
      pointerEvents={interactive ? 'auto' : 'none'}
      style={
        fill
          ? {
              flex: 1,
              width: '100%',
              backgroundColor: '#E8EEF5',
              borderRadius: rounded,
              overflow: 'hidden',
            }
          : {
              width: '100%',
              height,
              backgroundColor: '#E8EEF5',
              borderRadius: rounded,
              overflow: 'hidden',
            }
      }
    >
      <WebView
        key={`${src}-${recenterKey}`}
        source={{ uri: src }}
        style={fill ? StyleSheet.absoluteFillObject : { width: '100%', height, backgroundColor: '#E8EEF5' }}
        originWhitelist={['https://*', 'http://*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit={Platform.OS === 'android'}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        scrollEnabled={interactive}
        bounces={false}
        nestedScrollEnabled={interactive}
        pointerEvents={interactive ? 'auto' : 'none'}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        // Android: avoid crashing if the embed page fails to load chrome features.
        androidLayerType="hardware"
      />
      {showBadge ? (
        <Box
          className="absolute top-2 left-2 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(15,23,42,0.75)', zIndex: 3 }}
          pointerEvents="none"
        >
          <Text className="text-white text-[10px] font-bold">{badgeText}</Text>
        </Box>
      ) : null}
    </View>
  );
}
