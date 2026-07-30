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

const INK = '#94a3b8';
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
};

function shortBeside(raw: string | null | undefined, max = 18): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function fmtDim(v: number): string {
  if (!(v > 0)) return '—';
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
}

type Pt = { x: number; y: number };

/**
 * Engineering-style site dimensions card — visual parity with web SiteDimensionPlot
 * (survey frame, arrowed dimension lines, crop marks, N·North legend).
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
}: Props) {
  const dims: CardinalDims = {
    north: Math.max(0, Number(north) || 0),
    south: Math.max(0, Number(south) || 0),
    east: Math.max(0, Number(east) || 0),
    west: Math.max(0, Number(west) || 0),
  };
  const { north: n, south: s, east: e, west: w } = dims;
  const hasAny = [n, s, e, w].some((v) => v > 0);
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

  /** Plot geometry in centered SVG coords (web-style). */
  const avgNS = (n + s) / 2 || 1;
  const avgEW = (e + w) / 2 || 1;
  const target = 72;
  const scale = target / Math.max(avgNS, avgEW, 1);

  let tl: Pt;
  let tr: Pt;
  let br: Pt;
  let bl: Pt;

  if (odd && Math.abs(n - s) > 0.01 * Math.max(n, s, 1)) {
    const topW = Math.max(n * scale, 28);
    const botW = Math.max(s * scale, 28);
    const h = Math.max(((e + w) / 2) * scale, 28);
    tl = { x: -topW / 2, y: -h / 2 };
    tr = { x: topW / 2, y: -h / 2 };
    br = { x: botW / 2, y: h / 2 };
    bl = { x: -botW / 2, y: h / 2 };
  } else {
    const hw = Math.max(avgNS * scale, 28) / 2;
    const hh = Math.max(avgEW * scale, 28) / 2;
    tl = { x: -hw, y: -hh };
    tr = { x: hw, y: -hh };
    br = { x: hw, y: hh };
    bl = { x: -hw, y: hh };
  }

  const edges: {
    letter: keyof typeof DIM_COLORS;
    p0: Pt;
    p1: Pt;
    value: number;
  }[] = [
    { letter: 'N', p0: tl, p1: tr, value: n },
    { letter: 'E', p0: tr, p1: br, value: e },
    { letter: 'S', p0: br, p1: bl, value: s },
    { letter: 'W', p0: bl, p1: tl, value: w },
  ];

  const plotHw = Math.max(Math.abs(tl.x), Math.abs(tr.x), Math.abs(br.x), Math.abs(bl.x));
  const plotHh = Math.max(Math.abs(tl.y), Math.abs(tr.y), Math.abs(br.y), Math.abs(bl.y));
  const ext = 14;
  const tick = 4;
  /** Square viewBox so the plot stays optically centered on the card. */
  const labelPad = 86;
  const half = Math.max(plotHw, plotHh) + labelPad;
  const vbMinX = -half;
  const vbMinY = -half;
  const vbW = half * 2;
  const vbH = half * 2;

  const framePad = 46;
  const fx = vbMinX + framePad;
  const fy = vbMinY + framePad;
  const fw = vbW - framePad * 2;
  const fh = vbH - framePad * 2;

  const poly = `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`;
  const showCrop = !odd && Math.abs(n - s) < 0.5 && Math.abs(e - w) < 0.5;

  const eastBesideX = half - 14;
  const westBesideX = -half + 14;

  function outwardNormal(p0: Pt, p1: Pt): Pt {
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    let nx = p1.y - p0.y;
    let ny = -(p1.x - p0.x);
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    if (nx * mx + ny * my < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { x: nx, y: ny };
  }

  function arrowHead(at: Pt, toward: Pt, color: string, key: string) {
    const dx = toward.x - at.x;
    const dy = toward.y - at.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const size = 5.5;
    const bx = at.x + ux * size;
    const by = at.y + uy * size;
    const px = -uy;
    const py = ux;
    const p1 = `${at.x},${at.y}`;
    const p2 = `${bx + px * 3.2},${by + py * 3.2}`;
    const p3 = `${bx - px * 3.2},${by - py * 3.2}`;
    return <Polygon key={key} points={`${p1} ${p2} ${p3}`} fill={color} />;
  }

  return (
    <Box className="mt-3.5 overflow-hidden rounded-lg border border-slate-200/80 border-l-4 border-l-blue-600 bg-white shadow-sm">
      <HStack className="items-center justify-between border-b border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
        <HStack className="min-w-0 items-center gap-1.5">
          <Box className="h-6 w-6 items-center justify-center rounded-md bg-[#2563EB]">
            <Ruler size={12} color="#fff" strokeWidth={2.35} />
          </Box>
          <Text className="text-[15px] font-bold text-slate-900">Site dimensions</Text>
        </HStack>
        <HStack className="max-w-[55%] shrink items-center gap-1">
          <Box className="rounded-full border border-slate-200 bg-white px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-slate-700">{odd ? 'Odd' : 'Even'}</Text>
          </Box>
          {siteNo != null && String(siteNo).trim() !== '' ? (
            <Box className="max-w-[100px] rounded-full border border-slate-200 bg-white px-2 py-0.5">
              <Text className="text-[10px] font-semibold text-slate-900" numberOfLines={1}>
                {String(siteNo)}
              </Text>
            </Box>
          ) : null}
        </HStack>
      </HStack>

      <Box className="px-2.5 pb-2 pt-1.5">
        {!hasAny ? (
          <Text className="py-10 text-center text-[13px] text-slate-400">
            No plot dimensions available yet.
          </Text>
        ) : (
          <VStack className="gap-2">
            <Box className="w-full items-center justify-center overflow-hidden">
              <Svg
                width="100%"
                height={300}
                viewBox={`${vbMinX} ${vbMinY} ${vbW} ${vbH}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Survey compass frame — centered on plot origin */}
                <Rect
                  x={fx}
                  y={fy}
                  width={fw}
                  height={fh}
                  rx={10}
                  ry={10}
                  fill="none"
                  stroke={INK}
                  strokeWidth={1.1}
                  opacity={0.85}
                />
                <SvgText
                  x={0}
                  y={fy - 6}
                  textAnchor="middle"
                  fill={INK}
                  fontSize={13}
                  fontWeight="800"
                >
                  N
                </SvgText>
                <SvgText
                  x={fx + fw - 14}
                  y={0}
                  textAnchor="middle"
                  fill={INK}
                  fontSize={13}
                  fontWeight="800"
                  rotation={90}
                  origin={`${fx + fw - 14}, 0`}
                >
                  E
                </SvgText>
                <SvgText
                  x={0}
                  y={fy + fh + 14}
                  textAnchor="middle"
                  fill={INK}
                  fontSize={13}
                  fontWeight="800"
                >
                  S
                </SvgText>
                <SvgText
                  x={fx + 14}
                  y={0}
                  textAnchor="middle"
                  fill={INK}
                  fontSize={13}
                  fontWeight="800"
                  rotation={-90}
                  origin={`${fx + 14}, 0`}
                >
                  W
                </SvgText>

                {/* Plot fill + edges */}
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

                {/* Crop marks (Even rectangle) */}
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

                {/* Dimension lines + values */}
                {edges.map((ed) => {
                  const nor = outwardNormal(ed.p0, ed.p1);
                  const px = -nor.y * tick;
                  const py = nor.x * tick;
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
                  const beside = shortBeside(schedules[ed.letter], 14);
                  const besideLabel = beside ? `Beside ${beside}` : null;

                  return (
                    <G key={`dim-${ed.letter}`}>
                      <Line
                        x1={ed.p0.x - px}
                        y1={ed.p0.y - py}
                        x2={ed.p0.x + px}
                        y2={ed.p0.y + py}
                        stroke={color}
                        strokeWidth={0.85}
                        opacity={0.88}
                      />
                      <Line
                        x1={ed.p1.x - px}
                        y1={ed.p1.y - py}
                        x2={ed.p1.x + px}
                        y2={ed.p1.y + py}
                        stroke={color}
                        strokeWidth={0.85}
                        opacity={0.88}
                      />
                      <Line
                        x1={t1.x}
                        y1={t1.y}
                        x2={t2.x}
                        y2={t2.y}
                        stroke={color}
                        strokeWidth={1.15}
                      />
                      {arrowHead(t1, t2, color, `a0-${ed.letter}`)}
                      {arrowHead(t2, t1, color, `a1-${ed.letter}`)}
                      <SvgText
                        x={mid.x}
                        y={mid.y + 1}
                        textAnchor="middle"
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth={3}
                        fontSize={11}
                        fontWeight="800"
                      >
                        {fmtDim(ed.value)}
                      </SvgText>
                      {besideLabel && ed.letter === 'N' ? (
                        <SvgText
                          x={0}
                          y={vbMinY + 16}
                          textAnchor="middle"
                          fill={color}
                          fontSize={8}
                          fontWeight="700"
                        >
                          {besideLabel}
                        </SvgText>
                      ) : null}
                      {besideLabel && ed.letter === 'S' ? (
                        <SvgText
                          x={0}
                          y={vbMinY + vbH - 8}
                          textAnchor="middle"
                          fill={color}
                          fontSize={8}
                          fontWeight="700"
                        >
                          {besideLabel}
                        </SvgText>
                      ) : null}
                      {besideLabel && ed.letter === 'E' ? (
                        <SvgText
                          x={eastBesideX}
                          y={0}
                          textAnchor="middle"
                          fill={color}
                          fontSize={8}
                          fontWeight="700"
                          rotation={90}
                          origin={`${eastBesideX}, 0`}
                        >
                          {besideLabel}
                        </SvgText>
                      ) : null}
                      {besideLabel && ed.letter === 'W' ? (
                        <SvgText
                          x={westBesideX}
                          y={0}
                          textAnchor="middle"
                          fill={color}
                          fontSize={8}
                          fontWeight="700"
                          rotation={-90}
                          origin={`${westBesideX}, 0`}
                        >
                          {besideLabel}
                        </SvgText>
                      ) : null}
                    </G>
                  );
                })}
              </Svg>
            </Box>

            <HStack className="w-full flex-wrap justify-between gap-1 border-t border-slate-200/55 pt-1.5">
              {(['N', 'E', 'S', 'W'] as const).map((dir) => (
                <HStack
                  key={dir}
                  className="min-h-[28px] min-w-[22%] flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200/60 bg-slate-50/80 px-1 py-0.5"
                >
                  <Box
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: DIM_COLORS[dir] }}
                  />
                  <Text className="text-[10px] font-semibold text-slate-700" numberOfLines={1}>
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
