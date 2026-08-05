import { Text, View, type ViewStyle } from 'react-native';

import { COLORS, FONTS } from '@/src/cdrms/theme';

type Props = {
  percent: number;
  color?: string;
  trackColor?: string;
  labelColor?: string;
  style?: ViewStyle;
};

/** Thin blue progress line — fill moves left to right, no dots. */
export function PdfDownloadThinProgress({
  percent,
  color = COLORS.primary,
  trackColor = '#DBEAFE',
  labelColor = COLORS.primary,
  style,
}: Props) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <View
        style={{
          flex: 1,
          height: 3,
          borderRadius: 999,
          backgroundColor: trackColor,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${p}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: color,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: FONTS.semibold,
          fontSize: 11,
          color: labelColor,
          minWidth: 34,
          textAlign: 'right',
        }}
      >
        {p}%
      </Text>
    </View>
  );
}

/** Notification text — percentage only (no dot/bar characters). */
export function pdfDownloadProgressText(percent: number): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return `${p}%`;
}
