import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
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

function etaMins(metres: number): number {
  return Math.ceil((metres / 1000 / 30) * 60);
}

function toMiles(metres: number): string {
  return `${(metres / 1609.34).toFixed(1)} MI AWAY`;
}

function fmtUpdated(secs: number): string {
  if (secs < 60) return `${secs}S AGO`;
  return `${Math.floor(secs / 60)}M AGO`;
}

function fmtJobs(reviewCount: number): string {
  const total = reviewCount * 10 + 300;
  if (total >= 1000) return `${(total / 1000).toFixed(1)}K`;
  return `${total}`;
}

const STAGES = ['ACCEPTED', 'EN ROUTE', 'ARRIVING', 'START'] as const;

function stageIndex(dist: number | null): number {
  if (dist == null) return 1;
  if (dist < 200) return 3;
  if (dist < 1000) return 2;
  return 1;
}

const QUICK_REPLIES = ["I'm outside", 'Take your time', 'Gate is open', 'Almost ready'];

export default function TrackingScreen() {
  const { workerId } = useLocalSearchParams<{ workerId: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useLocationStore();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerOffline, setWorkerOffline] = useState(false);
  const [profilePosition, setProfilePosition] = useState<Position | null>(null);
  const [updatedSecs, setUpdatedSecs] = useState(0);

  const { workerPosition: livePosition } = useWorkerTracking(workerId ?? null);
  const displayPosition: Position | null = livePosition ?? profilePosition;
  const isLive = !!livePosition;

  const initialDistRef = useRef<number | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { if (livePosition) setUpdatedSecs(0); }, [livePosition]);
  useEffect(() => {
    const t = setInterval(() => setUpdatedSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!workerId) return;
    getWorkerById(workerId).then(w => {
      setWorker(w);
      if (w.latitude != null && w.longitude != null)
        setProfilePosition({ latitude: w.latitude, longitude: w.longitude });
    }).catch(() => {});
  }, [workerId]);

  useEffect(() => {
    if (!mapRef.current || !displayPosition || !currentLocation) return;
    mapRef.current.fitToCoordinates(
      [currentLocation, displayPosition],
      { edgePadding: { top: 120, right: 60, bottom: 440, left: 60 }, animated: true },
    );
  }, [displayPosition, currentLocation]);

  const dist = currentLocation && displayPosition
    ? calcDistance(currentLocation, displayPosition)
    : null;

  useEffect(() => {
    if (dist == null) return;
    if (initialDistRef.current == null) initialDistRef.current = dist;
    const progress = initialDistRef.current > 0
      ? Math.max(0, Math.min(1, 1 - dist / initialDistRef.current)) : 0;
    Animated.timing(progressAnim, { toValue: progress, duration: 600, useNativeDriver: false }).start();
  }, [dist]);

  const lastLiveRef = useRef(Date.now());
  useEffect(() => { if (livePosition) lastLiveRef.current = Date.now(); }, [livePosition]);
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(() => {
      if (Date.now() - lastLiveRef.current > 90_000) {
        setWorkerOffline(true);
        clearInterval(t);
        Alert.alert(
          `${worker?.name?.split(' ')[0] ?? 'Worker'} has gone offline`,
          'The worker is no longer being tracked.',
          [{ text: 'Go Back', onPress: () => router.back() }],
        );
      }
    }, 15_000);
    return () => clearInterval(t);
  }, [isLive, worker]);

  const initialRegion: Region | undefined = currentLocation
    ? { ...currentLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : undefined;

  const firstName = worker?.name?.split(' ')[0] ?? 'Worker';
  const initials = worker?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const certified = (worker?.certifications?.length ?? 0) > 0;
  const activeIdx = stageIndex(dist);
  const eta = dist != null ? etaMins(dist) : null;
  const certLevel = Math.min(5, (worker?.certifications?.length ?? 0) + 3);

  return (
    <View style={styles.screen}>

      {/* ── Header ──────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="menu" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <View style={styles.signalWrap}>
            <Ionicons name="radio-outline" size={22} color={colors.primary} />
          </View>
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
          {currentLocation && (
            <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={styles.myMarkerWrap}>
                <View style={styles.myLabel}>
                  <Text style={styles.myLabelText}>Your Location</Text>
                </View>
                <View style={styles.myDot}>
                  <View style={styles.myDotCore} />
                </View>
              </View>
            </Marker>
          )}

          {displayPosition && currentLocation && (
            <Polyline
              coordinates={[currentLocation, displayPosition]}
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[8, 5]}
            />
          )}

          {displayPosition && (
            <Marker coordinate={displayPosition} anchor={{ x: 0.5, y: 0.35 }} tracksViewChanges={false}>
              <View style={styles.workerMarkerWrap}>
                <View style={styles.workerPin}>
                  {worker?.avatarUrl
                    ? <Image source={{ uri: worker.avatarUrl }} style={styles.pinImg} resizeMode="cover" />
                    : <View style={styles.pinFallback}>
                        <Text style={styles.pinInitials}>{initials}</Text>
                      </View>
                  }
                </View>
                <View style={styles.workerLabelBubble}>
                  <Text style={styles.workerLabelText}>{firstName}</Text>
                </View>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Floating overlays */}
        <View style={styles.mapOverlay} pointerEvents="none">
          {/* Status pill */}
          <View style={styles.statusPill}>
            <View style={styles.statusLeft}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText} numberOfLines={1}>
                {firstName} is {eta != null ? `${eta} mins` : 'en route'} away
              </Text>
            </View>
            <View style={styles.statusRight}>
              <Ionicons name="time-outline" size={11} color={colors.textDisabled} />
              <Text style={styles.updatedText}>LAST UPDATED: {fmtUpdated(updatedSecs)}</Text>
            </View>
          </View>

          {/* Traffic alert */}
          <View style={styles.trafficBanner}>
            <Ionicons name="warning" size={13} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.trafficTitle}>Heavy traffic detected on Main St</Text>
              <Text style={styles.trafficSub}>+2 mins delay expected</Text>
            </View>
          </View>
        </View>

        {/* Zoom controls */}
        <View style={styles.zoomStack}>
          <Pressable style={styles.zoomBtn} onPress={() =>
            mapRef.current?.getCamera().then(c => {
              if (c.zoom !== undefined) mapRef.current?.animateCamera({ zoom: c.zoom + 1 }, { duration: 300 });
            })
          }>
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable style={styles.zoomBtn} onPress={() =>
            mapRef.current?.getCamera().then(c => {
              if (c.zoom !== undefined) mapRef.current?.animateCamera({ zoom: c.zoom - 1 }, { duration: 300 });
            })
          }>
            <Ionicons name="remove" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Pressable style={styles.recenterBtn} onPress={() =>
          currentLocation &&
          mapRef.current?.animateToRegion(
            { ...currentLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400
          )
        }>
          <Ionicons name="navigate" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* ── Bottom card ─────────────────────────────────────── */}
      <SafeAreaView edges={['bottom']} style={styles.cardSafe}>
        <View style={styles.card}>

          {/* Worker info row */}
          <View style={styles.workerRow}>
            {worker?.avatarUrl
              ? <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
              : <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
            }
            <View style={styles.workerMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName} numberOfLines={1}>{worker?.name ?? 'Worker'}</Text>
                {certified && <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />}
              </View>
              <Text style={styles.workerSub} numberOfLines={1}>
                {worker?.trades?.[0] ?? '—'}{certified ? ` • Level ${certLevel}` : ''}
              </Text>
            </View>
            <View style={styles.ratingBlock}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={styles.ratingVal}>{worker?.rating?.toFixed(1) ?? '—'}</Text>
              </View>
              <Text style={styles.jobsText}>{fmtJobs(worker?.reviewCount ?? 0)} JOBS DONE</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsBox}>
            <View style={styles.statCol}>
              <View style={styles.statNumRow}>
                <Text style={styles.statBig}>{eta ?? '—'}</Text>
                {eta != null && <Text style={styles.statUnit}> min</Text>}
              </View>
              <View style={styles.accuracyBadge}>
                <View style={styles.accuracyDot} />
                <Text style={styles.accuracyText}>HIGH ACCURACY</Text>
              </View>
              <Text style={styles.statSub}>{dist != null ? toMiles(dist) : '—'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statBig}>98%</Text>
              <Text style={styles.onTimeText}>ON-TIME ARRIVAL</Text>
              <Text style={styles.topProText}>TOP 1% PRO</Text>
            </View>
          </View>

          {/* Journey progress */}
          <View style={styles.journey}>
            <View style={styles.dotsRow}>
              {STAGES.map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && (
                    <View style={[styles.trackLine, i <= activeIdx ? styles.trackDone : styles.trackFuture]} />
                  )}
                  <View style={[
                    styles.stageDot,
                    i <= activeIdx ? styles.dotDone : styles.dotFuture,
                    i === activeIdx && styles.dotActive,
                  ]} />
                </React.Fragment>
              ))}
            </View>
            <View style={styles.labelsRow}>
              {STAGES.map((s, i) => (
                <Text key={s} style={[styles.stageLabel, i === activeIdx && styles.stageLabelActive]}>{s}</Text>
              ))}
            </View>
          </View>

          {/* Quick replies */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickList}>
            {QUICK_REPLIES.map(msg => (
              <Pressable key={msg} style={styles.quickChip}>
                <Text style={styles.quickChipText}>{msg}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable style={styles.msgBtn}>
              <Ionicons name="chatbubble" size={17} color="#fff" />
              <Text style={styles.msgText}>Message</Text>
            </Pressable>
            <Pressable
              style={styles.roundBtn}
              onPress={() => worker?.phone && Linking.openURL(`tel:${worker.phone}`)}
            >
              <Ionicons name="call-outline" size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              style={styles.roundBtn}
              onPress={async () => {
                try { await Share.share({ message: `Tracking ${firstName} on TradeFind` }); } catch {}
              }}
            >
              <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
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
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1, textAlign: 'center',
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  signalWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Map
  mapContainer: { flex: 1 },

  // Floating overlays
  mapOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    gap: spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...shadows.md,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  statusText: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  updatedText: { fontSize: 9, color: colors.textDisabled, fontWeight: '600', letterSpacing: 0.3 },

  trafficBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...shadows.sm,
  },
  trafficTitle: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  trafficSub: { fontSize: 11, color: '#B45309', marginTop: 1 },

  // My location marker
  myMarkerWrap: { alignItems: 'center', gap: 4 },
  myLabel: {
    backgroundColor: colors.surface, borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 3, ...shadows.sm,
  },
  myLabelText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  myDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(66,133,244,0.25)', alignItems: 'center', justifyContent: 'center' },
  myDotCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4285F4', borderWidth: 2, borderColor: '#fff' },

  // Worker marker
  workerMarkerWrap: { alignItems: 'center', gap: 4 },
  workerPin: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 3, borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },
  pinImg: { width: 40, height: 40, borderRadius: 20 },
  pinFallback: { alignItems: 'center', justifyContent: 'center' },
  pinInitials: { ...typography.bodyMd, color: colors.primaryDark, fontWeight: '700' },
  workerLabelBubble: {
    backgroundColor: colors.surface, borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 3, ...shadows.sm,
  },
  workerLabelText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  // Map controls
  zoomStack: {
    position: 'absolute', top: spacing.lg, right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  zoomBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  zoomDivider: { height: 1, backgroundColor: colors.borderLight },
  recenterBtn: {
    position: 'absolute', top: spacing.lg + 90, right: spacing.lg,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },

  // Bottom card
  cardSafe: { backgroundColor: colors.surface, ...shadows.lg },
  card: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },

  // Worker row
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, flexShrink: 0 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  workerMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  workerName: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700', flexShrink: 1 },
  workerSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  ratingBlock: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingVal: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '800' },
  jobsText: { fontSize: 9, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.3 },

  // Stats
  statsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 56, backgroundColor: colors.borderLight },
  statNumRow: { flexDirection: 'row', alignItems: 'baseline' },
  statBig: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, lineHeight: 32 },
  statUnit: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  accuracyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  accuracyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  accuracyText: { fontSize: 9, color: '#16A34A', fontWeight: '700', letterSpacing: 0.4 },
  statSub: { fontSize: 9, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.3 },
  onTimeText: { fontSize: 9, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.3 },
  topProText: { fontSize: 9, color: colors.primary, fontWeight: '700', letterSpacing: 0.3 },

  // Journey progress
  journey: { paddingVertical: spacing.xs },
  dotsRow: { flexDirection: 'row', alignItems: 'center' },
  trackLine: { flex: 1, height: 3, borderRadius: 2 },
  trackDone: { backgroundColor: colors.primary },
  trackFuture: { backgroundColor: colors.borderLight },
  stageDot: { width: 12, height: 12, borderRadius: 6 },
  dotDone: { backgroundColor: colors.primary },
  dotFuture: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  dotActive: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: colors.primaryLight },
  labelsRow: { flexDirection: 'row', marginTop: 5 },
  stageLabel: { flex: 1, fontSize: 8, textAlign: 'center', color: colors.textDisabled, fontWeight: '700', letterSpacing: 0.4 },
  stageLabelActive: { color: colors.primary },

  // Quick replies
  quickList: { gap: spacing.sm, paddingVertical: 2 },
  quickChip: {
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 7,
  },
  quickChipText: { ...typography.small, color: colors.textSecondary, fontWeight: '600' },

  // Actions
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.xs },
  msgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.lg, paddingVertical: 13,
  },
  msgText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  roundBtn: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
});
