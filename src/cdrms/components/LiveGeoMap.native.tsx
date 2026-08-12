import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { StaticMapPreview } from '@/src/cdrms/components/StaticMapPreview';
import { canUseNativeGoogleMaps, googleMapsApiKey } from '@/src/cdrms/lib/googleMapsNative';
import { NativeGoogleLiveMap } from './NativeGoogleLiveMap';
import type { LiveGeoMapProps } from './LiveGeoMap.types';

export type { LiveGeoMapProps } from './LiveGeoMap.types';

function buildInteractiveMapsHtml(opts: {
  latitude: number;
  longitude: number;
  outside?: boolean;
  zoom?: number;
  accuracyMeters?: number | null;
  zoneRadiusFeet?: number;
  bottomPadding?: number;
}): string {
  const lat = opts.latitude;
  const lng = opts.longitude;
  const zoom = Math.min(21, Math.max(1, opts.zoom ?? 18));
  const ringColor = opts.outside ? 'rgba(220,38,38,0.45)' : 'rgba(34,197,94,0.45)';
  const ringFill = opts.outside ? 'rgba(220,38,38,0.12)' : 'rgba(34,197,94,0.14)';
  const accuracy = Math.max(0, Number(opts.accuracyMeters) || 0);
  const fenceM =
    opts.zoneRadiusFeet != null && opts.zoneRadiusFeet > 0
      ? Math.max(opts.zoneRadiusFeet * 0.3048, 4)
      : 0;
  const padBottom = Math.max(0, Math.round(opts.bottomPadding ?? 0));
  const key = googleMapsApiKey();

  // Prefer Maps JS API when key exists (fully pannable). Else Leaflet OSM.
  if (key) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #E8EEF5; touch-action: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}"></script>
  <script>
    const center = { lat: ${lat}, lng: ${lng} };
    const map = new google.maps.Map(document.getElementById('map'), {
      center,
      zoom: ${zoom},
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: 'greedy',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      padding: { top: 12, right: 0, bottom: ${padBottom}, left: 0 }
    });
    ${
      accuracy > 0
        ? `new google.maps.Circle({
      map,
      center,
      radius: ${accuracy},
      strokeColor: '${ringColor}',
      strokeOpacity: 1,
      strokeWeight: 1.5,
      fillColor: '${ringFill}',
      fillOpacity: 1
    });`
        : ''
    }
    ${
      fenceM > 0
        ? `new google.maps.Circle({
      map,
      center,
      radius: ${fenceM},
      strokeColor: '${opts.outside ? '#DC2626' : '#10B981'}',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: '${opts.outside ? '#DC2626' : '#10B981'}',
      fillOpacity: 0.1
    });`
        : ''
    }
    // Green live-dot + default Google red pin (realistic marker)
    new google.maps.Marker({
      position: center,
      map,
      zIndex: 9,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#22C55E',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });
    new google.maps.Marker({ position: center, map, zIndex: 10 });
  </script>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #E8EEF5; touch-action: none; }
    .leaflet-control-attribution { font-size: 9px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false
    }).setView([${lat}, ${lng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OSM'
    }).addTo(map);
    ${
      accuracy > 0
        ? `L.circle([${lat}, ${lng}], {
      radius: ${accuracy},
      color: '${ringColor}',
      weight: 1.5,
      fillColor: '${ringFill}',
      fillOpacity: 1
    }).addTo(map);`
        : ''
    }
    ${
      fenceM > 0
        ? `L.circle([${lat}, ${lng}], {
      radius: ${fenceM},
      color: '${opts.outside ? '#DC2626' : '#10B981'}',
      weight: 2,
      fillColor: '${opts.outside ? '#DC2626' : '#10B981'}',
      fillOpacity: 0.12
    }).addTo(map);`
        : ''
    }
    L.circleMarker([${lat}, ${lng}], {
      radius: 6,
      color: '#fff',
      weight: 2,
      fillColor: '#22C55E',
      fillOpacity: 1
    }).addTo(map);
    // Classic Google-like red pin
    const pinIcon = L.icon({
      iconUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="27" height="43" viewBox="0 0 27 43"><path fill="#EA4335" stroke="#B31412" stroke-width="1" d="M13.5 0C6.04 0 0 6.04 0 13.5 0 23.62 13.5 43 13.5 43S27 23.62 27 13.5C27 6.04 20.96 0 13.5 0z"/><circle fill="#fff" cx="13.5" cy="13.5" r="5.5"/></svg>'),
      iconSize: [27, 43],
      iconAnchor: [13, 42],
      popupAnchor: [0, -36]
    });
    L.marker([${lat}, ${lng}], { icon: pinIcon, zIndexOffset: 1000 }).addTo(map);
    ${
      padBottom > 0
        ? `map.setView([${lat}, ${lng}], ${zoom}, { animate: false });
    // Bias pin into visible area above bottom sheet
    map.panBy([0, Math.round(${padBottom} / 2)], { animate: false });`
        : ''
    }
  </script>
</body>
</html>`;
}

/** WebView map — pannable Leaflet/Maps JS (not a locked iframe embed). */
function WebViewGoogleLiveMap(props: LiveGeoMapProps) {
  const {
    height = 280,
    rounded = 20,
    latitude,
    longitude,
    outside = false,
    recenterKey = 0,
    zoom = 18,
    accuracyMeters,
    zoneRadiusFeet,
    bottomPadding = 0,
    interactive = true,
    showBrandBadge = true,
  } = props;
  const [failed, setFailed] = useState(false);
  const [cam, setCam] = useState({
    latitude,
    longitude,
    zoom,
    outside,
    accuracyMeters,
    zoneRadiusFeet,
    bottomPadding,
  });
  const firstFix = useRef(false);

  // First real GPS fix → seed camera once (0,0 placeholder must not stick).
  useEffect(() => {
    if (firstFix.current) return;
    if (Math.abs(latitude) < 0.01 && Math.abs(longitude) < 0.01) return;
    firstFix.current = true;
    setCam({
      latitude,
      longitude,
      zoom,
      outside,
      accuracyMeters,
      zoneRadiusFeet,
      bottomPadding,
    });
  }, [latitude, longitude, zoom, outside, accuracyMeters, zoneRadiusFeet, bottomPadding]);

  // Explicit recenter / zoom only — never every GPS tick (that was killing pan).
  useEffect(() => {
    if (!firstFix.current) return;
    setCam({
      latitude,
      longitude,
      zoom,
      outside,
      accuracyMeters,
      zoneRadiusFeet,
      bottomPadding,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- GPS lat/lng intentionally omitted
  }, [recenterKey, zoom, bottomPadding]);

  // Fence color / accuracy ring can refresh without yanking camera from GPS ticks.
  useEffect(() => {
    setCam((prev) => ({
      ...prev,
      outside,
      accuracyMeters,
      zoneRadiusFeet,
    }));
  }, [outside, accuracyMeters, zoneRadiusFeet]);

  const html = useMemo(
    () =>
      buildInteractiveMapsHtml({
        latitude: cam.latitude,
        longitude: cam.longitude,
        outside: cam.outside,
        zoom: cam.zoom,
        accuracyMeters: cam.accuracyMeters,
        zoneRadiusFeet: cam.zoneRadiusFeet,
        bottomPadding: cam.bottomPadding,
      }),
    [cam],
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
        key={`gmaps-${recenterKey}-${zoom}-${outside ? 1 : 0}-${cam.latitude.toFixed(5)}-${cam.longitude.toFixed(5)}-${bottomPadding}`}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://localhost' }}
        style={{ width: '100%', height, backgroundColor: '#E8EEF5' }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        scrollEnabled={interactive}
        bounces={false}
        nestedScrollEnabled={interactive}
        pointerEvents={interactive ? 'auto' : 'none'}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        androidLayerType="hardware"
        allowsFullscreenVideo={false}
        geolocationEnabled
        scalesPageToFit={false}
        overScrollMode="never"
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
          <Text className="text-[9px] font-bold text-white">
            {googleMapsApiKey() ? 'Google Maps' : 'OpenStreetMap'}
          </Text>
        </Box>
      ) : null}
    </View>
  );
}

/**
 * Live geo map — native Google Maps only when a Maps API key is set;
 * otherwise interactive WebView map (Leaflet / Maps JS).
 */
export function LiveGeoMap(props: LiveGeoMapProps) {
  if (canUseNativeGoogleMaps()) {
    return <NativeGoogleLiveMap {...props} />;
  }
  return <WebViewGoogleLiveMap {...props} />;
}
