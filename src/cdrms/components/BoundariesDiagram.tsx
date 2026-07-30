import { Ruler } from 'lucide-react-native';
import Svg, { G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
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
import { COLORS, FONTS } from '@/src/cdrms/theme';

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
  width = 42,
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
        rx={2}
        ry={2}
        fill="#4B5563"
        stroke="#1F2937"
        strokeWidth={0.6}
      />
      {/* curb edges */}
      <Line
        x1={left + 1.2}
        y1={top + 1.4}
        x2={left + width - 1.2}
        y2={top + 1.4}
        stroke="#9CA3AF"
        strokeWidth={0.55}
      />
      <Line
        x1={left + 1.2}
        y1={top + height - 1.4}
        x2={left + width - 1.2}
        y2={top + height - 1.4}
        stroke="#9CA3AF"
        strokeWidth={0.55}
      />
      {/* horizontal dashed center line */}
      <Line
        x1={left + 2.5}
        y1={y}
        x2={left + width - 2.5}
        y2={y}
        stroke="#FBBF24"
        strokeWidth={1.1}
        strokeDasharray="3.2 2.2"
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
}: Props) {
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
  /** Extra horizontal room so W/E letter + Beside text don’t overlap. */
  const labelPadX = 118;
  const labelPadY = 88;

  let vbMinX = -160;
  let vbMinY = -140;
  let vbW = 320;
  let vbH = 280;
  if (edges.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const ed of edges) {
      for (const p of [ed.p0, ed.p1]) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }
    // Also include dimension-line offset so arrows stay inside
    minX -= ext + 8;
    maxX += ext + 8;
    minY -= ext + 8;
    maxY += ext + 8;

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    vbW = Math.max(280, contentW + labelPadX * 2);
    vbH = Math.max(250, contentH + labelPadY * 2);
    // Force plot content centered in viewBox
    const contentCx = (minX + maxX) / 2;
    const contentCy = (minY + maxY) / 2;
    vbMinX = contentCx - vbW / 2;
    vbMinY = contentCy - vbH / 2;
  }

  const plotHw = verts.length
    ? Math.max(...verts.map((p) => Math.abs(p.x)))
    : 0;
  const plotHh = verts.length
    ? Math.max(...verts.map((p) => Math.abs(p.y)))
    : 0;
  const poly = verts.map((p) => `${p.x},${p.y}`).join(' ');

  /** Compass letters sit near the plot; Beside labels sit further out (no overlap). */
  const westLetterX = -plotHw - 22;
  const eastLetterX = plotHw + 22;
  const westBesideX = vbMinX + 28;
  const eastBesideX = vbMinX + vbW - 28;
  const northBesideY = vbMinY + 24;
  const southBesideY = vbMinY + vbH - 22;

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
        borderRadius: 16,
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <HStack
        className="items-center justify-between"
        style={{
          paddingHorizontal: 14,
          paddingVertical: 12,
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
          <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}>
            Site dimensions
          </Text>
        </HStack>
        <HStack className="max-w-[55%] shrink items-center" style={{ gap: 6 }}>
          <Box
            style={{
              borderRadius: 8,
              backgroundColor: COLORS.white,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.ink }}>
              {odd ? 'Odd' : 'Even'}
            </Text>
          </Box>
          {siteNo != null && String(siteNo).trim() !== '' ? (
            <Box
              style={{
                maxWidth: 100,
                borderRadius: 8,
                backgroundColor: COLORS.white,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{ fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.ink }}
                numberOfLines={1}
              >
                {String(siteNo)}
              </Text>
            </Box>
          ) : null}
        </HStack>
      </HStack>

      <Box style={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: 8 }}>
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
          <VStack className="gap-2">
            <Box
              className="w-full items-center justify-center overflow-hidden"
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: '#FAFBFC',
                paddingVertical: 8,
              }}
            >
              <Svg
                width="100%"
                height={340}
                viewBox={`${vbMinX} ${vbMinY} ${vbW} ${vbH}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Compass — near plot; Beside labels sit further out */}
                <SvgText
                  x={0}
                  y={-plotHh - 28}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={DIM_COLORS.N}
                  fontSize={16}
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
                  fontSize={16}
                  fontWeight="800"
                >
                  E
                </SvgText>
                <SvgText
                  x={0}
                  y={plotHh + 28}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={DIM_COLORS.S}
                  fontSize={16}
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
                  fontSize={16}
                  fontWeight="800"
                >
                  W
                </SvgText>

                <Polygon points={poly} fill="#f8fafc" stroke="none" />
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
                          fontSize={14}
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
                              y={nb.cy - 15}
                              width={42}
                              height={14}
                            />
                          ) : null}
                          <SvgText
                            x={nb.cx}
                            y={isRoad ? nb.cy + 9 : nb.cy}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fill={color}
                            fontSize={13}
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
                gap: 6,
                paddingTop: 10,
                marginTop: 4,
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
              }}
            >
              {(['N', 'E', 'S', 'W'] as const).map((dir) => (
                <HStack
                  key={dir}
                  className="items-center justify-center"
                  style={{
                    minHeight: 30,
                    minWidth: '22%',
                    flex: 1,
                    gap: 6,
                    borderRadius: 10,
                    backgroundColor: '#FAFBFC',
                    paddingHorizontal: 6,
                    paddingVertical: 5,
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
                    style={{ fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.ink }}
                    numberOfLines={1}
                  >
                    {`${dir} · ${COMPASS_FULL[dir]}`}
                  </Text>
                </HStack>
              ))}
            </HStack>

            {area > 0 ? (
              <Box className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <Text className="text-center text-[12px] font-extrabold text-amber-900">
                  Total Dimension = {area.toFixed(2)} Sq. Yd
                </Text>
              </Box>
            ) : null}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
