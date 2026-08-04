import { useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import { Box } from '@/components/ui/box';
import {
  COLORS,
  DESIGN,
  GRADIENT_HEADER,
  GRADIENT_MESH,
  hexAlpha,
  gradientStops,
} from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';
import type { HeaderWave } from '@/src/cdrms/themeLayouts';

/** Soft animated wave strip — dual-tone chrome on white (visual only). */
export function WaveBand({
  color,
  height = 56,
  style,
  flip = false,
}: {
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  flip?: boolean;
}) {
  const { width } = useWindowDimensions();
  const fill = color ?? COLORS.primary;
  const glow = COLORS.primaryGlow;
  const w = Math.max(width, 360);

  return (
    <Box
      pointerEvents="none"
      style={[
        {
          width: '100%',
          height,
          overflow: 'hidden',
          transform: flip ? [{ scaleY: -1 }] : undefined,
        },
        style,
      ]}
    >
      <MotiView
        from={{ translateX: 0 }}
        animate={{ translateX: -w * 0.12 }}
        transition={{
          type: 'timing',
          duration: 9000,
          loop: true,
          repeatReverse: true,
        }}
        style={{ width: w * 1.35, height }}
      >
        <Svg width={w * 1.35} height={height} viewBox={`0 0 ${w} ${height}`}>
          <Path
            d={`M0 ${height * 0.55} C ${w * 0.2} ${height * 0.15}, ${w * 0.35} ${height * 0.95}, ${w * 0.5} ${height * 0.55} C ${w * 0.65} ${height * 0.15}, ${w * 0.8} ${height * 0.9}, ${w} ${height * 0.45} L ${w} ${height} L 0 ${height} Z`}
            fill={hexAlpha(glow, 0.45)}
          />
          <Path
            d={`M0 ${height * 0.7} C ${w * 0.25} ${height * 0.35}, ${w * 0.4} ${height * 1.05}, ${w * 0.55} ${height * 0.65} C ${w * 0.7} ${height * 0.3}, ${w * 0.85} ${height * 0.95}, ${w} ${height * 0.6} L ${w} ${height} L 0 ${height} Z`}
            fill={hexAlpha(fill, 0.4)}
          />
        </Svg>
      </MotiView>
    </Box>
  );
}

/** Full header wave stack for auth / home gradients. */
export function WaveFooter({
  height = 72,
  soft,
}: {
  height?: number;
  soft?: boolean;
}) {
  const { width } = useWindowDimensions();
  const w = Math.max(width, 360);
  const c1 = soft ? COLORS.soft : COLORS.white;
  const c2 = soft
    ? hexAlpha(COLORS.primaryGlow, 0.14)
    : hexAlpha(COLORS.primaryGlow, 0.18);
  const c3 = soft
    ? hexAlpha(COLORS.primary, 0.1)
    : hexAlpha(COLORS.primary, 0.12);

  return (
    <Box pointerEvents="none" style={{ width: '100%', height, marginTop: -2 }}>
      <MotiView
        from={{ translateX: 0 }}
        animate={{ translateX: 18 }}
        transition={{
          type: 'timing',
          duration: 7500,
          loop: true,
          repeatReverse: true,
        }}
        style={{ position: 'absolute', left: -20, right: -20, bottom: 0 }}
      >
        <Svg width={w + 40} height={height} viewBox={`0 0 ${w} ${height}`}>
          <Path
            d={`M0 ${height * 0.28} C ${w * 0.16} ${height * 0.02}, ${w * 0.34} ${height * 0.72}, ${w * 0.5} ${height * 0.32} S ${w * 0.84} ${height * 0.02}, ${w} ${height * 0.35} L ${w} ${height} L 0 ${height} Z`}
            fill={c3}
          />
          <Path
            d={`M0 ${height * 0.4} C ${w * 0.18} ${height * 0.05}, ${w * 0.32} ${height * 0.85}, ${w * 0.5} ${height * 0.4} S ${w * 0.82} ${height * 0.05}, ${w} ${height * 0.45} L ${w} ${height} L 0 ${height} Z`}
            fill={c2}
          />
          <Path
            d={`M0 ${height * 0.62} C ${w * 0.22} ${height * 0.28}, ${w * 0.4} ${height * 0.95}, ${w * 0.58} ${height * 0.58} S ${w * 0.88} ${height * 0.3}, ${w} ${height * 0.65} L ${w} ${height} L 0 ${height} Z`}
            fill={c1}
          />
        </Svg>
      </MotiView>
    </Box>
  );
}

/** Soft page-bottom / ambient waves — theme-wise. */
export function ScreenWaves({ height = 64 }: { height?: number }) {
  const { width, height: winH } = useWindowDimensions();
  const w = Math.max(width, 360);
  const top = GRADIENT_HEADER[0] ?? COLORS.primaryDeep;
  const mid = GRADIENT_HEADER[1] ?? COLORS.primary;
  const glow = GRADIENT_HEADER[GRADIENT_HEADER.length - 1] ?? COLORS.primaryGlow;
  const waveKind = DESIGN.headerWave;
  const plain = waveKind === 'plain';
  const waveH = plain ? Math.min(winH * 0.55, 420) : height;

  // Plain theme: faint full-page lavender curve lines (smart-home mock style)
  if (plain) {
    return (
      <Box
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        <MotiView
          from={{ translateX: 0 }}
          animate={{ translateX: -16 }}
          transition={{
            type: 'timing',
            duration: 14000,
            loop: true,
            repeatReverse: true,
          }}
          style={{ position: 'absolute', left: -30, right: -30, top: winH * 0.08 }}
        >
          <Svg width={w + 60} height={waveH} viewBox={`0 0 ${w} ${waveH}`}>
            <Path
              d={`M0 ${waveH * 0.22} C ${w * 0.25} ${waveH * 0.05}, ${w * 0.45} ${waveH * 0.4}, ${w * 0.7} ${waveH * 0.2} S ${w} ${waveH * 0.1}, ${w} ${waveH * 0.18}`}
              stroke={hexAlpha(COLORS.primary, 0.12)}
              strokeWidth={1.4}
              fill="none"
            />
            <Path
              d={`M0 ${waveH * 0.38} C ${w * 0.2} ${waveH * 0.55}, ${w * 0.4} ${waveH * 0.25}, ${w * 0.65} ${waveH * 0.42} S ${w} ${waveH * 0.55}, ${w} ${waveH * 0.4}`}
              stroke={hexAlpha(COLORS.primaryGlow, 0.16)}
              strokeWidth={1.2}
              fill="none"
            />
            <Path
              d={`M0 ${waveH * 0.58} C ${w * 0.28} ${waveH * 0.45}, ${w * 0.5} ${waveH * 0.72}, ${w * 0.75} ${waveH * 0.55} S ${w} ${waveH * 0.48}, ${w} ${waveH * 0.56}`}
              stroke={hexAlpha(COLORS.primary, 0.1)}
              strokeWidth={1.5}
              fill="none"
            />
            <Path
              d={`M0 ${waveH * 0.78} C ${w * 0.22} ${waveH * 0.92}, ${w * 0.48} ${waveH * 0.68}, ${w * 0.72} ${waveH * 0.82} S ${w} ${waveH * 0.7}, ${w} ${waveH * 0.76}`}
              stroke={hexAlpha(COLORS.primaryGlow, 0.22)}
              strokeWidth={1.2}
              fill="none"
            />
          </Svg>
        </MotiView>
      </Box>
    );
  }

  return (
    <Box
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height,
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <MotiView
        from={{ translateX: 0 }}
        animate={{ translateX: -22 }}
        transition={{
          type: 'timing',
          duration: 10000,
          loop: true,
          repeatReverse: true,
        }}
        style={{ position: 'absolute', left: -24, right: -24, bottom: 0 }}
      >
        <Svg width={w + 48} height={height} viewBox={`0 0 ${w} ${height}`}>
          <Path
            d={`M0 ${height * 0.45} C ${w * 0.2} ${height * 0.1}, ${w * 0.35} ${height * 0.9}, ${w * 0.52} ${height * 0.48} S ${w * 0.85} ${height * 0.12}, ${w} ${height * 0.5} L ${w} ${height} L 0 ${height} Z`}
            fill={hexAlpha(glow, 0.16)}
          />
          <Path
            d={`M0 ${height * 0.58} C ${w * 0.22} ${height * 0.28}, ${w * 0.4} ${height * 0.95}, ${w * 0.58} ${height * 0.55} S ${w * 0.88} ${height * 0.32}, ${w} ${height * 0.62} L ${w} ${height} L 0 ${height} Z`}
            fill={hexAlpha(mid, 0.12)}
          />
          <Path
            d={`M0 ${height * 0.72} C ${w * 0.25} ${height * 0.48}, ${w * 0.42} ${height * 1.05}, ${w * 0.6} ${height * 0.7} S ${w * 0.9} ${height * 0.5}, ${w} ${height * 0.75} L ${w} ${height} L 0 ${height} Z`}
            fill={hexAlpha(top, 0.1)}
          />
        </Svg>
      </MotiView>
    </Box>
  );
}

/** Subtle floating orbs for dual-tone header gradients. */
export function AtmosphereOrbs() {
  return (
    <Box pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <MotiView
        from={{ translateX: 0, translateY: 0, opacity: 0.45 }}
        animate={{ translateX: 16, translateY: -12, opacity: 0.7 }}
        transition={{ type: 'timing', duration: 7200, loop: true, repeatReverse: true }}
        style={{
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: 120,
          top: -80,
          right: -50,
          backgroundColor: hexAlpha(COLORS.primaryGlow, 0.28),
        }}
      />
      <MotiView
        from={{ translateX: 0, translateY: 0 }}
        animate={{ translateX: -14, translateY: 10 }}
        transition={{ type: 'timing', duration: 8500, loop: true, repeatReverse: true }}
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: 80,
          bottom: 10,
          left: -40,
          backgroundColor: 'rgba(255,255,255,0.12)',
        }}
      />
    </Box>
  );
}

