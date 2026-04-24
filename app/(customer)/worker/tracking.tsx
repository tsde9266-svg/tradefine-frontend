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
import { StackHeader } from '../../../components/layout/AppHeader';
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
  const miles = metres / 1609.344;
  if (miles < 0.1) return 'nearby';
  return `${miles.toFixed(1)} miles`;
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
  { key: 'start',    label: 'START' },
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
  const [lastUpdatedMs, setLastUpdatedMs] = useState(Date.now());
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('just now');
  const [journeyStep, setJourneyStep] = useState<JourneyStep>('en_route');

  const { workerPosition: livePosition } = useWorkerTracking(workerId ?? null);
  const displayPosition: Position | null = livePosition ?? profilePosition;
  const isLive = !!livePosition;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const lastLiveRef = useRef(Date.now());

  useEffect(() => {
    if (!workerId) return;
    getWorkerById(workerId)
      .then((w) => {
        setWorker(w);
        if (w.latitude != null && w.longitude != null)
          setProfilePosition({ latitude: w.latitude, longitude: w.longitude });
      })
      .catch(() => {});
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

  const distanceMetres = currentLocation && displayPosition
    ? calcDistance(currentLocation, displayPosition) : null;
  const etaMinutes = distanceMetres != null ? etaMins(distanceMetres) : null;

  useEffect(() => {
    if (distanceMetres == null) return;
    const progress = distanceMetres < 200 ? 0.85 : distanceMetres < 800 ? 0.6 : 0.3;
    Animated.timing(progressAnim, { toValue: progress, duration: 600, useNativeDriver: false }).start();
    if (distanceMetres < 300) setJourneyStep('arriving');
    else setJourneyStep('en_route');
  }, [distanceMetres]);

  useEffect(() => {
    if (livePosition) { lastLiveRef.current = Date.now(); setLastUpdatedMs(Date.now()); }
  }, [livePosition]);

  useEffect(() => {
    const interval = setInterval(() => setLastUpdatedLabel(formatLastUpdated(lastUpdatedMs)), 10_000);
    setLastUpdatedLabel(formatLastUpdated(lastUpdatedMs));
    return () => clearInterval(interval);
  }, [lastUpdatedMs]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      if (Date.now() - lastLiveRef.current > 90_000) {
        setWorkerOffline(true);
        clearInterval(timer);
        Alert.alert(
          `${worker?.name?.split(' ')[0] ?? 'Worker'} has gone offline`,
          'The worker is no longer being tracked.',
          [{ text: 'Go Back', onPress: () => router.back() }],
        );
      }
    }, 15_000);
    return () => clearInterval(timer);
  }, [isLive, worker]);

  const initialRegion: Region | undefined = currentLocation
    ? { ...currentLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 } : undefined;

  const firstName = worker?.name?.split(' ')[0] ?? 'Worker';
  const initials = worker?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const isVerified = !!(worker?.certifications?.length);
  const reviewCountLabel = worker?.reviewCount != null
    ? worker.reviewCount >= 1000 ? `${(worker.reviewCount / 1000).toFixed(1)}k` : `${worker.reviewCount}`
    : null;
  const activeStepIndex = STEPS.findIndex((s) => s.key === journeyStep);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']}>
        <StackHeader
          title="Live Tracking"
          right={
            <Ionicons
              name="radio-outline"
              size={22}
              color={isLive && !workerOffline ? colors.primary : colors.textSecondary}
            />
          }
        />
      </SafeAreaView>

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
                <View style={styles.myLabel}><Text style={styles.myLabelText}>Your Location</Text></View>
                <View style={styles.myDot}><View style={styles.myDotCore} /></View>
              </View>
            </Marker>
          )}
          {displayPosition && currentLocation && (
            <Polyline coordinates={[currentLocation, displayPosition]}
              strokeColor={colors.primary} strokeWidth={3} lineDashPattern={[8, 5]} />
          )}
          {displayPosition && (
            <Marker coordinate={displayPosition} anchor={{ x: 0.5, y: 1.0 }} tracksViewChanges={false}>
              <View style={styles.workerMarkerWrap}>
                <View style={styles.workerPin}>
                  {worker?.avatarUrl
                    ? <Image source={{ uri: worker.avatarUrl }} style={styles.pinImg} resizeMode="cover" />
                    : <View style={styles.pinFallback}><Text style={styles.pinInitials}>{initials}</Text></View>}
                </View>
                <View style={styles.workerLabel}><Text style={styles.workerLabelText}>{firstName}</Text></View>
                <View style={styles.pinTail} />
              </View>
            </Marker>
          )}
        </MapView>

        {etaMinutes != null && (
          <View style={styles.statusPill}>
            <View style={styles.statusLeft}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {firstName} is <Text style={styles.statusBold}>{etaMinutes} min{etaMinutes !== 1 ? 's' : ''} away</Text>
              </Text>
            </View>
            <View style={styles.statusRight}>
              <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.updatedText}>LAST UPDATED: {lastUpdatedLabel.toUpperCase()}</Text>
            </View>
          </View>
        )}

        <View style={styles.zoomControls}>
          <Pressable style={styles.zoomBtn} onPress={() =>
            mapRef.current?.getCamera().then((c) => {
              if (c.zoom !== undefined) mapRef.current?.animateCamera({ zoom: c.zoom + 1 }, { duration: 300 });
            })}>
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable style={styles.zoomBtn} onPress={() =>
            mapRef.current?.getCamera().then((c) => {
              if (c.zoom !== undefined) mapRef.current?.animateCamera({ zoom: c.zoom - 1 }, { duration: 300 });
            })}>
            <Ionicons name="remove" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Pressable style={styles.recenterBtn} onPress={() =>
          currentLocation && mapRef.current?.animateToRegion(
            { ...currentLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400)}>
          <Ionicons name="navigate" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.cardSafe}>
        <ScrollView scrollEnabled={false} contentContainerStyle={styles.card}>
          <View style={styles.workerRow}>
            {worker?.avatarUrl
              ? <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
              : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarInitials}>{initials}</Text></View>}
            <View style={styles.workerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{worker?.name ?? 'Worker'}</Text>
                {isVerified && <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" />}
              </View>
              <Text style={styles.tradeText} numberOfLines={1}>{worker?.trades?.[0] ?? '—'}</Text>
            </View>
            <View style={styles.ratingCol}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingVal}>{worker?.rating?.toFixed(1) ?? '—'}</Text>
              </View>
              {reviewCountLabel && <Text style={styles.jobsLabel}>{reviewCountLabel} JOBS</Text>}
            </View>
          </View>

          {distanceMetres != null && etaMinutes != null && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statBig}>{etaMinutes}<Text style={styles.statUnit}> min</Text></Text>
                <View style={styles.statBadge}>
                  <View style={styles.statBadgeDot} />
                  <Text style={styles.statBadgeText}>HIGH ACCURACY</Text>
                </View>
                <Text style={styles.statSub}>{shortDist(distanceMetres).toUpperCase()} AWAY</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statBig}>
                  {worker?.rating != null ? Math.round(worker.rating * 20) : '—'}
                  <Text style={styles.statUnit}>%</Text>
                </Text>
                <Text style={styles.statLabel}>ON-TIME ARRIVAL</Text>
                <Text style={styles.statSub}>TOP RATED PRO</Text>
              </View>
            </View>
          )}

          <View style={styles.stepsRow}>
            {STEPS.map((step, index) => {
              const isActive = index === activeStepIndex;
              const isDone = index < activeStepIndex;
              return (
                <React.Fragment key={step.key}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepDot, isDone && styles.stepDotDone, isActive && styles.stepDotActive]}>
                      {isDone && <Ionicons name="checkmark" size={9} color="#fff" />}
                    </View>
                    <Text style={[styles.stepLabel, isActive && styles.stepLabelActive, isDone && styles.stepLabelDone]}>
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

          <View style={styles.chipsRow}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable key={a} style={styles.chip}><Text style={styles.chipText}>{a}</Text></Pressable>
            ))}
          </View>

          <View style={styles.btnRow}>
            <Pressable style={styles.msgBtn}>
              <Ionicons name="chatbubble" size={18} color="#fff" />
              <Text style={styles.msgBtnText}>Message</Text>
            </Pressable>
            <Pressable style={styles.roundBtn}
              onPress={() => worker?.phone && Linking.openURL(`tel:${worker.phone}`)}>
              <Ionicons name="call" size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.roundBtn}
              onPress={() => Share.share({ message: `I'm being visited by ${worker?.name ?? 'a tradesperson'} via TradeFind.` })}>
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
  headerSafe: { backgroundColor: colors.surface, ...shadows.sm },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', ...typography.h4, color: colors.textPrimary, fontWeight: '700' },
  mapContainer: { flex: 1 },
  statusPill: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadows.md },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { ...typography.bodyMd, color: colors.textPrimary },
  statusBold: { fontWeight: '700' },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  updatedText: { fontSize: 9, color: colors.textSecondary, fontWeight: '600' },
  myMarkerWrap: { alignItems: 'center', gap: 4 },
  myLabel: { backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, ...shadows.sm },
  myLabelText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  myDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(66,133,244,0.25)', alignItems: 'center', justifyContent: 'center' },
  myDotCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4285F4', borderWidth: 2, borderColor: '#fff' },
  workerMarkerWrap: { alignItems: 'center' },
  workerPin: { width: 46, height: 46, borderRadius: 23, borderWidth: 3, borderColor: colors.primary, overflow: 'hidden', backgroundColor: colors.primaryLight },
  pinImg: { width: 40, height: 40 },
  pinFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pinInitials: { ...typography.bodyMd, color: colors.primaryDark, fontWeight: '700' },
  workerLabel: { backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3, ...shadows.sm },
  workerLabelText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  pinTail: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.primary, marginTop: 1 },
  zoomControls: { position: 'absolute', top: spacing.lg + 56, right: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', ...shadows.md },
  zoomBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  zoomDivider: { height: 1, backgroundColor: colors.borderLight },
  recenterBtn: { position: 'absolute', top: spacing.lg + 148, right: spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.md },
  cardSafe: { backgroundColor: colors.surface, ...shadows.lg },
  card: { padding: spacing.lg, gap: spacing.md },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, flexShrink: 0 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  workerInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  workerName: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  tradeText: { ...typography.caption, color: colors.textSecondary },
  ratingCol: { alignItems: 'flex-end', gap: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingVal: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  jobsLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.borderLight, marginHorizontal: spacing.sm },
  statBig: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, lineHeight: 28 },
  statUnit: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statBadgeText: { fontSize: 9, fontWeight: '700', color: colors.success, letterSpacing: 0.3 },
  statLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 },
  statSub: { fontSize: 9, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.3 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  stepItem: { alignItems: 'center', gap: 5 },
  stepDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.borderLight, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  stepLabel: { fontSize: 8, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },
  stepLabelActive: { color: colors.primary },
  stepLabelDone: { color: colors.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.borderLight, marginBottom: 12 },
  stepLineFilled: { backgroundColor: colors.primary },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { borderWidth: 1.5, borderColor: colors.borderLight, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 7 },
  chipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  msgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md },
  msgBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  roundBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
});
