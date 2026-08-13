import { type ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { Clock, Download, Eye, FilePenLine, type LucideIcon } from 'lucide-react-native';

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
import { DateZoneMetaRow } from '@/src/cdrms/components/DateZoneMetaRow';
import { COLORS, DESIGN, FONTS, GLASS, hexAlpha } from '@/src/cdrms/theme';
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
      <HStack key={themeId} style={{ flexWrap: 'wrap', gap: 8 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentKey === item.key;
          return (
            <Box key={item.key} style={{ width: '47%', flexGrow: 1 }}>
              <Pressable
                onPress={() => onSelect(item.key)}
                className="active:opacity-90"
                style={{
                  borderRadius: DESIGN.chipRadius,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  backgroundColor: active ? item.tint : COLORS.white,
                  borderWidth: 1,
                  borderColor: active ? item.tint : hexAlpha(item.tint, 0.25),
                  minHeight: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  shadowColor: item.tint,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: active ? 0.16 : 0.05,
                  shadowRadius: 8,
                  elevation: active ? 3 : 1,
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

  // tiles (classic / mesh) — 2-col grid with real gap (no negative margins)
  return (
    <HStack key={themeId} style={{ flexWrap: 'wrap', gap: 10 }}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentKey === item.key;
        return (
          <Box key={item.key} style={{ width: '47%', flexGrow: 1 }}>
            <Pressable
              onPress={() => onSelect(item.key)}
              className="active:opacity-90"
              style={{
                borderRadius: DESIGN.cardRadius,
                paddingVertical: 12,
                paddingHorizontal: 12,
                backgroundColor: active ? item.tint : COLORS.white,
                borderWidth: 1,
                borderColor: active ? item.tint : COLORS.border,
                minHeight: 72,
                justifyContent: 'center',
                shadowColor: GLASS.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: active ? 0.12 : 0.06,
                shadowRadius: 10,
                elevation: active ? 3 : 2,
              }}
            >
              <HStack className="items-center" style={{ gap: 10 }}>
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? 'rgba(255,255,255,0.22)' : item.soft,
                  }}
                >
                  <Icon size={16} color={active ? COLORS.white : item.tint} strokeWidth={2.3} />
                </Box>
                <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 20,
                      lineHeight: 24,
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

/** Application list row — same simple card as engineer home (no left rail). */
export function OfficeAppRow({
  title,
  siteNo,
  zoneCode,
  engineerName,
  status,
  dateLine,
  onPress,
  onEdit,
  onDownload,
  downloading = false,
  downloadPercent,
  /** ZC Recent Activity — show zone beside date/time instead of on site line. */
  zoneBesideDate = false,
  /** Smaller date/time · zone line (CAO cards). */
  compactDateZone = false,
  cardIndex = 0,
}: {
  title: string;
  siteNo: string;
  zoneCode: string;
  engineerName?: string | null;
  status: MobileApplicationStatus | string;
  dateLine?: string | null;
  onPress: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  downloading?: boolean;
  downloadPercent?: number;
  zoneBesideDate?: boolean;
  compactDateZone?: boolean;
  cardIndex?: number;
}) {
  const { themeId } = useTheme();
  const tone = applicationStatusTone(status);

  const actions = (
    <HStack className="items-center" style={{ gap: 5 }}>
      {onEdit ? (
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            onEdit();
          }}
          accessibilityLabel="Edit draft"
          className="items-center justify-center active:opacity-80"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: COLORS.slate,
          }}
        >
          <FilePenLine size={13} color={COLORS.white} strokeWidth={2.4} />
        </Pressable>
      ) : null}
      {onDownload ? (
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            if (downloading) return;
            onDownload();
          }}
          disabled={downloading}
          accessibilityLabel={
            downloading ? `Downloading ${downloadPercent ?? 0}%` : 'Download'
          }
          className="items-center justify-center active:opacity-80"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: downloading ? COLORS.primary : COLORS.success,
            opacity: downloading ? 0.85 : 1,
          }}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Download size={13} color={COLORS.white} strokeWidth={2.4} />
          )}
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
        <Eye size={13} color={COLORS.white} strokeWidth={2.4} />
      </Box>
    </HStack>
  );

  const meta = (
    <Text
      style={{ fontFamily: FONTS.medium, fontSize: 14, lineHeight: 17, color: COLORS.ink }}
      numberOfLines={1}
    >
      Site #{siteNo || '—'}
      {!zoneBesideDate ? ` · Zone ${zoneCode || '—'}` : ''}
      {engineerName ? ` · ${engineerName}` : ''}
    </Text>
  );

  const dateRow = dateLine ? (
    zoneBesideDate ? (
      <DateZoneMetaRow date={dateLine} zone={zoneCode} compact={compactDateZone} />
    ) : (
      <HStack className="items-center" style={{ gap: 4 }}>
        <Clock
          size={compactDateZone ? 12 : 13}
          color={COLORS.primary}
          strokeWidth={2.3}
        />
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: FONTS.medium,
            fontSize: compactDateZone ? 12.5 : 14,
            lineHeight: compactDateZone ? 16 : 17,
            color: COLORS.ink,
          }}
          numberOfLines={1}
        >
          {dateLine}
        </Text>
      </HStack>
    )
  ) : null;

  return (
    <Pressable
      key={`${themeId}-${cardIndex}`}
      onPress={onPress}
      className="active:opacity-92"
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: hexAlpha(tone.bar, 0.28),
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <VStack style={{ gap: 3 }}>
        <HStack className="items-center" style={{ gap: 8 }}>
          <Text
            style={{
              flex: 1,
              fontFamily: FONTS.bold,
              fontSize: 16,
              lineHeight: 19,
              color: COLORS.ink,
              minWidth: 0,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {title}
          </Text>
          <Box style={{ flexShrink: 0 }}>
            <ApplicationStatusBadge status={status} />
          </Box>
        </HStack>
        {meta}
        <HStack className="items-center justify-between" style={{ gap: 8 }}>
          <Box style={{ flex: 1, minWidth: 0 }}>{dateRow}</Box>
          <Box style={{ flexShrink: 0 }}>{actions}</Box>
        </HStack>
      </VStack>
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
