import { Check, Camera } from 'lucide-react-native';
import { useState } from 'react';
import { Platform } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type MobileApplication } from '@/src/api/applications';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { DIRECTION_META, type Cardinal } from '@/src/cdrms/project/types';
import { CARDINAL_ACCENT, COLORS, FONTS, GLASS, SPACE } from '@/src/cdrms/theme';

const CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];

function schedulePhotoUrl(app: MobileApplication, k: Cardinal): string {
  const raw = app.schedulePhotoUrls || {};
  return raw[k]?.trim() || raw[k.toLowerCase()]?.trim() || '';
}

function scheduleNoteText(app: MobileApplication, k: Cardinal): string {
  const notes = app.engineerScheduleNotes || {};
  const note = notes[k]?.trim() || notes[k.toLowerCase()]?.trim() || '';
  const flags = app.scheduleRoadFlags || {};
  const isRoad = Boolean(flags[k] ?? flags[k.toLowerCase()]);
  if (!note && !isRoad) return '';
  if (note && isRoad) return note;
  if (isRoad) return '';
  return note;
}

function isRoadSide(app: MobileApplication, k: Cardinal): boolean {
  const flags = app.scheduleRoadFlags || {};
  return Boolean(flags[k] ?? flags[k.toLowerCase()]);
}

/** Read-only engineer schedules — same row layout as SchedulesEditorCard / ReviewSchedulesPanel. */
export function EngineerSchedulesReadOnly({ app }: { app: MobileApplication }) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Photo preview');

  return (
    <>
      <VStack style={{ gap: SPACE[2] }}>
        {CARDINALS.map((k) => {
          const accent = CARDINAL_ACCENT[k];
          const isRoad = isRoadSide(app, k);
          const note = scheduleNoteText(app, k);
          const photoUri = schedulePhotoUrl(app, k);

          return (
            <Box
              key={`eng-view-sched-${k}`}
              style={{
                borderRadius: 12,
                padding: SPACE[2],
                backgroundColor: GLASS.surfaceSolid,
                borderWidth: 1,
                borderColor: GLASS.border,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <HStack className="items-center" style={{ gap: SPACE[2], minHeight: 44 }}>
                <Box style={{ width: 44, justifyContent: 'center', flexShrink: 0 }}>
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
                </Box>

                <Box
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    height: 32,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    backgroundColor: isRoad ? GLASS.tintBlue : GLASS.surface,
                    borderWidth: 1,
                    borderColor: isRoad ? accent : GLASS.borderSoft,
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
                      fontSize: 12,
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
                    height: 32,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: GLASS.border,
                    backgroundColor: COLORS.white,
                    paddingHorizontal: 8,
                    justifyContent: 'center',
                    paddingVertical: Platform.OS === 'android' ? 0 : 6,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      fontFamily: FONTS.regular,
                      color: note.trim() ? COLORS.ink : COLORS.slate,
                      ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
                    }}
                  >
                    {note.trim() || (isRoad ? 'Road' : '—')}
                  </Text>
                </Box>

                <Box style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
                  <Pressable
                    onPress={() => {
                      if (!photoUri) return;
                      setPreviewTitle(`${DIRECTION_META[k].label} photo`);
                      setPreviewUri(photoUri);
                    }}
                    disabled={!photoUri}
                    className="active:opacity-85 overflow-hidden"
                    style={{
                      width: 52,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: COLORS.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: photoUri ? accent : GLASS.border,
                      opacity: photoUri ? 1 : 0.55,
                    }}
                    accessibilityLabel={
                      photoUri
                        ? `Preview ${DIRECTION_META[k].label} photo`
                        : `${DIRECTION_META[k].label} photo missing`
                    }
                  >
                    {photoUri ? (
                      <Box className="w-full h-full relative">
                        <ApiMediaImage
                          uri={photoUri}
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