/**
 * Full-bleed fluid mesh for login — theme-wise colors, soft animated blobs
 * (inspired by the silk / mesh mock).
 */
export function LoginMeshBackground() {
  const { themeId } = useTheme();
  const { width, height } = useWindowDimensions();
  const mesh = GRADIENT_MESH.length >= 2 ? GRADIENT_MESH : GRADIENT_HEADER;
  const c0 = mesh[0] ?? COLORS.primaryDeep;
  const c1 = mesh[1] ?? COLORS.primary;
  const c2 = mesh[2] ?? COLORS.primaryGlow;
  const c3 = mesh[3] ?? COLORS.primary;
  const c4 = mesh[4] ?? COLORS.primaryGlow;

  return (
    <Box
      key={themeId}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      <LinearGradient
        colors={gradientStops([c0, c1, c2, c3, c4])}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Svg width={width} height={height} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="blobA" cx="22%" cy="18%" r="48%">
            <Stop offset="0%" stopColor={c0} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={c0} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobB" cx="78%" cy="32%" r="42%">
            <Stop offset="0%" stopColor={c1} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={c1} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobC" cx="48%" cy="58%" r="50%">
            <Stop offset="0%" stopColor={c2} stopOpacity="0.85" />
            <Stop offset="100%" stopColor={c2} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobD" cx="18%" cy="78%" r="40%">
            <Stop offset="0%" stopColor={c3} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={c3} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobE" cx="88%" cy="88%" r="38%">
            <Stop offset="0%" stopColor={c4} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={c4} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#blobA)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#blobB)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#blobC)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#blobD)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#blobE)" />
      </Svg>

      <MotiView
        from={{ translateX: -20, translateY: 10, scale: 1 }}
        animate={{ translateX: 24, translateY: -18, scale: 1.08 }}
        transition={{ type: 'timing', duration: 9000, loop: true, repeatReverse: true }}
        style={{
          position: 'absolute',
          width: width * 0.7,
          height: width * 0.7,
          borderRadius: width,
          top: -width * 0.15,
          left: -width * 0.1,
          backgroundColor: hexAlpha(c0, 0.35),
        }}
      />
      <MotiView
        from={{ translateX: 10, translateY: 0, scale: 1 }}
        animate={{ translateX: -18, translateY: 22, scale: 1.12 }}
        transition={{ type: 'timing', duration: 11000, loop: true, repeatReverse: true }}
        style={{
          position: 'absolute',
          width: width * 0.85,
          height: width * 0.85,
          borderRadius: width,
          top: height * 0.22,
          right: -width * 0.35,
          backgroundColor: hexAlpha(c1, 0.32),
        }}
      />
      <MotiView
        from={{ translateX: 0, translateY: 0 }}
        animate={{ translateX: 16, translateY: -14 }}
        transition={{ type: 'timing', duration: 8000, loop: true, repeatReverse: true }}
        style={{
          position: 'absolute',
          width: width * 0.9,
          height: width * 0.9,
          borderRadius: width,
          bottom: -width * 0.25,
          left: -width * 0.15,
          backgroundColor: hexAlpha(c4, 0.4),
        }}
      />
    </Box>
  );
}

