import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  Edit3,
  Film,
  Image as ImageIcon,
  Info,
  Lock,
  MapPin,
  Navigation,
  Plus,
  Route,
  Ruler,
  Save,
  Send,
  ShieldCheck,
  Sprout,
  Trash2,
  TreePine,
  Upload,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Image } from 'react-native';

import { Box } from '@/components/ui/box';
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from '@/components/ui/checkbox';
import { CheckIcon } from '@/components/ui/icon';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { VStack } from '@/components/ui/vstack';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { AppBtn, AppSheet, Field } from '@/src/cdrms/components/primitives';
import {
  SectionTitle,
  SurveyCard,
  SurveyScaffold,
  WorkspaceHeader,
} from '@/src/cdrms/components/SurveyLayout';
import { cardinalFromHeading, useCompass } from '@/src/cdrms/hooks/useCompass';
import {
  capturePhoto,
  captureSelfie,
  captureVideo,
  chooseVideoFile,
  pickPhoto,
} from '@/src/cdrms/hooks/useMediaCapture';
import { isLiveVideoBlocked } from '@/src/cdrms/device/isVirtualDevice';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import {
  DIRECTION_META,
  formatCoords,
  type Cardinal,
} from '@/src/cdrms/project/types';
import { COLORS } from '@/src/cdrms/theme';
import { TERMS } from '@/src/cdrms/terminology';
import type { Go } from '@/src/cdrms/types';

export { ProjectScreen } from '@/src/cdrms/screens/ProjectScreen';

const DIR_ICONS = {
  N: Building2,
  S: Route,
  E: Sprout,
  W: TreePine,
} as const;

const CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];

