import { useState } from 'react';
import { Dimensions } from 'react-native';
import { Ruler } from 'lucide-react-native';
import Svg, { G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  computeBoundaryArea,
  type CardinalDims,
} from '@/src/cdrms/lib/resolveBoundaryDims';
import {
  buildSitePlotEdges,
  centroidOf,
  outwardNormal,
  type Pt,
} from '@/src/cdrms/lib/sitePlotGeometry';
import { COLORS, FONTS, GLASS, hexAlpha } from '@/src/cdrms/theme';

/** Same palette as web SiteDimensionPlot */
const DIM_COLORS = {
  N: '#4A90E2',
  E: '#D35400',
  S: '#9B51E0',
  W: '#8B4513',
} as const;

const COMPASS_FULL = {
  N: 'North',
  E: 'East',
  S: 'South',
  W: 'West',
} as const;

const CROP = '#7F8C8D';

type Props = {
  north: number;
  south: number;
  east: number;
  west: number;
  odd?: boolean;
  siteNo?: string | number | null;
  totalArea?: number | null;
  scheduleNorth?: string | null;
  scheduleSouth?: string | null;
  scheduleEast?: string | null;
  scheduleWest?: string | null;
  roadNorth?: boolean;
  roadSouth?: boolean;
  roadEast?: boolean;
  roadWest?: boolean;
  /** Hide inner title bar when wrapped in GlassSectionCard */
  embedded?: boolean;
};

function shortBeside(raw: string | null | undefined, max = 20): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function looksLikeRoad(raw: string | null | undefined, roadFlag?: boolean): boolean {
  if (roadFlag) return true;
  return /\broad\b/i.test(raw || '');
}

function fmtDim(v: number): string {
  if (!(v > 0)) return '—';
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
}

/** Web `dimensionLabelRotationDeg` — keeps numbers readable along the dimension line. */
function dimensionLabelRotationDeg(tdx: number, tdy: number): number {
  let ang = (Math.atan2(tdy, tdx) * 180) / Math.PI;
  if (ang > 90 || ang < -90) ang += 180;
  return ang;
}

/** Road strip (asphalt + dashed center). Rotate via parent for E/W vertical. */
function RoadGlyph({
  x,
  y,
  width = 220,
  height = 14,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
}) {
  const left = x - width / 2;
  const top = y - height / 2;
  return (
    <G>
      <Rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={3}
        ry={3}
        fill="#374151"
        stroke="#1F2937"
        strokeWidth={0.8}
      />
      {/* curb edges */}
      <Line
        x1={left + 1.2}
        y1={top + 1.4}
        x2={left + width - 1.2}
        y2={top + 1.4}
        stroke="#9CA3AF"
        strokeWidth={0.6}
      />
      <Line
        x1={left + 1.2}
        y1={top + height - 1.4}
        x2={left + width - 1.2}
        y2={top + height - 1.4}
        stroke="#9CA3AF"
        strokeWidth={0.6}
      />
      {/* horizontal dashed center line */}
      <Line
        x1={left + 4}
        y1={y}
        x2={left + width - 4}
        y2={y}
        stroke="#FBBF24"
        strokeWidth={1.3}
        strokeDasharray="6 4"
      />
    </G>
  );
}

function arrowHead(at: Pt, toward: Pt, color: string, key: string) {
  /** Match web SVG marker: tip at outer end, ~7×7 user units. */
  const dx = toward.x - at.x;
  const dy = toward.y - at.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const depth = 7;
  const half = 3.5;
  const bx = at.x + ux * depth;
  const by = at.y + uy * depth;
  const px = -uy;
  const py = ux;
  return (
    <Polygon
      key={key}
      points={`${at.x},${at.y} ${bx + px * half},${by + py * half} ${bx - px * half},${by - py * half}`}
      fill={color}
    />
  );
}

/**
 * Engineering-style site dimensions — parity with web SiteDimensionPlot
 * (frame, gaps, rotated E/W dimension numbers, survey compass letters).
 */
type AreaUnit = 'sqft' | 'sqm';

