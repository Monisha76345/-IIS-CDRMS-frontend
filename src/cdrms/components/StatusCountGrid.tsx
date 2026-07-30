import type { LucideIcon } from 'lucide-react-native';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export type StatusCountItem = {
  key: string;
  label: string;
  count: number;
  icon: LucideIcon;
  tint: string;
  soft: string;
};

export function StatusCountGrid({
  items,
  activeKey,
  onSelect,
  columns = 2,
}: {
  items: StatusCountItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  columns?: 2 | 3 | 4;
}) {
  const widthPct = columns === 4 ? '25%' : columns === 3 ? '33.333%' : '50%';

  return (
    <HStack className="flex-wrap" style={{ marginHorizontal: -4 }}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeKey === item.key;
        return (
          <Box key={item.key} style={{ width: widthPct, padding: 4 }}>
            <Pressable
              onPress={() => onSelect(item.key)}
              className="active:opacity-90"
              style={{
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 12,
                backgroundColor: active ? item.tint : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: active ? item.tint : '#E5E7EB',
                minHeight: 92,
                justifyContent: 'space-between',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? 0.12 : 0.04,
                shadowRadius: 8,
                elevation: active ? 3 : 1,
              }}
            >
              <HStack className="items-center justify-between">
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? 'rgba(255,255,255,0.22)' : item.soft,
                  }}
                >
                  <Icon size={18} color={active ? '#FFFFFF' : item.tint} strokeWidth={2.3} />
                </Box>
                <Text
                  className="text-[22px] font-extrabold tabular-nums"
                  style={{ color: active ? '#FFFFFF' : '#0F172A' }}
                >
                  {item.count}
                </Text>
              </HStack>
              <Text
                className="text-[12px] font-semibold mt-3"
                numberOfLines={1}
                style={{ color: active ? 'rgba(255,255,255,0.92)' : '#64748B' }}
              >
                {item.label}
              </Text>
            </Pressable>
          </Box>
        );
      })}
    </HStack>
  );
}

export function OfficeAppRow({
  title,
  subtitle,
  meta,
  status,
  onPress,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  status: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-90"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
        marginBottom: 10,
      }}
    >
      <HStack className="items-start justify-between gap-3">
        <VStack className="flex-1 min-w-0">
          <Text className="text-[14px] font-bold" style={{ color: '#0F172A' }} numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-[12px] mt-1" style={{ color: '#64748B' }} numberOfLines={2}>
            {subtitle}
          </Text>
          {meta ? (
            <Text className="text-[11px] mt-1.5 font-medium" style={{ color: '#94A3B8' }}>
              {meta}
            </Text>
          ) : null}
        </VStack>
        <Box
          style={{
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: '#F1F5F9',
          }}
        >
          <Text className="text-[10px] font-bold" style={{ color: '#334155' }}>
            {status}
          </Text>
        </Box>
      </HStack>
    </Pressable>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack
      className="items-start justify-between gap-3 py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
    >
      <Text className="text-[12px] flex-1" style={{ color: '#64748B' }}>
        {label}
      </Text>
      <Text
        className="text-[13px] font-semibold flex-[1.4] text-right"
        style={{ color: '#0F172A' }}
      >
        {value || '—'}
      </Text>
    </HStack>
  );
}
