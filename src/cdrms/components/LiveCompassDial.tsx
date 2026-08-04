import { LinearGradient } from 'expo-linear-gradient';
import { Navigation } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { FrostedGlass } from '@/src/cdrms/components/GlassSurface';
import {
  CARDINAL_DEGREES,
  formatCardinalReading,
  formatLiveReading,
  parseCompassReading,
  SIMULATOR_COMPASS_FACE,
  SIMULATOR_COMPASS_HEADING,
  type CompassCardinal,
  useCompass,
} from '@/src/cdrms/hooks/useCompass';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { CARDINAL_ACCENT, COLORS, FONTS, GLASS, SPACE, cardinalAccentColor, DESIGN } from '@/src/cdrms/theme';

const SIZE = 132;
const CENTER = SIZE / 2;
const LABEL_R = 48;
const TICK_R = 52;

const DIAL_LABELS = [
  { label: 'N', deg: 0, color: '#DC2626', size: 12 },
  { label: 'E', deg: 90, color: CARDINAL_ACCENT.E, size: 11 },
  { label: 'S', deg: 180, color: CARDINAL_ACCENT.S, size: 11 },
  { label: 'W', deg: 270, color: CARDINAL_ACCENT.W, size: 11 },
] as const;

const PICK_FACES: CompassCardinal[] = ['N', 'E', 'S', 'W'];

/**
 * Live sensor compass (real device).
 * Simulator / no-sensor: auto-seeds North + tap N/E/S/W to set facing.
 */
