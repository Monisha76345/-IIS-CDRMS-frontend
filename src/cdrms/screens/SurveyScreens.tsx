import { LinearGradient } from 'expo-linear-gradient';
import {
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  Crosshair,
  Edit3,
  Film,
  Image as ImageIcon,
  Info,
  Lock,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Route,
  Ruler,
  ShieldCheck,
  Sprout,
  Trash2,
  TreePine,
  Upload,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, TextInput } from 'react-native';

import { Box } from '@/components/ui/box';
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from '@/components/ui/checkbox';
import { CheckIcon } from '@/components/ui/icon';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { VStack } from '@/components/ui/vstack';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { LiveCompassDial } from '@/src/cdrms/components/LiveCompassDial';
import { LiveGpsPanel } from '@/src/cdrms/components/LiveGpsPanel';
import { SchedulesEditorCard } from '@/src/cdrms/components/SchedulesEditorCard';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { AppBtn, AppSheet, Field } from '@/src/cdrms/components/primitives';
import {
  SectionTitle,
  SurveyCard,
  SurveyScaffold,
  WorkspaceHeader,
  FooterContinueBtn,
} from '@/src/cdrms/components/SurveyLayout';
import { parseCompassReading } from '@/src/cdrms/hooks/useCompass';
import { useLiveLocation } from '@/src/cdrms/hooks/useDeviceLocation';
import {
  capturePhoto,
  captureSelfie,
  captureVideo,
  chooseVideoFile,
  pickPhoto,
} from '@/src/cdrms/hooks/useMediaCapture';
import { isLiveVideoBlocked } from '@/src/cdrms/device/isVirtualDevice';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { alertDraftError } from '@/src/cdrms/project/draft-api';
import {
  DIRECTION_META,
  formatCoords,
  type Cardinal,
} from '@/src/cdrms/project/types';
import { COLORS, FONTS, SPACE, TYPE } from '@/src/cdrms/theme';
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
    setSurroundingPhoto,
    setApproachNotes,
    updateField,
    setGps,
    persistBackendStep,
    reloadBackendDraft,
  } = useProject();
  const isBackendTask = Boolean(draft.backendApplicationId);
  const nextAfterBandi = isBackendTask ? 'dimensions' : 'surroundings';
  const {
    gps: liveGps,
    address: liveAddress,
    loading: geoBusy,
    error: geoError,
    refresh: refreshLiveGps,
  } = useLiveLocation({ silent: true, timeInterval: 1500, distanceInterval: 2 });
  const [stepSaving, setStepSaving] = useState(false);
  const schedulePhotosReady = (['N', 'S', 'E', 'W'] as const).every(
    (k) => Boolean(draft.surroundingPhotos[k]),
  );
  const occupancyOk =
    draft.occupancy === 'Empty' ||
    (draft.occupancy === 'Occupied' && draft.occupancyReason.trim().length > 0);
  const compassOk = Boolean(draft.compassReading.trim());
  const canContinueBandi = isBackendTask
    ? schedulePhotosReady && Boolean(draft.gps) && compassOk && occupancyOk
    : draft.bandiVerified;
  const [editing, setEditing] = useState<Cardinal | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [approachOpen, setApproachOpen] = useState(false);
  const [schedulesEditing, setSchedulesEditing] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState({ N: '', S: '', E: '', W: '' });
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Photo preview');

  const mapGps = liveGps || draft.gps;
  const coords = mapGps
    ? formatCoords(mapGps.latitude, mapGps.longitude)
    : null;
  const isLiveFix = Boolean(liveGps);

  const adminArea =
    [draft.taluk, draft.district, draft.state].filter(Boolean).join(' · ') || '—';

  const compassFace = parseCompassReading(draft.compassReading)?.face ?? null;

  const approachSummary =
    [draft.approachRoadWidth, draft.approachRoadName].filter(Boolean).join(' · ') ||
    draft.approachNotes ||
    'Tap to add approach / access notes';

  const recaptureGps = async () => {
    await refreshLiveGps(false);
  };

  // Keep draft GPS in sync with continuous live device location
  useEffect(() => {
    if (!liveGps) return;
    setGps(liveGps);
  }, [liveGps, setGps]);

  const openEdit = (k: Cardinal) => {
    setEditing(k);
    setDraftNote(draft.directions[k]);
  };

  const saveEdit = () => {
    if (editing) setDirection(editing, draftNote.trim());
    setEditing(null);
    setDraftNote('');
  };

  const beginScheduleEdit = () => {
    setScheduleDraft({
      N: draft.directions.N,
      S: draft.directions.S,
      E: draft.directions.E,
      W: draft.directions.W,
    });
    setSchedulesEditing(true);
  };

  const saveScheduleEdit = () => {
    ;(['N', 'S', 'E', 'W'] as const).forEach((k) => {
      setDirection(k, scheduleDraft[k].trim());
    });
    setSchedulesEditing(false);
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
      iconColor: '#2563EB',
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

  const badge = compassFace
    ? `Facing ${compassFace}`
    : draft.gps
      ? 'KA GPS Active'
      : 'Pick direction';

  return (
    <SurveyScaffold
      title={
        isBackendTask ? 'Step 2 — Compass & schedule' : TERMS.workflow.checkBandi
      }
      subtitle={
        isBackendTask
          ? 'Compass, GPS, occupancy & schedule photos'
          : TERMS.workflow.checkBandiSubtitle
      }
      onBack={() => {
        void (async () => {
          if (isBackendTask) {
            try {
              await reloadBackendDraft();
            } catch {
              /* still navigate */
            }
          }
          go('project');
        })();
      }}
      step={2}
      total={isBackendTask ? 4 : 5}
      badge={badge}
      watermark="compass"
      footer={
        <FooterContinueBtn
          disabled={!canContinueBandi || stepSaving}
          loading={stepSaving}
          label={
            isBackendTask
              ? !draft.gps
                ? 'Capture GPS first'
                : !compassOk
                  ? 'Pick facing direction'
                  : !occupancyOk
                    ? 'Complete occupancy'
                    : !schedulePhotosReady
                      ? 'Add all 4 schedule photos'
                      : 'Continue'
              : TERMS.workflow.continueToSurroundings
          }
          onPress={() => {
            void (async () => {
              if (isBackendTask && !schedulePhotosReady) return;
              if (isBackendTask) {
                if (!draft.bandiVerified) setBandiVerified(true);
                setStepSaving(true);
                try {
                  await persistBackendStep('compass');
                } catch (err) {
                  alertDraftError(err);
                  setStepSaving(false);
                  return;
                }
                setStepSaving(false);
              }
              go(nextAfterBandi);
            })();
          }}
        />
      }
          go={go}
    >
      <SurveyCard>
        <WorkspaceHeader
          icon={Compass}
          title={isBackendTask ? 'Facing direction *' : TERMS.sections.boundaryCompass}
          subtitle={
            compassFace
              ? `Live ${draft.compassReading} · turn phone to update`
              : 'Hold phone flat — live sensor on real device'
          }
          stepLabel="STEP 02"
          iconBg={COLORS.primary}
        />

        <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], alignItems: 'center' }}>
          <LiveCompassDial />
        </VStack>
      </SurveyCard>

      {isBackendTask ? (
        <>
          {/* ── Card 1: Live GPS & Coordinates ── */}
          <SurveyCard>
            <WorkspaceHeader
              icon={MapPin}
              title="Live GPS & coordinates"
              subtitle={
                isLiveFix
                  ? 'Live GPS locked · location & coordinates captured'
                  : 'Device location required'
              }
              stepLabel="STEP 02"
              iconBg={COLORS.primary}
            />
            <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] }}>
              <LiveGpsPanel
                gps={mapGps}
                address={liveAddress}
                loading={geoBusy}
                error={geoError}
                onRefresh={() => void recaptureGps()}
                syNo={draft.surveyNo || draft.siteNo || undefined}
                title={null}
                hideTitleHeader
              />

              {/* Coordinates Section inside same card */}
              <Box
                style={{
                  borderRadius: 12,
                  backgroundColor: COLORS.white,
                  paddingHorizontal: 12,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <HStack className="items-center" style={{ gap: SPACE[2] }}>
                  <Box
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: COLORS.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#0F172A',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <Crosshair size={18} color={COLORS.primary} strokeWidth={2.4} />
                  </Box>

                  <VStack className="flex-1 min-w-0" style={{ gap: 6 }}>
                    <HStack className="items-center" style={{ gap: SPACE[2] }}>
                      <Box
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: mapGps ? COLORS.success : COLORS.warning,
                        }}
                      />
                      <Text
                        style={{
                          ...TYPE.caption,
                          fontFamily: FONTS.bold,
                          color: COLORS.ink,
                        }}
                      >
                        {mapGps
                          ? 'LIVE COORDINATES'
                          : geoBusy
                            ? 'Finding location…'
                            : 'Waiting for location'}
                      </Text>
                      {mapGps ? (
                        <Text style={{ ...TYPE.caption, fontFamily: FONTS.semibold, color: COLORS.ink }}>
                          {`±${Math.round(mapGps.accuracy ?? 6)} m`}
                        </Text>
                      ) : null}
                    </HStack>

                    <HStack className="items-center justify-between">
                      <Text style={{ ...TYPE.caption, color: '#64748B' }}>Latitude</Text>
                      <Text style={{ ...TYPE.bodyStrong, fontSize: 13, color: COLORS.ink }}>
                        {mapGps ? mapGps.latitude.toFixed(6) : '—'}
                      </Text>
                    </HStack>

                    <Box style={{ height: 1, backgroundColor: COLORS.border }} />

                    <HStack className="items-center justify-between">
                      <Text style={{ ...TYPE.caption, color: '#64748B' }}>Longitude</Text>
                      <Text style={{ ...TYPE.bodyStrong, fontSize: 13, color: COLORS.ink }}>
                        {mapGps ? mapGps.longitude.toFixed(6) : '—'}
                      </Text>
                    </HStack>
                  </VStack>

                  <Pressable
                    onPress={() => void recaptureGps()}
                    accessibilityLabel="Refresh live coordinates"
                    className="active:opacity-80"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: COLORS.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#0F172A',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 2,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    {geoBusy ? (
                      <ActivityIndicator size="small" color={COLORS.ink} />
                    ) : (
                      <RefreshCw size={15} color={COLORS.ink} strokeWidth={2.4} />
                    )}
                  </Pressable>
                </HStack>
              </Box>
            </VStack>
          </SurveyCard>

          {/* ── Card 2: Occupancy ── */}
          <SurveyCard>
            <WorkspaceHeader
              icon={Building2}
              title="Occupancy"
              subtitle="Select the current occupancy status of the site"
              stepLabel="STEP 02"
              iconBg={COLORS.primary}
            />
            <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] }}>
              <Box
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  padding: SPACE[4],
                  gap: SPACE[3],
                }}
              >
                <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={{ ...TYPE.label, color: COLORS.ink }}>Occupancy</Text>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#DC2626', lineHeight: 16 }}>*</Text>
                </Box>
                <HStack style={{ gap: SPACE[4], alignItems: 'center', marginTop: SPACE[1] }}>
                  {(['Empty', 'Occupied'] as const).map((opt) => {
                    const on = draft.occupancy === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => updateField('occupancy', opt)}
                        className="active:opacity-80"
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Box
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: on ? COLORS.primary : '#94A3B8',
                            backgroundColor: COLORS.white,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {on ? (
                            <Box
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: COLORS.primary,
                              }}
                            />
                          ) : null}
                        </Box>
                        <Text
                          style={{
                            fontFamily: FONTS.semibold,
                            fontSize: 14,
                            color: on ? COLORS.primary : COLORS.ink,
                          }}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
              </Box>
              {draft.occupancy === 'Occupied' ? (
                <Field
                  compact
                  label="Occupied reason *"
                  value={draft.occupancyReason}
                  onChangeText={(t) => updateField('occupancyReason', t)}
                  placeholder="Why is the site occupied?"
                />
              ) : null}
            </VStack>
          </SurveyCard>
        </>
      ) : (
        <SurveyCard>
          <VStack className="px-4 py-5" space="sm">
            <SectionTitle
              title={TERMS.sections.siteMatchDetails}
              subtitle="Matched from site particulars and live GPS"
              accent="#2563EB"
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
      )}

      {!isBackendTask ? (
        <SurveyCard>
          <VStack className="px-4 py-4" space="sm">
            <HStack className="items-center justify-between">
              <VStack className="flex-1 min-w-0 pr-2">
                <Text className="text-[15px] font-extrabold" style={{ color: '#0F172A' }}>
                  Schedules (site around)
                </Text>
                <Text className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
                  Prefills from ZC — tap Edit to update
                </Text>
              </VStack>
              <Pressable
                onPress={() => (schedulesEditing ? saveScheduleEdit() : beginScheduleEdit())}
                className="active:opacity-80"
                style={{
                  height: 34,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                  backgroundColor: schedulesEditing ? '#2563EB' : '#EFF6FF',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {schedulesEditing ? (
                  <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                ) : (
                  <Edit3 size={14} color="#2563EB" strokeWidth={2.5} />
                )}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: schedulesEditing ? '#FFFFFF' : '#2563EB',
                  }}
                >
                  {schedulesEditing ? 'Done' : 'Edit'}
                </Text>
              </Pressable>
            </HStack>

            {CARDINALS.map((k) => {
              const meta = DIRECTION_META[k];
              const value = schedulesEditing ? scheduleDraft[k] : draft.directions[k];
              return (
                <VStack key={`sched-${k}`} space="xs">
                  <Text
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: meta.color }}
                  >
                    Schedule {k} · {meta.label}
                  </Text>
                  {schedulesEditing ? (
                    <TextInput
                      value={value}
                      onChangeText={(t) => setScheduleDraft((d) => ({ ...d, [k]: t }))}
                      placeholder={`What is on the ${meta.label.toLowerCase()} side?`}
                      placeholderTextColor="#94A3B8"
                      style={{
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#BFDBFE',
                        backgroundColor: '#FFFFFF',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 13,
                        fontWeight: '700',
                        color: '#0F172A',
                      }}
                    />
                  ) : (
                    <Box
                      style={{
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        backgroundColor: '#F8FAFC',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: value ? '#0F172A' : '#94A3B8',
                        }}
                      >
                        {value || '—'}
                      </Text>
                    </Box>
                  )}
                </VStack>
              );
            })}
          </VStack>
        </SurveyCard>
      ) : null}

      {isBackendTask ? (
        <SchedulesEditorCard
          title="Schedules (site around)"
          subtitle="4 sides · Road checkbox · engineer note · upload image"
        />
      ) : (
        <>
          <Box className="mx-4 mb-1">
            <Text className="text-[15px] font-extrabold" style={{ color: '#0F172A' }}>
              Schedule photos <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>*</Text>
            </Text>
            <Text className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
              All four sides (N / S / E / W) are mandatory
            </Text>
          </Box>
          <Box className="mx-4 flex-row flex-wrap justify-between" style={{ gap: 12 }}>
            {CARDINALS.map((k) => {
              const meta = DIRECTION_META[k];
              const TypeIcon = DIR_ICONS[k];
              const val = draft.directions[k];
              const photo = draft.surroundingPhotos[k];
              return (
                <Pressable
                  key={k}
                  onPress={() => {
                    if (photo) {
                      setPreviewTitle(`${meta.label} photo`);
                      setPreviewUri(photo.uri);
                      return;
                    }
                    openEdit(k);
                  }}
                  onLongPress={() => openEdit(k)}
                  className="active:opacity-90 overflow-hidden"
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
                  {photo ? (
                    <VStack space="xs">
                      <HStack className="items-center justify-between mb-1.5">
                        <Box
                          className="items-center justify-center rounded-full"
                          style={{ width: 28, height: 28, backgroundColor: meta.color }}
                        >
                          <Text className="font-black text-white text-[11px]">{k}</Text>
                        </Box>
                        <Box
                          className="h-6 w-6 rounded-full items-center justify-center"
                          style={{ backgroundColor: '#10B981' }}
                        >
                          <Check size={12} color="#fff" strokeWidth={3} />
                        </Box>
                      </HStack>
                      <Box className="relative" style={{ height: 80, borderRadius: 12, overflow: 'hidden' }}>
                        <ApiMediaImage uri={photo.uri} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        <Box
                          className="absolute bottom-1 left-1 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                        >
                          <Text className="text-[9px] font-bold text-white">{meta.label} Photo</Text>
                        </Box>
                      </Box>
                    </VStack>
                  ) : (
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
                        <Text
                          className="text-[12px] font-bold mt-1"
                          style={{ color: val ? '#0F172A' : '#2563EB' }}
                        >
                          {val || 'Tap to upload photo'}
                        </Text>
                      </VStack>

                      <VStack className="items-center justify-between" style={{ minHeight: 88 }}>
                        <Box
                          className="items-center justify-center rounded-full"
                          style={{ width: 30, height: 30, backgroundColor: '#EFF6FF' }}
                        >
                          <Camera size={14} color="#2563EB" strokeWidth={2.2} />
                        </Box>
                        <Box
                          className="items-center justify-center rounded-full"
                          style={{ width: 34, height: 34, backgroundColor: meta.soft }}
                        >
                          <TypeIcon size={16} color={meta.typeColor} strokeWidth={2.2} />
                        </Box>
                      </VStack>
                    </HStack>
                  )}
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
            <VStack className="px-4 py-5" space="xs">
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
        </>
      )}

      <AppSheet
        open={editing != null}
        onClose={() => setEditing(null)}
        title={editing ? `${DIRECTION_META[editing].label} Boundary Photo & Note` : 'Boundary'}
      >
        <VStack space="md" className="pb-2">
          <Text className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Option 1: Upload Photo ({editing ? DIRECTION_META[editing].label : ''})
          </Text>
          <HStack space="md">
            <Pressable
              onPress={async () => {
                if (!editing) return;
                const k = editing;
                setEditing(null);
                await new Promise((r) => setTimeout(r, 350));
                const asset = await capturePhoto({ title: `Take ${DIRECTION_META[k].label} photo` });
                if (asset) void setSurroundingPhoto(k, asset);
              }}
              className="flex-1 h-24 rounded-2xl overflow-hidden active:opacity-90"
            >
              <LinearGradient
                colors={['#2563EB', '#3B82F6']}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Camera size={24} color="#fff" />
                <Text className="font-extrabold text-xs text-white">Take Photo</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={async () => {
                if (!editing) return;
                const k = editing;
                setEditing(null);
                await new Promise((r) => setTimeout(r, 350));
                const asset = await pickPhoto();
                if (asset) void setSurroundingPhoto(k, asset);
              }}
              className="flex-1 h-24 rounded-2xl items-center justify-center gap-2 active:opacity-90"
              style={{ backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE' }}
            >
              <ImageIcon size={24} color="#2563EB" />
              <Text className="font-extrabold text-xs text-foreground">From Gallery</Text>
            </Pressable>
          </HStack>

          <Text className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mt-2">
            Option 2: Write Text Note
          </Text>
          <Textarea className="min-h-[90px] rounded-2xl border-0" style={{ backgroundColor: '#F3F4F6' }}>
            <TextareaInput
              value={draftNote}
              onChangeText={setDraftNote}
              placeholder={editing ? DIRECTION_META[editing].placeholder : 'Describe boundary...'}
              multiline
            />
          </Textarea>
          <AppBtn onPress={saveEdit}>Save Note</AppBtn>
        </VStack>
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

      <ImagePreviewModal
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />
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
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Photo preview');

  const doneCount = CARDINALS.filter((k) => draft.surroundingPhotos[k]).length;

  const takeFor = async (k: Cardinal, mode: 'camera' | 'gallery') => {
    // Close the sheet first — iOS cannot present the picker over another Modal.
    setPicking(null);
    await new Promise((r) => setTimeout(r, 350));
    const asset = mode === 'camera' ? await capturePhoto() : await pickPhoto();
    if (asset) void setSurroundingPhoto(k, asset);
  };

  return (
    <SurveyScaffold
      title={TERMS.sections.surroundings}
      subtitle={TERMS.workflow.surroundingsSubtitle}
      onBack={() => go('bandi')}
      step={3}
      badge={`${doneCount} of 4 done`}
      footer={
        <FooterContinueBtn
          label="Continue"
          onPress={() => go('photos')}
        />
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
        <Box className="px-4 pb-5 flex-row flex-wrap justify-between" style={{ gap: 12 }}>
          {CARDINALS.map((k) => {
            const label = DIRECTION_META[k].label;
            const photo = draft.surroundingPhotos[k];
            return (
              <Box key={k} className="rounded-3xl overflow-hidden" style={{ width: '48%', aspectRatio: 4 / 3 }}>
                {photo ? (
                  <Box className="flex-1 relative">
                    <Pressable
                      onPress={() => {
                        setPreviewTitle(`${label} photo`);
                        setPreviewUri(photo.uri);
                      }}
                      className="w-full h-full"
                      accessibilityLabel={`Preview ${label} photo`}
                    >
                      <ApiMediaImage
                        uri={photo.uri}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </Pressable>
                    <Box
                      className="absolute top-2 left-2 px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    >
                      <Text className="text-[10px] font-bold text-white">{label}</Text>
                    </Box>
                    <Pressable
                      onPress={() => void setSurroundingPhoto(k, null)}
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
        <VStack space="md" className="px-4 py-5">
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

      <ImagePreviewModal
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />
    </SurveyScaffold>
  );
}

export function PhotosScreen({ go }: { go: Go }) {
  const {
    draft,
    setSelfie,
    removeSelfie,
    addPhoto,
    removePhoto,
    updateField,
    persistBackendStep,
    reloadBackendDraft,
  } = useProject();
  const [sheet, setSheet] = useState(false);
  const [stepSaving, setStepSaving] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Photo preview');
  const isBackendTask = Boolean(draft.backendApplicationId);
  const maxPhotos = isBackendTask ? 4 : 10;
  const backScreen = isBackendTask ? 'dimensions' : 'surroundings';

  const takeSelfieMedia = async () => {
    try {
      const asset = await captureSelfie();
      if (asset) await setSelfie(asset);
    } catch (err) {
      alertDraftError(err);
    }
  };

  const takeSitePhoto = async (mode: 'camera' | 'gallery') => {
    // Close the sheet first — iOS cannot present the picker over another Modal.
    setSheet(false);
    await new Promise((r) => setTimeout(r, 350));
    try {
      const asset =
        mode === 'camera'
          ? await capturePhoto({ facing: 'back', title: 'Take site photo' })
          : await pickPhoto();
      if (asset) await addPhoto(asset);
    } catch (err) {
      alertDraftError(err);
    }
  };

  const totalPhotosCount = (draft.selfie ? 1 : 0) + draft.photos.length;

  return (
    <SurveyScaffold
      title={isBackendTask ? 'Step 4 — Media & submit' : 'Upload Photographs'}
      subtitle={
        isBackendTask
          ? 'Selfie mandatory · extra site photos optional · then video required'
          : TERMS.workflow.photosSubtitle
      }
      onBack={() => {
        void (async () => {
          if (isBackendTask) {
            try {
              await reloadBackendDraft();
            } catch {
              /* still navigate */
            }
          }
          go(backScreen);
        })();
      }}
      step={4}
      total={isBackendTask ? 4 : 5}
      badge={`${totalPhotosCount} uploaded`}
      footer={
        <FooterContinueBtn
          loading={stepSaving}
          disabled={
            stepSaving ||
            !draft.selfie ||
            (isBackendTask && !draft.engineerComments.trim())
          }
          label="Continue"
          onPress={() => {
            void (async () => {
              if (isBackendTask) {
                setStepSaving(true);
                try {
                  await persistBackendStep('media');
                } catch (err) {
                  alertDraftError(err);
                  setStepSaving(false);
                  return;
                }
                setStepSaving(false);
              }
              go('video');
            })();
          }}
        />
      }
      go={go}
    >
      {/* ── Card 1: Mandatory Engineer Selfie ── */}
      <SurveyCard>
        <WorkspaceHeader
          icon={Camera}
          title="Engineer selfie *"
          subtitle="Mandatory — capture live selfie of engineer on site"
          stepLabel="STEP 04"
          iconBg={COLORS.primary}
        />
        <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] }}>
          {draft.selfie ? (
            /* Selfie Already Captured */
            <Box
              style={{
                borderRadius: 14,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                padding: SPACE[3],
              }}
            >
              <HStack style={{ alignItems: 'center', gap: SPACE[3] }}>
                <Box
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: '#0F172A',
                  }}
                >
                  <Pressable
                    onPress={() => {
                      setPreviewTitle('Engineer selfie');
                      setPreviewUri(draft.selfie!.uri);
                    }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <ApiMediaImage
                      uri={draft.selfie.uri}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </Pressable>
                </Box>

                <VStack style={{ flex: 1, gap: 4 }}>
                  <HStack style={{ alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}>
                      Selfie captured
                    </Text>
                  </HStack>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: '#64748B' }}>
                    Engineer verification photo ready
                  </Text>
                  <HStack style={{ gap: SPACE[2], marginTop: 2 }}>
                    <Pressable
                      onPress={() => void takeSelfieMedia()}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: COLORS.primary,
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: '#FFFFFF' }}>
                        Retake Selfie
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void removeSelfie()}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: '#FEF2F2',
                        borderWidth: 1,
                        borderColor: '#FECACA',
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: '#DC2626' }}>
                        Delete
                      </Text>
                    </Pressable>
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          ) : (
            /* Sleek Compact Selfie Empty State */
            <Box
              style={{
                borderRadius: 14,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                padding: SPACE[3],
              }}
            >
              <HStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] }}>
                <HStack style={{ alignItems: 'center', gap: SPACE[3], flex: 1 }}>
                  <Box
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Camera size={20} color={COLORS.primary} strokeWidth={2.2} />
                  </Box>
                  <VStack style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
                      Selfie photo required *
                    </Text>
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: '#64748B' }}>
                      Take a live engineer selfie
                    </Text>
                  </VStack>
                </HStack>

                <Pressable
                  onPress={() => void takeSelfieMedia()}
                  className="active:opacity-80 flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl"
                  style={{
                    backgroundColor: COLORS.primary,
                    shadowColor: '#0F172A',
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Camera size={15} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#FFFFFF' }}>
                    Take Selfie
                  </Text>
                </Pressable>
              </HStack>
            </Box>
          )}
        </VStack>
      </SurveyCard>

      {/* ── Card 2: Site Photograph Gallery ── */}
      <SurveyCard>
        <WorkspaceHeader
          icon={ImageIcon}
          title={TERMS.sections.sitePhotoGallery}
          subtitle="Captured on device · extra site photos"
          stepLabel="STEP 04"
          iconBg={COLORS.primary}
        />
        <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] }}>
          <VStack style={{ gap: 2 }}>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}>
              Uploaded assets
            </Text>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}>
              {draft.photos.length === 0
                ? 'No extra site photos'
                : `${draft.photos.length} photo${draft.photos.length === 1 ? '' : 's'} ready (max ${maxPhotos})`}
            </Text>
          </VStack>

          <Box className="flex-row flex-wrap" style={{ gap: 10 }}>
            {draft.photos.map((p, i) => (
              <Box
                key={p.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  width: '31%',
                  aspectRatio: 1,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Pressable
                  onPress={() => {
                    setPreviewTitle(`Site Photo ${String(i + 1).padStart(2, '0')}`);
                    setPreviewUri(p.uri);
                  }}
                  className="w-full h-full"
                  accessibilityLabel={`Preview photo ${i + 1}`}
                >
                  <ApiMediaImage
                    uri={p.uri}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </Pressable>
                <Pressable
                  onPress={() => void removePhoto(p.id)}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                  accessibilityLabel={`Remove photo ${i + 1}`}
                >
                  <X size={12} color="#fff" />
                </Pressable>
                <Box
                  className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                >
                  <Text className="text-[9px] text-white font-bold">
                    IMG_{String(i + 1).padStart(2, '0')}
                  </Text>
                </Box>
              </Box>
            ))}
            {draft.photos.length < maxPhotos ? (
              <Pressable
                onPress={() => setSheet(true)}
                className="rounded-2xl items-center justify-center active:opacity-80"
                style={{
                  width: '31%',
                  aspectRatio: 1,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1.5,
                  borderColor: '#BFDBFE',
                  borderStyle: 'dashed',
                }}
              >
                <VStack style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: COLORS.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={18} color="#FFFFFF" strokeWidth={2.8} />
                  </Box>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 11,
                      color: COLORS.primary,
                    }}
                  >
                    Add Photo
                  </Text>
                </VStack>
              </Pressable>
            ) : null}
          </Box>
        </VStack>
      </SurveyCard>

      <ImagePreviewModal
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />

      {isBackendTask ? (
        <SurveyCard>
          <VStack style={{ paddingHorizontal: SPACE[4], paddingVertical: SPACE[4], gap: SPACE[2] }}>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: COLORS.ink }}>
              Engineer comments *
            </Text>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}>
              Required — same as web Step 4 before submit
            </Text>
            <Textarea>
              <TextareaInput
                value={draft.engineerComments}
                onChangeText={(t) => updateField('engineerComments', t)}
                placeholder="Enter field remarks / comments…"
              />
            </Textarea>
          </VStack>
        </SurveyCard>
      ) : null}

      {draft.photos.length > 0 ? (
        <SurveyCard>
          <HStack
            className="items-center"
            style={{
              paddingHorizontal: SPACE[4],
              paddingVertical: SPACE[4],
              gap: SPACE[3],
            }}
          >
            <Box
              className="h-12 w-12 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: COLORS.white,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Upload size={22} color={COLORS.ink} />
            </Box>
            <VStack className="flex-1" style={{ gap: 2 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}>
                Ready on device
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}>
                {draft.photos.length} photo{draft.photos.length === 1 ? '' : 's'} stored locally
              </Text>
            </VStack>
          </HStack>
        </SurveyCard>
      ) : null}

      <AppSheet open={sheet} onClose={() => setSheet(false)} title="Add Site Photo">
        <HStack space="md">
          <Pressable onPress={() => takeSitePhoto('camera')} className="flex-1 h-32 rounded-2xl overflow-hidden">
            <LinearGradient
              colors={['#2563EB', '#3B82F6']}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Camera size={28} color="#fff" />
              <Text className="font-extrabold text-sm text-white">
                Take Photo
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => takeSitePhoto('gallery')}
            className="flex-1 h-32 rounded-2xl items-center justify-center gap-2"
            style={{ backgroundColor: '#F4F6FB' }}
          >
            <ImageIcon size={28} color="#2563EB" />
            <Text className="font-extrabold text-sm text-foreground">From Gallery</Text>
          </Pressable>
        </HStack>
        <Text className="mt-4 text-[11px] text-muted-foreground text-center">
          Site photos are optional (up to 4 photos). Upload clear site views.
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
  const { draft, setVideo, persistBackendStep, reloadBackendDraft } = useProject();
  const [busy, setBusy] = useState<'record' | 'choose' | null>(null);
  const [stepSaving, setStepSaving] = useState(false);
  const videoPickOnly = isLiveVideoBlocked();
  const isBackendTask = Boolean(draft.backendApplicationId);

  const record = async () => {
    if (busy) return;
    setBusy('record');
    try {
      const asset = await captureVideo();
      if (asset) await setVideo(asset);
    } catch (err) {
      alertDraftError(err);
    } finally {
      setBusy(null);
    }
  };

  const choose = async () => {
    if (busy) return;
    setBusy('choose');
    try {
      const asset = await chooseVideoFile();
      if (asset) await setVideo(asset);
    } catch (err) {
      alertDraftError(err);
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
      title={isBackendTask ? 'Step 4 — Media & submit' : 'Upload Inspection Video'}
      subtitle={
        isBackendTask
          ? 'Site video required before validation'
          : TERMS.workflow.videoSubtitle
      }
      onBack={() => {
        void (async () => {
          if (isBackendTask) {
            try {
              await reloadBackendDraft();
            } catch {
              /* still navigate */
            }
          }
          go('photos');
        })();
      }}
      step={isBackendTask ? 4 : 5}
      total={isBackendTask ? 4 : 5}
      badge="Final step"
      footer={
        <VStack space="sm">
          <FooterContinueBtn
            loading={stepSaving}
            disabled={stepSaving || (isBackendTask && !draft.video)}
            label={TERMS.workflow.validateApplication}
            onPress={() => {
              void (async () => {
                if (isBackendTask) {
                  setStepSaving(true);
                  try {
                    await persistBackendStep('media');
                  } catch (err) {
                    alertDraftError(err);
                    setStepSaving(false);
                    return;
                  }
                  setStepSaving(false);
                }
                go('validate');
              })();
            }}
          />
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
          stepLabel={isBackendTask ? 'STEP 04' : 'STEP 05'}
          iconBg={COLORS.primary}
        />
        <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] }}>
          <Box
            className="rounded-3xl overflow-hidden"
            style={{
              aspectRatio: 16 / 9,
              backgroundColor: '#0F172A',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 3,
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
            <HStack className="items-center" style={{ gap: SPACE[3] }}>
              <Box
                className="items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: COLORS.white,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <MapPin size={18} color={COLORS.ink} strokeWidth={2.3} />
              </Box>
              <VStack className="flex-1 min-w-0" style={{ gap: 2 }}>
                <Text
                  style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}
                  numberOfLines={1}
                >
                  Site Walk-through
                </Text>
                <Text
                  style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink }}
                  numberOfLines={1}
                >
                  Recorded {recordedLabel}
                </Text>
              </VStack>
              <Pressable
                onPress={() => void setVideo(null)}
                className="h-10 w-10 rounded-full items-center justify-center active:opacity-80"
                style={{
                  backgroundColor: COLORS.white,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <Trash2 size={16} color={COLORS.destructive} strokeWidth={2.2} />
              </Pressable>
            </HStack>
          ) : null}
        </VStack>
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
                  : 'Record Video'}
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
              <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}>
                Video ready
              </Text>
              <Text
                style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.ink, marginTop: 2 }}
              >
                Max size 50 MB · stored on this device
              </Text>
            </VStack>
            <Box
              className="px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: COLORS.white,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: COLORS.ink }}>Valid</Text>
            </Box>
          </HStack>
        </Box>
      ) : null}
    </SurveyScaffold>
  );
}
