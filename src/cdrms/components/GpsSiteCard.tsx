import {
  Clock3,
  LocateFixed,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { KarnatakaMap } from '@/src/cdrms/components/KarnatakaMap';
import { StaticMapPreview } from '@/src/cdrms/components/StaticMapPreview';
import { KARNATAKA } from '@/src/cdrms/location';
import { formatCoords, type GpsFix } from '@/src/cdrms/project/types';

type Props = {
  height?: number;
  /** `padded` nests a rounded map inside a card (matches design). */
  variant?: 'padded' | 'embed' | 'bleed' | 'inset';
  gps?: GpsFix | null;
  villageLabel?: string;
  /** Shown on map callout card */
  syNo?: string | null;
  layoutName?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Show the real map (default true). */
  liveMap?: boolean;
  /** Pan / pinch on the inline (minimized) map. Default true. */
  allowMapGestures?: boolean;
  /** Hide footer lat/lng line (place name only). */
  hideCoords?: boolean;
};

const MAP_RADIUS = 20;
const MIN_DELTA = 0.0015;
const MAX_DELTA = 0.35;

function formatTime(ts?: number) {
  if (!ts) return 'Tap refresh';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Map block for survey screens — padded rounded map matches the mock. */
export function GpsSiteCard({
  height = 320,
  variant = 'padded',
  gps,
  villageLabel,
  syNo,
  layoutName,
  refreshing = false,
  onRefresh,
  liveMap = true,
  allowMapGestures = true,
  hideCoords = false,
}: Props) {
  const padded = variant === 'padded' || variant === 'inset';
  const lat = gps?.latitude ?? KARNATAKA.site.latitude;
  const lng = gps?.longitude ?? KARNATAKA.site.longitude;
  const coords = formatCoords(lat, lng);
  const accuracy =
    gps?.accuracy != null ? `±${Math.round(gps.accuracy)}m` : gps ? 'GPS' : 'Waiting';
  const place = villageLabel || KARNATAKA.site.village;
  const showSiteCallout = Boolean(syNo || layoutName);

  const [delta, setDelta] = useState<number>(0.008);
  const [expanded, setExpanded] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);

  const zoomIn = () => setDelta((d) => Math.max(MIN_DELTA, d * 0.45));
  const zoomOut = () => setDelta((d) => Math.min(MAX_DELTA, d * 2.2));

  const recenter = () => {
    Keyboard.dismiss();
    setDelta(0.008);
    setRecenterKey((k) => k + 1);
  };

  const openFullscreen = () => {
    Keyboard.dismiss();
    setExpanded(true);
  };

  const closeFullscreen = () => setExpanded(false);

  const mapProps = {
    mode: 'site' as const,
    showBadge: false,
    latitude: lat,
    longitude: lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
    accuracyMeters: gps?.accuracy ?? 40,
    recenterKey,
  };

  return (
    <Box
      style={{
        backgroundColor: '#FFFFFF',
        paddingHorizontal: padded ? 14 : 0,
        paddingBottom: 14,
      }}
    >
      <Box
        className="relative"
        style={{
          borderRadius: MAP_RADIUS,
          ...(Platform.OS === 'web' ? { overflow: 'hidden' as const } : null),
        }}
      >
        {/* Dismiss keyboard when user starts interacting with the map. */}
        <View onTouchStart={Keyboard.dismiss}>
          {liveMap ? (
            <KarnatakaMap
              {...mapProps}
              height={height}
              rounded={MAP_RADIUS}
              interactive={allowMapGestures}
            />
          ) : (
            <StaticMapPreview
              height={height}
              showBadge={false}
              rounded={MAP_RADIUS}
              latitude={lat}
              longitude={lng}
            />
          )}
        </View>

        <Box
          className="absolute top-2.5 left-2.5 right-2.5 flex-row items-start justify-between"
          style={{ zIndex: 20 }}
          pointerEvents="box-none"
        >
          <Box
            pointerEvents="none"
            className="px-2.5 py-1.5 rounded-full flex-row items-center gap-1.5"
            style={{
              backgroundColor: 'rgba(15,23,42,0.84)',
              maxWidth: '74%',
              shadowColor: '#0F172A',
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <Box
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: gps ? '#34D399' : '#FBBF24' }}
            />
            <Text className="text-[10px] font-bold text-white" numberOfLines={1}>
              {gps ? 'LIVE · ' : ''}
              {place} · {accuracy}
            </Text>
          </Box>

          <Box
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.96)',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <Pressable
              onPress={onRefresh}
              disabled={refreshing || !onRefresh}
              className="h-9 w-9 items-center justify-center active:opacity-70"
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <RefreshCw size={14} color="#2563EB" strokeWidth={2.3} />
              )}
            </Pressable>
            {liveMap ? (
              <>
                <Box style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                <Pressable
                  onPress={recenter}
                  className="h-9 w-9 items-center justify-center active:opacity-70"
                  accessibilityLabel="Recenter map on site"
                >
                  <LocateFixed size={14} color="#2563EB" strokeWidth={2.4} />
                </Pressable>
                <Box style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                <Pressable
                  onPress={zoomIn}
                  className="h-9 w-9 items-center justify-center active:opacity-70"
                >
                  <Plus size={15} color="#334155" strokeWidth={2.4} />
                </Pressable>
                <Box style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                <Pressable
                  onPress={zoomOut}
                  className="h-9 w-9 items-center justify-center active:opacity-70"
                >
                  <Minus size={15} color="#334155" strokeWidth={2.4} />
                </Pressable>
                <Box style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                <Pressable
                  onPress={openFullscreen}
                  className="h-9 w-9 items-center justify-center active:opacity-70"
                  accessibilityLabel="Open map full screen"
                >
                  <Maximize2 size={14} color="#2563EB" strokeWidth={2.4} />
                </Pressable>
              </>
            ) : null}
          </Box>
        </Box>

        {showSiteCallout ? (
          <Box
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 10,
              right: 56,
              bottom: 10,
              zIndex: 20,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.96)',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              paddingHorizontal: 12,
              paddingVertical: 10,
              shadowColor: '#0F172A',
              shadowOpacity: 0.12,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                color: '#2563EB',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Site location
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
              Sy No: {syNo?.trim() || '—'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 2 }}>
              Village: {place || '—'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 2 }}>
              Layout: {layoutName?.trim() || '—'}
            </Text>
          </Box>
        ) : null}
      </Box>

      <Box className="mt-3.5 flex-row items-center justify-between px-0.5">
        <Box className="flex-row items-center gap-1.5 flex-1 min-w-0">
          <MapPin size={13} color="#2563EB" strokeWidth={2.4} />
          <Text
            className="text-[11px] font-semibold"
            style={{ color: '#64748B' }}
            numberOfLines={1}
          >
            {hideCoords ? place : `${coords.lat} · ${coords.lng}`}
          </Text>
        </Box>
        <Box className="flex-row items-center gap-1.5 ml-2">
          {gps ? (
            <Box className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
          ) : (
            <Clock3 size={11} color="#94A3B8" />
          )}
          <Text className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>
            {gps ? `Live · ${formatTime(gps.timestamp)}` : 'Tap refresh for GPS'}
          </Text>
        </Box>
      </Box>

      <Modal
        visible={expanded}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeFullscreen}
      >
        {/* Modal is a separate native root — needs its own SafeAreaProvider. */}
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0F172A' }}>
            <SafeAreaView
              style={{ flex: 1, backgroundColor: '#0F172A' }}
              edges={['top', 'right', 'bottom', 'left']}
            >
              <View style={{ flex: 1 }}>
                <KarnatakaMap
                  {...mapProps}
                  fill
                  rounded={0}
                  interactive
                  showBadge
                  badgeText={`${place} · Karnataka`}
                />

                <Box
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 14,
                    zIndex: 30,
                    borderRadius: 14,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255,255,255,0.96)',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                >
                  <Pressable
                    onPress={recenter}
                    accessibilityLabel="Recenter map on site"
                    className="h-11 w-11 items-center justify-center active:opacity-70"
                  >
                    <LocateFixed size={18} color="#2563EB" strokeWidth={2.4} />
                  </Pressable>
                  <Box style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                  <Pressable
                    onPress={zoomIn}
                    accessibilityLabel="Zoom in"
                    className="h-11 w-11 items-center justify-center active:opacity-70"
                  >
                    <Plus size={18} color="#334155" strokeWidth={2.4} />
                  </Pressable>
                  <Box style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                  <Pressable
                    onPress={zoomOut}
                    accessibilityLabel="Zoom out"
                    className="h-11 w-11 items-center justify-center active:opacity-70"
                  >
                    <Minus size={18} color="#334155" strokeWidth={2.4} />
                  </Pressable>
                </Box>

                <Pressable
                  onPress={closeFullscreen}
                  accessibilityLabel="Exit full screen map"
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 14,
                    zIndex: 30,
                    height: 42,
                    minWidth: 42,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: 'rgba(15,23,42,0.88)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <X size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-[12px] font-bold">Close</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </Modal>
    </Box>
  );
}
