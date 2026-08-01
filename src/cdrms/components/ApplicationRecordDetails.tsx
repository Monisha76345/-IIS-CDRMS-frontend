import { useState, type ReactNode } from 'react';
import { Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Building2,
  Camera,
  Compass,
  Eye,
  Film,
  MessageSquare,
  Ruler,
  type LucideIcon,
} from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type MobileApplication } from '@/src/api/applications';
import { ApplicationStatusBadge } from '@/src/cdrms/components/ApplicationStatusBadge';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { BoundariesDiagram } from '@/src/cdrms/components/BoundariesDiagram';
import { FrostedGlass, GlassSectionCard } from '@/src/cdrms/components/GlassSurface';
import { GpsSiteCard } from '@/src/cdrms/components/GpsSiteCard';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { resolveBoundaryDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import { COLORS, FONTS, GLASS, GRADIENT_PRIMARY, SPACE, gradientStops } from '@/src/cdrms/theme';

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

function ApplicationSummaryCard({ app }: { app: MobileApplication }) {
  return (
    <Box style={{ marginHorizontal: SPACE.gutter }}>
      <FrostedGlass borderRadius={20} padding={0} fill={GLASS.cardSolid}>
        <LinearGradient
          colors={gradientStops(GRADIENT_PRIMARY)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 4 }}
        />
        <VStack style={{ padding: SPACE[4], gap: SPACE[2] }}>
          <HStack className="items-center justify-between" style={{ gap: 8 }}>
            <Text
              style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 16, color: COLORS.ink }}
              numberOfLines={1}
            >
              {app.applicationNumber}
            </Text>
            <ApplicationStatusBadge status={app.status} size="md" />
          </HStack>
          <HStack className="items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.ink }}>
              Site no: {app.siteNo || '—'}
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
                <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: COLORS.primary }}>
                  {app.zoneCode || '—'}
                </Text>
              </Box>
            </HStack>
          </HStack>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.slate }} numberOfLines={1}>
            Engineer: {app.assignedEngineerName || '—'}
          </Text>
        </VStack>
      </FrostedGlass>
    </Box>
  );
}

function ZcDetailsBlock({ app, siteType }: { app: MobileApplication; siteType: string }) {
  const hasComments = Boolean(app.siteDimensionComment?.trim());
  return (
    <SectionCard title="ZC application details" subtitle="Site particulars from ZC" icon={Building2}>
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
        last={!app.createdByZcName && !hasComments}
      />
      {app.createdByZcName ? (
        <InfoRow label="Created by ZC" value={app.createdByZcName} last={!hasComments} />
      ) : null}
      {hasComments ? (
        <InfoRow label="ZC comments" value={app.siteDimensionComment!} last />
      ) : null}
    </SectionCard>
  );
}

function SchedulesBlock({ app }: { app: MobileApplication }) {
  return (
    <SectionCard title="Site Schedules" subtitle="North · South · East · West" icon={Compass}>
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
        last
      />
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

  // Diagram only — schedules are shown in Site Schedules card (no duplicate).
  const boundariesBlock = boundary.dims ? (
    <Box style={{ marginHorizontal: SPACE.gutter }}>
      <BoundariesDiagram
      north={boundary.dims.north}
      south={boundary.dims.south}
      east={boundary.dims.east}
      west={boundary.dims.west}
      odd={siteType === 'Odd'}
      siteNo={app.siteNo}
      totalArea={boundary.total}
      />
    </Box>
  ) : null;

  const hasCompassBlock = Boolean(app.compass || app.occupancy || hasGps);
  const hasMedia =
    app.selfieUrl ||
    photos.length > 0 ||
    schedulePhotos.N ||
    schedulePhotos.S ||
    schedulePhotos.E ||
    schedulePhotos.W;

  const coreBlocks = (
    <>
      <ApplicationSummaryCard app={app} />
      <ZcDetailsBlock app={app} siteType={siteType} />
      <SchedulesBlock app={app} />
      {boundariesBlock}
    </>
  );

  if (!showEmptyEngineer && !hasEngineerCapture) {
    return (
        <VStack style={{ gap: 12 }}>
        {coreBlocks}
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
      {coreBlocks}

      {app.engineerSiteDetails ? (
        <SectionCard title="Site details" subtitle="Engineer field notes" icon={Building2}>
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 13,
              color: COLORS.ink,
              lineHeight: 18,
            }}
          >
            {app.engineerSiteDetails}
          </Text>
        </SectionCard>
      ) : null}

      {hasCompassBlock ? (
        <SectionCard title="Compass & GPS" subtitle="Orientation and location" icon={Compass}>
          <InfoPairRow
            leftLabel="Compass"
            leftValue={app.compass || '—'}
            rightLabel="Occupancy"
            rightValue={app.occupancy || '—'}
            last={app.occupancy !== 'Occupied' && !hasGps}
          />
          {app.occupancy === 'Occupied' ? (
            <InfoRow
              label="Occupancy reason"
              value={app.occupancyReason || '—'}
              last={!hasGps}
            />
          ) : null}
          {hasGps ? (
            <>
              <InfoRow
                label="GPS location"
                value={`${app.latitude}, ${app.longitude}`}
                last={!gpsFix}
              />
              {gpsFix ? (
                <Box style={{ borderRadius: 12, overflow: 'hidden', marginTop: 6 }}>
                  <GpsSiteCard
                    height={200}
                    variant="inset"
                    gps={gpsFix}
                    syNo={app.siteNo}
                    villageLabel={app.addressArea}
                    layoutName={app.addressBlock || app.zoneCode}
                    liveMap
                    allowMapGestures
                  />
                </Box>
              ) : null}
              <Pressable
                onPress={() => {
                  void Linking.openURL(
                    `https://maps.google.com/?q=${app.latitude},${app.longitude}`,
                  );
                }}
                style={{
                  marginTop: 8,
                  paddingVertical: 9,
                  paddingHorizontal: 11,
                  borderRadius: 10,
                  backgroundColor: GLASS.tintBlue,
                  borderWidth: 1,
                  borderColor: `${COLORS.primary}40`,
                }}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.primary }}>
                  Open in Google Maps →
                </Text>
              </Pressable>
            </>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Dimensions only when no diagram (diagram already shows N/S/E/W). */}
      {boundary.source === 'engineer' && !boundariesBlock ? (
        <SectionCard title="Dimensions" subtitle="Site boundary measurements" icon={Ruler}>
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
        </SectionCard>
      ) : null}

      {hasMedia ? (
        <SectionCard title="Photos" subtitle="Selfie, site & schedule captures" icon={Camera}>
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
        </SectionCard>
      ) : null}

      {app.videoUrl ? (
        <SectionCard title="Site Video" subtitle="Walk-through recording" icon={Film}>
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
        </SectionCard>
      ) : null}

      {app.engineerComments ? (
        <SectionCard title="Comments" subtitle="Engineer remarks" icon={MessageSquare}>
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 13,
              color: COLORS.ink,
              lineHeight: 18,
            }}
          >
            {app.engineerComments}
          </Text>
        </SectionCard>
      ) : null}

      <ImagePreviewModal
        uri={preview?.uri ?? null}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />
    </VStack>
  );
}