/**
 * Header bottom wave edge.
 * - glass — transparent layered wave (Wave design header ONLY)
 * - sheet — fully opaque cut into the page (Mesh / Teal / Violet / login)
 *
 * Stacks above the header body (zIndex 20) so the wavy cut is never covered.
 */
export function WaveSheetEdge({
  height = 56,
  fill = '#FFFFFF',
  variant,
  /** How many px the wave pulls up over the header bottom. */
  pullUp,
}: {
  height?: number;
  /** Opaque page / sheet color under the header (login uses white). */
  fill?: string;
  /**
   * glass — transparent (Wave design only)
   * sheet — solid opaque (Mesh / Teal / Violet + login)
   * default: glass only when Wave (classic) is active
   */
  variant?: 'glass' | 'sheet';
  pullUp?: number;
}) {
  const { width } = useWindowDimensions();
  const w = Math.max(width, 360);
  const glass = (variant ?? (DESIGN.id === 'classic' ? 'glass' : 'sheet')) === 'glass';
  // Resolve translucent tokens to solid white so the cut never disappears
  const solidFill =
    !fill || fill.startsWith('rgba') || fill === COLORS.soft ? '#FFFFFF' : fill;
  const up = pullUp ?? Math.round(height * 0.55);

  const wrapStyle = {
    width: '100%' as const,
    height,
    marginTop: -up,
    zIndex: 20,
    elevation: 10,
  };

  // Opaque sheet: solid white/page wave cutting under the colored header
  if (!glass) {
    return (
      <Box pointerEvents="none" style={wrapStyle}>
        <MotiView
          from={{ translateX: 0 }}
          animate={{ translateX: 16 }}
          transition={{
            type: 'timing',
            duration: 8000,
            loop: true,
            repeatReverse: true,
          }}
          style={{ position: 'absolute', left: -24, right: -24, bottom: 0 }}
        >
          <Svg width={w + 48} height={height} viewBox={`0 0 ${w} ${height}`}>
            <Path
              d={`M0 ${height} L0 ${height * 0.38} C ${w * 0.14} ${height * 0.02}, ${w * 0.28} ${height * 0.92}, ${w * 0.46} ${height * 0.3} S ${w * 0.78} ${height * 0.02}, ${w} ${height * 0.36} L ${w} ${height} Z`}
              fill={COLORS.primaryGlow}
            />
            <Path
              d={`M0 ${height} L0 ${height * 0.44} C ${w * 0.16} ${height * 0.04}, ${w * 0.3} ${height * 0.9}, ${w * 0.48} ${height * 0.34} S ${w * 0.8} ${height * 0.04}, ${w} ${height * 0.4} L ${w} ${height} Z`}
              fill={COLORS.primary}
            />
            <Path
              d={`M0 ${height} L0 ${height * 0.52} C ${w * 0.18} ${height * 0.1}, ${w * 0.32} ${height * 0.96}, ${w * 0.5} ${height * 0.4} S ${w * 0.82} ${height * 0.08}, ${w} ${height * 0.48} L ${w} ${height} Z`}
              fill={solidFill}
            />
            <Path
              d={`M0 ${height * 0.52} C ${w * 0.18} ${height * 0.1}, ${w * 0.32} ${height * 0.96}, ${w * 0.5} ${height * 0.4} S ${w * 0.82} ${height * 0.08}, ${w} ${height * 0.48}`}
              stroke={COLORS.primaryDeep}
              strokeWidth={1.4}
              fill="none"
            />
          </Svg>
        </MotiView>
      </Box>
    );
  }

  // Transparent glass — Wave design header only
  const glow = hexAlpha(COLORS.primaryGlow, 0.32);
  const tint = hexAlpha(COLORS.primary, 0.22);
  const tintSoft = hexAlpha(COLORS.primary, 0.12);
  const sheet = hexAlpha('#FFFFFF', 0.35);
  const sheetMist = hexAlpha('#FFFFFF', 0.18);
  const stroke = hexAlpha(COLORS.primaryGlow, 0.55);
  const strokeSoft = hexAlpha(COLORS.primary, 0.35);

  return (
    <Box pointerEvents="none" style={wrapStyle}>
      <MotiView
        from={{ translateX: 0 }}
        animate={{ translateX: 20 }}
        transition={{
          type: 'timing',
          duration: 8500,
          loop: true,
          repeatReverse: true,
        }}
        style={{ position: 'absolute', left: -24, right: -24, bottom: 0 }}
      >
        <Svg width={w + 48} height={height} viewBox={`0 0 ${w} ${height}`}>
          <Path
            d={`M0 ${height} L0 ${height * 0.32} C ${w * 0.12} ${height * 0.02}, ${w * 0.26} ${height * 0.9}, ${w * 0.44} ${height * 0.26} S ${w * 0.76} ${height * 0.02}, ${w} ${height * 0.32} L ${w} ${height} Z`}
            fill={tintSoft}
          />
          <Path
            d={`M0 ${height} L0 ${height * 0.4} C ${w * 0.16} ${height * 0.02}, ${w * 0.3} ${height * 0.88}, ${w * 0.48} ${height * 0.32} S ${w * 0.8} ${height * 0.04}, ${w} ${height * 0.38} L ${w} ${height} Z`}
            fill={tint}
          />
          <Path
            d={`M0 ${height} L0 ${height * 0.46} C ${w * 0.18} ${height * 0.08}, ${w * 0.34} ${height * 0.9}, ${w * 0.52} ${height * 0.36} S ${w * 0.82} ${height * 0.06}, ${w} ${height * 0.44} L ${w} ${height} Z`}
            fill={glow}
          />
          <Path
            d={`M0 ${height} L0 ${height * 0.54} C ${w * 0.2} ${height * 0.14}, ${w * 0.36} ${height * 0.96}, ${w * 0.54} ${height * 0.42} S ${w * 0.84} ${height * 0.12}, ${w} ${height * 0.5} L ${w} ${height} Z`}
            fill={sheetMist}
          />
          <Path
            d={`M0 ${height} L0 ${height * 0.52} C ${w * 0.18} ${height * 0.1}, ${w * 0.32} ${height * 0.96}, ${w * 0.5} ${height * 0.4} S ${w * 0.82} ${height * 0.08}, ${w} ${height * 0.48} L ${w} ${height} Z`}
            fill={sheet}
          />
          <Path
            d={`M0 ${height * 0.52} C ${w * 0.18} ${height * 0.1}, ${w * 0.32} ${height * 0.96}, ${w * 0.5} ${height * 0.4} S ${w * 0.82} ${height * 0.08}, ${w} ${height * 0.48}`}
            stroke={stroke}
            strokeWidth={2.2}
            fill="none"
          />
          <Path
            d={`M0 ${height * 0.62} C ${w * 0.22} ${height * 0.22}, ${w * 0.4} ${height * 0.98}, ${w * 0.58} ${height * 0.48} S ${w * 0.86} ${height * 0.18}, ${w} ${height * 0.56}`}
            stroke={strokeSoft}
            strokeWidth={1.5}
            fill="none"
          />
        </Svg>
      </MotiView>
    </Box>
  );
}

