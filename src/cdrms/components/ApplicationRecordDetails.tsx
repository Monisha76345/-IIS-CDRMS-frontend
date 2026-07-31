import { useMemo, useState, type ReactNode } from 'react';
import { Linking } from 'react-native';
import {
  Building2,
  Camera,
  Compass,
  Film,
  History,
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
  applicationStatusLabel,
  type MobileApplication,
} from '@/src/api/applications';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { GpsSiteCard } from '@/src/cdrms/components/GpsSiteCard';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { resolveBoundaryDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import { COLORS, FONTS } from '@/src/cdrms/theme';

function addressLine(app: MobileApplication) {
  return [app.addressArea, app.addressBlock, app.addressPincode].filter(Boolean).join(', ');
}

function engineerLabel(app: MobileApplication) {
  return [app.assignedEngineerName || 'Engineer', app.assignedEngineerLoginId || null]
    .filter(Boolean)
    .join(' · ');
}

function formatHistoryDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yyyy}, ${hours}:${minutes} ${ampm}`;
}

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

function InfoRow({ label, value }: { label: string; value: string }) {
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
    </Box>
  );
}

function MediaThumb({
  label,
  uri,
  onPress,
}: {
  label: string;
  uri: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ width: '47%' }}>
      <Box
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          backgroundColor: '#F8FAFC',
        }}
      >
        <ApiMediaImage
          uri={uri}
          style={{
            width: '100%',
            aspectRatio: 1,
            backgroundColor: '#E2E8F0',
          }}
          resizeMode="cover"
        />
        <Box style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
          <Text
            style={{ fontFamily: FONTS.semibold, fontSize: 11, color: '#475569' }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </Box>
      </Box>
    </Pressable>
  );
}

function ApplicationHistorySection({ app }: { app: MobileApplication }) {
  const rows = useMemo(() => {
    const list = [...(app.history || [])];
    const caoRemark = app.caoRemarks?.trim() || '';
    if (caoRemark) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const row = list[i];
        const after = String(row.statusAfter || '').toLowerCase();
        if (after === 'verified' || after === 'returned' || after === 'rejected') {
          const existing = row.comments?.trim();
          if (!existing || existing === '—') {
            list[i] = { ...row, comments: caoRemark };
          }
          break;
        }
      }
    }
    return list.reverse();
  }, [app.caoRemarks, app.history]);

  return (
    <SectionCard title="Application history" icon={History} accent="#6366F1">
      {rows.length === 0 ? (
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 12,
            color: '#64748B',
            paddingVertical: 8,
          }}
        >
          No history yet.
        </Text>
      ) : (
        <VStack style={{ gap: 0 }}>
          {rows.map((row, idx) => (
            <HStack
              key={row.id || `${row.taskName}-${idx}`}
              className="items-stretch"
              style={{
                gap: 10,
                paddingVertical: 10,
                borderBottomWidth: idx < rows.length - 1 ? 1 : 0,
                borderBottomColor: '#F1F5F9',
              }}
            >
              <VStack className="items-center" style={{ width: 14, paddingTop: 4 }}>
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: idx === 0 ? COLORS.primary : '#CBD5E1',
                  }}
                />
                {idx < rows.length - 1 ? (
                  <Box
                    style={{
                      flex: 1,
                      width: 2,
                      backgroundColor: '#E2E8F0',
                      marginTop: 4,
                      minHeight: 24,
                    }}
                  />
                ) : null}
              </VStack>
              <VStack style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
                  {row.taskName}
                </Text>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: '#64748B' }}>
                  {row.performedBy}
                  {row.sentTo && row.sentTo !== '—' ? ` → ${row.sentTo}` : ''}
                </Text>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: '#94A3B8' }}>
                  {formatHistoryDate(row.completedOn || row.startedOn)}
                </Text>
                {row.comments && row.comments !== '—' ? (
                  <Box
                    style={{
                      marginTop: 4,
                      padding: 8,
                      borderRadius: 10,
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#EEF2F7',
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}>
                      {row.comments}
                    </Text>
                  </Box>
                ) : null}
              </VStack>
            </HStack>
          ))}
        </VStack>
      )}
    </SectionCard>
  );
}

function ZcDetailsBlock({ app, siteType, address }: { app: MobileApplication; siteType: string; address: string }) {
  return (
    <SectionCard title="ZC application details" icon={Building2} accent="#2563EB">
      <InfoRow label="Application no" value={app.applicationNumber} />
      <InfoRow label="Status" value={applicationStatusLabel(app.status)} />
      <InfoRow label="Site no" value={app.siteNo} />
      <InfoRow label="Site type" value={siteType} />
      <InfoRow label="Site dimension" value={app.siteDimension || '—'} />
      <InfoRow label="Zone" value={`${app.zoneCode}${app.zoneId ? ` (#${app.zoneId})` : ''}`} />
      <InfoRow label="Area" value={app.addressArea} />
      <InfoRow label="Block" value={app.addressBlock} />
      <InfoRow label="Pincode" value={app.addressPincode} />
      <InfoRow label="Created by ZC" value={app.createdByZcName || '—'} />
      <InfoRow label="Assigned engineer" value={engineerLabel(app)} />
      <InfoRow label="Assigned CAO" value={app.assignedCaoName || '—'} />
      <InfoRow label="Address" value={address || '—'} />
      <InfoRow label="ZC comments" value={app.siteDimensionComment || '—'} />
    </SectionCard>
  );
}

function SchedulesBlock({ app }: { app: MobileApplication }) {
  return (
    <SectionCard title="Schedules (site around)" icon={Compass} accent="#0EA5E9">
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
  const address = addressLine(app);
  const hasGps = Boolean(app.latitude && app.longitude);
  const boundary = resolveBoundaryDims(app);

  const hasEngineerCapture = Boolean(
    app.engineerSubmittedAt ||
      app.engineerSiteDetails ||
      app.selfieUrl ||
      (app.photoUrls && app.photoUrls.some(Boolean)) ||
      app.videoUrl ||
      app.dimNorth ||
      app.compass,
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
        <ZcDetailsBlock app={app} siteType={siteType} address={address} />
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
      <ZcDetailsBlock app={app} siteType={siteType} address={address} />
      <SchedulesBlock app={app} />
      {boundariesBlock}

      {app.engineerSiteDetails ? (
        <SectionCard title="Engineer — Site details" icon={Building2} accent="#7C3AED">
          <InfoRow label="Site verification details" value={app.engineerSiteDetails} />
        </SectionCard>
      ) : null}

      <SectionCard title="Engineer — Compass & GPS" icon={Compass} accent="#059669">
        <InfoRow label="Compass" value={app.compass || '—'} />
        <InfoRow label="Occupancy" value={app.occupancy || '—'} />
        <InfoRow label="Occupancy reason" value={app.occupancyReason || '—'} />
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
        <SectionCard title="Engineer — Site map" icon={MapPin} accent="#0284C7">
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
        <SectionCard title="Engineer — Dimensions" icon={Ruler} accent="#D97706">
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
        <SectionCard title="Engineer — Photos" icon={Camera} accent="#2563EB">
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
                <MediaThumb
                  label="Engineer selfie"
                  uri={app.selfieUrl}
                  onPress={() => setPreview({ uri: app.selfieUrl!, title: 'Selfie' })}
                />
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
                <HStack className="flex-wrap" style={{ gap: 10 }}>
                  {photos.map((url, i) => (
                    <MediaThumb
                      key={`photo-${i}-${url}`}
                      label={`Site photo ${i + 1}`}
                      uri={url}
                      onPress={() =>
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
                <HStack className="flex-wrap" style={{ gap: 10 }}>
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
                        onPress={() =>
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
        <SectionCard title="Engineer — Site video" icon={Film} accent="#1E293B">
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

      <ApplicationHistorySection app={app} />

      <ImagePreviewModal
        uri={preview?.uri ?? null}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />
    </VStack>
  );
}
