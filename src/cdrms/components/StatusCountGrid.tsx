import { type ReactNode } from 'react';
import { Download, Eye, type LucideIcon } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  applicationStatusTone,
  type MobileApplicationStatus,
} from '@/src/api/applications';
import { ApplicationStatusBadge } from '@/src/cdrms/components/ApplicationStatusBadge';
import { COLORS, FONTS, GLASS } from '@/src/cdrms/theme';

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
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 10,
                backgroundColor: active ? item.tint : COLORS.white,
                borderWidth: 1,
                borderColor: active ? item.tint : COLORS.border,
                minHeight: 62,
                justifyContent: 'center',
                shadowColor: GLASS.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? 0.12 : 0.06,
                shadowRadius: 6,
                elevation: active ? 3 : 2,
              }}
            >
              <HStack className="items-center" style={{ gap: 8 }}>
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? 'rgba(255,255,255,0.22)' : item.soft,
                  }}
                >
                  <Icon size={14} color={active ? COLORS.white : item.tint} strokeWidth={2.3} />
                </Box>
                <VStack className="flex-1 min-w-0" style={{ gap: 1 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 18,
                      lineHeight: 22,
                      color: active ? COLORS.white : COLORS.ink,
                    }}
                  >
                    {item.count}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 11,
                      color: active ? 'rgba(255,255,255,0.95)' : COLORS.ink,
                    }}
                  >
                    {item.label}
                  </Text>
                </VStack>
              </HStack>
            </Pressable>
          </Box>
        );
      })}
    </HStack>
  );
}

export function OfficeAppRow({
  title,
  siteNo,
  zoneCode,
  engineerName,
  status,
  onPress,
  onDownload,
}: {
  title: string;
  siteNo: string;
  zoneCode: string;
  engineerName?: string | null;
  status: MobileApplicationStatus | string;
  onPress: () => void;
  onDownload?: () => void;
}) {
  const tone = applicationStatusTone(status);

  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-90"
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 8,
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <HStack className="items-center">
        <Box style={{ width: 3.5, backgroundColor: tone.bar, alignSelf: 'stretch' }} />
        <VStack className="flex-1 min-w-0" style={{ paddingVertical: 10, paddingHorizontal: 11, gap: 6 }}>
          <HStack className="items-center justify-between" style={{ gap: 8 }}>
            <Text
              style={{
                flex: 1,
                fontFamily: FONTS.bold,
                fontSize: 14,
                lineHeight: 18,
                color: COLORS.ink,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Box style={{ flexShrink: 0, maxWidth: '46%' }}>
              <ApplicationStatusBadge status={status} />
            </Box>
          </HStack>

          <HStack className="items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
            <Text
              style={{ fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.ink }}
              numberOfLines={1}
            >
              Site no: {siteNo || '—'}
            </Text>
            <HStack className="items-center" style={{ gap: 4 }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.ink }}>
                Zone:
              </Text>
              <Box
                style={{
                  backgroundColor: GLASS.tintBlue,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderWidth: 1,
                  borderColor: `${COLORS.primary}40`,
                }}
              >
                <Text
                  style={{ fontFamily: FONTS.bold, fontSize: 11, color: COLORS.primary }}
                  numberOfLines={1}
                >
                  {zoneCode || '—'}
                </Text>
              </Box>
            </HStack>
          </HStack>

          <HStack className="items-center justify-between" style={{ gap: 8 }}>
            <Text
              style={{
                flex: 1,
                fontFamily: FONTS.medium,
                fontSize: 12,
                color: COLORS.slate,
              }}
              numberOfLines={1}
            >
              Assigned Engineer: {engineerName?.trim() || '—'}
            </Text>
            <HStack className="items-center" style={{ gap: 6 }}>
              {onDownload ? (
                <Pressable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onDownload();
                  }}
                  accessibilityLabel="Download"
                  className="items-center justify-center active:opacity-80"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    backgroundColor: COLORS.success,
                  }}
                >
                  <Download size={14} color={COLORS.white} strokeWidth={2.4} />
                </Pressable>
              ) : null}
              <Box
                accessibilityLabel="View"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Eye size={14} color={COLORS.white} strokeWidth={2.4} />
              </Box>
            </HStack>
          </HStack>
        </VStack>
      </HStack>
    </Pressable>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <HStack
      className="items-start justify-between gap-3"
      style={{
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Text style={{ flex: 1, fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}>
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          style={{
            flex: 1.4,
            fontFamily: FONTS.semibold,
            fontSize: 13,
            color: COLORS.ink,
            textAlign: 'right',
          }}
        >
          {value || '—'}
        </Text>
      ) : (
        <Box style={{ flex: 1.4, alignItems: 'flex-end' }}>{value}</Box>
      )}
    </HStack>
  );
}
