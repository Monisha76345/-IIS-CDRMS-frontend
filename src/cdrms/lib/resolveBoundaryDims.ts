/**
 * Resolve N/S/E/W plot sides for Boundaries + Dimensions stepper.
 * Two-part `A*B` → N=S=A, E=W=B (same as Site dimension label).
 */

export type CardinalDims = {
  north: number;
  south: number;
  east: number;
  west: number;
};

function num(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function fmtDim(n: number): string {
  if (!(n > 0)) return '';
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

export function parseSiteDimension(raw: string | null | undefined): CardinalDims | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .split(/[*xX××,/|\s]+/)
    .map((p) => Number(p.trim()))
    .filter((v) => Number.isFinite(v) && v > 0);

  if (parts.length === 1) {
    const a = parts[0]!;
    return { north: a, south: a, east: a, west: a };
  }
  if (parts.length === 2) {
    const [a, b] = parts as [number, number];
    return { north: a, south: a, east: b, west: b };
  }
  if (parts.length === 3) {
    return {
      north: parts[0]!,
      east: parts[1]!,
      south: parts[2]!,
      west: parts[1]!,
    };
  }
  if (parts.length >= 4) {
    return {
      north: parts[0]!,
      east: parts[1]!,
      south: parts[2]!,
      west: parts[3]!,
    };
  }
  return null;
}

export function siteDimensionToFormDims(raw: string | null | undefined): {
  north: string;
  south: string;
  east: string;
  west: string;
} | null {
  const parsed = parseSiteDimension(raw);
  if (!parsed) return null;
  return {
    north: fmtDim(parsed.north),
    south: fmtDim(parsed.south),
    east: fmtDim(parsed.east),
    west: fmtDim(parsed.west),
  };
}

export function computeBoundaryArea(dims: CardinalDims): number {
  const avgNS = (dims.north + dims.south) / 2;
  const avgEW = (dims.east + dims.west) / 2;
  if (!(avgNS > 0 && avgEW > 0)) return 0;
  return Number((avgNS * avgEW).toFixed(2));
}

export function resolveBoundaryDims(input: {
  dimNorth?: string | number | null;
  dimSouth?: string | number | null;
  dimEast?: string | number | null;
  dimWest?: string | number | null;
  siteDimension?: string | null;
  totalSiteArea?: string | number | null;
}): {
  dims: CardinalDims | null;
  total: number | null;
  source: 'engineer' | 'master' | null;
} {
  const engineer: CardinalDims = {
    north: num(input.dimNorth),
    south: num(input.dimSouth),
    east: num(input.dimEast),
    west: num(input.dimWest),
  };
  const hasEngineer = [engineer.north, engineer.south, engineer.east, engineer.west].every(
    (v) => v > 0,
  );

  if (hasEngineer) {
    return {
      dims: engineer,
      total: num(input.totalSiteArea) || computeBoundaryArea(engineer) || null,
      source: 'engineer',
    };
  }

  const parsed = parseSiteDimension(input.siteDimension);
  if (!parsed) return { dims: null, total: null, source: null };
  return {
    dims: parsed,
    total: computeBoundaryArea(parsed) || null,
    source: 'master',
  };
}
