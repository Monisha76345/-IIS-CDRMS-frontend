/** Shared OpenStreetMap helpers for web + native WebView. */
import { KARNATAKA, SITE_REGION } from '@/src/cdrms/location';

export function buildOsmEmbedUrl(opts: {
  mode?: 'site' | 'state';
  latitude?: number;
  longitude?: number;
  latitudeDelta?: number;
}): string {
  const latitude = opts.latitude ?? KARNATAKA.site.latitude;
  const longitude = opts.longitude ?? KARNATAKA.site.longitude;
  const centerLat = opts.mode === 'state' ? KARNATAKA.stateCenter.latitude : latitude;
  const centerLng = opts.mode === 'state' ? KARNATAKA.stateCenter.longitude : longitude;
  const latDelta =
    opts.mode === 'state'
      ? KARNATAKA.stateCenter.latitudeDelta
      : (opts.latitudeDelta ?? SITE_REGION.latitudeDelta);
  const delta = Math.max(latDelta * 0.9, 0.002);
  const bbox = [
    centerLng - delta,
    centerLat - delta * 0.7,
    centerLng + delta,
    centerLat + delta * 0.7,
  ].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

/** Zoom level approx from latitudeDelta for Leaflet / static tiles. */
export function zoomFromLatitudeDelta(latitudeDelta?: number): number {
  const d = latitudeDelta ?? SITE_REGION.latitudeDelta;
  if (d >= 4) return 6;
  if (d >= 1) return 8;
  if (d >= 0.25) return 11;
  if (d >= 0.1) return 13;
  if (d >= 0.05) return 14;
  if (d >= 0.025) return 15;
  if (d >= 0.012) return 16;
  if (d >= 0.006) return 17;
  if (d >= 0.003) return 18;
  return 19;
}

/**
 * Inline Leaflet map with full pinch / double-tap / button zoom.
 * Programmatic zoom via window.setMapView / window.zoomBy (no remount).
 */
export function buildLeafletMapHtml(opts: {
  latitude: number;
  longitude: number;
  zoom: number;
  interactive: boolean;
}): string {
  const lat = opts.latitude;
  const lng = opts.longitude;
  const zoom = Math.max(3, Math.min(19, Math.round(opts.zoom)));
  const interactive = opts.interactive ? 'true' : 'false';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #E8EEF5; touch-action: none; }
    .leaflet-control-attribution { font-size: 9px !important; max-width: 55%; }
    .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 10px rgba(15,23,42,0.18) !important; border-radius: 12px !important; overflow: hidden; }
    .leaflet-control-zoom a {
      width: 40px !important; height: 40px !important; line-height: 40px !important;
      font-size: 20px !important; color: #0F172A !important; background: #fff !important;
      border-bottom: 1px solid #E2E8F0 !important;
    }
    .leaflet-control-zoom a:last-child { border-bottom: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      var interactive = ${interactive};
      var map = L.map('map', {
        zoomControl: interactive,
        attributionControl: true,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: false,
        keyboard: false,
        bounceAtZoomLimits: false
      }).setView([${lat}, ${lng}], ${zoom});
      if (interactive && map.zoomControl) {
        map.zoomControl.setPosition('bottomright');
      }
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OSM'
      }).addTo(map);
      var marker = L.marker([${lat}, ${lng}]).addTo(map);
      function resize() { try { map.invalidateSize(true); } catch (e) {} }
      setTimeout(resize, 80);
      setTimeout(resize, 250);
      setTimeout(resize, 600);
      window.addEventListener('resize', resize);
      window.setMapView = function (la, ln, z) {
        map.setView([la, ln], z, { animate: true, duration: 0.25 });
        marker.setLatLng([la, ln]);
        resize();
      };
      window.zoomBy = function (delta) {
        map.setZoom(map.getZoom() + delta, { animate: true });
      };
      window.setZoomLevel = function (z) {
        map.setZoom(z, { animate: true });
      };
    })();
  </script>
</body>
</html>`;
}