export function LiveCompassDial() {
  const { draft, setCompassReading } = useProject();
  const compass = useCompass(true);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const lastSaved = useRef('');
  const seededFallback = useRef(false);

  const parsed = parseCompassReading(draft.compassReading);
  const face: CompassCardinal = compass.available
    ? (parseCompassReading(formatLiveReading(compass.heading))?.face ?? 'N')
    : parsed?.face ?? SIMULATOR_COMPASS_FACE;
  const heading = Math.round(
    compass.available ? compass.heading : parsed?.heading ?? SIMULATOR_COMPASS_HEADING,
  );
  const faceColor = cardinalAccentColor(face);
  const roseRotation = -heading;
  const needsManualPick =
    !compass.available ||
    compass.source === 'simulator' ||
    compass.status === 'unavailable' ||
    compass.status === 'permission';

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: roseRotation,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [roseRotation, rotateAnim]);

  // Live sensors → save continuously
  useEffect(() => {
    if (!compass.available || compass.source === 'simulator') return;
    const reading = formatLiveReading(compass.heading);
    if (reading === lastSaved.current) return;
    lastSaved.current = reading;
    setCompassReading(reading);
  }, [compass.available, compass.heading, compass.source, setCompassReading]);

  // Simulator / sensors missing → seed fixed North so Continue unlocks
  useEffect(() => {
    if (compass.available && compass.source !== 'simulator') return;
    if (
      compass.source === 'simulator' ||
      compass.status === 'unavailable' ||
      compass.status === 'permission'
    ) {
      if (seededFallback.current && draft.compassReading.trim()) return;
      seededFallback.current = true;
      const reading = formatLiveReading(SIMULATOR_COMPASS_HEADING);
      lastSaved.current = reading;
      setCompassReading(reading);
    }
  }, [
    compass.available,
    compass.source,
    compass.status,
    draft.compassReading,
    setCompassReading,
  ]);

  const pickFace = (f: CompassCardinal) => {
    const reading = formatCardinalReading(f);
    lastSaved.current = reading;
    seededFallback.current = true;
    setCompassReading(reading);
  };

  return (
    <FrostedGlass
      borderRadius={14}
      padding={SPACE[3]}
      fill={GLASS.surfaceSolid}
      sheen={false}
      style={{ borderTopWidth: 2, borderTopColor: faceColor }}
    >
      <VStack className="items-center" style={{ gap: SPACE[2], width: '100%' }}>
        {needsManualPick ? (
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 11,
              color: COLORS.slate,
              textAlign: 'center',
            }}
          >
            {compass.source === 'simulator' || compass.status === 'unavailable'
              ? `No live compass · facing set to ${SIMULATOR_COMPASS_FACE}. Tap to change.`
              : 'Allow location / use a real device for live compass — or tap a direction below.'}
          </Text>
        ) : null}

        <Box className="relative items-center justify-center" style={{ width: SIZE, height: SIZE }}>
          <LinearGradient
            pointerEvents="none"
            colors={['#EFF6FF', '#EFF6FF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              width: SIZE + 8,
              height: SIZE + 8,
              borderRadius: 999,
              top: -4,
              left: -4,
            }}
          />

          <Box
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -2,
              zIndex: 5,
              alignItems: 'center',
            }}
          >
            <Box
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderBottomWidth: 10,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: '#DC2626',
              }}
            />
          </Box>

          <Animated.View
            style={{
              width: SIZE,
              height: SIZE,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [-720, 720],
                    outputRange: ['-720deg', '720deg'],
                  }),
                },
              ],
            }}
          >
            <Box
              className="absolute inset-0 rounded-full"
              style={{
                borderWidth: 5,
                borderColor: draft.compassReading.trim() ? '#93C5FD' : '#E2E8F0',
                backgroundColor: '#F8FAFF',
              }}
            />

            {Array.from({ length: 36 }).map((_, i) => {
              const deg = i * 10;
              const rad = ((deg - 90) * Math.PI) / 180;
              const major = i % 3 === 0;
              const x = CENTER + TICK_R * Math.cos(rad);
              const y = CENTER + TICK_R * Math.sin(rad);
              return (
                <Box
                  key={i}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: x - (major ? 1 : 0.5),
                    top: y - (major ? 4 : 2),
                    width: major ? 2 : 1,
                    height: major ? 7 : 3.5,
                    backgroundColor: major ? COLORS.primary : '#BFDBFE',
                    borderRadius: 999,
                    transform: [{ rotate: `${deg}deg` }],
                  }}
                />
              );
            })}

            {DIAL_LABELS.map((d) => {
              const rad = ((d.deg - 90) * Math.PI) / 180;
              const x = CENTER + LABEL_R * Math.cos(rad);
              const y = CENTER + LABEL_R * Math.sin(rad);
              return (
                <Text
                  key={d.label}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: x - 7,
                    top: y - 7,
                    width: 14,
                    textAlign: 'center',
                    fontSize: d.size,
                    fontWeight: '900',
                    color: d.color,
                  }}
                >
                  {d.label}
                </Text>
              );
            })}

            <LinearGradient
              colors={
                draft.compassReading.trim()
                  ? [COLORS.primaryGlow, COLORS.primary]
                  : ['#94A3B8', '#64748B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 36,
                width: 36,
                borderRadius: DESIGN.cardRadius,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <Navigation
                size={15}
                color="#fff"
                strokeWidth={2.4}
                style={{ transform: [{ rotate: '-45deg' }] }}
              />
            </LinearGradient>
          </Animated.View>
        </Box>

        <HStack style={{ alignItems: 'baseline', gap: 6, justifyContent: 'center' }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 22,
              lineHeight: 26,
              color: COLORS.ink,
            }}
          >
            {draft.compassReading.trim() ? `${heading}°` : '—'}
          </Text>
          {draft.compassReading.trim() ? (
            <Box
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: GLASS.tintBlue,
                borderWidth: 1,
                borderColor: '#BFDBFE',
              }}
            >
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: faceColor }}>
                {face}
              </Text>
            </Box>
          ) : null}
        </HStack>

        {needsManualPick ? (
          <HStack style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {PICK_FACES.map((f) => {
              const on = face === f && Boolean(draft.compassReading.trim());
              return (
                <Pressable
                  key={f}
                  onPress={() => pickFace(f)}
                  accessibilityRole="button"
                  accessibilityLabel={`Facing ${f}`}
                  style={{
                    minWidth: 52,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: DESIGN.cardRadius,
                    alignItems: 'center',
                    backgroundColor: on ? COLORS.primary : COLORS.white,
                    borderWidth: 1.5,
                    borderColor: on ? COLORS.primary : COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 14,
                      color: on ? COLORS.white : COLORS.ink,
                    }}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>
        ) : null}
      </VStack>
    </FrostedGlass>
  );
}
