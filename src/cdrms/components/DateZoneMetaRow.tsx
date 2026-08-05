import { Clock } from 'lucide-react-native';

import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { COLORS, FONTS } from '@/src/cdrms/theme';

/** Date/time with zone on one line beside the clock icon. */
export function DateZoneMetaRow({
  date,
  zone,
  marginTop = 0,
}: {
  date: string;
  zone?: string | null;
  marginTop?: number;
}) {
  const zoneLabel = (zone || '').trim() || '—';
  return (
    <HStack className="items-center" style={{ gap: 4, marginTop }}>
      <Clock size={11} color={COLORS.primary} strokeWidth={2.3} style={{ flexShrink: 0 }} />
      <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.ink, flex: 1 }}>
        {`${date} · Zone: ${zoneLabel}`}
      </Text>
    </HStack>
  );
}
