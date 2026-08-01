import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Trash2, Video } from 'lucide-react-native';
import { useState } from 'react';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { GlassHeaderBadge, GlassSectionCard } from '@/src/cdrms/components/GlassSurface';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { captureVideo } from '@/src/cdrms/hooks/useMediaCapture';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { alertDraftError } from '@/src/cdrms/project/draft-api';
import { COLORS, FONTS, GRADIENT_VIDEO, SPACE, gradientStops } from '@/src/cdrms/theme';

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

  return (
    <GlassSectionCard
      icon={Video}
      title="Site walk-through video *"
      subtitle={
        draft.video
          ? `Recorded ${recordedLabel}`
          : 'Record a site video (max 50 MB)'
      }
      badge={
        draft.video ? (
          <GlassHeaderBadge>
            <CheckCircle2 size={10} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: '#FFFFFF' }}>
              Ready
            </Text>
          </GlassHeaderBadge>
        ) : undefined
      }
    >
      <VStack style={{ gap: SPACE[2] }}>
        <Box
          className="rounded-xl overflow-hidden"
          style={{
            aspectRatio: 16 / 9,
            backgroundColor: '#0F172A',
            shadowColor: '#0F172A',
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
              onPress={() => void record()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Record site walk-through video"
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
                <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF' }}>
                  {busy ? 'Opening…' : 'No video yet'}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  Tap to record
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        </Box>

        {draft.video ? (
          <HStack style={{ alignItems: 'center', gap: SPACE[2] }}>
            <VStack style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
                Site walk-through
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: COLORS.slate }}>
                Max 50 MB · stored on device
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
              accessibilityLabel="Remove site video"
            >
              <Trash2 size={16} color={COLORS.destructive} strokeWidth={2.2} />
            </Pressable>
          </HStack>
        ) : null}
      </VStack>
    </GlassSectionCard>
  );
}
