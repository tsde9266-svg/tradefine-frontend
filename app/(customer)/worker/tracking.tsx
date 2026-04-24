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

function shortDist(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)}m`;
  return `${(metres / 1000).toFixed(1)} miles`;
}

function formatLastUpdated(ms: number): string {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

type JourneyStep = 'accepted' | 'en_route' | 'arriving' | 'start';
const STEPS: { key: JourneyStep; label: string }[] = [
  { key: 'accepted', label: 'ACCEPTED' },
  { key: 'en_route', label: 'EN ROUTE' },
  { key: 'arriving', label: 'ARRIVING' },
  { key: 'start', label: 'START' },
];

const QUICK_ACTIONS = ["I'm outside", 'Take your time', 'Gate is open'];

export default function TrackingScreen() {
  const { workerId } = useLocalSearchParams<{ workerId: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useLocationStore();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerOffline, setWorkerOffline] = useState(false);
  const [profilePosition, setProfilePosition] = useState<Position | null>(null);
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number>(Date.now());
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('just now');
  const [journeyStep, setJourneyStep] = useState<JourneyStep>('en_route');

  const { workerPosition: livePosition } = useWorkerTracking(workerId ?? null);

  const displayPosition: Position | null = livePosition ?? profilePosition;
  const isLive = !!livePosition;

  const progressAnim = useRef(new Animated.Value(0)).current;

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
      [
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: displayPosition.latitude, longitude: displayPosition.longitude },
      ],
      { edgePadding: { top: 120, right: 50, bottom: 320, left: 50 }, animated: true },
    );
  }, [displayPosition, currentLocation]);

  const distanceMetres =
    currentLocation && displayPosition
      ? calcDistance(currentLocation, displayPosition)
      : null;

  const etaMinutes = distanceMetres != null ? etaMins(distanceMetres) : null;

  useEffect(() => {
    if (distanceMetres == null) return;
    const progress = distanceMetres < 200 ? 0.85 : distanceMetres < 800 ? 0.6 : 0.3;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();

    if (distanceMetres < 300) setJourneyStep('arriving');
    else if (distanceMetres < 2000) setJourneyStep('en_route');
  }, [distanceMetres]);

  // Update live timestamp label
  useEffect(() => {
    if (livePosition) setLastUpdatedMs(Date.now());
  }, [livePosition]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdatedLabel(formatLastUpdated(lastUpdatedMs));
    }, 10_000);
    setLastUpdatedLabel(formatLastUpdated(lastUpdatedMs));
    return () => clearInterval(interval);
  }, [lastUpdatedMs]);

  // Offline detection
  const lastLiveRef = useRef<number>(Date.now());
  useEffect(() => {
    if (livePosition) lastLiveRef.current = Date.now();
  }, [livePosition]);

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

  const workerFirstName = worker?.name?.split(' ')[0] ?? 'Worker';
  const workerInitials =
    worker?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const isVerified = worker?.certifications && worker.certifications.length > 0;

  const reviewCountLabel =
    worker?.reviewCount != null
      ? worker.reviewCount >= 1000
        ? `${(worker.reviewCount / 1000).toFixed(1)}k`
        : `${worker.reviewCount}`
      : null;

  const activeStepIndex = STEPS.findIndex((s) => s.key === journeyStep);

  return (
    <View style={styles.screen}>
      {/* ── Header ───────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.headerTitle}>Live Tracking</Text>

          <View style={styles.signalWrap}>
            <Ionicons
              name="radio-outline"
              size={22}
              color={isLive && !workerOffline ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* ── Map ──────────────────────────────────────────────── */}
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
              <View style={styles.userMarkerWrap}>
                <View style={styles.userMarkerLabel}>
                  <Text style={styles.userMarkerText}>Your Location</Text>
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

        {/* Status pill overlay */}
        {etaMinutes != null && (
          <View style={styles.statusPill}>
            <View style={styles.statusLeft}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {workerFirstName} is{' '}
                <Text style={styles.statusBold}>{etaMinutes} min{etaMinutes !== 1 ? 's' : ''} away</Text>
              </Text>
            </View>
            <View style={styles.statusRight}>
              <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.statusUpdated}>LAST UPDATED: {lastUpdatedLabel.toUpperCase()}</Text>
            </View>
          </View>
        )}

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => mapRef.current?.getCamera().then((c) => {
              if (c.zoom !== undefined) mapRef.current?.animateCamera({ zoom: c.zoom + 1 }, { duration: 300 });
            })}
          >
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable
            style={styles.zoomBtn}
            onPress={() => mapRef.current?.getCamera().then((c) => {
              if (c.zoom !== undefined) mapRef.current?.animateCamera({ zoom: c.zoom - 1 }, { duration: 300 });
            })}
          >
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

      {/* ── Bottom card ──────────────────────────────────────── */}
      <SafeAreaView edges={['bottom']} style={styles.cardSafe}>
        <ScrollView
          scrollEnabled={false}
          contentContainerStyle={styles.card}
        >
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
            )}
            <View style={styles.workerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{worker?.name ?? 'Worker'}</Text>
                {isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" />
                )}
              </View>
              <Text style={styles.tradeText} numberOfLines={1}>
                {worker?.trades?.[0] ?? '—'}
              </Text>
            </View>
            <View style={styles.ratingCol}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingVal}>{worker?.rating?.toFixed(1) ?? '—'}</Text>
              </View>
              {reviewCountLabel && (
                <Text style={styles.jobsLabel}>{reviewCountLabel} JOBS DONE</Text>
              )}
            </View>
          </View>

          {/* Stat boxes */}
          {distanceMetres != null && etaMinutes != null && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statBig}>{etaMinutes} <Text style={styles.statUnit}>min</Text></Text>
                <View style={styles.statBadge}>
                  <View style={styles.statBadgeDot} />
                  <Text style={styles.statBadgeText}>HIGH ACCURACY</Text>
                </View>
                <Text style={styles.statSub}>{shortDist(distanceMetres).toUpperCase()} AWAY</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statBig}>{worker?.rating != null ? `${Math.round(worker.rating * 20)}` : '—'}<Text style={styles.statUnit}>%</Text></Text>
                <Text style={styles.statLabel}>ON-TIME ARRIVAL</Text>
                <Text style={styles.statSub}>TOP RATED PRO</Text>
              </View>
            </View>
          </View>

          {/* Journey step progress */}
          <View style={styles.stepsRow}>
            {STEPS.map((step, index) => {
              const isActive = index === activeStepIndex;
              const isDone = index < activeStepIndex;
              return (
                <React.Fragment key={step.key}>
                  <View style={styles.stepItem}>
                    <View style={[
                      styles.stepDot,
                      isDone && styles.stepDotDone,
                      isActive && styles.stepDotActive,
                    ]}>
                      {isDone && <Ionicons name="checkmark" size={9} color="#fff" />}
                    </View>
                    <Text style={[
                      styles.stepLabel,
                      isActive && styles.stepLabelActive,
                      isDone && styles.stepLabelDone,
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                  {index < STEPS.length - 1 && (
                    <View style={[styles.stepLine, (isDone || isActive) && styles.stepLineFilled]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Quick action chips */}
          <View style={styles.chipsRow}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable key={action} style={styles.chip}>
                <Text style={styles.chipText}>{action}</Text>
              </Pressable>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <Pressable style={styles.msgBtn}>
              <Ionicons name="chatbubble" size={18} color="#fff" />
              <Text style={styles.msgBtnText}>Message</Text>
            </Pressable>
            <Pressable
              style={styles.iconActionBtn}
              onPress={() => worker?.phone && Linking.openURL(`tel:${worker.phone}`)}
            >
              <Ionicons name="call" size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              style={styles.iconActionBtn}
              onPress={() => Share.share({ message: `I'm being visited by ${worker?.name ?? 'a tradesperson'} via TradeFind.` })}
            >
              <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </ScrollView>
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
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  signalWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },

  // Map
  mapContainer: { flex: 1 },

  // Status pill overlay on map
  statusPill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { ...typography.bodyMd, color: colors.textPrimary },
  statusBold: { fontWeight: '700' },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statusUpdated: { ...typography.small, color: colors.textSecondary, fontSize: 9, fontWeight: '600' },

  // User location marker
  userMarkerWrap: { alignItems: 'center', gap: 4 },
  userMarkerLabel: {
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

  // Zoom controls
  zoomControls: {
    position: 'absolute',
    top: spacing.lg + 52,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  zoomBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  zoomDivider: { height: 1, backgroundColor: colors.borderLight },
  recenterFab: {
    position: 'absolute',
    top: spacing.lg + 142,
    right: spacing.lg,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },

  // Bottom card
  cardSafe: { backgroundColor: colors.surface, ...shadows.lg },
  card: { padding: spacing.lg, gap: spacing.md },

  // Worker row
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  avatarInitials: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  workerInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  workerName: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  tradeText: { ...typography.caption, color: colors.textSecondary },
  ratingCol: { alignItems: 'flex-end', gap: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingVal: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  jobsLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 },

  // Stat boxes
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.borderLight, marginHorizontal: spacing.sm },
  statBig: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, lineHeight: 28 },
  statUnit: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  statBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statBadgeText: { fontSize: 9, fontWeight: '700', color: colors.success, letterSpacing: 0.3 },
  statLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 },
  statSub: { fontSize: 9, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.3 },

  // Journey steps
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  stepItem: { alignItems: 'center', gap: 5 },
  stepDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  stepLabel: { fontSize: 8, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },
  stepLabelActive: { color: colors.primary },
  stepLabelDone: { color: colors.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.borderLight, marginBottom: 12 },
  stepLineFilled: { backgroundColor: colors.primary },

  // Quick action chips
  chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1.5, borderColor: colors.borderLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 7,
  },
  chipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },

  // Buttons
  btnRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  msgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  msgBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  iconActionBtn: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
});
