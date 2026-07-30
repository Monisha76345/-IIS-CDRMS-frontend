import { Navigation } from 'lucide-react-native';
import { useMemo } from 'react';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  CARDINAL_DEGREES,
  COMPASS_CARDINALS,
  cardinalFullName,
  formatCardinalReading,
  parseCompassReading,
  type CompassCardinal,
} from '@/src/cdrms/hooks/useCompass';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { COLORS, FONTS, SPACE, TYPE } from '@/src/cdrms/theme';

const SIZE = 100;
const CENTER = SIZE / 2;
const LABEL_R = 36;
const TICK_R = 40;

/**
 * Cardinal picker only — tap direction. No device sensors.
 */
export function LiveCompassDial() {
  const { draft, setCompassReading } = useProject();

  const selected = useMemo(() => {
    const parsed = parseCompassReading(draft.compassReading);
    return parsed?.face ?? null;
  }, [draft.compassReading]);

  const heading = selected ? CARDINAL_DEGREES[selected] : 0;
  const roseRotation = selected ? -heading : 0;

  const pick = (face: CompassCardinal) => {
    setCompassReading(formatCardinalReading(face));
  };

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
              borderLeftWidth: 5,
              borderRightWidth: 5,
              borderBottomWidth: 9,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#DC2626',
            }}
          />
        </Box>

        <Box
          style={{
            width: SIZE,
            height: SIZE,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: `${roseRotation}deg` }],
          }}
        >
          <Box
            className="absolute inset-0 rounded-full"
            style={{
              borderWidth: 5,
              borderColor: '#DBEAFE',
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
              { label: 'N', deg: 0, color: '#DC2626', size: 11 },
              { label: 'E', deg: 90, color: '#334155', size: 10 },
              { label: 'S', deg: 180, color: '#334155', size: 10 },
              { label: 'W', deg: 270, color: '#334155', size: 10 },
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
                  left: x - 6,
                  top: y - 6,
                  width: 12,
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
              height: 32,
              width: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2563EB',
              zIndex: 2,
            }}
          >
            <Navigation
              size={14}
              color="#fff"
              strokeWidth={2.4}
              style={{ transform: [{ rotate: '-45deg' }] }}
            />
          </Box>
        </Box>
      </Box>

      <VStack className="items-center" style={{ gap: 4 }}>
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: 20,
            lineHeight: 24,
            color: COLORS.ink,
          }}
        >
          {selected ? selected : '—'}
        </Text>
        <Text style={{ ...TYPE.label, color: COLORS.ink }}>
          {selected ? cardinalFullName(selected) : 'Tap a direction'}
        </Text>
      </VStack>

      <VStack style={{ width: '100%', gap: SPACE[2] }}>
        <Text style={{ ...TYPE.label, color: COLORS.ink }}>Facing direction *</Text>
        <HStack style={{ flexWrap: 'wrap', gap: 8 }}>
          {COMPASS_CARDINALS.map((k) => {
            const on = selected === k;
            return (
              <Pressable
                key={k}
                onPress={() => pick(k)}
                className="active:opacity-80"
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{
                  width: '22%',
                  flexGrow: 1,
                  minWidth: 64,
                  height: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                  borderRadius: 10,
                  backgroundColor: COLORS.white,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: on ? 0.1 : 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                  borderWidth: on ? 1.5 : 1,
                  borderColor: on ? COLORS.primary : COLORS.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 12,
                    color: COLORS.ink,
                    lineHeight: 14,
                  }}
                >
                  {k}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 9,
                    color: COLORS.ink,
                    lineHeight: 11,
                    marginTop: 1,
                  }}
                  numberOfLines={1}
                >
                  {cardinalFullName(k)}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </VStack>
    </VStack>
  );
}
