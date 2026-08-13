import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Video } from 'lucide-react-native';
import { useState } from 'react';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { PremiumStepCard } from '@/src/cdrms/components/SurveyLayout';
import { createDummyVideoAsset } from '@/src/cdrms/hooks/dummyMedia';
import { captureVideo, useDummyCapture } from '@/src/cdrms/hooks/useMediaCapture';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { alertDraftError } from '@/src/cdrms/project/draft-api';
import {
  COLORS,
  DESIGN,
  FONTS,
  GRADIENT_PRIMARY,
  GRADIENT_VIDEO,
  SPACE,
  gradientStops,
  hexAlpha,
} from '@/src/cdrms/theme';

const BLUE_SOFT = '#EEF4FF';
const BLUE_BORDER = 'rgba(26,86,219,0.22)';

function formatDuration(ms?: number | null) {
  if (ms == null || ms <= 0) return 'Video';
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Site walk-through video capture — used on engineer step 4 (Media). */
export function SiteVideoCaptureCard() {
  const { draft, setVideo } = useProject();
  const [busy, setBusy] = useState(false);
  const simDummy = useDummyCapture();

  const recordedLabel = draft.video
    ? new Date(draft.video.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const record = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const asset = await captureVideo();
      if (asset) await setVideo(asset);
    } catch (err) {
      alertDraftError(err);
    } finally {
      setBusy(false);
    }
  };

  const useDummy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const asset = await createDummyVideoAsset();
      await setVideo(asset);
    } catch (err) {
      alertDraftError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PremiumStepCard
      icon={Video}
      title="Site walk-through video *"
      subtitle={
        draft.video
          ? `Recorded ${recordedLabel}`
          : simDummy
            ? 'Simulator · use dummy sample video'
            : 'Live record only — upload from gallery/files is not allowed'
      }
      badge={
        draft.video ? (
          <Box
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: '#ECFDF5',
              borderWidth: 1,
              borderColor: '#A7F3D0',
            }}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: '#047857' }}>Ready</Text>
          </Box>
        ) : undefined
      }
    >
      <VStack style={{ gap: 8 }}>
        <Box
          className="rounded-xl overflow-hidden"
          style={{
            aspectRatio: 16 / 9,
            backgroundColor: '#0F172A',
            borderWidth: 1,
            borderColor: BLUE_BORDER,
            shadowColor: COLORS.primaryDeep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
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
            <Pressable
              onPress={() => void (simDummy ? useDummy() : record())}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={
                simDummy ? 'Use dummy sample video' : 'Record site walk-through video'
              }
              className="active:opacity-90"
              style={{ flex: 1, opacity: busy ? 0.7 : 1 }}
            >
              <LinearGradient
                colors={gradientStops(GRADIENT_VIDEO)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Box
                  style={{
                    height: 56,
                    width: 56,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <Video size={24} color="#fff" strokeWidth={2.2} />
                </Box>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: '#FFFFFF' }}>
                  {busy ? 'Loading…' : 'No video yet'}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {simDummy ? 'Tap to use dummy sample video' : 'Tap to record'}
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        </Box>

        {simDummy && !draft.video ? (
          <Pressable
            onPress={() => void useDummy()}
            disabled={busy}
            className="active:opacity-90"
            style={{
              borderRadius: DESIGN.cardRadius,
              overflow: 'hidden',
              opacity: busy ? 0.6 : 1,
            }}
          >
            <LinearGradient
              colors={gradientStops(GRADIENT_PRIMARY)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' }}>
                {busy ? 'Loading dummy video…' : 'Use dummy sample video'}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : null}

        {draft.video ? (
          <Box
            style={{
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: COLORS.white,
              borderWidth: 1.5,
              borderColor: BLUE_BORDER,
              shadowColor: COLORS.primaryDeep,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <HStack style={{ alignItems: 'center', gap: SPACE[2] }}>
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  backgroundColor: BLUE_SOFT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Video size={14} color={COLORS.primary} strokeWidth={2.4} />
              </Box>
              <VStack style={{ flex: 1, minWidth: 0, gap: 0 }}>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 13,
                    letterSpacing: 0.3,
                    color: COLORS.ink,
                    textTransform: 'uppercase',
                  }}
                >
                  Site walk-through
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.semibold,
                    fontSize: 12,
                    lineHeight: 16,
                    color: '#475569',
                  }}
                >
                  {simDummy ? 'Simulator sample · stored on device' : 'Max 50 MB · stored on device'}
                </Text>
              </VStack>
              <Pressable
                onPress={() => void setVideo(null)}
                className="active:opacity-80"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: BLUE_SOFT,
                  borderWidth: 1,
                  borderColor: hexAlpha('#DC2626', 0.25),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityLabel="Remove site video"
              >
                <Trash2 size={15} color={COLORS.destructive} strokeWidth={2.2} />
              </Pressable>
            </HStack>
          </Box>
        ) : null}
      </VStack>
    </PremiumStepCard>
  );
}
