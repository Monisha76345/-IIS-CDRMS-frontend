/**
 * Site plot geometry — parity with web `site-dimension-plot.tsx`
 * (axis-aligned rectangle vs convex quad from N/E/S/W side lengths).
 */

export type Pt = { x: number; y: number };

export type CardinalLetter = 'N' | 'E' | 'S' | 'W';

export type EdgeDraw = {
  letter: CardinalLetter;
  p0: Pt;
  p1: Pt;
  value: number;
};

const EPS = 1e-9;

function polygonSignedArea(pts: Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    s += pts[i]!.x * pts[j]!.y - pts[j]!.x * pts[i]!.y;
  }
  return s / 2;
}

function centroidPoly(pts: Pt[]): Pt {
  const a = polygonSignedArea(pts);
  if (Math.abs(a) < EPS) {
    let sx = 0;
    let sy = 0;
    for (const p of pts) {
      sx += p.x;
      sy += p.y;
    }
    return { x: sx / pts.length, y: sy / pts.length };
  }
  let bx = 0;
  let by = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const c = pts[i]!.x * pts[j]!.y - pts[j]!.x * pts[i]!.y;
    bx += (pts[i]!.x + pts[j]!.x) * c;
    by += (pts[i]!.y + pts[j]!.y) * c;
  }
  return { x: bx / (6 * a), y: by / (6 * a) };
}

function rotatePolyAround(pts: Pt[], rad: number, c: Pt): Pt[] {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return pts.map((p) => {
    const x = p.x - c.x;
    const y = p.y - c.y;
    return { x: c.x + x * cos - y * sin, y: c.y + x * sin + y * cos };
  });
}

function mirrorXVerts(verts: Pt[], cx: number): Pt[] {
  return verts.map((p) => ({ x: 2 * cx - p.x, y: p.y }));
}

function unitOutwardNormal(p0: Pt, p1: Pt, c: Pt): Pt {
  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;
  let nx = p1.y - p0.y;
  let ny = -(p1.x - p0.x);
  const len = Math.hypot(nx, ny) || 1;
  nx /= len;
  ny /= len;
  if (nx * (mx - c.x) + ny * (my - c.y) < 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: nx, y: ny };
}

function intersectTwoCircles(
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
): Pt[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  if (d < EPS) return [];
  if (d > r0 + r1 + 1e-5) return [];
  if (d < Math.abs(r0 - r1) - 1e-5) return [];
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  const h2 = r0 * r0 - a * a;
  if (h2 < -1e-5) return [];
  const h = Math.sqrt(Math.max(0, h2));
  const xm = x0 + (dx * a) / d;
  const ym = y0 + (dy * a) / d;
  const rx = (-dy * h) / d;
  const ry = (dx * h) / d;
  return [
    { x: xm + rx, y: ym + ry },
    { x: xm - rx, y: ym - ry },
  ];
}

function isConvexQuad(pts: Pt[]): boolean {
  if (pts.length !== 4) return false;
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const p0 = pts[i]!;
    const p1 = pts[(i + 1) % 4]!;
    const p2 = pts[(i + 2) % 4]!;
    const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
    if (Math.abs(cross) < 1e-7) continue;
    if (sign === 0) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign) return false;
  }
  return sign !== 0;
}

/** Cyclic survey order NW→NE→SE→SW with true side lengths N,E,S,W. */
export function solveConvexQuadFromSides(
  Ln: number,
  Le: number,
  Ls: number,
  Lw: number,
): Pt[] | null {
  const NW: Pt = { x: 0, y: 0 };
  const NE: Pt = { x: Ln, y: 0 };
  let best: { pts: Pt[]; area: number } | null = null;
  const STEPS = 120;
  for (let i = 1; i < STEPS; i++) {
    const gamma = (Math.PI * i) / STEPS;
    const sex = NE.x + Le * Math.cos(gamma);
    const sey = NE.y + Le * Math.sin(gamma);
    const hits = intersectTwoCircles(NW.x, NW.y, Lw, sex, sey, Ls);
    for (const SW of hits) {
      const pts = [NW, NE, { x: sex, y: sey }, SW];
      if (!isConvexQuad(pts)) continue;
      const area = Math.abs(polygonSignedArea(pts));
      if (!best || area > best.area) best = { pts, area };
    }
  }
  return best?.pts ?? null;
}

export function rectOppositeTol(Ln: number, Le: number, Ls: number, Lw: number): number {
  const m = Math.max(Ln, Le, Ls, Lw, 1);
  return Math.max(m * 0.015, 0.25);
}

/** Axis-aligned rectangle from averaged opposite sides (survey N top). */
export function buildAxisAlignedRectangle(
  Ln: number,
  Le: number,
  Ls: number,
  Lw: number,
): Pt[] {
  const w = (Ln + Ls) / 2;
  const h = (Le + Lw) / 2;
  const hw = w / 2;
  const hh = h / 2;
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
}

