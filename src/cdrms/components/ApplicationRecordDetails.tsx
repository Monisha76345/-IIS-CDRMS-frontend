import { useState, type ReactNode } from 'react';
import {
  Building2,
  Camera,
  Eye,
  Ruler,
  type LucideIcon,
} from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type MobileApplication, engineerApplicationListStatus } from '@/src/api/applications';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { ApplicationStatusBadge } from '@/src/cdrms/components/ApplicationStatusBadge';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { EngineerSchedulesReadOnly } from '@/src/cdrms/components/EngineerSchedulesReadOnly';
import { DimTypeBadge, GlassSectionCard } from '@/src/cdrms/components/GlassSurface';
import { GpsSiteCard } from '@/src/cdrms/components/GpsSiteCard';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { StatusChip } from '@/src/cdrms/components/primitives';
import { resolveBoundaryDims, deriveSiteTypeFromDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import { COLORS, DESIGN, FONTS, GLASS, SPACE, hexAlpha } from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';

function SectionCard({
  title,
  subtitle,
  icon,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <GlassSectionCard
      title={title}
      subtitle={subtitle ?? 'Application record'}
      icon={icon}
      badge={badge}
      translucent
      bodyStyle={{ paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], gap: 0 }}
    >
      {children}
    </GlassSectionCard>
  );
}

const FIELD_LABEL_STYLE = {
  fontFamily: FONTS.bold,
  fontWeight: '800' as const,
  fontSize: 13,
  color: '#0F172A',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.45,
};

const EMPHASIS_FIELD_LABEL_STYLE = {
  ...FIELD_LABEL_STYLE,
  fontSize: 14,
  letterSpacing: 0.55,
};

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: ReactNode;
  last?: boolean;
}) {
  return (
    <Box
      style={{
        paddingVertical: 7,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: GLASS.divider,
      }}
    >
      <Text style={FIELD_LABEL_STYLE}>
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 13,
            color: COLORS.ink,
            marginTop: 2,
            lineHeight: 17,
          }}
        >
          {value || '—'}
        </Text>
      ) : (
        <Box style={{ marginTop: 3 }}>{value}</Box>
      )}
    </Box>
  );
}

function renderFieldValue(value: ReactNode) {
  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <Text
        style={{
          fontFamily: FONTS.medium,
          fontSize: 13,
          color: COLORS.ink,
          marginTop: 2,
          lineHeight: 17,
        }}
      >
        {value || '—'}
      </Text>
    );
  }
  return <Box style={{ marginTop: 2 }}>{value ?? '—'}</Box>;
}

function InfoPairRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  last,
  emphasisLabels = false,
}: {
  leftLabel: string;
  leftValue: ReactNode;
  rightLabel: string;
  rightValue: ReactNode;
  last?: boolean;
  emphasisLabels?: boolean;
}) {
  const labelStyle = emphasisLabels ? EMPHASIS_FIELD_LABEL_STYLE : FIELD_LABEL_STYLE;
  return (
    <HStack
      style={{
        paddingVertical: 7,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: GLASS.divider,
        gap: 10,
      }}
    >
      <Box style={{ flex: 1 }}>
        <Text style={labelStyle}>
          {leftLabel}
        </Text>
        {renderFieldValue(leftValue)}
      </Box>
      <Box style={{ flex: 1 }}>
        <Text style={labelStyle}>
          {rightLabel}
        </Text>
        {renderFieldValue(rightValue)}
      </Box>
    </HStack>
  );
}

