import { Navigation } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  cardinalFromHeading,
  cardinalNameFromHeading,
  formatLiveReading,
  useCompass,
} from '@/src/cdrms/hooks/useCompass';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { COLORS, FONTS, SPACE, TYPE } from '@/src/cdrms/theme';

const SIZE = 132;
const CENTER = SIZE / 2;
const LABEL_R = 48;
const TICK_R = 52;

/**
 * Live sensor compass (real device).
 * Dial rotates so geographic N stays correct; red tip at top = direction you face.
 * No manual cardinal picker — reading is auto-saved from the sensor.
 */
export function LiveCompassDial() {
  const { setCompassReading } = useProject();
  const compass = useCompass(true);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const lastSaved = useRef('');

  const heading = Math.round(compass.heading);
  const face = cardinalFromHeading(compass.heading);
  const faceName = cardinalNameFromHeading(compass.heading);
  // Rotate rose opposite to heading so N points to real north; tip stays at top.
  const roseRotation = compass.available ? -heading : 0;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: roseRotation,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [roseRotation, rotateAnim]);

  useEffect(() => {
    if (!compass.available) return;
    const reading = formatLiveReading(compass.heading);
    if (reading === lastSaved.current) return;
    lastSaved.current = reading;
    setCompassReading(reading);
  }, [compass.available, compass.heading, setCompassReading]);

  const statusLabel = !compass.available
    ? compass.status === 'permission'
      ? 'Allow Location for compass'
      : compass.status === 'calibrating'
        ? 'Calibrating… hold phone flat'
        : 'Use a real device · sensor required'
    : `Facing ${faceName}`;

  return (
    <VStack className="items-center" style={{ gap: SPACE[3], width: '100%' }}>
      <Box className="relative items-center justify-center" style={{ width: SIZE, height: SIZE }}>
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
              borderColor: compass.available ? '#DBEAFE' : '#E2E8F0',
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
                  backgroundColor: major ? '#2563EB' : '#BFDBFE',
                  borderRadius: 999,
                  transform: [{ rotate: `${deg}deg` }],
                }}
              />
            );
          })}

          {(
            [
              { label: 'N', deg: 0, color: '#DC2626', size: 12 },
              { label: 'E', deg: 90, color: '#334155', size: 11 },
              { label: 'S', deg: 180, color: '#334155', size: 11 },
              { label: 'W', deg: 270, color: '#334155', size: 11 },
            ] as const
          ).map((d) => {
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

          <Box
            style={{
              height: 36,
              width: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: compass.available ? '#2563EB' : '#94A3B8',
              zIndex: 2,
            }}
          >
            <Navigation
              size={15}
              color="#fff"
              strokeWidth={2.4}
              style={{ transform: [{ rotate: '-45deg' }] }}
            />
          </Box>
        </Animated.View>
      </Box>

      <VStack className="items-center" style={{ gap: 4 }}>
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: 22,
            lineHeight: 26,
            color: COLORS.ink,
          }}
        >
          {compass.available ? `${heading}° ${face}` : '—'}
        </Text>
        <Text style={{ ...TYPE.label, color: COLORS.ink, textAlign: 'center' }}>
          {statusLabel}
        </Text>
        {compass.available ? (
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 11,
              color: COLORS.slate,
              marginTop: 2,
            }}
          >
            Live sensor · hold phone flat · turn slowly
          </Text>
        ) : null}
      </VStack>
    </VStack>
  );
}
