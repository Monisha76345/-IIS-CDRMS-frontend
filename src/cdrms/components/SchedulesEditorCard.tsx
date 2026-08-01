import { Camera, Check, MapPinned, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Platform, TextInput } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ImagePreviewModal } from '@/src/cdrms/components/ImagePreviewModal';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';
import { SurveyCard, WorkspaceHeader } from '@/src/cdrms/components/SurveyLayout';
import { captureSitePhoto } from '@/src/cdrms/hooks/useMediaCapture';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { alertDraftError } from '@/src/cdrms/project/draft-api';
import { DIRECTION_META, type Cardinal } from '@/src/cdrms/project/types';
import { COLORS, FONTS, SPACE } from '@/src/cdrms/theme';

const CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];

/**
 * Engineer schedules — same Step 1 card alignment: black text, white shadow tiles.
 */
export function SchedulesEditorCard({
  title = 'Schedules (site around)',
  subtitle = '4 sides · Road · note · photo',
}: {
  title?: string;
  subtitle?: string;
}) {
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
    Alert.alert(`Remove ${DIRECTION_META[k].label} photo?`, 'This clears the uploaded image.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
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
      },
    ]);
  };

  return (
    <SurveyCard>
      <WorkspaceHeader
        icon={MapPinned}
        title={title}
        subtitle={subtitle}
        iconBg={COLORS.primary}
      />

      <VStack style={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] }}>
        {CARDINALS.map((k) => {
          const isRoad = Boolean(draft.roadFlags?.[k]);
          const note = draft.directions[k] || '';
          const photo = draft.surroundingPhotos[k];
          const isClearing = clearing === k;

          return (
            <HStack
              key={`eng-sched-${k}`}
              className="items-center"
              style={{
                borderRadius: 12,
                backgroundColor: COLORS.white,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: SPACE[2],
                minHeight: 52,
                opacity: isClearing ? 0.55 : 1,
                borderWidth: 1,
                borderColor: COLORS.border,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Box style={{ width: 50, justifyContent: 'center', flexShrink: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 13,
                    color: COLORS.ink,
                    textAlign: 'left',
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

              <Pressable
                onPress={() => setRoadFlag(k, !isRoad)}
                className="active:opacity-80 shrink-0"
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
              </Pressable>

              <TextInput
                value={note}
                onChangeText={(t) => setDirection(k, t)}
                placeholder={isRoad ? 'Width' : `${DIRECTION_META[k].label} by`}
                placeholderTextColor="#94A3B8"
                underlineColorAndroid="transparent"
                autoCorrect={false}
                style={{
                  flex: 1,
                  minWidth: 80,
                  height: 36,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.white,
                  paddingHorizontal: 10,
                  paddingVertical: Platform.OS === 'android' ? 0 : 8,
                  fontSize: 12,
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
                {photo ? (
                  <Pressable
                    onPress={() => removePhoto(k)}
                    disabled={isClearing}
                    hitSlop={8}
                    className="active:opacity-85"
                    style={{
                      position: 'absolute',
                      top: -7,
                      right: -7,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#DC2626',
                      borderWidth: 1.5,
                      borderColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                    accessibilityLabel={`Remove ${DIRECTION_META[k].label} photo`}
                  >
                    <X size={12} color="#FFFFFF" strokeWidth={3} />
                  </Pressable>
                ) : null}
              </Box>
            </HStack>
          );
        })}
      </VStack>

      <ImagePreviewModal
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />
    </SurveyCard>
  );
}