/**
 * Mesh-only bottom edge — soft overlapping scallop lobes (not a continuous Wave S-curve).
 * Keeps Mesh palette; only geometry differs.
 */
export function MeshSheetEdge({
  height = 68,
  fill = '#FFFFFF',
  pullUp,
}: {
  height?: number;
  fill?: string;
  pullUp?: number;
}) {
  const { width } = useWindowDimensions();
  const w = Math.max(width, 360);
  const solidFill =
    !fill || fill.startsWith('rgba') || fill === COLORS.soft ? '#FFFFFF' : fill;
  const up = pullUp ?? Math.round(height * 0.42);
  const lobes = 4;
  const lobeW = w / lobes;
  const crestY = height * 0.22;
  const dipY = height * 0.78;

  // Build scallop crest: series of soft bubble arcs across the width
  let crest = `M0 ${height} L0 ${crestY}`;
  for (let i = 0; i < lobes; i++) {
    const x1 = (i + 0.5) * lobeW;
    const x2 = (i + 1) * lobeW;
    const yDip = i % 2 === 0 ? dipY : dipY * 0.88;
    crest += ` Q ${x1} ${yDip} ${x2} ${crestY}`;
  }
  crest += ` L ${w} ${height} Z`;

  // Inner accent lobes (slightly higher) — reads as silk mesh bubbles, not Wave layers
  let accent = `M0 ${height} L0 ${crestY + 6}`;
  for (let i = 0; i < lobes; i++) {
    const x1 = (i + 0.5) * lobeW;
    const x2 = (i + 1) * lobeW;
    const yDip = i % 2 === 0 ? dipY * 0.72 : dipY * 0.64;
    accent += ` Q ${x1} ${yDip} ${x2} ${crestY + 6}`;
  }
  accent += ` L ${w} ${height} Z`;

  return (
    <Box
      pointerEvents="none"
      style={{
        width: '100%',
        height,
        marginTop: -up,
        zIndex: 20,
        elevation: 10,
      }}
    >
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: 5 }}
        transition={{
          type: 'timing',
          duration: 5200,
          loop: true,
          repeatReverse: true,
        }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
      >
        <Svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
          <Path d={accent} fill={hexAlpha(COLORS.primaryGlow, 0.28)} />
          <Path d={crest} fill={solidFill} />
          {/* Soft lobe outlines */}
          {Array.from({ length: lobes }).map((_, i) => {
            const x1 = (i + 0.5) * lobeW;
            const yDip = i % 2 === 0 ? dipY : dipY * 0.88;
            const x0 = i * lobeW;
            const x2 = (i + 1) * lobeW;
            return (
              <Path
                key={i}
                d={`M${x0} ${crestY} Q ${x1} ${yDip} ${x2} ${crestY}`}
                stroke={hexAlpha(COLORS.primaryDeep, 0.18)}
                strokeWidth={1.2}
                fill="none"
              />
            );
          })}
        </Svg>
      </MotiView>
    </Box>
  );
}

