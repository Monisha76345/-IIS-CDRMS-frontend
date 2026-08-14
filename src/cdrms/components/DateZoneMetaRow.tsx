import { Clock } from 'lucide-react-native';

import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { COLORS, FONTS } from '@/src/cdrms/theme';

/** Date/time with zone on one line beside the clock icon. */
export function DateZoneMetaRow({
  date,
  zone,
  marginTop = 0,
  compact = false,
}: {
  date: string;
  zone?: string | null;
  marginTop?: number;
  /** Smaller type for CAO cards. */
  compact?: boolean;
}) {
  const zoneLabel = (zone || '').trim() || '—';
  const fontSize = compact ? 11.5 : 13;
  const lineHeight = compact ? 14 : 16;
  const iconSize = compact ? 11 : 12;
  return (
    <HStack className="items-center" style={{ gap: 4, marginTop }}>
      <Clock size={iconSize} color={COLORS.primary} strokeWidth={2.3} style={{ flexShrink: 0 }} />
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: FONTS.medium,
          fontSize,
          lineHeight,
          color: COLORS.ink,
          flex: 1,
        }}
        numberOfLines={1}
      >
        {`${date} · Zone: ${zoneLabel}`}
      </Text>
    </HStack>
  );
}