export function BandiScreen({ go }: { go: Go }) {
  const {
    draft,
    setBandiVerified,
    setBandiRemarks,
    setDirection,
    setApproachNotes,
    setCompassReading,
    updateField,
    saveDraft,
  } = useProject();
  const compass = useCompass(true);
  const [editing, setEditing] = useState<Cardinal | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [approachOpen, setApproachOpen] = useState(false);

  const coords = draft.gps
    ? formatCoords(draft.gps.latitude, draft.gps.longitude)
    : null;

  const adminArea =
    [draft.taluk, draft.district, draft.state].filter(Boolean).join(' · ') || '—';

  const heading = Math.round(compass.heading);
  const face = cardinalFromHeading(compass.heading);
  const needleRotation = compass.available ? -heading : 0;

  const approachSummary =
    [draft.approachRoadWidth, draft.approachRoadName].filter(Boolean).join(' · ') ||
    draft.approachNotes ||
    'Tap to add approach / access notes';

  const openEdit = (k: Cardinal) => {
    setEditing(k);
    setDraftNote(draft.directions[k]);
  };

  const saveEdit = () => {
    if (editing) setDirection(editing, draftNote.trim());
    setEditing(null);
    setDraftNote('');
  };

  const rows: Array<{
    label: string;
    val: string;
    ok: boolean;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
  }> = [
    {
      label: TERMS.fields.assignedSurvey,
      val: `${draft.surveyNo || '—'} · ${draft.village || 'Pending GPS'}`,
      ok: Boolean(draft.surveyNo || draft.village),
      icon: ClipboardList,
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
    },
    {
      label: TERMS.fields.gpsCoordinates,
      val: coords ? `${coords.lat}, ${coords.lng}` : 'Capture on Site Particulars',
      ok: Boolean(draft.gps),
      icon: MapPin,
      iconColor: '#0F766E',
      iconBg: '#CCFBF1',
    },
    {
      label: TERMS.fields.administrativeArea,
      val: adminArea,
      ok: Boolean(draft.taluk || draft.district),
      icon: Building2,
      iconColor: '#2563EB',
      iconBg: '#DBEAFE',
    },
  ];

  const badge = compass.available
    ? `Live ${heading}°`
    : draft.gps
      ? 'KA GPS Active'
      : 'Compass…';

  return (
    <SurveyScaffold
      title={TERMS.workflow.checkBandi}
      subtitle={TERMS.workflow.checkBandiSubtitle}
      onBack={() => go('project')}
      step={2}
      badge={badge}
      watermark="compass"
      footer={
        <HStack space="md" className="items-center">
          <Pressable
            onPress={() => {
              saveDraft();
              go('draft');
            }}
            className="h-14 w-14 rounded-2xl items-center justify-center active:opacity-85"
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#DBEAFE',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Save size={20} color={COLORS.primary} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            disabled={!draft.bandiVerified}
            onPress={() => go('surroundings')}
            className={`flex-1 h-14 rounded-2xl overflow-hidden ${
              draft.bandiVerified ? 'active:opacity-90' : 'opacity-45'
            }`}
            style={{
              shadowColor: '#1D4ED8',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: draft.bandiVerified ? 0.35 : 0.1,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={['#2563EB', '#3B82F6', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingHorizontal: 16,
              }}
            >
              <Text className="text-[15px] font-extrabold text-white tracking-wide">
                {TERMS.workflow.continueToSurroundings}
              </Text>
              <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        </HStack>
      }
          go={go}
    >
      <SurveyCard>
        <WorkspaceHeader
          icon={Compass}
          title={TERMS.sections.boundaryCompass}
          subtitle={
            compass.available
              ? `Facing ${face} · magnetic heading`
              : 'Hold device flat outdoors for best reading'
          }
          stepLabel="STEP 02"
        />

        <VStack className="px-4 pb-5 items-center">
          <Box className="relative items-center justify-center my-2" style={{ width: 200, height: 200 }}>
            <Box
              className="absolute inset-0 rounded-full"
              style={{
                borderWidth: 10,
                borderColor: '#EFF6FF',
                backgroundColor: '#FAFBFF',
              }}
            />
            {Array.from({ length: 60 }).map((_, i) => {
              const deg = i * 6;
              const rad = ((deg - 90) * Math.PI) / 180;
              const major = i % 5 === 0;
              const r = 88;
              const x = 100 + r * Math.cos(rad);
              const y = 100 + r * Math.sin(rad);
              return (
                <Box
                  key={i}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: x - (major ? 1 : 0.5),
                    top: y - (major ? 5 : 3),
                    width: major ? 2 : 1,
                    height: major ? 10 : 6,
                    backgroundColor: major ? '#3B82F6' : '#BFDBFE',
                    borderRadius: 999,
                    transform: [{ rotate: `${deg}deg` }],
                  }}
                />
              );
            })}

            <Box
              className="absolute rounded-full"
              style={{
                top: 24,
                right: 24,
                bottom: 24,
                left: 24,
                borderWidth: 1.5,
                borderColor: '#BFDBFE',
              }}
            />

            <Text className="absolute font-black text-[14px]" style={{ top: 12, color: '#2563EB' }}>
              N
            </Text>
            <Text className="absolute font-bold text-[12px]" style={{ bottom: 12, color: '#64748B' }}>
              S
            </Text>
            <Text className="absolute font-bold text-[12px]" style={{ left: 14, color: '#64748B' }}>
              W
            </Text>
            <Text className="absolute font-bold text-[12px]" style={{ right: 14, color: '#64748B' }}>
              E
            </Text>

            <Box
              style={{
                height: 68,
                width: 68,
                borderRadius: 34,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: `${needleRotation}deg` }],
                zIndex: 2,
              }}
            >
              <LinearGradient
                colors={['#2563EB', '#3B82F6']}
                style={{
                  height: 68,
                  width: 68,
                  borderRadius: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#2563EB',
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 6,
                }}
              >
                <Navigation size={30} color="#fff" strokeWidth={2.2} style={{ transform: [{ rotate: '45deg' }] }} />
              </LinearGradient>
            </Box>
          </Box>

          <Box
            className="px-4 py-2 rounded-full mt-1"
            style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' }}
          >
            <Text className="text-[12px] font-bold" style={{ color: '#1D4ED8' }}>
              Bearing{' '}
              <Text style={{ color: '#1E3A8A' }}>{compass.available ? `${heading}°` : '—'}</Text>
              {' · '}
              {compass.available ? `facing ${face}` : 'waiting for sensor'}
            </Text>
          </Box>
        </VStack>
      </SurveyCard>

      <SurveyCard>
        <VStack className="px-[18px] py-5" space="sm">
          <SectionTitle
            title={TERMS.sections.siteMatchDetails}
            subtitle="Matched from site particulars and live GPS"
            accent="#0F766E"
          />
          {rows.map((r, i) => {
            const Icon = r.icon;
            return (
              <HStack
                key={r.label}
                className={`items-center gap-3 ${
                  i > 0 ? 'pt-3.5 mt-0.5 border-t border-border' : 'pt-1'
                }`}
              >
                <Box
                  className="items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: r.iconBg,
                  }}
                >
                  <Icon size={18} color={r.iconColor} strokeWidth={2.3} />
                </Box>
                <VStack className="flex-1 min-w-0">
                  <Text
                    className="text-[10px] uppercase font-extrabold tracking-wider"
                    style={{ color: '#94A3B8' }}
                  >
                    {r.label}
                  </Text>
                  <Text
                    className="font-bold text-[13px] text-foreground mt-0.5"
                    numberOfLines={2}
                  >
                    {r.val}
                  </Text>
                </VStack>
                {r.ok ? (
                  <Box
                    className="h-9 w-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#D1FAE5' }}
                  >
                    <CheckCircle2 size={18} color="#059669" strokeWidth={2.2} />
                  </Box>
                ) : (
                  <Box className="h-9 w-9" />
                )}
              </HStack>
            );
          })}
        </VStack>
      </SurveyCard>

      <Box className="mx-4 flex-row flex-wrap justify-between" style={{ gap: 12 }}>
        {CARDINALS.map((k) => {
          const meta = DIRECTION_META[k];
          const TypeIcon = DIR_ICONS[k];
          const val = draft.directions[k];
          return (
            <Pressable
              key={k}
              onPress={() => openEdit(k)}
              className="active:opacity-90"
              style={{
                width: '48%',
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                padding: 14,
                shadowColor: '#1E3A8A',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.08,
                shadowRadius: 14,
                elevation: 3,
              }}
            >
              <HStack className="items-start justify-between">
                <VStack className="flex-1 min-w-0 pr-2">
                  <Box
                    className="items-center justify-center rounded-full"
                    style={{ width: 36, height: 36, backgroundColor: meta.color }}
                  >
                    <Text className="font-black text-white text-[13px]">{k}</Text>
                  </Box>
                  <Text
                    className="mt-2.5 text-[11px] uppercase font-extrabold tracking-wider"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </Text>
                  <Text className="text-[13px] font-bold mt-1" style={{ color: val ? '#0F172A' : '#94A3B8' }}>
                    {val || 'Tap to write note'}
                  </Text>
                </VStack>

                <VStack className="items-center justify-between" style={{ minHeight: 88 }}>
                  <Box
                    className="items-center justify-center rounded-full"
                    style={{ width: 30, height: 30, backgroundColor: '#EFF6FF' }}
                  >
                    <Edit3 size={13} color="#2563EB" strokeWidth={2.2} />
                  </Box>
                  <Box
                    className="items-center justify-center rounded-full"
                    style={{ width: 34, height: 34, backgroundColor: meta.soft }}
                  >
                    <TypeIcon size={16} color={meta.typeColor} strokeWidth={2.2} />
                  </Box>
                </VStack>
              </HStack>
            </Pressable>
          );
        })}
      </Box>

      <Pressable
        onPress={() => setApproachOpen(true)}
        className="mx-4 active:opacity-90"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          paddingVertical: 14,
          paddingHorizontal: 14,
          shadowColor: '#1E3A8A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        <HStack className="items-center gap-3">
          <Box
            style={{
              width: 4,
              alignSelf: 'stretch',
              borderRadius: 999,
              backgroundColor: '#2563EB',
            }}
          />
          <Box
            className="items-center justify-center rounded-full"
            style={{ width: 32, height: 32, backgroundColor: '#EFF6FF' }}
          >
            <Info size={16} color="#2563EB" strokeWidth={2.4} />
          </Box>
          <VStack className="flex-1 min-w-0">
            <Text className="text-[14px] font-bold" style={{ color: '#0F172A' }}>
              {TERMS.sections.approachDetails}
            </Text>
            <Text className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }} numberOfLines={1}>
              {approachSummary}
            </Text>
          </VStack>
          <ChevronRight size={18} color="#94A3B8" />
        </HStack>
      </Pressable>

      <SurveyCard>
        <VStack className="px-[18px] py-5" space="xs">
          <SectionTitle
            title={TERMS.workflow.checkBandi}
            subtitle={TERMS.workflow.checkBandiRemarksSubtitle}
            accent="#2563EB"
          />
          <Textarea
            className="min-h-[110px] rounded-[16px] border-0 mt-1"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <TextareaInput
              value={draft.bandiRemarks}
              onChangeText={setBandiRemarks}
              placeholder={TERMS.workflow.checkBandiPlaceholder}
              multiline
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#1E293B',
                minHeight: 96,
              }}
            />
          </Textarea>
        </VStack>
      </SurveyCard>

      <Box
        className="mx-4"
        style={{
          borderRadius: 22,
          backgroundColor: '#ECFDF5',
          borderWidth: 1.5,
          borderColor: '#A7F3D0',
          paddingHorizontal: 14,
          paddingVertical: 14,
          shadowColor: '#059669',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        <HStack className="items-center gap-3">
          <Box
            className="items-center justify-center"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: '#D1FAE5',
            }}
          >
            <ShieldCheck size={20} color="#059669" strokeWidth={2.3} />
          </Box>
          <Checkbox
            value="verified"
            isChecked={draft.bandiVerified}
            onChange={(checked) => {
              setBandiVerified(checked);
              if (checked && compass.available) {
                setCompassReading(`${Math.round(compass.heading)}° ${cardinalFromHeading(compass.heading)}`);
              }
            }}
            className="flex-1 items-start gap-3"
          >
            <CheckboxIndicator
              className="mt-0.5"
              style={{
                borderRadius: 8,
                width: 22,
                height: 22,
                borderColor: draft.bandiVerified ? '#2563EB' : '#93C5FD',
                backgroundColor: draft.bandiVerified ? '#2563EB' : '#FFFFFF',
              }}
            >
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel className="text-[13px] font-semibold flex-1 leading-5 text-foreground">
              {TERMS.workflow.physicalVerification}
            </CheckboxLabel>
          </Checkbox>
        </HStack>
      </Box>

      <AppSheet
        open={editing != null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${DIRECTION_META[editing].label}` : 'Edit'}
      >
        <Textarea className="min-h-[120px] mb-4">
          <TextareaInput
            value={draftNote}
            onChangeText={setDraftNote}
            placeholder={editing ? DIRECTION_META[editing].placeholder : ''}
            multiline
          />
        </Textarea>
        <AppBtn onPress={saveEdit}>Save note</AppBtn>
      </AppSheet>

      <AppSheet open={approachOpen} onClose={() => setApproachOpen(false)} title={TERMS.sections.approachDetails}>
        <VStack space="md" className="pb-1">
          <Field
            label={TERMS.fields.approachRoadWidth}
            icon={Ruler}
            value={draft.approachRoadWidth}
            onChangeText={(t) => updateField('approachRoadWidth', t)}
            placeholder="e.g. 18 ft"
          />
          <Field
            label={TERMS.fields.approachRoadName}
            value={draft.approachRoadName}
            onChangeText={(t) => updateField('approachRoadName', t)}
            placeholder="e.g. Old Bombay Highway"
          />
          <VStack space="xs">
            <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[1.2px]">
              Additional Notes
            </Text>
            <Textarea
              className="min-h-[110px] rounded-[16px] border-0"
              style={{ backgroundColor: '#F3F4F6' }}
            >
              <TextareaInput
                value={draft.approachNotes}
                onChangeText={setApproachNotes}
                placeholder="Boundary markers, access notes, officer remarks…"
                multiline
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#1E293B',
                  minHeight: 96,
                }}
              />
            </Textarea>
          </VStack>
          <AppBtn onPress={() => setApproachOpen(false)}>Done</AppBtn>
        </VStack>
      </AppSheet>
    </SurveyScaffold>
  );
}

/** @deprecated Bounds merged into BandiScreen — kept for existing navigation links. */
export function DirectionsScreen({ go }: { go: Go }) {
  return <BandiScreen go={go} />;
}

export function SurroundingsScreen({ go }: { go: Go }) {
  const { draft, setSurroundingPhoto, updateField } = useProject();
  const [picking, setPicking] = useState<Cardinal | null>(null);

  const doneCount = CARDINALS.filter((k) => draft.surroundingPhotos[k]).length;

  const takeFor = async (k: Cardinal, mode: 'camera' | 'gallery') => {
    // Close the sheet first — iOS cannot present the picker over another Modal.
    setPicking(null);
    await new Promise((r) => setTimeout(r, 350));
    const asset = mode === 'camera' ? await capturePhoto() : await pickPhoto();
    if (asset) setSurroundingPhoto(k, asset);
  };

  return (
    <SurveyScaffold
      title={TERMS.sections.surroundings}
      subtitle={TERMS.workflow.surroundingsSubtitle}
      onBack={() => go('bandi')}
      step={3}
      badge={`${doneCount} of 4 done`}
      footer={
        <AppBtn onPress={() => go('photos')} icon={ArrowRight}>
          {TERMS.workflow.continueToPhotos}
        </AppBtn>
      }
          go={go}
    >
      <SurveyCard>
        <WorkspaceHeader
          icon={Camera}
          title={TERMS.sections.directionalPhotos}
          subtitle="North · South · East · West"
          stepLabel="STEP 03"
          iconBg="#2563EB"
        />
        <Box className="px-[18px] pb-5 flex-row flex-wrap justify-between" style={{ gap: 12 }}>
          {CARDINALS.map((k) => {
            const label = DIRECTION_META[k].label;
            const photo = draft.surroundingPhotos[k];
            return (
              <Box key={k} className="rounded-3xl overflow-hidden" style={{ width: '48%', aspectRatio: 4 / 3 }}>
                {photo ? (
                  <Box className="flex-1 relative">
                    <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <Box
                      className="absolute top-2 left-2 px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    >
                      <Text className="text-[10px] font-bold text-white">{label}</Text>
                    </Box>
                    <Pressable
                      onPress={() => setSurroundingPhoto(k, null)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      <X size={12} color="#fff" />
                    </Pressable>
                    <Box
                      className="absolute bottom-2 right-2 h-7 w-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </Box>
                  </Box>
                ) : (
                  <Pressable
                    onPress={() => setPicking(k)}
                    className="flex-1 items-center justify-center"
                    style={{
                      backgroundColor: '#EFF6FF',
                      borderWidth: 2,
                      borderColor: '#BFDBFE',
                      borderStyle: 'dashed',
                    }}
                  >
                    <Box
                      className="h-12 w-12 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: '#2563EB' }}
                    >
                      <Camera size={22} color="#fff" />
                    </Box>
                    <Text className="text-[12px] font-extrabold" style={{ color: '#2563EB' }}>
                      Capture {label}
                    </Text>
                  </Pressable>
                )}
              </Box>
            );
          })}
        </Box>
      </SurveyCard>

      <SurveyCard>
        <VStack space="md" className="px-[18px] py-5">
          <SectionTitle
            title={TERMS.sections.nearbyContext}
            subtitle="Record adjacent structures and reference points"
            accent="#2563EB"
          />
          <Field
            label={TERMS.fields.nearbyBuildings}
            icon={Building2}
            value={draft.nearbyBuildings}
            onChangeText={(t) => updateField('nearbyBuildings', t)}
            placeholder="School, health centre…"
          />
          <Field
            label={TERMS.fields.nearbyRoads}
            icon={Navigation}
            value={draft.nearbyRoads}
            onChangeText={(t) => updateField('nearbyRoads', t)}
            placeholder="Main road, service road…"
          />
          <Field
            label={TERMS.fields.landmarks}
            icon={MapPin}
            value={draft.landmarks}
            onChangeText={(t) => updateField('landmarks', t)}
            placeholder="Temple, metro pillar…"
          />

          <Box className="mt-1 p-4 rounded-2xl" style={{ backgroundColor: '#F4F6FB' }}>
            <HStack className="items-center justify-between mb-2">
              <Text className="text-xs font-extrabold text-foreground">Section progress</Text>
              <Text className="text-xs font-bold" style={{ color: '#2563EB' }}>
                {Math.round((doneCount / 4) * 100)}%
              </Text>
            </HStack>
            <Progress
              value={(doneCount / 4) * 100}
              className="h-2.5 rounded-full"
              style={{ backgroundColor: '#DBEAFE' }}
            >
              <ProgressFilledTrack style={{ backgroundColor: '#2563EB' }} />
            </Progress>
          </Box>
        </VStack>
      </SurveyCard>

      <AppSheet
        open={picking != null}
        onClose={() => setPicking(null)}
        title={picking ? `Capture ${DIRECTION_META[picking].label}` : 'Capture'}
      >
        <HStack space="md">
          <Pressable
            onPress={() => picking && takeFor(picking, 'camera')}
            className="flex-1 h-32 rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={['#2563EB', '#3B82F6']}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Camera size={28} color="#fff" />
              <Text className="font-extrabold text-sm text-white">Take Photo</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => picking && takeFor(picking, 'gallery')}
            className="flex-1 h-32 rounded-2xl items-center justify-center gap-2"
            style={{ backgroundColor: '#F4F6FB' }}
          >
            <ImageIcon size={28} color="#2563EB" />
            <Text className="font-extrabold text-sm text-foreground">From Gallery</Text>
          </Pressable>
        </HStack>
      </AppSheet>
    </SurveyScaffold>
  );
}

export function PhotosScreen({ go }: { go: Go }) {
  const { draft, addPhoto, removePhoto } = useProject();
  const [sheet, setSheet] = useState(false);

  const take = async (mode: 'camera' | 'gallery') => {
    // Close the sheet first — iOS cannot present the picker over another Modal.
    setSheet(false);
    await new Promise((r) => setTimeout(r, 350));
    // First photo is the engineer selfie.
    const asset =
      mode === 'camera'
        ? draft.photos.length === 0
          ? await captureSelfie()
          : await capturePhoto({ facing: 'back', title: 'Take site photo' })
        : await pickPhoto();
    if (asset) addPhoto(asset);
  };

  return (
    <SurveyScaffold
      title="Upload Photographs"
      subtitle={TERMS.workflow.photosSubtitle}
      onBack={() => go('surroundings')}
      step={4}
      badge={`${draft.photos.length} of 10`}
      footer={
        <AppBtn
          onPress={() => go('video')}
          icon={ArrowRight}
          disabled={draft.photos.length < 1}
        >
          {TERMS.workflow.continueToVideo}
        </AppBtn>
      }
          go={go}
    >
      <SurveyCard>
        <WorkspaceHeader
          icon={ImageIcon}
          title={TERMS.sections.sitePhotoGallery}
          subtitle="Captured on device"
          stepLabel="STEP 04"
          iconBg="#2563EB"
        />
        <Box className="px-[18px] pb-5">
          <HStack className="items-center justify-between mb-4">
            <VStack>
              <Text className="text-sm font-extrabold text-foreground">Uploaded assets</Text>
              <Text className="text-xs text-muted-foreground">
                {draft.photos.length} photo{draft.photos.length === 1 ? '' : 's'} ready
              </Text>
            </VStack>
            <Pressable
              onPress={() => setSheet(true)}
              disabled={draft.photos.length >= 10}
              className="h-11 px-4 rounded-2xl flex-row items-center gap-1.5"
              style={{
                backgroundColor: '#2563EB',
                opacity: draft.photos.length >= 10 ? 0.5 : 1,
                shadowColor: '#2563EB',
                shadowOpacity: 0.35,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <Plus size={16} color="#fff" strokeWidth={2.5} />
              <Text className="text-xs font-extrabold text-white">Add</Text>
            </Pressable>
          </HStack>

          <Box className="flex-row flex-wrap" style={{ gap: 10 }}>
            {draft.photos.map((p, i) => (
              <Box key={p.id} className="rounded-2xl overflow-hidden" style={{ width: '31%', aspectRatio: 1 }}>
                <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <Pressable
                  onPress={() => removePhoto(p.id)}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                >
                  <X size={12} color="#fff" />
                </Pressable>
                <Box
                  className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                >
                  <Text className="text-[9px] text-white font-bold">IMG_{String(i + 1).padStart(2, '0')}</Text>
                </Box>
              </Box>
            ))}
            {draft.photos.length < 10 ? (
              <Pressable
                onPress={() => setSheet(true)}
                className="rounded-2xl items-center justify-center"
                style={{
                  width: '31%',
                  aspectRatio: 1,
                  borderWidth: 2,
                  borderColor: '#93C5FD',
                  borderStyle: 'dashed',
                  backgroundColor: '#EFF6FF',
                }}
              >
                <Plus size={28} color="#2563EB" />
              </Pressable>
            ) : null}
          </Box>
        </Box>
      </SurveyCard>

      {draft.photos.length > 0 ? (
        <SurveyCard>
          <HStack className="items-center gap-3 px-[18px] py-5">
            <Box
              className="h-12 w-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: '#059669' }}
            >
              <Upload size={22} color="#fff" />
            </Box>
            <VStack className="flex-1">
              <Text className="text-sm font-extrabold text-foreground">Ready on device</Text>
              <Text className="text-[11px] text-muted-foreground mt-1 font-medium">
                {draft.photos.length} photo{draft.photos.length === 1 ? '' : 's'} stored locally
              </Text>
            </VStack>
          </HStack>
        </SurveyCard>
      ) : null}

      <AppSheet open={sheet} onClose={() => setSheet(false)} title="Add Photos">
        <HStack space="md">
          <Pressable onPress={() => take('camera')} className="flex-1 h-32 rounded-2xl overflow-hidden">
            <LinearGradient
              colors={['#2563EB', '#3B82F6']}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Camera size={28} color="#fff" />
              <Text className="font-extrabold text-sm text-white">
                {draft.photos.length === 0 ? 'Take Selfie' : 'Take Photo'}
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => take('gallery')}
            className="flex-1 h-32 rounded-2xl items-center justify-center gap-2"
            style={{ backgroundColor: '#F4F6FB' }}
          >
            <ImageIcon size={28} color="#2563EB" />
            <Text className="font-extrabold text-sm text-foreground">From Gallery</Text>
          </Pressable>
        </HStack>
        <Text className="mt-4 text-[11px] text-muted-foreground text-center">
          {draft.photos.length === 0
            ? 'Selfie uses front camera. On Simulator: I/O → Camera → MacBook camera first.'
            : 'Photos stay on this device until you submit the application.'}
        </Text>
      </AppSheet>
    </SurveyScaffold>
  );
}

function formatDuration(ms?: number | null) {
  if (ms == null || ms <= 0) return 'Video';
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function VideoScreen({ go }: { go: Go }) {
  const { draft, setVideo, saveDraft } = useProject();
  const [busy, setBusy] = useState<'record' | 'choose' | null>(null);
  const videoPickOnly = isLiveVideoBlocked();

  const record = async () => {
    if (busy) return;
    setBusy('record');
    try {
      const asset = await captureVideo();
      if (asset) setVideo(asset);
    } finally {
      setBusy(null);
    }
  };

  const choose = async () => {
    if (busy) return;
    setBusy('choose');
    try {
      const asset = await chooseVideoFile();
      if (asset) setVideo(asset);
    } finally {
      setBusy(null);
    }
  };

  const recordedLabel = draft.video
    ? new Date(draft.video.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <SurveyScaffold
      title="Upload Inspection Video"
      subtitle={TERMS.workflow.videoSubtitle}
      onBack={() => go('photos')}
      step={5}
      badge="Final step"
      footer={
        <VStack space="sm">
          <HStack space="md" className="items-center">
            <Pressable
              onPress={() => {
                saveDraft();
                go('draft');
              }}
              className="h-14 w-14 rounded-2xl items-center justify-center active:opacity-85"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: '#DBEAFE',
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <Save size={20} color={COLORS.primary} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              onPress={() => go('validate')}
              className="flex-1 h-14 rounded-2xl overflow-hidden active:opacity-90"
              style={{
                shadowColor: '#1D4ED8',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 6,
              }}
            >
              <LinearGradient
                colors={['#2563EB', '#3B82F6', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 18,
                  gap: 10,
                }}
              >
                <Send size={17} color="#fff" strokeWidth={2.4} />
                <Text className="flex-1 text-[15px] font-extrabold text-white tracking-wide text-center">
                  {TERMS.workflow.validateApplication}
                </Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            </Pressable>
          </HStack>
          <HStack className="items-center justify-center gap-1.5 pt-0.5">
            <Lock size={11} color="#94A3B8" strokeWidth={2.2} />
            <Text className="text-[10px] font-medium" style={{ color: '#94A3B8' }}>
              Your data is secure and encrypted
            </Text>
          </HStack>
        </VStack>
      }
          go={go}
    >
      <SurveyCard>
        <WorkspaceHeader
          icon={Camera}
          title={TERMS.sections.walkthroughVideo}
          subtitle="HD recording · on device"
          stepLabel="STEP 05"
          iconBg="#2563EB"
        />
        <Box className="px-[18px] pb-5">
          <Box
            className="rounded-3xl overflow-hidden"
            style={{
              aspectRatio: 16 / 9,
              backgroundColor: '#0F172A',
              shadowColor: '#1E3A8A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 14,
              elevation: 4,
            }}
          >
            {draft.video ? (
              <SiteVideoPlayer
                key={draft.video.uri}
                uri={draft.video.uri}
                durationLabel={formatDuration(draft.video.durationMs)}
              />
            ) : (
              <LinearGradient
                colors={['#1E40AF', '#2563EB', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                <Box
                  className="items-center justify-center rounded-full"
                  style={{
                    height: 64,
                    width: 64,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.4)',
                  }}
                >
                  <Video size={26} color="#fff" strokeWidth={2.2} />
                </Box>
                <Text className="text-white font-extrabold text-sm">No video yet</Text>
                <Text className="text-white/70 text-xs font-medium">
                  Record or choose a file below
                </Text>
              </LinearGradient>
            )}
          </Box>

          {draft.video ? (
            <HStack className="mt-4 items-center gap-3">
              <Box
                className="items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#EFF6FF',
                }}
              >
                <MapPin size={18} color={COLORS.primary} strokeWidth={2.3} />
              </Box>
              <VStack className="flex-1 min-w-0">
                <Text className="text-sm font-extrabold text-foreground" numberOfLines={1}>
                  Site Walk-through
                </Text>
                <Text className="text-[11px] text-muted-foreground mt-0.5" numberOfLines={1}>
                  Recorded {recordedLabel}
                </Text>
              </VStack>
              <Pressable
                onPress={() => setVideo(null)}
                className="h-10 w-10 rounded-full items-center justify-center active:opacity-80"
                style={{ backgroundColor: '#FEE2E2' }}
              >
                <Trash2 size={16} color="#DC2626" strokeWidth={2.2} />
              </Pressable>
            </HStack>
          ) : null}
        </Box>
      </SurveyCard>

      <HStack className="mx-4" space="md">
        <Pressable
          onPress={record}
          disabled={busy !== null}
          className="flex-1 h-[68px] rounded-2xl overflow-hidden active:opacity-90"
          style={{
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.28,
            shadowRadius: 14,
            elevation: 5,
            opacity: busy === 'choose' ? 0.55 : 1,
          }}
        >
          <LinearGradient
            colors={['#2563EB', '#3B82F6', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              gap: 10,
            }}
          >
            <Box
              className="items-center justify-center"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.22)',
              }}
            >
              <Camera size={18} color="#fff" strokeWidth={2.3} />
            </Box>
            <Text className="flex-1 font-extrabold text-white text-[13px]">
              {busy === 'record'
                ? 'Opening…'
                : videoPickOnly
                  ? 'Pick Video'
                  : 'Record New'}
            </Text>
            <ChevronRight size={18} color="rgba(255,255,255,0.9)" strokeWidth={2.4} />
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={choose}
          disabled={busy !== null}
          className="flex-1 h-[68px] rounded-2xl flex-row items-center px-3.5 gap-2.5 active:opacity-90"
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1.5,
            borderColor: '#BFDBFE',
            shadowColor: '#1E293B',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <Box
            className="items-center justify-center"
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#EFF6FF',
            }}
          >
            <Film size={18} color={COLORS.primary} strokeWidth={2.3} />
          </Box>
          <Text className="flex-1 font-extrabold text-foreground text-[13px]">
            {busy === 'choose' ? 'Opening…' : 'Choose File'}
          </Text>
          <ChevronRight size={18} color={COLORS.primary} strokeWidth={2.4} />
        </Pressable>
      </HStack>

      {draft.video ? (
        <Box
          className="mx-4"
          style={{
            borderRadius: 22,
            backgroundColor: '#ECFDF5',
            borderWidth: 1.5,
            borderColor: '#6EE7B7',
            borderStyle: 'dashed',
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <HStack className="items-center gap-3">
            <Box
              className="items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#059669',
              }}
            >
              <Check size={22} color="#fff" strokeWidth={3} />
            </Box>
            <VStack className="flex-1 min-w-0">
              <Text className="text-sm font-extrabold text-foreground">Video ready</Text>
              <Text className="text-[11px] mt-0.5 font-medium" style={{ color: '#64748B' }}>
                Max size 50 MB · stored on this device
              </Text>
            </VStack>
            <Box
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#6EE7B7' }}
            >
              <Text className="text-[10px] font-extrabold" style={{ color: '#047857' }}>
                Valid
              </Text>
            </Box>
          </HStack>
        </Box>
      ) : null}
    </SurveyScaffold>
  );
}
