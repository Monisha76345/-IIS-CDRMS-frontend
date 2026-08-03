import { computeBoundaryArea, resolveBoundaryDims } from '@/src/cdrms/lib/resolveBoundaryDims';
import {
  buildSitePlotEdges,
  centroidOf,
  outwardNormal,
  type Pt,
} from '@/src/cdrms/lib/sitePlotGeometry';

const DIM_COLORS = {
  N: '#4A90E2',
  E: '#D35400',
  S: '#9B51E0',
  W: '#8B4513',
} as const;

const CROP = '#7F8C8D';

export type SiteDimensionPlotSvgInput = {
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

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function dimensionLabelRotationDeg(tdx: number, tdy: number): number {
  let ang = (Math.atan2(tdy, tdx) * 180) / Math.PI;
  if (ang > 90 || ang < -90) ang += 180;
  return ang;
}

function arrowHeadSvg(at: Pt, toward: Pt, color: string): string {
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
  return `<polygon points="${at.x},${at.y} ${bx + px * half},${by + py * half} ${bx - px * half},${by - py * half}" fill="${color}" />`;
}

function roadGlyphSvg(x: number, y: number, width = 42, height = 14): string {
  const left = x - width / 2;
  const top = y - height / 2;
  return `
    <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="2" ry="2" fill="#4B5563" stroke="#1F2937" stroke-width="0.6" />
    <line x1="${left + 1.2}" y1="${top + 1.4}" x2="${left + width - 1.2}" y2="${top + 1.4}" stroke="#9CA3AF" stroke-width="0.55" />
    <line x1="${left + 1.2}" y1="${top + height - 1.4}" x2="${left + width - 1.2}" y2="${top + height - 1.4}" stroke="#9CA3AF" stroke-width="0.55" />
    <line x1="${left + 2.5}" y1="${y}" x2="${left + width - 2.5}" y2="${y}" stroke="#FBBF24" stroke-width="1.1" stroke-dasharray="3.2 2.2" />
  `;
}

/** Engineering-style site dimensions SVG — parity with BoundariesDiagram / web SiteDimensionPlot. */
export function buildSiteDimensionPlotSvg(input: SiteDimensionPlotSvgInput): string | null {
  const n = Math.max(0, Number(input.north) || 0);
  const s = Math.max(0, Number(input.south) || 0);
  const e = Math.max(0, Number(input.east) || 0);
  const w = Math.max(0, Number(input.west) || 0);
  const hasAny = [n, s, e, w].every((v) => v > 0);
  if (!hasAny) return null;

  const area =
    input.totalArea != null && Number(input.totalArea) > 0
      ? Number(Number(input.totalArea).toFixed(2))
      : computeBoundaryArea({ north: n, south: s, east: e, west: w });

  const schedules = {
    N: input.scheduleNorth,
    E: input.scheduleEast,
    S: input.scheduleSouth,
    W: input.scheduleWest,
  } as const;

  const roadFlags = {
    N: input.roadNorth,
    E: input.roadEast,
    S: input.roadSouth,
    W: input.roadWest,
  } as const;

  const plot = buildSitePlotEdges(n, e, s, w, 74);
  if (!plot) return null;

  const { edges, verts, showCrop } = plot;
  const center = centroidOf(verts);
  const ext = 13;
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
    minX -= ext + 8;
    maxX += ext + 8;
    minY -= ext + 8;
    maxY += ext + 8;
    const contentCx = (minX + maxX) / 2;
    const contentCy = (minY + maxY) / 2;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    vbW = Math.max(280, contentW + labelPadX * 2);
    vbH = Math.max(250, contentH + labelPadY * 2);
    vbMinX = contentCx - vbW / 2;
    vbMinY = contentCy - vbH / 2;
  }

  const plotHw = Math.max(...verts.map((p) => Math.abs(p.x)));
  const plotHh = Math.max(...verts.map((p) => Math.abs(p.y)));
  const poly = verts.map((p) => `${p.x},${p.y}`).join(' ');

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

  const cropSvg = showCrop
    ? (
        [
          [-plotHw, -plotHh],
          [plotHw, -plotHh],
          [plotHw, plotHh],
          [-plotHw, plotHh],
        ] as const
      )
        .map(([cx, cy], i) => {
          const L = 5;
          const sx = Math.sign(cx) || 1;
          const sy = Math.sign(cy) || 1;
          return `
            <line x1="${cx}" y1="${cy}" x2="${cx - sx * L}" y2="${cy}" stroke="${CROP}" stroke-width="0.9" />
            <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - sy * L}" stroke="${CROP}" stroke-width="0.9" />
          `;
        })
        .join('')
    : '';

  const dimSvg = edges
    .map((ed) => {
      const nor = outwardNormal(ed.p0, ed.p1, center);
      const edgeLen = Math.hypot(ed.p1.x - ed.p0.x, ed.p1.y - ed.p0.y) || 1;
      const tdx = (ed.p1.x - ed.p0.x) / edgeLen;
      const tdy = (ed.p1.y - ed.p0.y) / edgeLen;
      const labelRot = dimensionLabelRotationDeg(tdx, tdy);
      const t1 = { x: ed.p0.x + nor.x * ext, y: ed.p0.y + nor.y * ext };
      const t2 = { x: ed.p1.x + nor.x * ext, y: ed.p1.y + nor.y * ext };
      const mid = { x: (t1.x + t2.x) / 2, y: (t1.y + t2.y) / 2 };
      const color = DIM_COLORS[ed.letter];
      const beside = shortBeside(schedules[ed.letter], 16);
      const isRoad = looksLikeRoad(schedules[ed.letter], roadFlags[ed.letter]);
      const besideLabel = beside ? `Beside ${beside}` : isRoad ? 'Beside Road' : null;
      const dimText = fmtDim(ed.value);
      const nb = besideLabel ? besidePos(ed.letter) : null;
      const halfGap = Math.min(edgeLen * 0.3, Math.max(10, 6.5 + dimText.length * 3.6));
      const g1 = { x: mid.x - tdx * halfGap, y: mid.y - tdy * halfGap };
      const g2 = { x: mid.x + tdx * halfGap, y: mid.y + tdy * halfGap };
      const tickStart = 1.8;
      const tickEnd = ext + 3.2;

      return `
        <g>
          <line x1="${ed.p0.x + nor.x * tickStart}" y1="${ed.p0.y + nor.y * tickStart}" x2="${ed.p0.x + nor.x * tickEnd}" y2="${ed.p0.y + nor.y * tickEnd}" stroke="${color}" stroke-width="0.85" opacity="0.9" />
          <line x1="${ed.p1.x + nor.x * tickStart}" y1="${ed.p1.y + nor.y * tickStart}" x2="${ed.p1.x + nor.x * tickEnd}" y2="${ed.p1.y + nor.y * tickEnd}" stroke="${color}" stroke-width="0.85" opacity="0.9" />
          <line x1="${t1.x}" y1="${t1.y}" x2="${g1.x}" y2="${g1.y}" stroke="${color}" stroke-width="1.15" />
          <line x1="${g2.x}" y1="${g2.y}" x2="${t2.x}" y2="${t2.y}" stroke="${color}" stroke-width="1.15" />
          ${arrowHeadSvg(t1, mid, color)}
          ${arrowHeadSvg(t2, mid, color)}
          <g transform="rotate(${labelRot} ${mid.x} ${mid.y})">
            <text x="${mid.x}" y="${mid.y}" text-anchor="middle" dominant-baseline="middle" fill="#0f172a" font-size="17" font-weight="800" font-family="Arial,sans-serif">${esc(dimText)}</text>
          </g>
          ${
            besideLabel && nb
              ? `<g transform="rotate(${nb.rot} ${nb.cx} ${nb.cy})">
                  ${isRoad ? roadGlyphSvg(nb.cx, nb.cy - 15) : ''}
                  <text x="${nb.cx}" y="${isRoad ? nb.cy + 9 : nb.cy}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="15" font-weight="700" font-family="Arial,sans-serif">${esc(besideLabel)}</text>
                </g>`
              : ''
          }
        </g>
      `;
    })
    .join('');

  const oddLabel = input.odd ? 'Odd' : 'Even';
  const siteNoLabel =
    input.siteNo != null && String(input.siteNo).trim() !== ''
      ? esc(String(input.siteNo))
      : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" width="100%" height="340" preserveAspectRatio="xMidYMid meet">
      <rect x="${vbMinX}" y="${vbMinY}" width="${vbW}" height="${vbH}" fill="#FAFBFC" />
      <text x="0" y="${-plotHh - 28}" text-anchor="middle" dominant-baseline="middle" fill="${DIM_COLORS.N}" font-size="20" font-weight="800" font-family="Arial,sans-serif">N</text>
      <text x="${eastLetterX}" y="0" text-anchor="middle" dominant-baseline="middle" fill="${DIM_COLORS.E}" font-size="20" font-weight="800" font-family="Arial,sans-serif">E</text>
      <text x="0" y="${plotHh + 28}" text-anchor="middle" dominant-baseline="middle" fill="${DIM_COLORS.S}" font-size="20" font-weight="800" font-family="Arial,sans-serif">S</text>
      <text x="${westLetterX}" y="0" text-anchor="middle" dominant-baseline="middle" fill="${DIM_COLORS.W}" font-size="20" font-weight="800" font-family="Arial,sans-serif">W</text>
      <polygon points="${poly}" fill="#f8fafc" stroke="none" />
      ${
        siteNoLabel
          ? `<text x="0" y="-9" text-anchor="middle" dominant-baseline="middle" fill="#64748B" font-size="11" font-weight="700" font-family="Arial,sans-serif">Site No</text>
      <text x="0" y="10" text-anchor="middle" dominant-baseline="middle" fill="#0F172A" font-size="16" font-weight="800" font-family="Arial,sans-serif">${siteNoLabel}</text>`
          : ''
      }
      ${edges
        .map(
          (ed) =>
            `<line x1="${ed.p0.x}" y1="${ed.p0.y}" x2="${ed.p1.x}" y2="${ed.p1.y}" stroke="${DIM_COLORS[ed.letter]}" stroke-width="2.35" />`,
        )
        .join('')}
      ${cropSvg}
      ${dimSvg}
    </svg>
    <div class="plot-footer">
      <span class="plot-tag">${esc(oddLabel)}</span>
      ${siteNoLabel ? `<span class="plot-tag">${siteNoLabel}</span>` : ''}
      ${
        area > 0
          ? `<div class="plot-area">Total Dimension = ${area.toFixed(2)} Sq. Yd</div>`
          : ''
      }
    </div>
  `;
}

export function buildSiteDimensionPlotSvgFromApp(app: {
  dimNorth?: string | number | null;
  dimSouth?: string | number | null;
  dimEast?: string | number | null;
  dimWest?: string | number | null;
  siteDimension?: string | null;
  totalSiteArea?: string | number | null;
  siteDimensionType?: string | null;
  siteNo?: string | number | null;
  scheduleNorth?: string | null;
  scheduleSouth?: string | null;
  scheduleEast?: string | null;
  scheduleWest?: string | null;
  scheduleRoadFlags?: Record<string, boolean> | null;
}): string | null {
  const boundary = resolveBoundaryDims(app);
  if (!boundary.dims) return null;
  const flags = app.scheduleRoadFlags ?? {};
  return buildSiteDimensionPlotSvg({
    north: boundary.dims.north,
    south: boundary.dims.south,
    east: boundary.dims.east,
    west: boundary.dims.west,
    odd: app.siteDimensionType === 'Odd',
    siteNo: app.siteNo,
    totalArea: boundary.total,
    scheduleNorth: app.scheduleNorth,
    scheduleSouth: app.scheduleSouth,
    scheduleEast: app.scheduleEast,
    scheduleWest: app.scheduleWest,
    roadNorth: flags.N ?? flags.n,
    roadSouth: flags.S ?? flags.s,
    roadEast: flags.E ?? flags.e,
    roadWest: flags.W ?? flags.w,
  });
}