function MediaThumb({
  label,
  uri,
  onView,
  showLabel = true,
}: {
  label: string;
  uri: string;
  onView: () => void;
  showLabel?: boolean;
}) {
  return (
    <Box style={{ width: '22%' }}>
      {showLabel ? (
        <Text
          style={{
            ...FIELD_LABEL_STYLE,
            fontSize: 10,
            marginBottom: 4,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={onView}
        className="active:opacity-80"
        accessibilityLabel={`View ${label}`}
        style={{
          borderRadius: 999,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: hexAlpha(COLORS.primary, 0.45),
          backgroundColor: COLORS.muted,
        }}
      >
        <ApiMediaImage
          uri={uri}
          style={{ width: '100%', aspectRatio: 1, backgroundColor: GLASS.divider, borderRadius: 999 }}
          resizeMode="cover"
        />
      </Pressable>
    </Box>
  );
}

function formatSubmittedDateTime(iso?: string | null): string {
  if (!iso?.trim()) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function SectionLabel({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <Text
      style={{
        fontFamily: FONTS.bold,
        fontWeight: '800',
        fontSize: 12,
        color: accent ? COLORS.primary : COLORS.ink,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 12,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

function MediaSectionHeading({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: FONTS.bold,
        fontWeight: '800',
        fontSize: 12,
        color: COLORS.primary,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {children}
    </Text>
  );
}

function ZcDetailsCard({
  app,
  siteType,
  diagram,
  badge,
}: {
  app: MobileApplication;
  siteType: string;
  diagram?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <SectionCard
      title="ZC details"
      subtitle="Submitted by Zone Commissioner"
      icon={Building2}
      badge={badge}
    >
      <InfoPairRow
        leftLabel="E-office number"
        leftValue={app.eOfficeNumber?.trim() || '—'}
        rightLabel="Site no"
        rightValue={app.siteNo}
      />
      <InfoPairRow
        leftLabel="Site type"
        leftValue={siteType}
        rightLabel="Site dimension"
        rightValue={app.siteDimension || '—'}
      />
      <InfoPairRow
        leftLabel="Zone"
        leftValue={app.zoneCode || '—'}
        rightLabel="Area"
        rightValue={app.addressArea || '—'}
      />
      <InfoPairRow
        leftLabel="Block"
        leftValue={app.addressBlock || '—'}
        rightLabel="Pincode"
        rightValue={app.addressPincode || '—'}
      />

      <SectionLabel accent> Site Schedules</SectionLabel>
      <InfoPairRow
        leftLabel="North"
        leftValue={app.scheduleNorth || '—'}
        rightLabel="South"
        rightValue={app.scheduleSouth || '—'}
      />
      <InfoPairRow
        leftLabel="West"
        leftValue={app.scheduleWest || '—'}
        rightLabel="East"
        rightValue={app.scheduleEast || '—'}
        last={!app.siteDimensionComment?.trim() && !diagram}
      />

      {app.siteDimensionComment?.trim() ? (
        <>
          <SectionLabel accent>Comments</SectionLabel>
          <Box
            style={{
              paddingVertical: 7,
              borderBottomWidth: diagram ? 1 : 0,
              borderBottomColor: GLASS.divider,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 13,
                color: COLORS.ink,
                lineHeight: 17,
              }}
            >
              {app.siteDimensionComment}
            </Text>
          </Box>
        </>
      ) : null}

      {diagram ? <Box style={{ marginTop: 8, marginBottom: 4 }}>{diagram}</Box> : null}

      <InfoPairRow
        leftLabel="Created by ZC"
        leftValue={app.createdByZcName || '—'}
        rightLabel="Assigned on"
        rightValue={formatSubmittedDateTime(app.createdAt)}
      />
      <InfoRow label="Assigned engineer" value={app.assignedEngineerName || '—'} last />
    </SectionCard>
  );
}

/**
 * Shared read-only application body — mirrors web ApplicationRecordDetails.
 */
export function ApplicationRecordDetails({
  app,
  showEmptyEngineer = true,
  viewerRole,
}: {
  app: MobileApplication;
  showEmptyEngineer?: boolean;
  /** When engineer, never show ZC draft badge — use workflow status only. */
  viewerRole?: 'engineer' | 'zc' | 'cao';
}) {
  const { themeId } = useTheme();
  const [preview, setPreview] = useState<{ uri: string; title: string } | null>(null);

  const zcSiteType = app.siteDimensionType || '—';
  const engDims = app.engineerDimensions;
  const measuredType = deriveSiteTypeFromDims(
    app.dimNorth || engDims?.N,
    app.dimSouth || engDims?.S,
    app.dimEast || engDims?.E,
    app.dimWest || engDims?.W,
  );
  const hasGps = Boolean(app.latitude && app.longitude);
  const boundary = resolveBoundaryDims(app);
  const diagramOdd =
    boundary.source === 'engineer'
      ? measuredType === 'Odd' || measuredType === null
      : zcSiteType === 'Odd';

  const photos = (app.photoUrls || []).filter((u) => Boolean(u?.trim()));
  const rawSchedule = app.schedulePhotoUrls || {};
  const schedulePhotos: Record<string, string> = {
    N: rawSchedule.N || rawSchedule.n || '',
    S: rawSchedule.S || rawSchedule.s || '',
    E: rawSchedule.E || rawSchedule.e || '',
    W: rawSchedule.W || rawSchedule.w || '',
  };

  const hasEngineerCapture = Boolean(
    app.engineerSubmittedAt ||
      app.engineerSiteDetails ||
      app.selfieUrl ||
      photos.length > 0 ||
      app.videoUrl ||
      app.dimNorth ||
      app.compass ||
      hasGps ||
      app.engineerScheduleNotes?.N ||
      app.engineerScheduleNotes?.S ||
      app.engineerScheduleNotes?.E ||
      app.engineerScheduleNotes?.W ||
      schedulePhotos.N ||
      schedulePhotos.S ||
      schedulePhotos.E ||
      schedulePhotos.W,
  );

  const geo = app.engineerGeoAddress || null;
  const geoPlace =
    geo?.displayName?.trim() ||
    geo?.village?.trim() ||
    geo?.area?.trim() ||
    '';
  const geoAreaLine = [geo?.area, geo?.block, geo?.district, geo?.state]
    .filter(Boolean)
    .join(' · ');
  const gpsFix = hasGps
    ? {
        latitude: Number(app.latitude),
        longitude: Number(app.longitude),
        accuracy: typeof geo?.accuracy === 'number' ? geo.accuracy : null,
        altitude: null,
        timestamp: 0,
      }
    : null;

  const engNotes = app.engineerScheduleNotes || {};
  const roadFlags = app.scheduleRoadFlags || {};
  const isRoadSide = (k: 'N' | 'S' | 'E' | 'W') =>
    Boolean(roadFlags[k] ?? roadFlags[k.toLowerCase()]);
  /** Same labels as engineer Dimensions step — includes Road so diagram shows the strip. */
  const diagramSchedule = (k: 'N' | 'S' | 'E' | 'W') => {
    const eng =
      engNotes[k]?.trim() || engNotes[k.toLowerCase()]?.trim() || '';
    const zc =
      k === 'N'
        ? app.scheduleNorth
        : k === 'S'
          ? app.scheduleSouth
          : k === 'E'
            ? app.scheduleEast
            : app.scheduleWest;
    const base = eng || (zc || '').trim();
    const road = isRoadSide(k);
    if (road && base) return `Road · ${base}`;
    if (road) return 'Road';
    return base || null;
  };

  const diagramNode = boundary.dims ? (
    <BoundariesDiagram
      north={boundary.dims.north}
      south={boundary.dims.south}
      east={boundary.dims.east}
      west={boundary.dims.west}
      odd={diagramOdd}
      siteNo={app.siteNo}
      totalArea={boundary.total}
      scheduleNorth={
        boundary.source === 'engineer' ? diagramSchedule('N') : app.scheduleNorth
      }
      scheduleSouth={
        boundary.source === 'engineer' ? diagramSchedule('S') : app.scheduleSouth
      }
      scheduleEast={
        boundary.source === 'engineer' ? diagramSchedule('E') : app.scheduleEast
      }
      scheduleWest={
        boundary.source === 'engineer' ? diagramSchedule('W') : app.scheduleWest
      }
      roadNorth={boundary.source === 'engineer' ? isRoadSide('N') : undefined}
      roadSouth={boundary.source === 'engineer' ? isRoadSide('S') : undefined}
      roadEast={boundary.source === 'engineer' ? isRoadSide('E') : undefined}
      roadWest={boundary.source === 'engineer' ? isRoadSide('W') : undefined}
    />
  ) : null;

  const zcDiagram = boundary.source !== 'engineer' ? diagramNode : null;
  const engineerDiagram = boundary.source === 'engineer' ? diagramNode : null;

  const hasMedia =
    app.selfieUrl ||
    photos.length > 0 ||
    schedulePhotos.N ||
    schedulePhotos.S ||
    schedulePhotos.E ||
    schedulePhotos.W;

  const zcCard = (
    <ZcDetailsCard
      app={app}
      siteType={zcSiteType}
      diagram={zcDiagram}
      badge={
        viewerRole === 'engineer' ? undefined : (
          <ApplicationStatusBadge status={app.status} size="md" />
        )
      }
    />
  );

  const engineerStatusBadge =
    viewerRole === 'engineer' ? (
      <StatusChip status={engineerApplicationListStatus(app)} />
    ) : (
      <ApplicationStatusBadge status={app.status} size="md" />
    );

  const measuredSiteTypeValue = measuredType ? (
    <Box style={{ alignSelf: 'flex-start' }}>
      <DimTypeBadge type={measuredType} />
    </Box>
  ) : (
    '—'
  );

  if (!showEmptyEngineer && !hasEngineerCapture) {
    return (
      <VStack key={themeId} style={{ gap: Math.max(6, DESIGN.sectionGap - 2) }}>
        {zcCard}
        <ImagePreviewModal
          uri={preview?.uri ?? null}
          title={preview?.title}
          onClose={() => setPreview(null)}
        />
      </VStack>
    );
  }

  return (
    <VStack key={themeId} style={{ gap: Math.max(6, DESIGN.sectionGap - 2) }}>
      {zcCard}

      <SectionCard
        title="Engineer details"
        subtitle="Submitted by field engineer"
        icon={Ruler}
        badge={engineerStatusBadge}
      >
        <InfoPairRow
          leftLabel="Assigned on"
          leftValue={formatSubmittedDateTime(app.createdAt)}
          rightLabel="Submitted on"
          rightValue={formatSubmittedDateTime(app.engineerSubmittedAt)}
        />

        <SectionLabel accent>Site Schedules</SectionLabel>
        <InfoPairRow
          leftLabel="North"
          leftValue={app.scheduleNorth?.trim() || '—'}
          rightLabel="South"
          rightValue={app.scheduleSouth?.trim() || '—'}
        />
        <InfoPairRow
          leftLabel="West"
          leftValue={app.scheduleWest?.trim() || '—'}
          rightLabel="East"
          rightValue={app.scheduleEast?.trim() || '—'}
        />

        <SectionLabel accent>Boundary capture</SectionLabel>
        <EngineerSchedulesReadOnly app={app} />

        <SectionLabel accent>Compass & GPS</SectionLabel>
        <InfoPairRow
          leftLabel="Compass"
          leftValue={app.compass || '—'}
          rightLabel="Occupancy"
          rightValue={app.occupancy || '—'}
        />
        {app.occupancy === 'Occupied' ? (
          <InfoRow label="Occupancy reason" value={app.occupancyReason || '—'} />
        ) : null}
        <InfoRow
          label="Location"
          value={geoPlace || '—'}
        />
        {geoAreaLine || geo?.postalCode ? (
          <InfoRow
            label="Area"
            value={[geoAreaLine, geo?.postalCode?.trim()].filter(Boolean).join(' · ') || '—'}
          />
        ) : null}
        <InfoPairRow
          leftLabel="Latitude"
          leftValue={app.latitude?.trim() || '—'}
          rightLabel="Longitude"
          rightValue={app.longitude?.trim() || '—'}
          last={!hasGps}
        />
        {hasGps && gpsFix ? (
          <Box style={{ borderRadius: DESIGN.cardRadius, overflow: 'hidden', marginTop: 6 }}>
            <GpsSiteCard
              height={200}
              variant="inset"
              gps={gpsFix}
              liveMap
              allowMapGestures
              source="captured"
            />
          </Box>
        ) : null}

        {engineerDiagram ? (
          <>
            <SectionLabel accent>Dimensions</SectionLabel>
            <InfoPairRow
              leftLabel="Measured site type"
              leftValue={measuredSiteTypeValue}
              rightLabel="Total area"
              rightValue={app.totalSiteArea ? String(app.totalSiteArea) : boundary.total != null ? String(boundary.total) : '—'}
              emphasisLabels
            />
            <Box style={{ marginTop: 4 }}>{engineerDiagram}</Box>
          </>
        ) : null}

        {!engineerDiagram && boundary.source === 'engineer' ? (
          <>
            <SectionLabel accent>Dimensions</SectionLabel>
            <InfoPairRow
              leftLabel="Measured site type"
              leftValue={measuredSiteTypeValue}
              rightLabel="Total area"
              rightValue={app.totalSiteArea ? String(app.totalSiteArea) : '—'}
              emphasisLabels
            />
            <InfoPairRow
              leftLabel="Dim N"
              leftValue={app.dimNorth != null && app.dimNorth !== '' ? String(app.dimNorth) : '—'}
              rightLabel="Dim S"
              rightValue={app.dimSouth != null && app.dimSouth !== '' ? String(app.dimSouth) : '—'}
            />
            <InfoPairRow
              leftLabel="Dim E"
              leftValue={app.dimEast != null && app.dimEast !== '' ? String(app.dimEast) : '—'}
              rightLabel="Dim W"
              rightValue={app.dimWest != null && app.dimWest !== '' ? String(app.dimWest) : '—'}
              last
            />
          </>
        ) : null}

        {hasMedia || app.videoUrl ? (
          <>
            <SectionLabel accent>Photos & Media</SectionLabel>
            <Box
              style={{
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: hexAlpha(COLORS.primary, 0.55),
                backgroundColor: 'rgba(255,255,255,0.5)',
                padding: 12,
                marginTop: 4,
                gap: 12,
              }}
            >
              <HStack className="items-center justify-between" style={{ marginBottom: 2 }}>
                <HStack className="items-center" style={{ gap: 8 }}>
                  <Box
                    style={{
                      height: 30,
                      width: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 9,
                      backgroundColor: COLORS.primary,
                    }}
                  >
                    <Camera size={14} color="#FFFFFF" strokeWidth={2.35} />
                  </Box>
                  <Text style={{ fontFamily: FONTS.bold, fontWeight: '800', fontSize: 15, color: COLORS.ink }}>
                    Captured photos & video
                  </Text>
                </HStack>
              </HStack>
              <Box style={{ height: 1, backgroundColor: GLASS.divider, marginVertical: 4 }} />

              <VStack style={{ gap: 12 }}>
                {app.selfieUrl ? (
                  <Box>
                    <MediaSectionHeading>Selfie</MediaSectionHeading>
                    <HStack className="flex-wrap" style={{ gap: 6 }}>
                      <MediaThumb
                        label="Selfie"
                        showLabel={false}
                        uri={app.selfieUrl}
                        onView={() => setPreview({ uri: app.selfieUrl!, title: 'Selfie' })}
                      />
                    </HStack>
                  </Box>
                ) : null}

                {photos.length > 0 ? (
                  <Box>
                    <MediaSectionHeading>Site photos</MediaSectionHeading>
                    <HStack className="flex-wrap" style={{ gap: 6 }}>
                      {photos.map((url, i) => (
                        <MediaThumb
                          key={`photo-${i}-${url}`}
                          label={`Photo ${i + 1}`}
                          uri={url}
                          onView={() => setPreview({ uri: url, title: `Site photo ${i + 1}` })}
                        />
                      ))}
                    </HStack>
                  </Box>
                ) : null}

                {schedulePhotos.N || schedulePhotos.S || schedulePhotos.E || schedulePhotos.W ? (
                  <Box>
                    <MediaSectionHeading>Site schedule photos</MediaSectionHeading>
                    <HStack className="flex-wrap" style={{ gap: 6 }}>
                      {(
                        [
                          ['N', 'North'],
                          ['S', 'South'],
                          ['E', 'East'],
                          ['W', 'West'],
                        ] as const
                      ).map(([key, label]) =>
                        schedulePhotos[key] ? (
                          <MediaThumb
                            key={key}
                            label={label}
                            uri={schedulePhotos[key]}
                            onView={() =>
                              setPreview({ uri: schedulePhotos[key], title: `${label} photo` })
                            }
                          />
                        ) : null,
                      )}
                    </HStack>
                  </Box>
                ) : null}

                {app.videoUrl ? (
                  <Box>
                    <MediaSectionHeading>Site video</MediaSectionHeading>
                    <Box
                      style={{
                        borderRadius: DESIGN.cardRadius,
                        overflow: 'hidden',
                        aspectRatio: 16 / 9,
                        backgroundColor: COLORS.ink,
                      }}
                    >
                      <SiteVideoPlayer uri={app.videoUrl} />
                    </Box>
                  </Box>
                ) : null}
              </VStack>
            </Box>
          </>
        ) : null}

        {app.engineerComments ? (
          <>
            <SectionLabel accent>Comments</SectionLabel>
            <InfoRow label="Engineer remarks" value={app.engineerComments} last />
          </>
        ) : null}
      </SectionCard>

      <ImagePreviewModal
        uri={preview?.uri ?? null}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />
    </VStack>
  );
}
