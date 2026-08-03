import { Camera, Check, MapPinned, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, TextInput } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { GlassSectionCard, HeaderStatusBadge } from '@/src/cdrms/components/GlassSurface';
import { captureSitePhoto } from '@/src/cdrms/hooks/useMediaCapture';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';
import { alertDraftError } from '@/src/cdrms/project/draft-api';
import { DIRECTION_META, type Cardinal } from '@/src/cdrms/project/types';
import { CARDINAL_ACCENT, COLORS, FONTS, GLASS, SPACE, DESIGN } from '@/src/cdrms/theme';

const CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];

/**
 * Engineer schedules — premium glass card with per-direction accent lines.
 */
export function SchedulesEditorCard() {
  const { draft, setDirection, setRoadFlag, setSurroundingPhoto, clearSurroundingPhoto } =
    useProject();
  const [clearing, setClearing] = useState<Cardinal | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Photo preview');

  const pickForSide = (k: Cardinal) => {
    void (async () => {
      try {
        const asset = await captureSitePhoto({
          title: `Take ${DIRECTION_META[k].label} photo`,
        });
        if (asset) await setSurroundingPhoto(k, asset);
      } catch (err) {
        alertDraftError(err);
      }
    })();
  };

  const removePhoto = (k: Cardinal) => {
    showAppDialog({
      variant: 'error',
      title: `Remove ${DIRECTION_META[k].label} photo?`,
      message: 'This clears the uploaded image.',
      cancelLabel: 'Cancel',
      confirmLabel: 'Remove',
      onConfirm: () => {
        void (async () => {
          setClearing(k);
          try {
            await clearSurroundingPhoto(k);
          } catch (err) {
            alertDraftError(err);
          } finally {
            setClearing(null);
          }
        })();
      },
    });
  };

  const photoCount = CARDINALS.filter((k) => Boolean(draft.surroundingPhotos[k])).length;

  return (
    <GlassSectionCard
      title="Site Schedules *"
      subtitle="Check the box if road exists and upload image"
      icon={MapPinned}
      badge={<HeaderStatusBadge label={`${photoCount}/4`} tone="info" />}
    >
      <VStack style={{ gap: SPACE[2] }}>
        {CARDINALS.map((k) => {
          const accent = CARDINAL_ACCENT[k];
          const isRoad = Boolean(draft.roadFlags?.[k]);
          const note = draft.directions[k] || '';
          const photo = draft.surroundingPhotos[k];
          const isClearing = clearing === k;

          return (
            <Box
              key={`eng-sched-${k}`}
              style={{
                borderRadius: DESIGN.cardRadius,
                padding: SPACE[2],
                backgroundColor: GLASS.surfaceSolid,
                borderWidth: 1,
                borderColor: GLASS.border,
                opacity: isClearing ? 0.55 : 1,
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

                <Pressable
                  onPress={() => setRoadFlag(k, !isRoad)}
                  className="active:opacity-80 shrink-0"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    height: 32,
                    paddingHorizontal: 8,
                    borderRadius: DESIGN.stepRadius,
                    backgroundColor: isRoad ? GLASS.tintBlue : GLASS.surface,
                    borderWidth: 1,
                    borderColor: isRoad ? accent : GLASS.borderSoft,
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
                </Pressable>

                <TextInput
                  value={note}
                  onChangeText={(t) => setDirection(k, t)}
                  placeholder={isRoad ? 'Width (eg:30ft)' : `${DIRECTION_META[k].label} by`}
                  placeholderTextColor="#94A3B8"
                  underlineColorAndroid="transparent"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    minWidth: 72,
                    height: 32,
                    borderRadius: DESIGN.stepRadius,
                    borderWidth: 1,
                    borderColor: GLASS.border,
                    backgroundColor: COLORS.white,
                    paddingHorizontal: 8,
                    paddingVertical: Platform.OS === 'android' ? 0 : 6,
                    fontSize: 11,
                    fontFamily: FONTS.medium,
                    color: COLORS.ink,
                    ...(Platform.OS === 'android'
                      ? { textAlignVertical: 'center', includeFontPadding: false }
                      : null),
                  }}
                />

                <Box style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
                  <Pressable
                    onPress={() => {
                      if (photo) {
                        setPreviewTitle(`${DIRECTION_META[k].label} photo`);
                        setPreviewUri(photo.uri);
                        return;
                      }
                      pickForSide(k);
                    }}
                    onLongPress={() => {
                      if (photo) pickForSide(k);
                    }}
                    disabled={isClearing}
                    className="active:opacity-85 overflow-hidden"
                    style={{
                      width: 52,
                      height: 40,
                      borderRadius: DESIGN.stepRadius,
                      backgroundColor: COLORS.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: photo ? accent : GLASS.border,
                    }}
                    accessibilityLabel={
                      photo
                        ? `Preview ${DIRECTION_META[k].label} photo`
                        : `Upload ${DIRECTION_META[k].label} photo`
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
                  {photo ? (
                    <Pressable
                      onPress={() => removePhoto(k)}
                      disabled={isClearing}
                      hitSlop={8}
                      className="active:opacity-85"
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 20,
                        height: 20,
                        borderRadius: DESIGN.stepRadius,
                        backgroundColor: '#DC2626',
                        borderWidth: 1.5,
                        borderColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                      }}
                      accessibilityLabel={`Remove ${DIRECTION_META[k].label} photo`}
                    >
                      <X size={11} color="#FFFFFF" strokeWidth={3} />
                    </Pressable>
                  ) : null}
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
    </GlassSectionCard>
  );
}
