import { useState, type ReactNode } from 'react';
import {
  Building2,
  Eye,
  Ruler,
  type LucideIcon,
} from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type MobileApplication, applicationStatusLabel } from '@/src/api/applications';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { GlassSectionCard } from '@/src/cdrms/components/GlassSurface';
import { GpsSiteCard } from '@/src/cdrms/components/GpsSiteCard';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { resolveBoundaryDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import { COLORS, FONTS, GLASS, SPACE } from '@/src/cdrms/theme';

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <GlassSectionCard
      title={title}
      subtitle={subtitle ?? 'Application record'}
      icon={icon}
      bodyStyle={{ paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], gap: 0 }}
    >
      {children}
    </GlassSectionCard>
  );
}

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
      <Text
        style={{
          fontFamily: FONTS.medium,
          fontSize: 10,
          color: COLORS.slate,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
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

function InfoPairRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  last,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  last?: boolean;
}) {
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
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 10,
            color: COLORS.slate,
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}
        >
          {leftLabel}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 13,
            color: COLORS.ink,
            marginTop: 2,
            lineHeight: 17,
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
            color: COLORS.slate,
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}
        >
          {rightLabel}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 13,
            color: COLORS.ink,
            marginTop: 2,
            lineHeight: 17,
          }}
        >
          {rightValue || '—'}
        </Text>
      </Box>
    </HStack>
  );
}