export function BoundariesDiagram({
  north,
  south,
  east,
  west,
  odd = false,
  siteNo,
  totalArea,
  scheduleNorth,
  scheduleSouth,
  scheduleEast,
  scheduleWest,
  roadNorth,
  roadSouth,
  roadEast,
  roadWest,
  embedded = false,
}: Props) {
  const [unit, setUnit] = useState<AreaUnit>('sqft');

  const dims: CardinalDims = {
    north: Math.max(0, Number(north) || 0),
    south: Math.max(0, Number(south) || 0),
    east: Math.max(0, Number(east) || 0),
    west: Math.max(0, Number(west) || 0),
  };
  const { north: n, south: s, east: e, west: w } = dims;
  const hasAny = [n, s, e, w].every((v) => v > 0);
  const area =
    totalArea != null && Number(totalArea) > 0
      ? Number(Number(totalArea).toFixed(2))
      : computeBoundaryArea(dims);

  const getFormattedArea = () => {
    if (unit === 'sqm') {
      const sqmVal = area * 0.092903;
      return { val: sqmVal.toFixed(2), label: 'Sq. M' };
    }
    return { val: area.toFixed(2), label: 'Sq. Ft' };
  };

  const schedules = {
    N: scheduleNorth,
    E: scheduleEast,
    S: scheduleSouth,
    W: scheduleWest,
  } as const;

  const roadFlags = {
    N: roadNorth,
    E: roadEast,
    S: roadSouth,
    W: roadWest,
  } as const;

  const plot = hasAny ? buildSitePlotEdges(n, e, s, w, 74) : null;
  const edges = plot?.edges ?? [];
  const verts = plot?.verts ?? [];
  const showCrop = Boolean(plot?.showCrop);
  const center = verts.length ? centroidOf(verts) : { x: 0, y: 0 };

  /** Same as web SiteBlueprintSvg */
  const ext = 13;
  const dimReach = ext + 8;
  /** Outward room for rotated Beside labels (symmetric around plot origin). */
  const besideReach = 54;
  /** Extra gap below N / above S compass letters before beside + road labels. */
  const besideLabelGap = 42;

  let vbMinX = -160;
  let vbMinY = -140;
  let vbW = 320;
  let vbH = 280;

  const plotHw = verts.length
    ? Math.max(...verts.map((p) => Math.abs(p.x)))
    : 0;
  const plotHh = verts.length
    ? Math.max(...verts.map((p) => Math.abs(p.y)))
    : 0;
  const poly = verts.map((p) => `${p.x},${p.y}`).join(' ');

  /** Same outward gap for N/S and E/W compass letters (keeps letters off dimension numbers). */
  const COMPASS_LETTER_OFFSET = 32;

  if (edges.length > 0) {
    // Plot is built around (0,0) — keep viewBox symmetric so the diagram stays centered in the card.
    const halfW = plotHw + dimReach + COMPASS_LETTER_OFFSET + besideReach;
    const halfH = plotHh + dimReach + COMPASS_LETTER_OFFSET + besideReach;
    vbW = Math.max(240, halfW * 2);
    vbH = Math.max(210, halfH * 2);
    vbMinX = -vbW / 2;
    vbMinY = -vbH / 2;
  }

  /** Compass letters sit outside the plot; Beside labels sit further out (plot-relative, symmetric). */
  const westLetterX = -plotHw - COMPASS_LETTER_OFFSET;
  const eastLetterX = plotHw + COMPASS_LETTER_OFFSET;
  const westBesideX = -plotHw - dimReach - 34;
  const eastBesideX = plotHw + dimReach + 34;
  const northBesideY = -plotHh - dimReach - besideLabelGap;
  const southBesideY = plotHh + dimReach + besideLabelGap;

  /** Match viewBox aspect so RN SVG fills the frame and stays centered (not shifted right). */
  const cardInnerWidth = Math.max(280, Dimensions.get('window').width - 72);
  const viewAspect = vbW / vbH;
  let diagramWidth = cardInnerWidth;
  let diagramHeight = diagramWidth / viewAspect;
  if (diagramHeight > 268) {
    diagramHeight = 268;
    diagramWidth = diagramHeight * viewAspect;
  } else if (diagramHeight < 220) {
    diagramHeight = 220;
    diagramWidth = diagramHeight * viewAspect;
  }
  diagramWidth = Math.round(diagramWidth);
  diagramHeight = Math.round(diagramHeight);

  function besidePos(letter: keyof typeof DIM_COLORS) {
    switch (letter) {
      case 'N':
        return { cx: 0, cy: northBesideY, rot: 0 };
      case 'S':
        return { cx: 0, cy: southBesideY, rot: 0 };
      case 'E':
        return { cx: eastBesideX, cy: 0, rot: 90 };
      case 'W':
        return { cx: westBesideX, cy: 0, rot: -90 };
      default:
        return { cx: 0, cy: 0, rot: 0 };
    }
  }

  return (
    <Box
      style={{
        overflow: 'hidden',
        borderRadius: embedded ? 12 : 16,
        backgroundColor: COLORS.white,
        borderWidth: embedded ? 1.5 : 1,
        borderColor: embedded ? hexAlpha(COLORS.primary, 0.35) : COLORS.border,
        ...(embedded
          ? {
              shadowColor: COLORS.primaryDeep,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
            }
          : {
              borderWidth: 1.5,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 3,
            }),
      }}
    >
      {!embedded ? (
      <HStack
        className="items-center justify-between"
        style={{
          paddingHorizontal: 12,
          paddingVertical: 9,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: '#FAFBFC',
        }}
      >
        <HStack className="min-w-0 items-center" style={{ gap: 8 }}>
          <Box
            style={{
              height: 30,
              width: 30,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9,
              backgroundColor: COLORS.primary,
            }}
          >
            <Ruler size={13} color="#fff" strokeWidth={2.35} />
          </Box>
          <Text style={{ fontFamily: FONTS.bold, fontWeight: '800', fontSize: 15, color: COLORS.ink }}>
            Site dimensions
          </Text>
        </HStack>
        <HStack className="max-w-[55%] shrink items-center" style={{ gap: 6 }}>
          <Box
            style={{
              borderRadius: 8,
              backgroundColor: odd ? '#FFE4E6' : '#D1FAE5',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: odd ? '#FDA4AF' : '#A7F3D0',
            }}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: odd ? '#BE123C' : '#047857' }}>
              {odd ? 'Odd' : 'Even'}
            </Text>
          </Box>
        </HStack>
      </HStack>
      ) : null}

      <Box style={{ paddingHorizontal: 10, paddingBottom: 8, paddingTop: embedded ? 8 : 4 }}>
        {!hasAny || !plot ? (
          <Box
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderStyle: 'dashed',
              backgroundColor: '#F8FAFC',
              paddingVertical: 36,
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 13,
                color: COLORS.ink,
                textAlign: 'center',
              }}
            >
              Enter all 4 dimensions to see the site plot.
            </Text>
          </Box>
        ) : (
          <VStack style={{ gap: 6 }}>
            <Box
              className="w-full overflow-hidden"
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: '#FAFBFC',
                paddingVertical: 2,
              }}
            >
              <Svg
                width={diagramWidth}
                height={diagramHeight}
                viewBox={`${vbMinX} ${vbMinY} ${vbW} ${vbH}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Compass — near plot; Beside labels sit further out */}
                <SvgText
                  x={0}
                  y={-plotHh - COMPASS_LETTER_OFFSET}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={DIM_COLORS.N}
                  fontSize={20}
                  fontWeight="800"
                >
                  N
                </SvgText>
                <SvgText
                  x={eastLetterX}
                  y={0}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={DIM_COLORS.E}
                  fontSize={20}
                  fontWeight="800"
                >
                  E
                </SvgText>
                <SvgText
                  x={0}
                  y={plotHh + COMPASS_LETTER_OFFSET}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={DIM_COLORS.S}
                  fontSize={20}
                  fontWeight="800"
                >
                  S
                </SvgText>
                <SvgText
                  x={westLetterX}
                  y={0}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={DIM_COLORS.W}
                  fontSize={20}
                  fontWeight="800"
                >
                  W
                </SvgText>

                <Polygon points={poly} fill="#f8fafc" stroke="none" />
                {siteNo != null && String(siteNo).trim() !== '' ? (
                  <G>
                    <SvgText
                      x={center.x}
                      y={center.y - 9}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill={COLORS.slate}
                      fontSize={11}
                      fontWeight="700"
                    >
                      Site No
                    </SvgText>
                    <SvgText
                      x={center.x}
                      y={center.y + 10}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill={COLORS.ink}
                      fontSize={16}
                      fontWeight="800"
                    >
                      {String(siteNo).trim()}
                    </SvgText>
                  </G>
                ) : null}
                {edges.map((ed) => (
                  <Line
                    key={`edge-${ed.letter}`}
                    x1={ed.p0.x}
                    y1={ed.p0.y}
                    x2={ed.p1.x}
                    y2={ed.p1.y}
                    stroke={DIM_COLORS[ed.letter]}
                    strokeWidth={2.35}
                  />
                ))}

                {showCrop
                  ? (
                    [
                      [-plotHw, -plotHh],
                      [plotHw, -plotHh],
                      [plotHw, plotHh],
                      [-plotHw, plotHh],
                    ] as const
                  ).map(([cx, cy], i) => {
                    const L = 5;
                    const sx = Math.sign(cx) || 1;
                    const sy = Math.sign(cy) || 1;
                    return (
                      <G key={`crop-${i}`}>
                        <Line
                          x1={cx}
                          y1={cy}
                          x2={cx - sx * L}
                          y2={cy}
                          stroke={CROP}
                          strokeWidth={0.9}
                        />
                        <Line
                          x1={cx}
                          y1={cy}
                          x2={cx}
                          y2={cy - sy * L}
                          stroke={CROP}
                          strokeWidth={0.9}
                        />
                      </G>
                    );
                  })
                  : null}

                {edges.map((ed) => {
                  const nor = outwardNormal(ed.p0, ed.p1, center);
                  const edgeLen =
                    Math.hypot(ed.p1.x - ed.p0.x, ed.p1.y - ed.p0.y) || 1;
                  const tdx = (ed.p1.x - ed.p0.x) / edgeLen;
                  const tdy = (ed.p1.y - ed.p0.y) / edgeLen;
                  const labelRot = dimensionLabelRotationDeg(tdx, tdy);

                  const t1 = {
                    x: ed.p0.x + nor.x * ext,
                    y: ed.p0.y + nor.y * ext,
                  };
                  const t2 = {
                    x: ed.p1.x + nor.x * ext,
                    y: ed.p1.y + nor.y * ext,
                  };
                  const mid = { x: (t1.x + t2.x) / 2, y: (t1.y + t2.y) / 2 };
                  const color = DIM_COLORS[ed.letter];
                  const beside = shortBeside(schedules[ed.letter], 16);
                  const isRoad = looksLikeRoad(schedules[ed.letter], roadFlags[ed.letter]);
                  const besideLabel = beside
                    ? `Beside ${beside}`
                    : isRoad
                      ? 'Beside Road'
                      : null;
                  const dimText = fmtDim(ed.value);
                  const nb = besideLabel ? besidePos(ed.letter) : null;

                  /** Gap in dim line for the number (web “break” look). */
                  const halfGap = Math.min(
                    edgeLen * 0.3,
                    Math.max(10, 6.5 + dimText.length * 3.6),
                  );
                  const g1 = {
                    x: mid.x - tdx * halfGap,
                    y: mid.y - tdy * halfGap,
                  };
                  const g2 = {
                    x: mid.x + tdx * halfGap,
                    y: mid.y + tdy * halfGap,
                  };

                  /** Extension ticks: small gap from edge, past the dim line (web screenshot). */
                  const tickStart = 1.8;
                  const tickEnd = ext + 3.2;

                  return (
                    <G key={`dim-${ed.letter}`}>
                      <Line
                        x1={ed.p0.x + nor.x * tickStart}
                        y1={ed.p0.y + nor.y * tickStart}
                        x2={ed.p0.x + nor.x * tickEnd}
                        y2={ed.p0.y + nor.y * tickEnd}
                        stroke={color}
                        strokeWidth={0.85}
                        opacity={0.9}
                      />
                      <Line
                        x1={ed.p1.x + nor.x * tickStart}
                        y1={ed.p1.y + nor.y * tickStart}
                        x2={ed.p1.x + nor.x * tickEnd}
                        y2={ed.p1.y + nor.y * tickEnd}
                        stroke={color}
                        strokeWidth={0.85}
                        opacity={0.9}
                      />

                      {/* Two dim-line halves + clear center gap for value */}
                      <Line
                        x1={t1.x}
                        y1={t1.y}
                        x2={g1.x}
                        y2={g1.y}
                        stroke={color}
                        strokeWidth={1.15}
                        strokeLinecap="butt"
                      />
                      <Line
                        x1={g2.x}
                        y1={g2.y}
                        x2={t2.x}
                        y2={t2.y}
                        stroke={color}
                        strokeWidth={1.15}
                        strokeLinecap="butt"
                      />
                      {arrowHead(t1, mid, color, `a0-${ed.letter}`)}
                      {arrowHead(t2, mid, color, `a1-${ed.letter}`)}

                      {/* Dimension value — rotated along line like web */}
                      <G transform={`rotate(${labelRot} ${mid.x} ${mid.y})`}>
                        <SvgText
                          x={mid.x}
                          y={mid.y}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          fill="#0f172a"
                          fontSize={17}
                          fontWeight="800"
                        >
                          {dimText}
                        </SvgText>
                      </G>

                      {besideLabel && nb ? (
                        <G transform={`rotate(${nb.rot} ${nb.cx} ${nb.cy})`}>
                          {isRoad ? (
                            <RoadGlyph
                              x={nb.cx}
                              y={
                                ed.letter === 'S'
                                  ? nb.cy + 6
                                  : ed.letter === 'N'
                                    ? nb.cy - 6
                                    : nb.cy - 15
                              }
                              width={140}
                              height={14}
                            />
                          ) : null}
                          <SvgText
                            x={nb.cx}
                            y={
                              isRoad
                                ? ed.letter === 'S'
                                  ? nb.cy + 24
                                  : ed.letter === 'N'
                                    ? nb.cy - 24
                                    : nb.cy + 9
                                : nb.cy
                            }
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fill={color}
                            fontSize={15}
                            fontWeight="700"
                          >
                            {besideLabel}
                          </SvgText>
                        </G>
                      ) : null}
                    </G>
                  );
                })}
              </Svg>
            </Box>

            <HStack
              className="w-full flex-wrap justify-between"
              style={{
                gap: 5,
                paddingTop: 6,
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
              }}
            >
              {(['N', 'E', 'S', 'W'] as const).map((dir) => (
                <HStack
                  key={dir}
                  className="items-center justify-center"
                  style={{
                    minHeight: 26,
                    minWidth: '22%',
                    flex: 1,
                    gap: 5,
                    borderRadius: 8,
                    backgroundColor: '#FAFBFC',
                    paddingHorizontal: 5,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Box
                    style={{
                      height: 8,
                      width: 8,
                      borderRadius: 4,
                      backgroundColor: DIM_COLORS[dir],
                    }}
                  />
                  <Text
                    style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.ink }}
                    numberOfLines={1}
                  >
                    {`${dir} · ${COMPASS_FULL[dir]}`}
                  </Text>
                </HStack>
              ))}
            </HStack>

            {area > 0 ? (
              <Box
                style={{
                  borderRadius: 12,
                  backgroundColor: '#FEF3C7',
                  borderWidth: 1,
                  borderColor: '#FDE68A',
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                }}
              >
                <HStack style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <VStack style={{ gap: 1 }}>
                    <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Total Area
                    </Text>
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#78350F' }}>
                      {getFormattedArea().val}{' '}
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#92400E' }}>
                        {getFormattedArea().label}
                      </Text>
                    </Text>
                  </VStack>

                  {/* Interactive Unit Toggle: Sq. Ft <-> Sq. M */}
                  <HStack
                    style={{
                      backgroundColor: '#FFFFFF',
                      padding: 3,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#FCD34D',
                      gap: 2,
                    }}
                  >
                    <Pressable
                      onPress={() => setUnit('sqft')}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 7,
                        backgroundColor: unit === 'sqft' ? COLORS.primary : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.bold,
                          fontSize: 11,
                          color: unit === 'sqft' ? '#FFFFFF' : '#78350F',
                        }}
                      >
                        Sq. Ft
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setUnit('sqm')}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 7,
                        backgroundColor: unit === 'sqm' ? COLORS.primary : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.bold,
                          fontSize: 11,
                          color: unit === 'sqm' ? '#FFFFFF' : '#78350F',
                        }}
                      >
                        Sq. M
                      </Text>
                    </Pressable>
                  </HStack>
                </HStack>
              </Box>
            ) : null}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
