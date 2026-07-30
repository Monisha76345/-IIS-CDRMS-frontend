import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Compass,
  Edit3,
  Film,
  MapPin,
  Navigation,
} from 'lucide-react-native';
import { Image } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  AppBtn,
  AppHeader,
  ScreenShell,
  StatusChip,
} from '@/src/cdrms/components/primitives';
import { findSampleApp } from '@/src/cdrms/data';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { COLORS } from '@/src/cdrms/theme';
import { TERMS } from '@/src/cdrms/terminology';
import type { Go } from '@/src/cdrms/types';

type DetailView = {
  id: string;
  project: string;
  status: string;
  date: string;
  village: string;
  image: string | null;
  khatedarName: string;
  surveyNo: string;
  plotNo: string;
  dimensionArea: string;
  roadType: string;
  landType: string;
  taluk: string;
  district: string;
  state: string;
  coords: string;
  directions: { N: string; S: string; E: string; W: string };
  photoCount: number;
  hasVideo: boolean;
  approachRoadWidth: string;
  approachRoadName: string;
  approachNotes: string;
  nearbyBuildings: string;
  nearbyRoads: string;
  landmarks: string;
  remarks?: string;
  officer?: string;
  gallery: string[];
  liveDraft?: boolean;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box style={{ width: '47%' }}>
      <Text className="text-[10px] uppercase font-extrabold tracking-wider" style={{ color: '#94A3B8' }}>
        {label}
      </Text>
      <Text className="text-[13px] font-bold mt-0.5" style={{ color: '#0F172A' }}>
        {value || '—'}
      </Text>
    </Box>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  accent = '#2563EB',
}: {
  title: string;
  icon: typeof Building2;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <Box
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <HStack className="items-center gap-2.5 mb-3">
        <Box
          className="items-center justify-center rounded-xl"
          style={{ width: 34, height: 34, backgroundColor: accent }}
        >
          <Icon size={16} color="#fff" strokeWidth={2.3} />
        </Box>
        <Text className="text-[14px] font-extrabold" style={{ color: '#0F172A' }}>
          {title}
        </Text>
      </HStack>
      {children}
    </Box>
  );
}

