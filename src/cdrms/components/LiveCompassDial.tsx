import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Line, Polygon, Text as SvgText } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  cardinalNameFromHeading,
  formatLiveReading,
  parseCompassReading,
  SIMULATOR_COMPASS_FACE,
  SIMULATOR_COMPASS_HEADING,
  type CompassCardinal,
  useCompass,
} from '@/src/cdrms/hooks/useCompass';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import {
  CARDINAL_ACCENT,
  COLORS,
  DESIGN,
  FONTS,
  GLASS,
  SPACE,
  TYPE,
  cardinalAccentColor,
  hexAlpha,
} from '@/src/cdrms/theme';

const DIAL = 216;
/** Padding outside tick ring so degree labels are not clipped. */
const LABEL_PAD = 24;
const SIZE = DIAL + LABEL_PAD * 2;
const CENTER = SIZE / 2;
const TICK_INNER = 88;
const TICK_OUTER = 100;
const NUMBER_R = 112;
const LABEL_R = 68;

const RING_DEGREES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/** 0° at bottom, clockwise — matches native compass apps. */
function dialRad(deg: number): number {
  return ((deg + 90) * Math.PI) / 180;
}

function dialPoint(deg: number, radius: number) {
  const rad = dialRad(deg);
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function decimalToDms(decimal: number): string {
  const abs = Math.abs(decimal);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60);
  return `${d}°${m}'${s}"`;
}

/**
 * Live sensor compass (real device).
 * Simulator / no-sensor: auto-seeds North so Continue can unlock.
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
  const accent = cardinalAccentColor(face);
  const roseRotation = -heading;
  const hasReading = Boolean(draft.compassReading.trim());
  const directionName = hasReading ? cardinalNameFromHeading(heading) : '—';
  const needsManualPick =
    !compass.available ||
    compass.source === 'simulator' ||
    compass.status === 'unavailable' ||
    compass.status === 'permission';

  const tickMajor = hexAlpha(COLORS.primary, 0.42);
  const tickMinor = hexAlpha(COLORS.primary, 0.18);
  const dialLabels = [
    { label: 'N', deg: 0, color: CARDINAL_ACCENT.N, size: 18 },
    { label: 'E', deg: 90, color: CARDINAL_ACCENT.E, size: 15 },
    { label: 'S', deg: 180, color: CARDINAL_ACCENT.S, size: 15 },
    { label: 'W', deg: 270, color: CARDINAL_ACCENT.W, size: 15 },
  ] as const;

  const gps = draft.gps;
  const nl = gps ? decimalToDms(gps.latitude) : '—';
  const el = gps ? decimalToDms(gps.longitude) : '—';
  const elevation =
    gps?.altitude != null && Number.isFinite(gps.altitude)
      ? `${gps.altitude.toFixed(1)}m`
      : '—';

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

  return (
    <VStack className="items-center" style={{ gap: SPACE[3], width: '100%' }}>
      {needsManualPick ? (
        <Text
          style={{
            ...TYPE.caption,
            fontFamily: FONTS.semibold,
            color: COLORS.slate,
            textAlign: 'center',
          }}
        >
          {compass.source === 'simulator' || compass.status === 'unavailable'
            ? `No live compass · facing set to ${SIMULATOR_COMPASS_FACE}.`
            : 'Allow location / use a real device for live compass.'}
        </Text>
      ) : null}

      <Box
        className="relative items-center justify-center"
        style={{
          width: SIZE,
          height: SIZE,
          overflow: 'visible',
        }}
      >
        <Svg width={SIZE} height={SIZE} pointerEvents="none" style={{ overflow: 'visible' }}>
          {Array.from({ length: 72 }).map((_, i) => {
            const deg = i * 5;
            const major = deg % 30 === 0;
            const inner = major ? TICK_INNER - 4 : TICK_INNER;
            const outer = TICK_OUTER;
            const a = dialPoint(deg, inner);
            const b = dialPoint(deg, outer);
            const inArc = hasReading && deg <= heading;
            return (
              <Line
                key={`tick-${deg}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={inArc ? accent : major ? tickMajor : tickMinor}
                strokeWidth={major ? 1.8 : 1}
                strokeOpacity={inArc ? 1 : 1}
              />
            );
          })}

          {RING_DEGREES.map((deg) => {
            const { x, y } = dialPoint(deg, NUMBER_R);
            const inArc = hasReading && deg <= heading;
            return (
              <SvgText
                key={`num-${deg}`}
                x={x}
                y={y}
                fill={deg === 0 || inArc ? accent : COLORS.slate}
                fontSize={11}
                fontWeight="700"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {String(deg)}
              </SvgText>
            );
          })}

          {(() => {
            const tip = dialPoint(0, TICK_INNER - 10);
            const left = dialPoint(352, TICK_INNER - 2);
            const right = dialPoint(8, TICK_INNER - 2);
            return (
              <Polygon
                points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
                fill={CARDINAL_ACCENT.N}
              />
            );
          })()}
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
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
          {dialLabels.map((d) => {
            const { x, y } = dialPoint(d.deg, LABEL_R);
            return (
              <Text
                key={d.label}
                style={{
                  position: 'absolute',
                  left: x - d.size * 0.55,
                  top: y - d.size * 0.55,
                  width: d.size * 1.1,
                  textAlign: 'center',
                  fontSize: d.size,
                  fontFamily: FONTS.bold,
                  fontWeight: '900',
                  color: d.color,
                }}
              >
                {d.label}
              </Text>
            );
          })}
        </Animated.View>

        <Box pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 36,
              lineHeight: 40,
              color: COLORS.primaryDeep,
              fontWeight: '800',
            }}
          >
            {hasReading ? `${heading}°` : '—'}
          </Text>
        </Box>
      </Box>

      <Text
        style={{
          fontFamily: FONTS.bold,
          fontSize: 17,
          color: accent,
          textAlign: 'center',
        }}
      >
        {directionName}
      </Text>

      <Box
        style={{
          width: '100%',
          borderRadius: DESIGN.cardRadius,
          backgroundColor: GLASS.tintBlue,
          borderWidth: 1,
          borderColor: hexAlpha(COLORS.primary, 0.12),
          paddingVertical: SPACE[3],
          paddingHorizontal: SPACE[4],
          gap: SPACE[2],
        }}
      >
        <HStack style={{ justifyContent: 'space-around' }}>
          <VStack className="items-center" style={{ gap: 2, flex: 1 }}>
            <Text style={{ ...TYPE.caption, fontFamily: FONTS.semibold, color: COLORS.slate, fontSize: 10 }}>
              NL
            </Text>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink, fontWeight: '800' }}>
              {nl}
            </Text>
          </VStack>
          <Box style={{ width: 1, backgroundColor: GLASS.divider, alignSelf: 'stretch' }} />
          <VStack className="items-center" style={{ gap: 2, flex: 1 }}>
            <Text style={{ ...TYPE.caption, fontFamily: FONTS.semibold, color: COLORS.slate, fontSize: 10 }}>
              EL
            </Text>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink, fontWeight: '800' }}>
              {el}
            </Text>
          </VStack>
        </HStack>

        <Box style={{ height: 1, backgroundColor: GLASS.divider }} />

        <HStack className="items-center justify-between">
          <Text style={{ fontFamily: FONTS.bold, color: COLORS.ink, fontSize: 13 }}>Elevation</Text>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink, fontWeight: '800' }}>
            {elevation}
          </Text>
        </HStack>
      </Box>
    </VStack>
  );
}
