export type LiveGeoMapProps = {
  height?: number;
  rounded?: number;
  /** Live device GPS only — no hardcoded site. */
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  zoneRadiusFeet?: number;
  outside?: boolean;
  placeLabel?: string;
  recenterKey?: number;
  /** Google Maps zoom level (1–21). Default 18. */
  zoom?: number;
  /** Native MapView region delta (preferred over zoom when set). */
  latitudeDelta?: number;
  /**
   * Bottom inset (px) so the GPS pin sits in the visible map above a sheet/card.
   * Applied via map padding / biased center.
   */
  bottomPadding?: number;
  /** Allow pinch-zoom / pan (default true). */
  interactive?: boolean;
  /** Top-right "Google Maps" chip (default true). */
  showBrandBadge?: boolean;
  /** Bottom HTML coordinate badge — WebView fallback only. */
  showInnerBadge?: boolean;
};