function MediaThumb({
  label,
  uri,
  onView,
}: {
  label: string;
  uri: string;
  onView: () => void;
}) {
  return (
    <Box style={{ width: '23%' }}>
      <Text
        style={{
          fontFamily: FONTS.bold,
          fontSize: 9,
          color: COLORS.primaryDeep,
          marginBottom: 3,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
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
          borderColor: GLASS.border,
          backgroundColor: COLORS.muted,
        }}
      >
        <Box style={{ position: 'relative' }}>
          <ApiMediaImage
            uri={uri}
            style={{ width: '100%', aspectRatio: 1, backgroundColor: GLASS.divider }}
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
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
            }}
          >
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: COLORS.white,
              }}
            >
              <Eye size={14} color={COLORS.primary} strokeWidth={2.3} />
            </Box>
          </Pressable>
        </Box>
      </Box>
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

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: FONTS.bold,
        fontSize: 11,
        color: COLORS.primaryDeep,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginTop: 10,
        marginBottom: 4,
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
}: {
  app: MobileApplication;
  siteType: string;
  diagram?: ReactNode;
}) {
  return (
    <SectionCard title="ZC details" subtitle="Submitted by Zonal Commissioner" icon={Building2}>
      <InfoPairRow
        leftLabel="Application no"
        leftValue={app.applicationNumber}
        rightLabel="Status"
        rightValue={applicationStatusLabel(app.status) || String(app.status || '—')}
      />
      <InfoPairRow
        leftLabel="Site no"
        leftValue={app.siteNo}
        rightLabel="Site type"
        rightValue={siteType}
      />
      <InfoPairRow
        leftLabel="Site dimension"
        leftValue={app.siteDimension || '—'}
        rightLabel="Zone"
        rightValue={app.zoneCode || '—'}
      />
      <InfoPairRow
        leftLabel="Area"
        leftValue={app.addressArea || '—'}
        rightLabel="Block"
        rightValue={app.addressBlock || '—'}
      />
      <InfoPairRow
        leftLabel="Pincode"
        leftValue={app.addressPincode || '—'}
        rightLabel="Assigned CAO"
        rightValue={app.assignedCaoName || '—'}
      />
      <InfoPairRow
        leftLabel="Created by ZC"
        leftValue={app.createdByZcName || '—'}
        rightLabel="Assigned"
        rightValue={formatSubmittedDateTime(app.createdAt)}
      />

      <SectionLabel>Schedules</SectionLabel>
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
        <InfoRow
          label="ZC comments"
          value={app.siteDimensionComment}
          last={!diagram}
        />
      ) : null}

      {diagram ? <Box style={{ marginTop: 8 }}>{diagram}</Box> : null}
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
  const scheduleNote = (k: 'N' | 'S' | 'E' | 'W') => {
    const note = engNotes[k]?.trim() || engNotes[k.toLowerCase()]?.trim() || '';
    const road = isRoadSide(k);
    if (!note && !road) return '—';
    if (note && road) return `${note} · Road`;
    if (road) return 'Road';
    return note;
  };
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
      odd={siteType === 'Odd'}
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
    <ZcDetailsCard app={app} siteType={siteType} diagram={zcDiagram} />
  );

  if (!showEmptyEngineer && !hasEngineerCapture) {
    return (
      <VStack style={{ gap: 12 }}>
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
    <VStack style={{ gap: 12 }}>
      {zcCard}

      <SectionCard title="Engineer details" subtitle="Submitted by field engineer" icon={Ruler}>
        <InfoPairRow
          leftLabel="Assigned engineer"
          leftValue={app.assignedEngineerName || '—'}
          rightLabel="Status"
          rightValue={applicationStatusLabel(app.status) || String(app.status || '—')}
        />
        <InfoPairRow
          leftLabel="Assigned"
          leftValue={formatSubmittedDateTime(app.createdAt)}
          rightLabel="Submitted"
          rightValue={formatSubmittedDateTime(app.engineerSubmittedAt)}
        />

        {app.engineerSiteDetails ? (
          <>
            <SectionLabel>Site details</SectionLabel>
            <InfoRow label="Verification notes" value={app.engineerSiteDetails} />
          </>
        ) : null}

        <SectionLabel>Schedules</SectionLabel>
        <InfoPairRow
          leftLabel="North"
          leftValue={scheduleNote('N')}
          rightLabel="South"
          rightValue={scheduleNote('S')}
        />
        <InfoPairRow
          leftLabel="West"
          leftValue={scheduleNote('W')}
          rightLabel="East"
          rightValue={scheduleNote('E')}
        />
        <InfoPairRow
          leftLabel="Road N"
          leftValue={roadFlags.N ? 'Yes' : 'No'}
          rightLabel="Road S"
          rightValue={roadFlags.S ? 'Yes' : 'No'}
        />
        <InfoPairRow
          leftLabel="Road W"
          leftValue={roadFlags.W ? 'Yes' : 'No'}
          rightLabel="Road E"
          rightValue={roadFlags.E ? 'Yes' : 'No'}
        />

        <SectionLabel>Compass & GPS</SectionLabel>
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
          <Box style={{ borderRadius: 12, overflow: 'hidden', marginTop: 6 }}>
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
            <SectionLabel>Dimensions</SectionLabel>
            <Box style={{ marginTop: 4 }}>{engineerDiagram}</Box>
          </>
        ) : null}

        {!engineerDiagram && boundary.source === 'engineer' ? (
          <>
            <SectionLabel>Dimensions</SectionLabel>
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
              last={!app.totalSiteArea}
            />
            {app.totalSiteArea ? (
              <InfoRow label="Total site area" value={app.totalSiteArea} last />
            ) : null}
          </>
        ) : null}

        {hasMedia ? (
          <>
            <SectionLabel>Photos</SectionLabel>
            <VStack style={{ gap: 12 }}>
              {app.selfieUrl ? (
                <Box>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 10,
                      color: COLORS.slate,
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                    }}
                  >
                    Selfie
                  </Text>
                  <HStack className="flex-wrap" style={{ gap: 6 }}>
                    <MediaThumb
                      label="Selfie"
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
                      fontSize: 10,
                      color: COLORS.slate,
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                    }}
                  >
                    Site photos
                  </Text>
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
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 10,
                      color: COLORS.slate,
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                    }}
                  >
                    Schedule photos
                  </Text>
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
            </VStack>
          </>
        ) : null}

        {app.videoUrl ? (
          <>
            <SectionLabel>Site video</SectionLabel>
            <Box
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                aspectRatio: 16 / 9,
                backgroundColor: COLORS.ink,
              }}
            >
              <SiteVideoPlayer uri={app.videoUrl} />
            </Box>
          </>
        ) : null}

        {app.engineerComments ? (
          <>
            <SectionLabel>Comments</SectionLabel>
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
