import { Check, Camera } from 'lucide-react-native';
import { useState } from 'react';
import { Platform } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { DIRECTION_META, type Cardinal } from '@/src/cdrms/project/types';
import { COLORS, FONTS, SPACE } from '@/src/cdrms/theme';

const CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];

/** Read-only schedules — same layout as SchedulesEditorCard when filling Step 2. */
export function ReviewSchedulesPanel() {
  const { draft } = useProject();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Photo preview');

  return (
    <>
      <VStack style={{ gap: SPACE[3] }}>
        {CARDINALS.map((k) => {
          const isRoad = Boolean(draft.roadFlags?.[k]);
          const note = draft.directions[k] || '';
          const photo = draft.surroundingPhotos[k];

          return (
            <VStack
              key={`review-sched-${k}`}
              style={{
                borderRadius: 12,
                backgroundColor: COLORS.white,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: SPACE[2],
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
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 13,
                      color: COLORS.ink,
                    }}
                  >
                    {DIRECTION_META[k].label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: 10,
                      color: COLORS.slate,
                      marginTop: 1,
                    }}
                  >
                    by
                  </Text>
                </Box>

                <Box
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    height: 36,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    backgroundColor: COLORS.white,
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Box
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: isRoad ? COLORS.primary : COLORS.ink,
                      backgroundColor: isRoad ? COLORS.primary : COLORS.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isRoad ? <Check size={10} color="#FFFFFF" strokeWidth={3} /> : null}
                  </Box>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 11,
                      color: COLORS.ink,
                    }}
                  >
                    Road
                  </Text>
                </Box>

                <Pressable
                  onPress={() => {
                    if (!photo) return;
                    setPreviewTitle(`${DIRECTION_META[k].label} photo`);
                    setPreviewUri(photo.uri);
                  }}
                  disabled={!photo}
                  className="overflow-hidden"
                  style={{
                    width: 56,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: COLORS.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 2,
                    opacity: photo ? 1 : 0.55,
                  }}
                  accessibilityLabel={
                    photo
                      ? `Preview ${DIRECTION_META[k].label} photo`
                      : `${DIRECTION_META[k].label} photo missing`
                  }
                >
                  {photo ? (
                    <Box className="w-full h-full relative">
                      <ApiMediaImage
                        uri={photo.uri}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <Box
                        className="absolute"
                        style={{
                          right: 2,
                          bottom: 2,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: COLORS.success,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={9} color="#fff" strokeWidth={3} />
                      </Box>
                    </Box>
                  ) : (
                    <Camera size={20} color={COLORS.ink} />
                  )}
                </Pressable>
              </HStack>

              <Box
                style={{
                  width: '100%',
                  minHeight: 36,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: '#F8FAFC',
                  paddingHorizontal: 10,
                  justifyContent: 'center',
                  paddingVertical: Platform.OS === 'android' ? 8 : 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: FONTS.semibold,
                    fontWeight: '600',
                    color: note.trim() ? COLORS.ink : COLORS.slate,
                  }}
                >
                  {note.trim() || '—'}
                </Text>
              </Box>
            </VStack>
          );
        })}
      </VStack>

      <ImagePreviewModal
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />
    </>
  );
}
