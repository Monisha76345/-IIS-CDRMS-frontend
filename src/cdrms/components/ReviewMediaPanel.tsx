import { Camera, UserRound, Video } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { SiteVideoPlayer } from '@/src/cdrms/components/SiteVideoPlayer';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { COLORS, FONTS, GLASS, SPACE } from '@/src/cdrms/theme';

const BLUE_SOFT = '#EEF4FF';
const BLUE_BORDER = 'rgba(26,86,219,0.22)';

function formatDuration(ms?: number | null) {
  if (ms == null || ms <= 0) return null;
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function MediaBlock({
  title,
  icon: Icon,
  variant,
  children,
}: {
  title: string;
  icon: typeof UserRound;
  variant: 'default' | 'premium';
  children: ReactNode;
}) {
  const isPremium = variant === 'premium';

  return (
    <VStack style={{ gap: SPACE[2] }}>
      <HStack className="items-center" style={{ gap: SPACE[2] }}>
        <Box
          style={
            isPremium
              ? {
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: BLUE_SOFT,
                  borderWidth: 1,
                  borderColor: BLUE_BORDER,
                }
              : undefined
          }
        >
          <Icon size={isPremium ? 14 : 16} color={COLORS.primary} strokeWidth={2.3} />
        </Box>
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: isPremium ? 14 : 13,
            color: isPremium ? '#1A368E' : COLORS.ink,
          }}
        >
          {title}
        </Text>
      </HStack>
      <Box
        style={
          isPremium
            ? {
                borderRadius: 14,
                backgroundColor: COLORS.white,
                borderWidth: 1.5,
                borderColor: BLUE_BORDER,
                padding: 8,
                shadowColor: COLORS.primaryDeep,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 5,
                elevation: 2,
              }
            : undefined
        }
      >
        {children}
      </Box>
    </VStack>
  );
}

/** Read-only selfie, site photos & video — same assets as Step 4 fill screens. */
export function ReviewMediaPanel({ variant = 'default' }: { variant?: 'default' | 'premium' }) {
  const { draft } = useProject();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Photo preview');

  const videoDuration = draft.video ? formatDuration(draft.video.durationMs) : null;
  const isPremium = variant === 'premium';

  return (
    <>
      <VStack style={{ gap: isPremium ? 6 : SPACE[4] }}>
        <MediaBlock title="Selfie" icon={UserRound} variant={variant}>
          {draft.selfie ? (
            <Pressable
              onPress={() => {
                setPreviewTitle('Engineer selfie');
                setPreviewUri(draft.selfie!.uri);
              }}
              className="overflow-hidden active:opacity-90"
              style={{
                width: isPremium ? 96 : 112,
                height: isPremium ? 96 : 112,
                borderRadius: isPremium ? 12 : 16,
                borderWidth: 1,
                borderColor: isPremium ? GLASS.border : COLORS.border,
              }}
            >
              <ApiMediaImage
                uri={draft.selfie.uri}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.slate }}>
              No selfie captured
            </Text>
          )}
        </MediaBlock>

        <MediaBlock title="Site photos" icon={Camera} variant={variant}>
          {draft.photos.length > 0 ? (
            <Box className="flex-row flex-wrap" style={{ gap: 8 }}>
              {draft.photos.map((p, i) => (
                <Box
                  key={p.id}
                  style={{
                    width: '31%',
                    aspectRatio: 1,
                    borderRadius: isPremium ? 10 : 14,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isPremium ? GLASS.border : COLORS.border,
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
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.slate }}>
              No extra site photos
            </Text>
          )}
        </MediaBlock>

        <MediaBlock title="Site video" icon={Video} variant={variant}>
          {draft.video ? (
            <Box
              className="overflow-hidden"
              style={{
                borderRadius: isPremium ? 12 : 16,
                aspectRatio: 16 / 9,
                backgroundColor: '#0F172A',
                borderWidth: 1,
                borderColor: isPremium ? GLASS.border : COLORS.border,
              }}
            >
              <SiteVideoPlayer
                key={draft.video.uri}
                uri={draft.video.uri}
                durationLabel={videoDuration ?? undefined}
              />
            </Box>
          ) : (
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.slate }}>
              No video captured
            </Text>
          )}
        </MediaBlock>
      </VStack>

      <ImagePreviewModal
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />
    </>
  );
}
