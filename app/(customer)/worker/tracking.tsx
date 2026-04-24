import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/radius';
import { spacing } from '../../../constants/spacing';
import { shadows } from '../../../constants/shadows';
import { typography } from '../../../constants/typography';
import { useWorkerTracking } from '../../../hooks/useWorkerTracking';
import { LIGHT_MAP_STYLE } from '../../../constants/mapStyle';
import { useLocationStore } from '../../../stores/locationStore';
import { getWorkerById } from '../../../services/workers';
import { Worker } from '../../../types/worker';

interface Position { latitude: number; longitude: number }

function calcDistance(a: Position, b: Position): number {
  return Math.hypot(
    (a.latitude - b.latitude) * 111_000,
    (a.longitude - b.longitude) * 111_000 * Math.cos((a.latitude * Math.PI) / 180),
  );
}

function etaNum(metres: number): string {
  const mins = Math.ceil((metres / 1000 / 30) * 60);
  return mins < 60 ? `${mins}` : `~${Math.round(mins / 60)}h`;
}

function shortDist(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)}m`;
  return `${(metres / 1000).toFixed(1)}km`;
}

export default function TrackingScreen() {
  const { workerId } = useLocalSearchParams<{ workerId: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useLocationStore();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerOffline, setWorkerOffline] = useState(false);
  const [profilePosition, setProfilePosition] = useState<Position | null>(null);

  const { workerPosition: livePosition } = useWorkerTracking(workerId ?? null);

  // Live position takes priority; fall back to worker's stored profile coordinates
  const displayPosition: Position | null = livePosition ?? profilePosition;
  const isLive = !!livePosition;

  // Progress tracking: store initial distance to calculate journey completion
  const initialDistRef = useRef<number | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Load worker profile; seed map with their stored lat/lng immediately
  useEffect(() => {
    if (!workerId) return;
    getWorkerById(workerId)
      .then((w) => {
        setWorker(w);
        if (w.latitude != null && w.longitude != null) {
          setProfilePosition({ latitude: w.latitude, longitude: w.longitude });
        }
      })
      .catch(() => {});
  }, [workerId]);

  // Fit map to show both positions when we have them
  useEffect(() => {
    if (!mapRef.current || !displayPosition || !currentLocation) return;
    mapRef.current.fitToCoordinates(
      [
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: displayPosition.latitude, longitude: displayPosition.longitude },
      ],
      { edgePadding: { top: 80, right: 50, bottom: 290, left: 50 }, animated: true },
    );
  }, [displayPosition, currentLocation]);

  // Calculate current distance and animate the progress bar
  const distanceMetres =
    currentLocation && displayPosition
      ? calcDistance(currentLocation, displayPosition)
      : null;

  useEffect(() => {
    if (distanceMetres == null) return;
    if (initialDistRef.current == null) {
      initialDistRef.current = distanceMetres;
    }
    const progress =
      initialDistRef.current > 0
        ? Math.max(0, Math.min(1, 1 - distanceMetres / initialDistRef.current))
        : 0;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [distanceMetres]);

  // Offline detection (only when receiving live updates)
  const lastLiveRef = useRef<number>(Date.now());
  useEffect(() => {
    if (livePosition) lastLiveRef.current = Date.now();
  }, [livePosition]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      if (Date.now() - lastLiveRef.current > 90_000) {
        setWorkerOffline(true);
        clearInterval(timer);
        Alert.alert(
          `${worker?.name?.split(' ')[0] ?? 'Worker'} has gone offline`,
          'The worker has gone offline and can no longer be tracked.',
          [{ text: 'Go Back', onPress: () => router.back() }],
        );
      }
    }, 15_000);
    return () => clearInterval(timer);
  }, [isLive, worker]);

  const initialRegion: Region | undefined = currentLocation
    ? { ...currentLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : undefined;

  const workerFirstName = worker?.name?.split(' ')[0] ?? 'Worker';
  const workerInitials =
    worker?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  const isVerified = worker?.certifications && worker.certifications.length > 0;

  return (
    <View style={styles.screen}>
      {/* ── Header ─────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.headerTitle}>TradeFind</Text>

          {isLive && !workerOffline ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : (
            <View style={styles.headerRight} />
          )}
        </View>
      </SafeAreaView>

      {/* ── Map ─────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          customMapStyle={LIGHT_MAP_STYLE}
        >
          {/* Customer location marker with label */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.userMarkerWrap}>
                <View style={styles.userMarkerLabel}>
                  <Text style={styles.userMarkerText}>Your Location</Text>
                </View>
                <View style={styles.userDot}>
                  <View style={styles.userDotInner} />
                </View>
              </View>
            </Marker>
          )}

          {/* Route line */}
          {displayPosition && currentLocation && (
            <Polyline
              coordinates={[
                { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                { latitude: displayPosition.latitude, longitude: displayPosition.longitude },
              ]}
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[8, 5]}
            />
          )}

          {/* Worker marker */}
          {displayPosition && (
            <Marker
              coordinate={displayPosition}
              anchor={{ x: 0.5, y: 0.35 }}
              tracksViewChanges={false}
            >
              <View style={styles.workerMarkerWrap}>
                <View style={styles.workerPin}>
                  {worker?.avatarUrl ? (
                    <Image source={{ uri: worker.avatarUrl }} style={styles.workerPinAvatar} />
                  ) : (
                    <View style={[styles.workerPinAvatar, styles.workerPinFallback]}>
                      <Text style={styles.workerPinInitials}>{workerInitials}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.workerMarkerLabel}>
                  <Text style={styles.workerMarkerText}>{workerFirstName}</Text>
                </View>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => {
              mapRef.current?.getCamera().then((camera) => {
                if (camera.zoom !== undefined) {
                  mapRef.current?.animateCamera({ zoom: camera.zoom + 1 }, { duration: 300 });
                }
              });
            }}
          >
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable
            style={styles.zoomBtn}
            onPress={() => {
              mapRef.current?.getCamera().then((camera) => {
                if (camera.zoom !== undefined) {
                  mapRef.current?.animateCamera({ zoom: camera.zoom - 1 }, { duration: 300 });
                }
              });
            }}
          >
            <Ionicons name="remove" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Recenter */}
        <Pressable
          style={styles.recenterFab}
          onPress={() =>
            currentLocation &&
            mapRef.current?.animateToRegion(
              { ...currentLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 },
              400,
            )
          }
        >
          <Ionicons name="navigate" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* ── Bottom card ─────────────────────────────────────── */}
      <SafeAreaView edges={['bottom']} style={styles.cardSafe}>
        <View style={styles.card}>
          {/* Worker row */}
          <View style={styles.workerRow}>
            {worker?.avatarUrl ? (
              <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{workerInitials}</Text>
              </View>
            )}
            <View style={styles.workerInfo}>
              <Text style={styles.workerHeading}>
                {workerFirstName} is{' '}
                {isLive ? 'on his way' : displayPosition ? 'nearby' : 'being located'}
              </Text>
              <View style={styles.workerMeta}>
                {isVerified && (
                  <Ionicons name="shield-checkmark" size={13} color={colors.success} />
                )}
                <Text style={styles.tradeText}>{worker?.trades?.[0] ?? '—'}</Text>
              </View>
            </View>
            {distanceMetres != null && (
              <View style={styles.metricCol}>
                <Text style={styles.metricBig}>{etaNum(distanceMetres)}</Text>
                <Text style={styles.metricUnit}>min</Text>
                <Text style={styles.metricSub}>{shortDist(distanceMetres)}</Text>
              </View>
            )}
          </View>

          {/* Progress section */}
          {distanceMetres != null ? (
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>En route to you</Text>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['5%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.locatingRow}>
              <Ionicons name="radio-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.locatingText}>Locating {workerFirstName}…</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.btnRow}>
            <Pressable
              style={styles.callBtn}
              onPress={() => worker?.phone && Linking.openURL(`tel:${worker.phone}`)}
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.callBtnText}>Call {workerFirstName}</Text>
            </Pressable>
            <Pressable style={styles.msgBtn}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
              <Text style={styles.msgBtnText}>Message</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Header
  headerSafe: { backgroundColor: colors.surface, ...shadows.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.h4,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF3E0',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  liveText: { ...typography.caption, color: colors.primary, fontWeight: '800', letterSpacing: 0.5 },
  headerRight: { width: 60 },

  // Map
  mapContainer: { flex: 1 },

  // User location marker
  userMarkerWrap: { alignItems: 'center', gap: 4 },
  userMarkerLabel: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    ...shadows.sm,
  },
  userMarkerText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  userDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(66,133,244,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  userDotInner: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4285F4',
    borderWidth: 2, borderColor: '#fff',
  },

  // Worker marker
  workerMarkerWrap: { alignItems: 'center', gap: 4 },
  workerMarkerLabel: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    ...shadows.sm,
  },
  workerMarkerText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  workerPin: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 3, borderColor: colors.primary,
    overflow: 'hidden',
    ...shadows.md,
  },
  workerPinAvatar: { width: '100%', height: '100%' },
  workerPinFallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  workerPinInitials: { ...typography.bodyMd, color: colors.primaryDark, fontWeight: '700' },

  // Zoom controls
  zoomControls: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  zoomDivider: { height: 1, backgroundColor: colors.borderLight },
  recenterFab: {
    position: 'absolute',
    top: spacing.lg + 90,
    right: spacing.lg,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },

  // Bottom card
  cardSafe: { backgroundColor: colors.surface, ...shadows.lg },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  workerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, flexShrink: 0 },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  workerInfo: { flex: 1 },
  workerHeading: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  workerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  tradeText: { ...typography.caption, color: colors.textSecondary },
  metricCol: { alignItems: 'center', minWidth: 52 },
  metricBig: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, lineHeight: 30 },
  metricUnit: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: -2 },
  metricSub: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },

  // Progress
  progressSection: { gap: 8 },
  progressLabel: { ...typography.small, color: colors.textSecondary, fontWeight: '600' },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  locatingText: { ...typography.bodyMd, color: colors.textSecondary },

  // Buttons
  btnRow: { flexDirection: 'row', gap: spacing.md },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  callBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  msgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  msgBtnText: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
});
