import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { StaticMapPreview } from '@/src/cdrms/components/StaticMapPreview';
import {
  buildLeafletMapHtml,
  zoomFromLatitudeDelta,
} from '@/src/cdrms/components/osmMapUrl';
import { KARNATAKA, SITE_REGION } from '@/src/cdrms/location';
import type { KarnatakaMapProps } from './KarnatakaMap.types';

export type { KarnatakaMapProps };

/**
 * Native map: Leaflet + OSM tiles in WebView.
 * Pinch / double-tap / Leaflet +/- work inside the map; parent +/- uses injectJS.
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
  const [ready, setReady] = useState(false);
  const webRef = useRef<WebView>(null);

  const latitude = latitudeProp ?? KARNATAKA.site.latitude;
  const longitude = longitudeProp ?? KARNATAKA.site.longitude;
  const latitudeDelta =
    mode === 'state'
      ? KARNATAKA.stateCenter.latitudeDelta
      : (latitudeDeltaProp ?? SITE_REGION.latitudeDelta);
  const zoom = zoomFromLatitudeDelta(latitudeDelta);

  // Remount only when interactivity / mode changes — zoom uses injectJS.
  const html = useMemo(
    () =>
      buildLeafletMapHtml({
        latitude: mode === 'state' ? KARNATAKA.stateCenter.latitude : latitude,
        longitude: mode === 'state' ? KARNATAKA.stateCenter.longitude : longitude,
        zoom,
        interactive,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [interactive, mode]
  );

  useEffect(() => {
    setReady(false);
  }, [html]);

  useEffect(() => {
    if (!ready || failed) return;
    const la = mode === 'state' ? KARNATAKA.stateCenter.latitude : latitude;
    const ln = mode === 'state' ? KARNATAKA.stateCenter.longitude : longitude;
    const z = zoomFromLatitudeDelta(latitudeDelta);
    webRef.current?.injectJavaScript(
      `try{window.setMapView&&window.setMapView(${la},${ln},${z});}catch(e){} true;`
    );
  }, [ready, failed, latitude, longitude, latitudeDelta, mode, recenterKey]);

  if (failed) {
    return (
      <StaticMapPreview
        height={height}
        rounded={rounded}
        showBadge={showBadge}
        badgeText={badgeText}
        latitude={latitude}
        longitude={longitude}
      />
    );
  }

  const containerStyle = fill
    ? {
        flex: 1,
        width: '100%' as const,
        backgroundColor: '#E8EEF5',
        borderRadius: rounded,
        overflow: 'hidden' as const,
      }
    : {
        width: '100%' as const,
        height,
        backgroundColor: '#E8EEF5',
        borderRadius: rounded,
        overflow: 'hidden' as const,
      };

  return (
    <View pointerEvents={interactive ? 'auto' : 'none'} style={containerStyle}>
      <WebView
        ref={webRef}
        source={{ html, baseUrl: 'https://unpkg.com' }}
        style={
          fill
            ? StyleSheet.absoluteFillObject
            : { width: '100%', height, backgroundColor: '#E8EEF5' }
        }
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit={false}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        scrollEnabled={interactive}
        bounces={false}
        nestedScrollEnabled={interactive}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        // Let Leaflet own pinch gestures inside the WebView.
        allowsBackForwardNavigationGestures={false}
        pointerEvents={interactive ? 'auto' : 'none'}
        onLoadEnd={() => {
          setReady(true);
          webRef.current?.injectJavaScript(
            `try{setTimeout(function(){if(window.setMapView){}},50);}catch(e){} true;`
          );
        }}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        androidLayerType="hardware"
        {...(Platform.OS === 'ios'
          ? { allowsLinkPreview: false, dataDetectorTypes: 'none' as const }
          : null)}
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
