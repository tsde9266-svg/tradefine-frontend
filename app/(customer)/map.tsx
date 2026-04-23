import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import WorkerMapPin from '../../components/map/WorkerMapPin';
import MapBottomSheet from '../../components/map/MapBottomSheet';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { MAP_REFRESH_INTERVAL, NEARBY_RADIUS_KM } from '../../constants/config';
import { useLocation } from '../../hooks/useLocation';
import { useWorkerStore } from '../../stores/workerStore';
import { getNearbyWorkers } from '../../services/workers';
import { Worker } from '../../types/worker';

const DEFAULT_REGION: Region = {
  latitude: 52.4862,
  longitude: -1.8904,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const router = useRouter();
  const { currentLocation } = useLocation();
  const { nearbyWorkers, setNearbyWorkers, setSelectedWorker } = useWorkerStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWorkers = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const workers = await getNearbyWorkers({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        radiusKm: NEARBY_RADIUS_KM,
      });
      setNearbyWorkers(workers);
    } catch {}
  }, [currentLocation]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkers();
      refreshTimer.current = setInterval(fetchWorkers, MAP_REFRESH_INTERVAL);
      return () => {
        if (refreshTimer.current) clearInterval(refreshTimer.current);
      };
    }, [fetchWorkers]),
  );

  const handlePinPress = useCallback((worker: Worker) => {
    setSelectedId(worker.id);
    setSelectedWorker(worker);
    setSheetVisible(true);
  }, []);

  const initialRegion: Region = currentLocation
    ? { ...currentLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : DEFAULT_REGION;

  const visibleWorkers = nearbyWorkers.filter(
    (w) => w.latitude != null && w.longitude != null,
  );

  return (
    <View style={styles.screen}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {visibleWorkers.map((worker) => (
          <WorkerMapPin
            key={worker.id}
            worker={worker}
            onPress={handlePinPress}
            selected={worker.id === selectedId}
          />
        ))}
      </MapView>

      {/* Floating search bar */}
      <SafeAreaView edges={['top']} style={styles.searchWrapper}>
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/(customer)/search')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search tradespeople...</Text>
        </Pressable>
      </SafeAreaView>

      {/* Filter FAB */}
      <Pressable style={styles.fab}>
        <Text style={styles.fabIcon}>⚙️</Text>
      </Pressable>

      <MapBottomSheet workers={visibleWorkers} visible={sheetVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.textDisabled,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 240,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  fabIcon: {
    fontSize: 20,
  },
});