export function ApplicationDetailsScreen({ go }: { go: Go }) {
  const {
    selectedApplicationId,
    draft,
    applications,
    statusOverrides,
    clearSelectedApplication,
    loadApplicationForEdit,
  } = useProject();

  const detail: DetailView | null = (() => {
    if (!selectedApplicationId) return null;

    const sample = findSampleApp(selectedApplicationId);
    if (sample) {
      const status = statusOverrides[sample.id] || sample.status;
      return {
        ...sample,
        status,
        gallery: sample.gallery.length ? sample.gallery : [sample.image],
      };
    }

    const submitted = applications.find(
      (a) => a.applicationId === selectedApplicationId || a.id === selectedApplicationId
    );
    if (submitted) {
      const cover = submitted.coverImage?.trim() || null;
      return {
        id: submitted.applicationId,
        project: submitted.projectName,
        status: 'Submitted',
        date: new Date(submitted.submittedAt).toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        village: submitted.village,
        image: cover,
        khatedarName: submitted.khatedarName,
        surveyNo: submitted.surveyNo,
        plotNo: submitted.plotNo,
        dimensionArea: submitted.dimensionArea,
        roadType: submitted.roadType,
        landType: '—',
        taluk: '—',
        district: submitted.district,
        state: submitted.state,
        coords: 'Captured on device',
        directions: { N: '—', S: '—', E: '—', W: '—' },
        photoCount: submitted.photoCount,
        hasVideo: submitted.hasVideo,
        approachRoadWidth: '—',
        approachRoadName: '—',
        approachNotes: 'Submitted from field capture on this device.',
        nearbyBuildings: '—',
        nearbyRoads: '—',
        landmarks: '—',
        gallery: cover ? [cover] : [],
      };
    }

    if (draft.id === selectedApplicationId || draft.applicationId === selectedApplicationId) {
      const cover =
        draft.photos[0]?.uri ||
        draft.surroundingPhotos.N?.uri ||
        draft.surroundingPhotos.S?.uri ||
        draft.surroundingPhotos.E?.uri ||
        draft.surroundingPhotos.W?.uri ||
        null;
      const gallery = [
        ...draft.photos.map((p) => p.uri),
        ...Object.values(draft.surroundingPhotos)
          .filter(Boolean)
          .map((p) => p!.uri),
      ];
      return {
        id: draft.applicationId || draft.id,
        project: draft.projectName.trim() || 'Untitled draft',
        status: draft.status === 'submitted' ? 'Submitted' : 'Draft',
        date: new Date(draft.updatedAt).toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        village: draft.village.trim() || '—',
        image: cover,
        khatedarName: draft.khatedarName.trim() || '—',
        surveyNo: draft.surveyNo.trim() || '—',
        plotNo: draft.plotNo.trim() || '—',
        dimensionArea: draft.dimensionArea.trim() || '—',
        roadType: draft.roadType.trim() || '—',
        landType: draft.landType.trim() || '—',
        taluk: draft.taluk.trim() || '—',
        district: draft.district.trim() || '—',
        state: draft.state.trim() || 'Karnataka',
        coords: draft.gps
          ? `${draft.gps.latitude.toFixed(4)}, ${draft.gps.longitude.toFixed(4)}`
          : 'GPS pending',
        directions: draft.directions,
        photoCount: draft.photos.length,
        hasVideo: Boolean(draft.video),
        approachRoadWidth: draft.approachRoadWidth.trim() || '—',
        approachRoadName: draft.approachRoadName.trim() || '—',
        approachNotes: draft.approachNotes.trim() || 'No approach notes yet',
        nearbyBuildings: draft.nearbyBuildings.trim() || '—',
        nearbyRoads: draft.nearbyRoads.trim() || '—',
        landmarks: draft.landmarks.trim() || '—',
        gallery,
        liveDraft: draft.status === 'draft',
      };
    }

    return null;
  })();

  const back = () => {
    clearSelectedApplication();
    go('history');
  };

  if (!detail) {
    return (
      <ScreenShell className="bg-[#F3F4F6]">
        <AppHeader title="Application" subtitle="Not found" onBack={back} go={go} />
        <VStack className="flex-1 items-center justify-center px-8">
          <Text className="font-bold text-foreground">Application not found</Text>
          <Box className="mt-4 w-full">
            <AppBtn onPress={back}>Back to Applications</AppBtn>
          </Box>
        </VStack>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="bg-[#F3F4F6]">
      <AppHeader title="Project details" subtitle={detail.id} onBack={back} go={go} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Box
          className="mx-4 mt-4 overflow-hidden items-center justify-center"
          style={{ borderRadius: 24, height: 200, backgroundColor: '#E2E8F0' }}
        >
          {detail.image ? (
            <Image
              source={{ uri: detail.image }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Camera size={36} color="#94A3B8" strokeWidth={2} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.75)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16 }}
          >
            <HStack className="items-end justify-between gap-3">
              <VStack className="flex-1 min-w-0">
                <Text className="text-white text-[17px] font-extrabold" numberOfLines={2}>
                  {detail.project}
                </Text>
                <HStack className="items-center gap-1.5 mt-1">
                  <MapPin size={13} color="#E2E8F0" />
                  <Text className="text-[12px] text-white/85">
                    {detail.village}, {detail.district}
                  </Text>
                </HStack>
              </VStack>
              <StatusChip status={detail.status} />
            </HStack>
          </LinearGradient>
        </Box>

        <HStack className="mx-4 mt-3 items-center justify-between">
          <HStack className="items-center gap-1.5">
            <CalendarDays size={14} color="#64748B" />
            <Text className="text-[12px] font-semibold" style={{ color: '#64748B' }}>
              {detail.date}
            </Text>
          </HStack>
          <Text className="text-[12px] font-bold" style={{ color: COLORS.primary }}>
            {detail.id}
          </Text>
        </HStack>

        {detail.remarks ? (
          <Box
            className="mx-4 mt-4 p-4"
            style={{
              backgroundColor: '#FFFBEB',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: '#FCD34D',
            }}
          >
            <Text className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#B45309' }}>
              {TERMS.sections.caoRemarks}
            </Text>
            <Text className="text-[13px] mt-1.5 leading-5" style={{ color: '#78350F' }}>
              {detail.remarks}
            </Text>
            {detail.officer ? (
              <Text className="text-[11px] mt-2" style={{ color: '#A16207' }}>
                — {detail.officer}
              </Text>
            ) : null}
          </Box>
        ) : null}

        <VStack className="mx-4 mt-4" space="md">
          <SectionCard title={TERMS.sections.siteParticulars} icon={Building2}>
            <Box className="flex-row flex-wrap" style={{ gap: 14 }}>
              <InfoRow label={TERMS.fields.khatedarName} value={detail.khatedarName} />
              <InfoRow label={TERMS.fields.surveyNo} value={detail.surveyNo} />
              <InfoRow label={TERMS.fields.plotNo} value={detail.plotNo} />
              <InfoRow label={TERMS.fields.dimensionArea} value={detail.dimensionArea} />
              <InfoRow label={TERMS.fields.roadType} value={detail.roadType} />
              <InfoRow label={TERMS.fields.landType} value={detail.landType} />
              <InfoRow label={TERMS.fields.gpsCoordinates} value={detail.coords} />
            </Box>
          </SectionCard>

          <SectionCard title={TERMS.sections.administrativeArea} icon={MapPin} accent="#2563EB">
            <Box className="flex-row flex-wrap" style={{ gap: 14 }}>
              <InfoRow label={TERMS.fields.village} value={detail.village} />
              <InfoRow label={TERMS.fields.taluk} value={detail.taluk} />
              <InfoRow label={TERMS.fields.district} value={detail.district} />
              <InfoRow label={TERMS.fields.state} value={detail.state} />
            </Box>
          </SectionCard>

          <SectionCard title={TERMS.sections.boundaryDirections} icon={Compass} accent="#2563EB">
            <VStack space="sm">
              {(
                [
                  ['N', 'North'],
                  ['S', 'South'],
                  ['E', 'East'],
                  ['W', 'West'],
                ] as const
              ).map(([k, label]) => (
                <HStack key={k} className="items-start justify-between gap-3">
                  <Box
                    className="items-center justify-center rounded-full"
                    style={{ width: 28, height: 28, backgroundColor: '#EFF6FF' }}
                  >
                    <Text className="text-[11px] font-black" style={{ color: COLORS.primary }}>
                      {k}
                    </Text>
                  </Box>
                  <VStack className="flex-1 min-w-0">
                    <Text className="text-[11px] font-bold" style={{ color: '#94A3B8' }}>
                      {label}
                    </Text>
                    <Text className="text-[13px] font-semibold" style={{ color: '#0F172A' }}>
                      {detail.directions[k] || '—'}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
            {detail.approachNotes || detail.approachRoadWidth || detail.approachRoadName ? (
              <Box className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: '#EFF6FF' }}>
                <Text className="text-[11px] font-bold mb-2" style={{ color: '#94A3B8' }}>
                  {TERMS.sections.approachDetails}
                </Text>
                <Box className="flex-row flex-wrap" style={{ gap: 14 }}>
                  <InfoRow label={TERMS.fields.approachRoadWidth} value={detail.approachRoadWidth} />
                  <InfoRow label={TERMS.fields.approachRoadName} value={detail.approachRoadName} />
                </Box>
                {detail.approachNotes ? (
                  <Text className="text-[13px] font-medium mt-2" style={{ color: '#334155' }}>
                    {detail.approachNotes}
                  </Text>
                ) : null}
              </Box>
            ) : null}
          </SectionCard>

          <SectionCard title={TERMS.sections.surroundings} icon={Navigation} accent="#0891B2">
            <VStack space="sm">
              <InfoRow label={TERMS.fields.nearbyBuildings} value={detail.nearbyBuildings} />
              <InfoRow label={TERMS.fields.nearbyRoads} value={detail.nearbyRoads} />
              <InfoRow label={TERMS.fields.landmarks} value={detail.landmarks} />
            </VStack>
          </SectionCard>

          <SectionCard title={TERMS.sections.media} icon={Camera} accent="#2563EB">
            <HStack className="mb-3" style={{ gap: 10 }}>
              <Box
                className="flex-1 items-center py-3 rounded-2xl"
                style={{ backgroundColor: '#FDF2F8' }}
              >
                <Camera size={18} color="#2563EB" />
                <Text className="text-[18px] font-black mt-1" style={{ color: '#2563EB' }}>
                  {detail.photoCount}
                </Text>
                <Text className="text-[11px] font-semibold" style={{ color: '#9D174D' }}>
                  Photos
                </Text>
              </Box>
              <Box
                className="flex-1 items-center py-3 rounded-2xl"
                style={{ backgroundColor: '#EFF6FF' }}
              >
                <Film size={18} color="#2563EB" />
                <Text className="text-[18px] font-black mt-1" style={{ color: '#2563EB' }}>
                  {detail.hasVideo ? 1 : 0}
                </Text>
                <Text className="text-[11px] font-semibold" style={{ color: '#6D28D9' }}>
                  Video
                </Text>
              </Box>
            </HStack>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HStack style={{ gap: 8 }}>
                {detail.gallery.length === 0 ? (
                  <Box
                    className="items-center justify-center"
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 14,
                      backgroundColor: '#E2E8F0',
                    }}
                  >
                    <Camera size={22} color="#94A3B8" />
                  </Box>
                ) : (
                  detail.gallery.map((uri, i) => (
                    <Box
                      key={`${uri}-${i}`}
                      className="overflow-hidden"
                      style={{ width: 88, height: 88, borderRadius: 14 }}
                    >
                      <Image source={{ uri }} style={{ width: 88, height: 88 }} resizeMode="cover" />
                    </Box>
                  ))
                )}
              </HStack>
            </ScrollView>
          </SectionCard>
        </VStack>

        <VStack className="mx-4 mt-4" space="sm">
          {detail.liveDraft || detail.status === 'Draft' ? (
            <AppBtn
              onPress={() => {
                if (detail.liveDraft) {
                  clearSelectedApplication();
                  go('project');
                  return;
                }
                const ok = loadApplicationForEdit(detail.id);
                if (ok) go('project');
              }}
              icon={Edit3}
            >
              Continue editing
            </AppBtn>
          ) : null}
          {detail.status === 'Returned' || detail.status === 'Rejected' ? (
            <AppBtn
              onPress={() => {
                const ok = loadApplicationForEdit(detail.id);
                if (ok) go('project');
              }}
              icon={Edit3}
            >
              Fix & resubmit
            </AppBtn>
          ) : null}
          {detail.status === 'Submitted' || detail.status === 'Verified' ? (
            <AppBtn variant="outline" onPress={back} icon={CheckCircle2}>
              Back to list
            </AppBtn>
          ) : (
            <Pressable onPress={back} className="py-3 items-center">
              <Text className="text-sm font-semibold" style={{ color: '#64748B' }}>
                Back to Applications
              </Text>
            </Pressable>
          )}
        </VStack>
      </ScrollView>
    </ScreenShell>
  );
}
