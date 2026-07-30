export const COMPASS_CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type CompassCardinal = (typeof COMPASS_CARDINALS)[number];

const CARDINAL_NAMES: Record<CompassCardinal, string> = {
  N: 'North',
  NE: 'Northeast',
  E: 'East',
  SE: 'Southeast',
  S: 'South',
  SW: 'Southwest',
  W: 'West',
  NW: 'Northwest',
};

/** Fixed degrees for each cardinal chip. */
export const CARDINAL_DEGREES: Record<CompassCardinal, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

function normalizeHeading(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  return ((deg % 360) + 360) % 360;
}

export function cardinalFromHeading(heading: number): CompassCardinal {
  if (!Number.isFinite(heading)) return 'N';
  const index = Math.round(normalizeHeading(heading) / 45) % 8;
  return COMPASS_CARDINALS[index];
}

export function cardinalNameFromHeading(heading: number): string {
  return CARDINAL_NAMES[cardinalFromHeading(heading)];
}

export function cardinalFullName(face: CompassCardinal): string {
  return CARDINAL_NAMES[face];
}

export function formatCardinalReading(face: CompassCardinal): string {
  return `${CARDINAL_DEGREES[face]}° ${face}`;
}

/** Parse saved values like `312° NW`, `90 E`, or `NE`. */
export function parseCompassReading(
  raw: string,
): { heading: number; face: CompassCardinal } | null {
  const t = raw.trim().toUpperCase();
  if (!t) return null;

  if ((COMPASS_CARDINALS as readonly string[]).includes(t)) {
    const face = t as CompassCardinal;
    return { heading: CARDINAL_DEGREES[face], face };
  }

  const m = t.match(/(\d{1,3})\s*°?\s*([NSEW]{1,2})?/);
  if (!m) return null;
  const heading = normalizeHeading(Number(m[1]));
  const faceRaw = m[2] as CompassCardinal | undefined;
  if (faceRaw && (COMPASS_CARDINALS as readonly string[]).includes(faceRaw)) {
    return { heading: CARDINAL_DEGREES[faceRaw], face: faceRaw };
  }
  return { heading, face: cardinalFromHeading(heading) };
}
