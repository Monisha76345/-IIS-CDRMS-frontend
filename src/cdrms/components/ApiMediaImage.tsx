import { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  View,
  type ImageProps,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/auth/AuthContext';
import { useResolvedMediaUri } from '@/src/cdrms/media/displayUri';
import { COLORS } from '@/src/cdrms/theme';

type Props = Omit<ImageProps, 'source'> & {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
};

/**
 * Renders survey media.
 * Local file:// URIs show immediately.
 * After reload, remote MinIO URLs are downloaded via authenticated
 * `/object-store/view-by-url` into cache (RN Image auth headers are unreliable).
 */
export function ApiMediaImage({ uri, style, ...rest }: Props) {
  const { accessToken } = useAuth();
  const { displayUri, loading, error } = useResolvedMediaUri(uri, accessToken);

  const flatStyle = useMemo(() => style, [style]);

  if (loading) {
    return (
      <View
        style={[
          flatStyle,
          {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#E2E8F0',
          },
        ]}
      >
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (error || !displayUri) {
    return (
      <View
        style={[
          flatStyle,
          {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#E2E8F0',
            padding: 6,
          },
        ]}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            color: '#64748B',
            textAlign: 'center',
          }}
        >
          Preview unavailable
        </Text>
      </View>
    );
  }

  return (
    <Image
      {...rest}
      source={{ uri: displayUri }}
      style={flatStyle}
    />
  );
}