/**
 * Header edge helper — Mesh uses scallops; Wave uses glass wave; others opaque wave.
 */
export function ThemeHeaderWave({
  variant: _variant,
  height,
  fillColor,
}: {
  variant?: HeaderWave;
  height?: number;
  fillColor?: string;
}) {
  const fill = fillColor && !fillColor.startsWith('rgba') ? fillColor : COLORS.white;
  if (DESIGN.id === 'nature' || DESIGN.headerWave === 'mesh') {
    return <MeshSheetEdge height={height ?? 64} fill={fill} />;
  }
  return (
    <WaveSheetEdge
      height={height ?? 52}
      fill={fill}
      variant={DESIGN.id === 'classic' ? 'glass' : 'sheet'}
    />
  );
}

/**
 * Compact mesh for app headers — same palette/blobs as login, clipped to the header.
 * Mesh design uses a different blob layout (corner clusters) so it doesn’t read like Wave.
 */
export function HeaderMeshBackground() {
  const { themeId } = useTheme();
  const { width } = useWindowDimensions();
  const mesh = GRADIENT_MESH.length >= 2 ? GRADIENT_MESH : GRADIENT_HEADER;
  const c0 = mesh[0] ?? COLORS.primaryDeep;
  const c1 = mesh[1] ?? COLORS.primary;
  const c2 = mesh[2] ?? COLORS.primaryGlow;
  const c3 = mesh[3] ?? COLORS.primary;
  const c4 = mesh[4] ?? COLORS.primaryGlow;
  const h = Math.max(width * 0.9, 280);
  const meshLayout = DESIGN.id === 'nature' || DESIGN.headerWave === 'mesh';

  return (
    <Box
      key={themeId}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      <LinearGradient
        colors={gradientStops([c0, c1, c2, c3, c4])}
        start={meshLayout ? { x: 0.2, y: 0 } : { x: 0.05, y: 0 }}
        end={meshLayout ? { x: 0.85, y: 1 } : { x: 0.95, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Svg width={width} height={h} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id={`hdrBlobA-${themeId}`} cx={meshLayout ? '12%' : '20%'} cy={meshLayout ? '22%' : '15%'} r={meshLayout ? '48%' : '55%'}>
            <Stop offset="0%" stopColor={c0} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={c0} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`hdrBlobB-${themeId}`} cx={meshLayout ? '88%' : '82%'} cy={meshLayout ? '18%' : '28%'} r={meshLayout ? '42%' : '48%'}>
            <Stop offset="0%" stopColor={c1} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={c1} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`hdrBlobC-${themeId}`} cx={meshLayout ? '70%' : '50%'} cy={meshLayout ? '78%' : '70%'} r={meshLayout ? '50%' : '55%'}>
            <Stop offset="0%" stopColor={c2} stopOpacity="0.85" />
            <Stop offset="100%" stopColor={c2} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`hdrBlobD-${themeId}`} cx={meshLayout ? '28%' : '10%'} cy={meshLayout ? '88%' : '85%'} r={meshLayout ? '38%' : '42%'}>
            <Stop offset="0%" stopColor={c3} stopOpacity="0.75" />
            <Stop offset="100%" stopColor={c3} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={h} fill={`url(#hdrBlobA-${themeId})`} />
        <Rect x="0" y="0" width={width} height={h} fill={`url(#hdrBlobB-${themeId})`} />
        <Rect x="0" y="0" width={width} height={h} fill={`url(#hdrBlobC-${themeId})`} />
        <Rect x="0" y="0" width={width} height={h} fill={`url(#hdrBlobD-${themeId})`} />
        {meshLayout ? (
          <>
            {/* Soft circle lattice — Mesh identity (not Wave stripes) */}
            <Path
              d={`M ${width * 0.08} ${h * 0.2} Q ${width * 0.22} ${h * 0.05} ${width * 0.36} ${h * 0.22}
                  Q ${width * 0.5} ${h * 0.4} ${width * 0.64} ${h * 0.18}
                  Q ${width * 0.78} ${h * -0.02} ${width * 0.92} ${h * 0.2}`}
              stroke={hexAlpha('#FFFFFF', 0.22)}
              strokeWidth={1.6}
              fill="none"
            />
            <Path
              d={`M ${width * 0.05} ${h * 0.55} Q ${width * 0.25} ${h * 0.35} ${width * 0.45} ${h * 0.58}
                  Q ${width * 0.65} ${h * 0.8} ${width * 0.88} ${h * 0.48}`}
              stroke={hexAlpha('#FFFFFF', 0.16)}
              strokeWidth={1.4}
              fill="none"
            />
          </>
        ) : null}
      </Svg>

      {meshLayout ? (
        <>
          <MotiView
            from={{ translateX: 0, translateY: 0, scale: 1 }}
            animate={{ translateX: 10, translateY: 8, scale: 1.08 }}
            transition={{ type: 'timing', duration: 10000, loop: true, repeatReverse: true }}
            style={{
              position: 'absolute',
              width: width * 0.55,
              height: width * 0.55,
              borderRadius: width,
              top: -width * 0.18,
              left: -width * 0.2,
              backgroundColor: hexAlpha(c0, 0.45),
            }}
          />
          <MotiView
            from={{ translateX: 0, translateY: 0, scale: 1 }}
            animate={{ translateX: -12, translateY: 6, scale: 1.12 }}
            transition={{ type: 'timing', duration: 8500, loop: true, repeatReverse: true }}
            style={{
              position: 'absolute',
              width: width * 0.48,
              height: width * 0.48,
              borderRadius: width,
              top: -width * 0.08,
              right: -width * 0.16,
              backgroundColor: hexAlpha(c2, 0.4),
            }}
          />
          <MotiView
            from={{ translateX: 0, translateY: 0, scale: 1 }}
            animate={{ translateX: 8, translateY: -10, scale: 1.06 }}
            transition={{ type: 'timing', duration: 12000, loop: true, repeatReverse: true }}
            style={{
              position: 'absolute',
              width: width * 0.62,
              height: width * 0.42,
              borderRadius: width * 0.35,
              bottom: -width * 0.12,
              left: width * 0.22,
              backgroundColor: hexAlpha(c4, 0.36),
            }}
          />
        </>
      ) : (
        <>
          <MotiView
            from={{ translateX: -12, translateY: 6, scale: 1 }}
            animate={{ translateX: 18, translateY: -10, scale: 1.06 }}
            transition={{ type: 'timing', duration: 9000, loop: true, repeatReverse: true }}
            style={{
              position: 'absolute',
              width: width * 0.65,
              height: width * 0.65,
              borderRadius: width,
              top: -width * 0.22,
              left: -width * 0.12,
              backgroundColor: hexAlpha(c0, 0.4),
            }}
          />
          <MotiView
            from={{ translateX: 8, translateY: 0, scale: 1 }}
            animate={{ translateX: -14, translateY: 12, scale: 1.1 }}
            transition={{ type: 'timing', duration: 11000, loop: true, repeatReverse: true }}
            style={{
              position: 'absolute',
              width: width * 0.7,
              height: width * 0.7,
              borderRadius: width,
              top: 20,
              right: -width * 0.28,
              backgroundColor: hexAlpha(c2, 0.35),
            }}
          />
          <MotiView
            from={{ translateX: 0, translateY: 0 }}
            animate={{ translateX: 12, translateY: -8 }}
            transition={{ type: 'timing', duration: 8000, loop: true, repeatReverse: true }}
            style={{
              position: 'absolute',
              width: width * 0.75,
              height: width * 0.75,
              borderRadius: width,
              bottom: -width * 0.35,
              left: width * 0.1,
              backgroundColor: hexAlpha(c4, 0.38),
            }}
          />
        </>
      )}
    </Box>
  );
}

