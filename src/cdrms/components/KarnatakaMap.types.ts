export type KarnatakaMapProps = {
  height?: number;
  /** Stretch to fill parent (full-screen modal). */
  fill?: boolean;
  mode?: 'site' | 'state';
  showBadge?: boolean;
  badgeText?: string;
  rounded?: number;
  latitude?: number;
  longitude?: number;
  /** Override site zoom (degrees). Smaller = closer. */
  latitudeDelta?: number;
  longitudeDelta?: number;
  /** Draw accuracy ring around the pin when set (meters). */
  accuracyMeters?: number | null;
  /**
   * When false (default), map gestures stay off. Never flip this on while
   * TextInputs share the screen — use the full-screen modal for gestures.
   */
  interactive?: boolean;
  /** Bump to re-animate the camera to the site pin. */
  recenterKey?: number;
};
