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
import { CARDINAL_ACCENT, COLORS, FONTS, GLASS, hexAlpha } from '@/src/cdrms/theme';

const CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];
const BLUE_SOFT = '#EEF4FF';
const BLUE_BORDER = 'rgba(26,86,219,0.22)';

/** Read-only schedules — same row layout as SchedulesEditorCard when filling Step 2. */
export function ReviewSchedulesPanel({ variant = 'default' }: { variant?: 'default' | 'premium' }) {
  const { draft } = useProject();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Photo preview');
  const isPremium = variant === 'premium';

  return (
    <>
      <VStack style={{ gap: isPremium ? 4 : 8 }}>
        {CARDINALS.map((k) => {
          const accent = CARDINAL_ACCENT[k];
          const isRoad = Boolean(draft.roadFlags?.[k]);
          const note = draft.directions[k] || '';
          const photo = draft.surroundingPhotos[k];

          return (
            <Box
              key={`review-sched-${k}`}
              style={{
                borderRadius: isPremium ? 12 : 12,
                padding: isPremium ? 6 : 8,
                backgroundColor: COLORS.white,
                borderWidth: isPremium ? 1.5 : 1,
                borderColor: isPremium ? hexAlpha(accent, 0.35) : COLORS.border,
                shadowColor: isPremium ? COLORS.primaryDeep : '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 5,
                elevation: 2,
              }}
            >
              <HStack className="items-center" style={{ gap: 8, minHeight: 40 }}>
                <Box style={{ width: isPremium ? 40 : 44, justifyContent: 'center', flexShrink: 0 }}>
                  {isPremium ? (
                    <HStack className="items-center" style={{ gap: 4 }}>
                      <Box
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 999,
                          backgroundColor: accent,
                        }}
                      />
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: accent }}>
                        {DIRECTION_META[k].label}
                      </Text>
                    </HStack>
                  ) : (
                    <>
                      <Box
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: GLASS.tintBlue,
                          borderWidth: 1,
                          borderColor: '#BFDBFE',
                          marginBottom: 2,
                        }}
                      >
                        <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: accent }}>
                          {k}
                        </Text>
                      </Box>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: FONTS.medium,
                          fontSize: 9,
                          color: COLORS.slate,
                        }}
                      >
                        {DIRECTION_META[k].label}
                      </Text>
                    </>
                  )}
                </Box>

                <Box
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    height: 30,
                    paddingHorizontal: 8,
                    borderRadius: isPremium ? 999 : 8,
                    backgroundColor: isRoad
                      ? isPremium
                        ? BLUE_SOFT
                        : GLASS.tintBlue
                      : COLORS.white,
                    borderWidth: 1,
                    borderColor: isRoad ? accent : isPremium ? BLUE_BORDER : GLASS.borderSoft,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: isRoad ? accent : COLORS.ink,
                      backgroundColor: isRoad ? accent : COLORS.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isRoad ? <Check size={9} color="#FFFFFF" strokeWidth={3} /> : null}
                  </Box>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 11,
                      color: isRoad ? accent : COLORS.ink,
                    }}
                  >
                    Road
                  </Text>
                </Box>

                <Box
                  style={{
                    flex: 1,
                    minWidth: 72,
                    height: 30,
                    borderRadius: isPremium ? 999 : 8,
                    borderWidth: 1,
                    borderColor: isPremium ? BLUE_BORDER : GLASS.border,
                    backgroundColor: isPremium ? BLUE_SOFT : COLORS.white,
                    paddingHorizontal: 10,
                    justifyContent: 'center',
                    paddingVertical: Platform.OS === 'android' ? 0 : 5,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      fontFamily: FONTS.medium,
                      color: note.trim() ? COLORS.ink : '#94A3B8',
                      ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
                    }}
                  >
                    {note.trim() || '—'}
                  </Text>
                </Box>

                <Box style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
                  <Pressable
                    onPress={() => {
                      if (!photo) return;
                      setPreviewTitle(`${DIRECTION_META[k].label} photo`);
                      setPreviewUri(photo.uri);
                    }}
                    disabled={!photo}
                    className="active:opacity-85 overflow-hidden"
                    style={{
                      width: 48,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: COLORS.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: photo ? accent : isPremium ? BLUE_BORDER : GLASS.border,
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
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: COLORS.success,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={8} color="#fff" strokeWidth={3} />
                        </Box>
                      </Box>
                    ) : (
                      <Camera size={18} color={accent} />
                    )}
                  </Pressable>
                </Box>
              </HStack>
            </Box>
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
