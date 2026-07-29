/** Shared OpenStreetMap embed URL for web + native WebView. */
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
  const delta = Math.max(latDelta * 0.9, 0.008);
  const bbox = [
    centerLng - delta,
    centerLat - delta * 0.7,
    centerLng + delta,
    centerLat + delta * 0.7,
  ].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

/** Zoom level approx from latitudeDelta for static tile fallbacks. */
export function zoomFromLatitudeDelta(latitudeDelta?: number): number {
  const d = latitudeDelta ?? SITE_REGION.latitudeDelta;
  if (d >= 4) return 6;
  if (d >= 1) return 8;
  if (d >= 0.2) return 11;
  if (d >= 0.05) return 13;
  if (d >= 0.02) return 14;
  return 15;
}
