import { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { StaticMapPreview } from '@/src/cdrms/components/StaticMapPreview';
import { canUseNativeGoogleMaps, googleMapsApiKey } from '@/src/cdrms/lib/googleMapsNative';
import { NativeGoogleLiveMap } from './NativeGoogleLiveMap';
import type { LiveGeoMapProps } from './LiveGeoMap.types';

export type { LiveGeoMapProps } from './LiveGeoMap.types';

function buildGoogleMapsHtml(opts: {
  latitude: number;
  longitude: number;
  placeLabel?: string;
  outside?: boolean;
  zoom?: number;
  showInnerBadge?: boolean;
}): string {
  const lat = opts.latitude;
  const lng = opts.longitude;
  const zoom = Math.min(21, Math.max(1, opts.zoom ?? 18));
  const label = (opts.placeLabel || 'Current location').replace(/[<>&'"]/g, '');
  const pinColor = opts.outside ? 'red' : 'green';
  const key = googleMapsApiKey();
  const showInnerBadge = opts.showInnerBadge !== false;

  const embedSrc = key
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${lat}%2C${lng}&zoom=${zoom}&maptype=roadmap`
    : `https://maps.google.com/maps?q=${lat}%2C${lng}&z=${zoom}&hl=en&output=embed`;

  const innerBadge = showInnerBadge
    ? `<div class="badge">${label}<br/>Google Maps · ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
  <style>
    html, body { height: 100%; width: 100%; margin: 0; padding: 0; background: #E8EEF5; overflow: hidden; }
    iframe { border: 0; width: 100%; height: 100%; display: block; }
    .badge {
      position: absolute; left: 10px; bottom: 10px; z-index: 2;
      background: rgba(15,23,42,0.82); color: #fff; font: 700 10px/1.2 -apple-system, sans-serif;
      padding: 6px 8px; border-radius: 8px; max-width: 70%;
    }
    .dot {
      position: absolute; left: 50%; top: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px;
      border-radius: 999px; border: 2px solid #fff; background: ${pinColor === 'red' ? '#DC2626' : '#10B981'};
      box-shadow: 0 0 0 6px rgba(16,185,129,0.25); pointer-events: none; z-index: 1;
    }
  </style>
</head>
<body>
  <iframe
    src="${embedSrc}"
    allowfullscreen
    loading="eager"
    referrerpolicy="no-referrer-when-downgrade"
    title="Google Maps"
  ></iframe>
  <div class="dot"></div>
  ${innerBadge}
</body>
</html>`;
}

/** WebView Google Maps — Expo Go fallback when native SDK is unavailable. */
function WebViewGoogleLiveMap(props: LiveGeoMapProps) {
  const {
    height = 280,
    rounded = 20,
    latitude,
    longitude,
    outside = false,
    placeLabel,
    recenterKey = 0,
    zoom = 18,
    interactive = true,
    showBrandBadge = true,
    showInnerBadge = true,
  } = props;
  const [failed, setFailed] = useState(false);

  const html = useMemo(
    () =>
      buildGoogleMapsHtml({
        latitude,
        longitude,
        placeLabel,
        outside,
        zoom,
        showInnerBadge,
      }),
    [latitude, longitude, placeLabel, outside, zoom, showInnerBadge, recenterKey],
  );

  if (failed) {
    return (
      <View style={{ width: '100%', height, borderRadius: rounded, overflow: 'hidden' }}>
        <StaticMapPreview
          height={height}
          rounded={rounded}
          showBadge={false}
          latitude={latitude}
          longitude={longitude}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width: '100%',
        height,
        backgroundColor: '#E8EEF5',
        borderRadius: rounded,
        overflow: 'hidden',
      }}
    >
      <WebView
        key={`gmaps-${latitude.toFixed(5)}-${longitude.toFixed(5)}-${zoom}-${recenterKey}`}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://maps.google.com' }}
        style={{ width: '100%', height, backgroundColor: '#E8EEF5' }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit={Platform.OS === 'android'}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        scrollEnabled={interactive}
        bounces={false}
        nestedScrollEnabled={interactive}
        pointerEvents="auto"
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        androidLayerType="hardware"
        allowsFullscreenVideo={false}
        geolocationEnabled
      />

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
          <Text className="text-[9px] font-bold text-white">Google Maps (preview)</Text>
        </Box>
      ) : null}
    </View>
  );
}

/**
 * Live geo map — native Google Maps SDK in dev client builds;
 * WebView embed fallback in Expo Go.
 */
export function LiveGeoMap(props: LiveGeoMapProps) {
  if (canUseNativeGoogleMaps()) {
    return <NativeGoogleLiveMap {...props} />;
  }
  return <WebViewGoogleLiveMap {...props} />;
}
