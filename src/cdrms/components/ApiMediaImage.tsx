import { useMemo } from 'react';
import {
  Image,
  type ImageProps,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { mediaSource } from '@/src/cdrms/media/displayUri';

type Props = Omit<ImageProps, 'source'> & {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
};

/**
 * Renders survey media. Remote object-store URLs load through the
 * authenticated GET `/object-store/view-by-url` API (same as web).
 */
export function ApiMediaImage({ uri, style, ...rest }: Props) {
  const { accessToken } = useAuth();
  const source = useMemo(
    () => mediaSource(uri, accessToken),
    [uri, accessToken]
  );

  if (!source) return null;

  return <Image {...rest} source={source} style={style} />;
}
