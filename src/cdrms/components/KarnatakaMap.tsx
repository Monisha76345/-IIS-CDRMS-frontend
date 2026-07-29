import { type ReactElement } from 'react';
import { Platform } from 'react-native';

import { StaticMapPreview } from '@/src/cdrms/components/StaticMapPreview';
import { KARNATAKA } from '@/src/cdrms/location';
import type { KarnatakaMapProps } from './KarnatakaMap.types';

export type { KarnatakaMapProps } from './KarnatakaMap.types';

/**
 * Platform entry — native uses OpenStreetMap WebView (Android-safe),
 * web uses iframe embed. Never mounts react-native-maps (crash-prone).
 */
export function KarnatakaMap(props: KarnatakaMapProps): ReactElement {
  const latitude = props.latitude ?? KARNATAKA.site.latitude;
  const longitude = props.longitude ?? KARNATAKA.site.longitude;
  const fallback = (
    <StaticMapPreview
      height={props.height ?? 180}
      rounded={props.rounded ?? 0}
      showBadge={props.showBadge ?? true}
      badgeText={props.badgeText ?? 'Karnataka, India'}
      latitude={latitude}
      longitude={longitude}
    />
  );

  try {
    if (Platform.OS === 'web') {
      const { KarnatakaMap: WebMap } = require('./KarnatakaMap.web') as {
        KarnatakaMap: (p: KarnatakaMapProps) => ReactElement;
      };
      return <WebMap {...props} />;
    }

    const { KarnatakaMap: NativeMap } = require('./KarnatakaMap.native') as {
      KarnatakaMap: (p: KarnatakaMapProps) => ReactElement;
    };
    return <NativeMap {...props} />;
  } catch {
    return fallback;
  }
}
