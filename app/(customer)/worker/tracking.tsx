import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import TrackingPulse from '../../../components/map/TrackingPulse';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/radius';
import { spacing } from '../../../constants/spacing';
import { shadows } from '../../../constants/shadows';
import { typography } from '../../../constants/typography';
import { useWorkerTracking } from '../../../hooks/useWorkerTracking';
import { useLocationStore } from '../../../stores/locationStore';
import { getWorkerById } from '../../../services/workers';
import { formatDistance, formatEta } from '../../../utils/formatters';
import { Worker } from '../../../types/worker';

export default function TrackingScreen() {
  const { workerId } = useLocalSearchParams<{ workerId: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useLocationStore();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerOffline, setWorkerOffline] = useState(false);

  const { workerPosition } = useWorkerTracking(workerId ?? null);

  // Load worker info
  useEffect(() => {
    if (!workerId) return;
    getWorkerById(workerId)
      .then(setWorker)
      .catch(() => {});
  }, [workerId]);

  // Fit map to show both user and worker
  useEffect(() => {
    if (!mapRef.current || !workerPosition || !currentLocation) return;
    mapRef.current.fitToCoordinates(
      [
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: workerPosition.latitude, longitude: workerPosition.longitude },
      ],
      { edgePadding: { top: 80, right: 60, bottom: 200, left: 60 }, animated: true },
    );
  }, [workerPosition, currentLocation]);

  // Detect worker going offline (no position update for 90s)
  const lastUpdateRef = useRef<number>(Date.now());
  useEffect(() => {
    if (workerPosition) lastUpdateRef.current = Date.now();
  }, [workerPosition]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastUpdateRef.current > 90_000 && workerPosition) {
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
  }, [workerPosition, worker]);

  const distanceMetres =
    currentLocation && workerPosition
      ? Math.hypot(
          (currentLocation.latitude - workerPosition.latitude) * 111_000,
          (currentLocation.longitude - workerPosition.longitude) *
            111_000 *
            Math.cos((currentLocation.latitude * Math.PI) / 180),
        )
      : null;

  const initialRegion = currentLocation
    ? { ...currentLocation, latitudeDelta: 0.04, longitudeDelta: 0.04 }
    : { latitude: 52.4862, longitude: -1.8904, latitudeDelta: 0.04, longitudeDelta: 0.04 };

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {workerPosition && (
          <Marker coordinate={workerPosition} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={true}>
            <View style={styles.pulseMarker}>
              <TrackingPulse size={56} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Back button */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Button
          label="← Back"
          variant="ghost"
          onPress={() => router.back()}
          size="sm"
        />
      </SafeAreaView>

      {/* Bottom info card */}
      <View style={styles.bottomCard}>
        <View style={styles.workerRow}>
          <Avatar uri={worker?.avatarUrl} name={worker?.name} size={48} />
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{worker?.name ?? '—'}</Text>
            <Text style={styles.workerTrade}>{worker?.trades?.[0] ?? '—'}</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>En route</Text>
          </View>
        </View>

        {distanceMetres != null && (
          <View style={styles.etaRow}>
            <Text style={styles.etaLabel}>Distance</Text>
            <Text style={styles.etaValue}>{formatDistance(distanceMetres)}</Text>
            <Text style={styles.etaSep}>·</Text>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue}>{formatEta(distanceMetres)}</Text>
          </View>
        )}

        {!workerPosition && (
          <Text style={styles.waitingText}>Waiting for worker's location…</Text>
        )}

        <Button
          label={`Call ${worker?.name?.split(' ')[0] ?? 'Worker'}`}
          variant="primary"
          fullWidth
          onPress={() => worker?.phone && Linking.openURL(`tel:${worker.phone}`)}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
  },
  pulseMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    ...shadows.lg,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  workerTrade: {
    ...typography.small,
    color: colors.textSecondary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  etaLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  etaValue: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  etaSep: {
    ...typography.small,
    color: colors.textDisabled,
  },
  waitingText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
