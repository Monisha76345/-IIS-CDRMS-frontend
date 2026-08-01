import { Camera, UserRound } from 'lucide-react-native';
import { useState } from 'react';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { COLORS, FONTS, SPACE } from '@/src/cdrms/theme';

function formatDuration(ms?: number | null) {
  if (ms == null || ms <= 0) return null;
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Read-only selfie, site photos & video — same assets as Step 4 fill screens. */
export function ReviewMediaPanel() {
  const { draft } = useProject();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Photo preview');

  const videoDuration = draft.video ? formatDuration(draft.video.durationMs) : null;

  return (
    <>
      <VStack style={{ gap: SPACE[4] }}>
        <VStack style={{ gap: SPACE[2] }}>
          <HStack className="items-center" style={{ gap: SPACE[2] }}>
            <UserRound size={16} color={COLORS.primary} strokeWidth={2.3} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
              Selfie
            </Text>
          </HStack>
          {draft.selfie ? (
            <Pressable
              onPress={() => {
                setPreviewTitle('Engineer selfie');
                setPreviewUri(draft.selfie!.uri);
              }}
              className="overflow-hidden active:opacity-90"
              style={{
                width: 112,
                height: 112,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <ApiMediaImage
                uri={draft.selfie.uri}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.slate }}>
              No selfie captured
            </Text>
          )}
        </VStack>

        <VStack style={{ gap: SPACE[2] }}>
          <HStack className="items-center" style={{ gap: SPACE[2] }}>
            <Camera size={16} color={COLORS.primary} strokeWidth={2.3} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
              Site photos
            </Text>
          </HStack>
          {draft.photos.length > 0 ? (
            <Box className="flex-row flex-wrap" style={{ gap: 10 }}>
              {draft.photos.map((p, i) => (
                <Box
                  key={p.id}
                  style={{
                    width: '31%',
                    aspectRatio: 1,
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      setPreviewTitle(`Site photo ${String(i + 1).padStart(2, '0')}`);
                      setPreviewUri(p.uri);
                    }}
                    className="w-full h-full active:opacity-90"
                  >
                    <ApiMediaImage
                      uri={p.uri}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <Box
                      className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      <Text style={{ fontSize: 9, fontFamily: FONTS.bold, color: '#FFFFFF' }}>
                        IMG_{String(i + 1).padStart(2, '0')}
                      </Text>
                    </Box>
                  </Pressable>
                </Box>
              ))}
            </Box>
          ) : (
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.slate }}>
              No extra site photos
            </Text>
          )}
        </VStack>

        <VStack style={{ gap: SPACE[2] }}>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.ink }}>
            Site video
          </Text>
          {draft.video ? (
            <Box
              className="overflow-hidden"
              style={{
                borderRadius: 16,
                aspectRatio: 16 / 9,
                backgroundColor: '#0F172A',
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <SiteVideoPlayer
                key={draft.video.uri}
                uri={draft.video.uri}
                durationLabel={videoDuration ?? undefined}
              />
            </Box>
          ) : (
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.slate }}>
              No video captured
            </Text>
          )}
        </VStack>
      </VStack>

      <ImagePreviewModal
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />
    </>
  );
}
