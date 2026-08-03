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
import { COLORS, DESIGN, FONTS, GLASS, hexAlpha } from '@/src/cdrms/theme';
import { cardSurfaceStyle } from '@/src/cdrms/lib/cardSurface';
import { useTheme } from '@/src/theme/ThemeContext';

export type StatusCountItem = {
  key: string;
  label: string;
  count: number;
  icon: LucideIcon;
  tint: string;
  soft: string;
};

/** ZC / CAO status filters — layout changes with theme family. */
export function StatusCountGrid({
  items,
  activeKey,
  selectedKey,
  onSelect,
  columns = 2,
}: {
  items: StatusCountItem[];
  activeKey?: string;
  selectedKey?: string;
  onSelect: (key: string) => void;
  columns?: 2 | 3 | 4;
}) {
  const { themeId } = useTheme();
  const fv = DESIGN.filterVariant;
  const widthPct = columns === 4 ? '25%' : columns === 3 ? '33.333%' : '50%';
  const currentKey = activeKey ?? selectedKey ?? '';

  if (fv === 'tabs') {
    return (
      <HStack
        key={themeId}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          marginBottom: 4,
        }}
      >
        {items.map((item) => {
          const active = currentKey === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              className="flex-1 items-center active:opacity-80"
              style={{
                paddingVertical: 7,
                borderBottomWidth: active ? 2.5 : 0,
                borderBottomColor: item.tint,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 16,
                  color: active ? item.tint : COLORS.ink,
                }}
              >
                {item.count}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  color: active ? item.tint : COLORS.slate,
                  marginTop: 2,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
    );
  }

  if (fv === 'pills') {
    return (
      <HStack
        key={themeId}
        className="flex-wrap"
        style={{
          gap: 6,
          backgroundColor: COLORS.white,
          borderRadius: 999,
          padding: 6,
          shadowColor: GLASS.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: DESIGN.shadowOpacity,
          shadowRadius: DESIGN.shadowRadius,
          elevation: DESIGN.elevation,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentKey === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              className="active:opacity-90"
              style={{
                flexGrow: 1,
                flexBasis: '40%',
                borderRadius: 999,
                paddingVertical: 7,
                paddingHorizontal: 12,
                backgroundColor: active ? item.tint : hexAlpha(COLORS.ink, 0.04),
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon size={14} color={active ? COLORS.white : item.tint} strokeWidth={2.3} />
              <VStack style={{ gap: 0 }}>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 16,
                    color: active ? COLORS.white : COLORS.ink,
                  }}
                >
                  {item.count}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 12,
                    color: active ? 'rgba(255,255,255,0.9)' : COLORS.slate,
                  }}
                >
                  {item.label}
                </Text>
              </VStack>
            </Pressable>
          );
        })}
      </HStack>
    );
  }

  if (fv === 'blocks') {
    return (
      <HStack key={themeId} className="flex-wrap" style={{ marginHorizontal: -3 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentKey === item.key;
          return (
            <Box key={item.key} style={{ width: widthPct, padding: 3 }}>
              <Pressable
                onPress={() => onSelect(item.key)}
                className="active:opacity-90"
                style={{
                  borderRadius: DESIGN.chipRadius,
                  paddingVertical: 7,
                  paddingHorizontal: 8,
                  backgroundColor: active ? item.tint : COLORS.white,
                  borderWidth: 1,
                  borderColor: active ? item.tint : hexAlpha(item.tint, 0.25),
                  minHeight: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  shadowColor: item.tint,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: active ? 0.16 : 0.04,
                  shadowRadius: 5,
                  elevation: active ? 2 : 1,
                }}
              >
                <Icon size={15} color={active ? COLORS.white : item.tint} strokeWidth={2.4} />
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 17,
                    color: active ? COLORS.white : COLORS.ink,
                  }}
                >
                  {item.count}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 12,
                    color: active ? 'rgba(255,255,255,0.95)' : COLORS.slate,
                  }}
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

  if (fv === 'chips') {
    return (
      <HStack key={themeId} className="flex-wrap" style={{ gap: 6 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentKey === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              className="active:opacity-90"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: DESIGN.chipRadius,
                backgroundColor: active ? item.tint : hexAlpha(item.tint, 0.1),
                borderWidth: 1,
                borderColor: active ? item.tint : hexAlpha(item.tint, 0.25),
              }}
            >
              <Icon size={13} color={active ? COLORS.white : item.tint} strokeWidth={2.3} />
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 14,
                  color: active ? COLORS.white : COLORS.ink,
                }}
              >
                {item.count}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 12,
                  color: active ? 'rgba(255,255,255,0.92)' : item.tint,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
    );
  }

  // tiles (classic)
  return (
    <HStack key={themeId} className="flex-wrap" style={{ marginHorizontal: -4 }}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentKey === item.key;
        return (
          <Box key={item.key} style={{ width: widthPct, padding: 4 }}>
            <Pressable
              onPress={() => onSelect(item.key)}
              className="active:opacity-90"
              style={{
                borderRadius: DESIGN.cardRadius,
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: active ? item.tint : COLORS.white,
                borderWidth: DESIGN.borderWidth,
                borderColor: active ? item.tint : COLORS.border,
                minHeight: 48,
                justifyContent: 'center',
                shadowColor: GLASS.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? DESIGN.shadowOpacity + 0.04 : DESIGN.shadowOpacity,
                shadowRadius: DESIGN.shadowRadius / 2,
                elevation: active ? DESIGN.elevation : Math.max(1, DESIGN.elevation - 1),
              }}
            >
              <HStack className="items-center" style={{ gap: 6 }}>
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
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
                      fontFamily: FONTS.bold,
                      fontSize: 13,
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

/** Application list row — shape changes with theme listVariant. */
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
  dateLine?: string | null;
  onPress: () => void;
  onDownload?: () => void;
}) {
  const { themeId } = useTheme();
  const tone = applicationStatusTone(status);
  const lv = DESIGN.listVariant;

  const actions = (
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
            borderRadius: lv === 'tile' || lv === 'ghost' ? DESIGN.chipRadius : 999,
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
          borderRadius: lv === 'tile' || lv === 'ghost' ? DESIGN.chipRadius : 999,
          backgroundColor: COLORS.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Eye size={14} color={COLORS.white} strokeWidth={2.4} />
      </Box>
    </HStack>
  );

  const meta = (
    <Text
      style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.ink }}
      numberOfLines={1}
    >
      Site #{siteNo || '—'} · Zone {zoneCode || '—'}
      {engineerName ? ` · ${engineerName}` : ''}
    </Text>
  );

  const dateRow = dateLine ? (
    <HStack className="items-center" style={{ gap: 4 }}>
      <Clock size={12} color={COLORS.primary} strokeWidth={2.3} />
      <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
        {dateLine}
      </Text>
    </HStack>
  ) : null;

  if (lv === 'ghost') {
    return (
      <Pressable
        key={themeId}
        onPress={onPress}
        className="active:opacity-80"
        style={{
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          marginBottom: 0,
        }}
      >
        <HStack className="items-center justify-between" style={{ gap: 6 }}>
          <VStack className="flex-1 min-w-0" style={{ gap: 4 }}>
            <HStack className="items-center" style={{ gap: 6 }}>
              <Box style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: tone.bar }} />
              <Text
                style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}
                numberOfLines={1}
              >
                {title}
              </Text>
              <ApplicationStatusBadge status={status} />
            </HStack>
            {meta}
            {dateRow}
          </VStack>
          {actions}
        </HStack>
      </Pressable>
    );
  }

  if (lv === 'strip') {
    return (
      <Pressable
        key={themeId}
        onPress={onPress}
        className="active:opacity-90"
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 999,
          marginBottom: 6,
          paddingVertical: 8,
          paddingHorizontal: 14,
          shadowColor: GLASS.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: DESIGN.shadowOpacity,
          shadowRadius: DESIGN.shadowRadius,
          elevation: DESIGN.elevation,
        }}
      >
        <HStack className="items-center" style={{ gap: 10 }}>
          <Box
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: tone.bar,
            }}
          />
          <VStack className="flex-1 min-w-0" style={{ gap: 3 }}>
            <Text
              style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {meta}
          </VStack>
          <ApplicationStatusBadge status={status} />
          {actions}
        </HStack>
      </Pressable>
    );
  }

  if (lv === 'tile') {
    return (
      <Pressable
        key={themeId}
        onPress={onPress}
        className="active:opacity-90"
        style={{
          backgroundColor: COLORS.white,
          borderRadius: DESIGN.cardRadius,
          borderWidth: 1,
          borderColor: hexAlpha(COLORS.primary, 0.2),
          borderLeftWidth: 4,
          borderLeftColor: tone.bar,
          marginBottom: 6,
          padding: 11,
          shadowColor: COLORS.primaryDeep,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <HStack className="items-start justify-between" style={{ gap: 6 }}>
          <VStack className="flex-1 min-w-0" style={{ gap: 6 }}>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 14,
                color: COLORS.ink,
                letterSpacing: -0.1,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {meta}
            <ApplicationStatusBadge status={status} />
          </VStack>
          {actions}
        </HStack>
      </Pressable>
    );
  }

  if (lv === 'row') {
    return (
      <Pressable
        key={themeId}
        onPress={onPress}
        className="active:opacity-90"
        style={{
          backgroundColor: hexAlpha(COLORS.primary, 0.04),
          borderRadius: DESIGN.cardRadius,
          borderWidth: 1,
          borderColor: hexAlpha(COLORS.primary, 0.15),
          marginBottom: 6,
          paddingVertical: 11,
          paddingHorizontal: 12,
        }}
      >
        <HStack className="items-center" style={{ gap: 10 }}>
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: DESIGN.stepRadius,
              backgroundColor: hexAlpha(tone.bar, 0.15),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: tone.bar }} />
          </Box>
          <VStack className="flex-1 min-w-0" style={{ gap: 3 }}>
            <Text
              style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {meta}
          </VStack>
          <ApplicationStatusBadge status={status} />
          {actions}
        </HStack>
      </Pressable>
    );
  }

  // card (classic) — still follows theme card family chrome
  return (
    <Pressable
      key={themeId}
      onPress={onPress}
      className="active:opacity-90"
      style={[cardSurfaceStyle(), { marginBottom: 6 }]}
    >
      <HStack className="items-center">
        <Box style={{ width: 3.5, backgroundColor: tone.bar, alignSelf: 'stretch' }} />
        <VStack className="flex-1 min-w-0" style={{ paddingVertical: 7, paddingHorizontal: 11, gap: 6 }}>
          <HStack className="items-center justify-between" style={{ gap: 6 }}>
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

          <HStack className="items-center justify-between" style={{ gap: 6 }}>
            {meta}
            {actions}
          </HStack>
          {dateRow}
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
      <Text style={{ flex: 1, fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.ink }}>
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
