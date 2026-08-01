import { useState, type ReactNode } from 'react';
import { Linking } from 'react-native';
import {
  Building2,
  Camera,
  Compass,
  Eye,
  Film,
  MapPin,
  Ruler,
  type LucideIcon,
} from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  type MobileApplication,
} from '@/src/api/applications';
import { ApplicationStatusBadge } from '@/src/cdrms/components/ApplicationStatusBadge';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { GpsSiteCard } from '@/src/cdrms/components/GpsSiteCard';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { resolveBoundaryDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import { COLORS, FONTS } from '@/src/cdrms/theme';

function SectionCard({
  title,
  icon: Icon,
  accent = '#2563EB',
  children,
}: {
  title: string;
  icon: LucideIcon;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <Box
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <HStack className="items-center" style={{ gap: 10, marginBottom: 10 }}>
        <Box
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={17} color="#fff" strokeWidth={2.3} />
        </Box>
        <Text style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}>
          {title}
        </Text>
      </HStack>
      {children}
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box
      style={{
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.medium,
          fontSize: 10,
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 13,
            color: COLORS.ink,
            marginTop: 3,
            lineHeight: 18,
          }}
        >
          {value || '—'}
        </Text>
      ) : (
        <Box style={{ marginTop: 4 }}>{value}</Box>
      )}
    </Box>
  );
}

function MediaThumb({
  label,
  uri,
  onView,
  columns = 4,
}: {
  label: string;
  uri: string;
  onView: () => void;
  columns?: 2 | 4;
}) {
  const widthPct = columns === 4 ? '23%' : '47%';

  return (
    <Box style={{ width: widthPct }}>
      <Text
        style={{
          fontFamily: FONTS.bold,
          fontSize: 9,
          color: '#1E3A5F',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Box
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          backgroundColor: '#F1F5F9',
        }}
      >
        <Box style={{ position: 'relative' }}>
          <ApiMediaImage
            uri={uri}
            style={{
              width: '100%',
              aspectRatio: 1,
              backgroundColor: '#E2E8F0',
            }}
            resizeMode="cover"
          />
          <Pressable
            onPress={onView}
            accessibilityLabel={`View ${label}`}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
            }}
          >
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Eye size={16} color="#2563EB" strokeWidth={2.3} />
            </Box>
          </Pressable>
        </Box>
      </Box>
    </Box>
  );
}

function ApplicationHistorySection({ app }: { app: MobileApplication }) {
  return null;
}

function ApplicationSummaryCard({ app }: { app: MobileApplication }) {
  return (
    <Box
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <HStack>
        <Box
          style={{
            width: 4,
            backgroundColor: '#2563EB',
            alignSelf: 'stretch',
          }}
        />
        <VStack className="flex-1" style={{ padding: 12, gap: 6 }}>
          <HStack className="items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
            <Box
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: COLORS.primary }}>
                Zone {app.zoneCode}
              </Text>
            </Box>
            <Box style={{ marginLeft: 'auto' }}>
              <ApplicationStatusBadge status={app.status} size="md" />
            </Box>
          </HStack>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 17, color: COLORS.ink }}>
            {app.applicationNumber}
          </Text>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}>
            Engineer: {app.assignedEngineerName || '—'}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

function InfoPairRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}) {
  return (
    <HStack
      style={{
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
      }}
    >
      <Box style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 10,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {leftLabel}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 13,
            color: COLORS.ink,
            marginTop: 3,
            lineHeight: 18,
          }}
        >
          {leftValue || '—'}
        </Text>
      </Box>
      <Box style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 10,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {rightLabel}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 13,
            color: COLORS.ink,
            marginTop: 3,
            lineHeight: 18,
          }}
        >
          {rightValue || '—'}
        </Text>
      </Box>
    </HStack>
  );
}

function ZcDetailsBlock({ app, siteType }: { app: MobileApplication; siteType: string }) {
  return (
    <SectionCard title="ZC application details" icon={Building2} accent="#2563EB">
      <InfoPairRow
        leftLabel="Site no"
        leftValue={app.siteNo}
        rightLabel="Site type"
        rightValue={siteType}
      />
      <InfoPairRow
        leftLabel="Site dimension"
        leftValue={app.siteDimension || '—'}
        rightLabel="Pincode"
        rightValue={app.addressPincode || '—'}
      />
      <InfoPairRow
        leftLabel="Area"
        leftValue={app.addressArea || '—'}
        rightLabel="Block"
        rightValue={app.addressBlock || '—'}
      />
      <InfoRow label="Created by ZC" value={app.createdByZcName || '—'} />
      <InfoRow label="ZC comments" value={app.siteDimensionComment || '—'} />
    </SectionCard>
  );
}

