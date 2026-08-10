import {
  CheckCircle2,
  Clock,
  FilePenLine,
  PlayCircle,
  RotateCcw,
  UserCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import {
  applicationStatusDisplayLabel,
  applicationStatusTone,
  normalizeApplicationStatus,
  type MobileApplicationStatus,
} from '@/src/api/applications';
import { FONTS } from '@/src/cdrms/theme';

const STATUS_ICONS: Partial<Record<MobileApplicationStatus, LucideIcon>> = {
  draft: FilePenLine,
  assigned: UserCheck,
  in_progress: PlayCircle,
  submitted: Clock,
};

/** Pill badge — matches web ApplicationStatusBadge labels & colors. */
export function ApplicationStatusBadge({
  status,
  size = 'sm',
}: {
  status: string | null | undefined;
  size?: 'sm' | 'md';
}) {
  const key = normalizeApplicationStatus(status);
  const tone = applicationStatusTone(status);
  const label = applicationStatusDisplayLabel(status);
  const Icon = key ? STATUS_ICONS[key] : Clock;
  const compact = size === 'sm';

  return (
    <Box
      style={{
        borderRadius: 999,
        paddingHorizontal: compact ? 8 : 10,
        paddingVertical: compact ? 3 : 5,
        backgroundColor: tone.bg,
        borderWidth: 1,
        borderColor: tone.border,
        maxWidth: '100%',
      }}
    >
      <HStack className="items-center" style={{ gap: 4 }}>
        {Icon ? (
          <Icon size={compact ? 10 : 12} color={tone.fg} strokeWidth={2.3} />
        ) : null}
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: compact ? 10 : 11,
            color: tone.fg,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </HStack>
    </Box>
  );
}