/** Scale + center into a half-box (web normalizeToBox). */
export function normalizeToBox(pts: Pt[], halfBox: number, fillScale = 0.96): Pt[] {
  let minX = pts[0]!.x;
  let minY = pts[0]!.y;
  let maxX = pts[0]!.x;
  let maxY = pts[0]!.y;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const w = Math.max(maxX - minX, EPS);
  const h = Math.max(maxY - minY, EPS);
  const s = (halfBox * 2 * fillScale) / Math.max(w, h);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return pts.map((p) => ({
    x: (p.x - cx) * s,
    y: (p.y - cy) * s,
  }));
}

type EdgeIx = { i0: number; i1: number; letter: CardinalLetter };

function edgeMidOnVerts(out: Pt[], e: EdgeIx): Pt {
  const p0 = out[e.i0]!;
  const p1 = out[e.i1]!;
  return { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
}

/** Rotate / mirror so N is top, E right, S bottom, W left. */
export function orientSurveyCardinal(verts: Pt[], ix: EdgeIx[]): Pt[] {
  if (verts.length < 3) return verts;
  let out = verts;
  const centroid = () => centroidPoly(out);

  const nIx = ix.find((e) => e.letter === 'N');
  const sIx = ix.find((e) => e.letter === 'S');
  const eIx = ix.find((e) => e.letter === 'E');

  const rotateNormalTo = (e: EdgeIx, tx: number, ty: number) => {
    const c = centroid();
    const p0 = out[e.i0]!;
    const p1 = out[e.i1]!;
    const n = unitOutwardNormal(p0, p1, c);
    const cross = n.x * ty - n.y * tx;
    const dot = n.x * tx + n.y * ty;
    out = rotatePolyAround(out, Math.atan2(cross, dot), c);
  };

  if (nIx) {
    rotateNormalTo(nIx, 0, -1);
    const c = centroid();
    const mid = edgeMidOnVerts(out, nIx);
    if (mid.y > c.y) out = rotatePolyAround(out, Math.PI, c);
  } else if (sIx) {
    rotateNormalTo(sIx, 0, 1);
    const c = centroid();
    const mid = edgeMidOnVerts(out, sIx);
    if (mid.y < c.y) out = rotatePolyAround(out, Math.PI, c);
  } else if (eIx) {
    rotateNormalTo(eIx, 1, 0);
    const c = centroid();
    const mid = edgeMidOnVerts(out, eIx);
    if (mid.x < c.x) out = rotatePolyAround(out, Math.PI, c);
  } else {
    const wIx = ix.find((e) => e.letter === 'W');
    if (wIx) {
      rotateNormalTo(wIx, -1, 0);
      const c = centroid();
      const mid = edgeMidOnVerts(out, wIx);
      if (mid.x > c.x) out = rotatePolyAround(out, Math.PI, c);
    }
  }

  const cPost = centroid();
  if (eIx) {
    const m = edgeMidOnVerts(out, eIx);
    if (m.x < cPost.x) out = mirrorXVerts(out, cPost.x);
  }

  return out;
}

export function buildSitePlotEdges(
  n: number,
  e: number,
  s: number,
  w: number,
  halfBox = 74,
): { verts: Pt[]; edges: EdgeDraw[]; showCrop: boolean } | null {
  if (!(n > 0 && e > 0 && s > 0 && w > 0)) return null;

  const tol = rectOppositeTol(n, e, s, w);
  let verts: Pt[] | null = null;
  const rectLike = Math.abs(n - s) < tol && Math.abs(e - w) < tol;
  if (rectLike) {
    verts = buildAxisAlignedRectangle(n, e, s, w);
  } else {
    verts = solveConvexQuadFromSides(n, e, s, w);
  }
  if (!verts) {
    // Fallback so UI still shows something when lengths can't form a closed quad
    verts = buildAxisAlignedRectangle(n, e, s, w);
  }

  const ix: EdgeIx[] = [
    { i0: 0, i1: 1, letter: 'N' },
    { i0: 1, i1: 2, letter: 'E' },
    { i0: 2, i1: 3, letter: 'S' },
    { i0: 3, i1: 0, letter: 'W' },
  ];
  verts = orientSurveyCardinal(verts, ix);
  verts = normalizeToBox(verts, halfBox);

  const values: Record<CardinalLetter, number> = { N: n, E: e, S: s, W: w };
  const edges: EdgeDraw[] = ix.map((edge) => ({
    letter: edge.letter,
    p0: verts![edge.i0]!,
    p1: verts![edge.i1]!,
    value: values[edge.letter],
  }));

  return { verts, edges, showCrop: rectLike };
}

export function outwardNormal(p0: Pt, p1: Pt, center: Pt): Pt {
  return unitOutwardNormal(p0, p1, center);
}

export function centroidOf(pts: Pt[]): Pt {
  return centroidPoly(pts);
}
