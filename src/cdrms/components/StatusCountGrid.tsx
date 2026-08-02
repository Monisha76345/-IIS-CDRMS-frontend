import { type ReactNode } from 'react';
import { Clock, Download, Eye, type LucideIcon } from 'lucide-react-native';

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
  selectedKey,
  onSelect,
}: {
  items: StatusCountItem[];
  activeKey?: string;
  selectedKey?: string;
  columns?: number;
  onSelect: (key: any) => void;
}) {
  const currentKey = activeKey ?? selectedKey ?? '';
  return (
    <HStack className="flex-wrap gap-2">
      {items.map((item) => {
        const active = currentKey === item.key;
        const Icon = item.icon;
        return (
          <Box key={item.key} className="flex-1 min-w-[46%]">
            <Pressable
              onPress={() => onSelect(item.key)}
              className="active:opacity-90"
              style={{
                backgroundColor: active ? COLORS.primary : COLORS.white,
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: active ? COLORS.primary : COLORS.border,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? 0.15 : 0.04,
                shadowRadius: 6,
                elevation: active ? 4 : 1,
              }}
            >
              <HStack className="items-center justify-between">
                <Box
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : item.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    size={20}
                    color={active ? COLORS.white : item.tint}
                    strokeWidth={2.4}
                  />
                </Box>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 22,
                    lineHeight: 26,
                    color: active ? COLORS.white : COLORS.ink,
                  }}
                >
                  {item.count}
                </Text>
              </HStack>

              <HStack className="items-center justify-between" style={{ marginTop: 10 }}>
                <VStack className="flex-1 min-w-0">
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
  dateLine,
  onPress,
  onDownload,
}: {
  title: string;
  siteNo: string;
  zoneCode: string;
  engineerName?: string | null;
  status: MobileApplicationStatus | string;
  /** Status-aware date like engineer cards: "Assigned · …" / "Submitted · …" */
  dateLine?: string | null;
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
            <Box style={{ flexShrink: 0, marginLeft: 'auto' }}>
              <ApplicationStatusBadge status={status} />
            </Box>
          </HStack>

          <HStack className="items-center justify-between" style={{ gap: 8 }}>
            <VStack className="flex-1 min-w-0" style={{ gap: 3 }}>
              <Text
                style={{ fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.slate }}
                numberOfLines={1}
              >
                Site #{siteNo || '—'} · Zone {zoneCode || '—'}
              </Text>
              {dateLine ? (
                <HStack className="items-center" style={{ gap: 4 }}>
                  <Clock size={11} color="#64748B" strokeWidth={2} />
                  <Text
                    style={{ fontFamily: FONTS.medium, fontSize: 11, color: '#64748B' }}
                    numberOfLines={1}
                  >
                    {dateLine}
                  </Text>
                </HStack>
              ) : null}
            </VStack>

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