function SchedulesBlock({ app }: { app: MobileApplication }) {
  return (
    <SectionCard title="Site Schedules" icon={Compass} accent="#0EA5E9">
      <InfoRow label="Schedule N" value={app.scheduleNorth || '—'} />
      <InfoRow label="Schedule S" value={app.scheduleSouth || '—'} />
      <InfoRow label="Schedule W" value={app.scheduleWest || '—'} />
      <InfoRow label="Schedule E" value={app.scheduleEast || '—'} />
    </SectionCard>
  );
}

/**
 * Shared read-only application body — mirrors web ApplicationRecordDetails.
 */
export function ApplicationRecordDetails({
  app,
  showEmptyEngineer = true,
}: {
  app: MobileApplication;
  showEmptyEngineer?: boolean;
}) {
  const [preview, setPreview] = useState<{ uri: string; title: string } | null>(null);

  const siteType = app.siteDimensionType || '—';
  const hasGps = Boolean(app.latitude && app.longitude);
  const boundary = resolveBoundaryDims(app);

  const hasEngineerCapture = Boolean(
    app.engineerSubmittedAt ||
      app.engineerSiteDetails ||
      app.selfieUrl ||
      (app.photoUrls && app.photoUrls.some(Boolean)) ||
      app.videoUrl ||
      app.dimNorth ||
      app.compass ||
      hasGps,
  );

  const photos = (app.photoUrls || []).filter((u) => Boolean(u?.trim()));
  const rawSchedule = app.schedulePhotoUrls || {};
  const schedulePhotos: Record<string, string> = {
    N: rawSchedule.N || rawSchedule.n || '',
    S: rawSchedule.S || rawSchedule.s || '',
    E: rawSchedule.E || rawSchedule.e || '',
    W: rawSchedule.W || rawSchedule.w || '',
  };

  const gpsFix = hasGps
    ? {
        latitude: Number(app.latitude),
        longitude: Number(app.longitude),
        accuracy: null,
        altitude: null,
        timestamp: Date.now(),
      }
    : null;

  const boundariesBlock = boundary.dims ? (
    <BoundariesDiagram
      north={boundary.dims.north}
      south={boundary.dims.south}
      east={boundary.dims.east}
      west={boundary.dims.west}
      odd={siteType === 'Odd'}
      siteNo={app.siteNo}
      totalArea={boundary.total}
      scheduleNorth={app.scheduleNorth}
      scheduleSouth={app.scheduleSouth}
      scheduleEast={app.scheduleEast}
      scheduleWest={app.scheduleWest}
    />
  ) : null;

  if (!showEmptyEngineer && !hasEngineerCapture) {
    return (
      <VStack style={{ gap: 12 }}>
        <ApplicationSummaryCard app={app} />
        <ZcDetailsBlock app={app} siteType={siteType} />
        <SchedulesBlock app={app} />
        {boundariesBlock}
        <ApplicationHistorySection app={app} />
        <ImagePreviewModal
          uri={preview?.uri ?? null}
          title={preview?.title}
          onClose={() => setPreview(null)}
        />
      </VStack>
    );
  }

  const hasMedia =
    app.selfieUrl ||
    photos.length > 0 ||
    schedulePhotos.N ||
    schedulePhotos.S ||
    schedulePhotos.E ||
    schedulePhotos.W;

  return (
    <VStack style={{ gap: 12 }}>
      <ApplicationSummaryCard app={app} />
      <ZcDetailsBlock app={app} siteType={siteType} />
      <SchedulesBlock app={app} />
      {boundariesBlock}

      {app.engineerSiteDetails ? (
        <SectionCard title="Engineer — Site details" icon={Building2} accent="#7C3AED">
          <InfoRow label="Site verification details" value={app.engineerSiteDetails} />
        </SectionCard>
      ) : null}

      <SectionCard title="Compass & GPS" icon={Compass} accent="#059669">
        <InfoRow label="Compass" value={app.compass || '—'} />
        <InfoRow label="Occupancy" value={app.occupancy || '—'} />
        {app.occupancy === 'Occupied' ? (
          <InfoRow label="Occupancy reason" value={app.occupancyReason || '—'} />
        ) : null}
        <InfoRow
          label="GPS location"
          value={hasGps ? `${app.latitude}, ${app.longitude}` : '—'}
        />
        {hasGps ? (
          <Pressable
            onPress={() => {
              void Linking.openURL(
                `https://maps.google.com/?q=${app.latitude},${app.longitude}`,
              );
            }}
            style={{
              marginTop: 4,
              marginBottom: 4,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#BFDBFE',
            }}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.primary }}>
              Open in Google Maps →
            </Text>
          </Pressable>
        ) : null}
      </SectionCard>

      {hasGps && gpsFix ? (
        <SectionCard title="Site Map" icon={MapPin} accent="#0284C7">
          <Box style={{ borderRadius: 14, overflow: 'hidden', marginTop: 2 }}>
            <GpsSiteCard
              height={220}
              variant="inset"
              gps={gpsFix}
              syNo={app.siteNo}
              villageLabel={app.addressArea}
              layoutName={app.addressBlock || app.zoneCode}
              liveMap
              allowMapGestures
            />
          </Box>
        </SectionCard>
      ) : null}

      {boundary.source === 'engineer' ? (
        <SectionCard title="Dimensions" icon={Ruler} accent="#D97706">
          <HStack className="flex-wrap" style={{ gap: 8, marginTop: 2 }}>
            {(
              [
                ['N', app.dimNorth],
                ['S', app.dimSouth],
                ['E', app.dimEast],
                ['W', app.dimWest],
              ] as const
            ).map(([side, val]) => (
              <Box
                key={side}
                style={{
                  width: '47%',
                  borderRadius: 12,
                  padding: 10,
                  backgroundColor: '#FFFBEB',
                  borderWidth: 1,
                  borderColor: '#FDE68A',
                }}
              >
                <Text style={{ fontFamily: FONTS.medium, fontSize: 10, color: '#92400E' }}>
                  Dim {side}
                </Text>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: '#78350F', marginTop: 2 }}>
                  {val != null && val !== '' ? String(val) : '—'}
                </Text>
              </Box>
            ))}
          </HStack>
          {app.totalSiteArea ? (
            <Box
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Text style={{ fontFamily: FONTS.medium, fontSize: 10, color: '#94A3B8' }}>
                TOTAL SITE AREA
              </Text>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: COLORS.ink, marginTop: 2 }}>
                {app.totalSiteArea}
              </Text>
            </Box>
          ) : null}
        </SectionCard>
      ) : null}

      {hasMedia ? (
        <SectionCard title="Photos" icon={Camera} accent="#2563EB">
          <VStack style={{ gap: 14 }}>
            {app.selfieUrl ? (
              <Box>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 11,
                    color: '#64748B',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Selfie
                </Text>
                <HStack className="flex-wrap" style={{ gap: 6 }}>
                  <MediaThumb
                    label="Engineer selfie"
                    uri={app.selfieUrl}
                    onView={() => setPreview({ uri: app.selfieUrl!, title: 'Selfie' })}
                  />
                </HStack>
              </Box>
            ) : null}

            {photos.length > 0 ? (
              <Box>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 11,
                    color: '#64748B',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Site photos
                </Text>
                <HStack className="flex-wrap" style={{ gap: 6 }}>
                  {photos.map((url, i) => (
                    <MediaThumb
                      key={`photo-${i}-${url}`}
                      label={`Site photo ${i + 1}`}
                      uri={url}
                      onView={() =>
                        setPreview({ uri: url, title: `Site photo ${i + 1}` })
                      }
                    />
                  ))}
                </HStack>
              </Box>
            ) : null}

            {schedulePhotos.N || schedulePhotos.S || schedulePhotos.E || schedulePhotos.W ? (
              <Box>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 11,
                    color: '#64748B',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Schedule boundary photos
                </Text>
                <HStack className="flex-wrap" style={{ gap: 6 }}>
                  {(
                    [
                      ['N', 'North photo'],
                      ['S', 'South photo'],
                      ['E', 'East photo'],
                      ['W', 'West photo'],
                    ] as const
                  ).map(([key, label]) =>
                    schedulePhotos[key] ? (
                      <MediaThumb
                        key={key}
                        label={label}
                        uri={schedulePhotos[key]}
                        onView={() =>
                          setPreview({ uri: schedulePhotos[key], title: label })
                        }
                      />
                    ) : null,
                  )}
                </HStack>
              </Box>
            ) : null}
          </VStack>
        </SectionCard>
      ) : null}

      {app.videoUrl ? (
        <SectionCard title="Site Video" icon={Film} accent="#1E293B">
          <Box
            style={{
              marginTop: 2,
              borderRadius: 14,
              overflow: 'hidden',
              aspectRatio: 16 / 9,
              backgroundColor: '#0F172A',
            }}
          >
            <SiteVideoPlayer uri={app.videoUrl} />
          </Box>
        </SectionCard>
      ) : null}

      {app.engineerComments ? (
        <SectionCard title="Comments" icon={Building2} accent="#64748B">
          <InfoRow label="Comments" value={app.engineerComments} />
        </SectionCard>
      ) : null}

      <ApplicationHistorySection app={app} />

      <ImagePreviewModal
        uri={preview?.uri ?? null}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />
    </VStack>
  );
}
