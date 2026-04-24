import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import WorkerMapPin from '../../components/map/WorkerMapPin';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { MAP_REFRESH_INTERVAL, NEARBY_RADIUS_KM } from '../../constants/config';
import { LIGHT_MAP_STYLE } from '../../constants/mapStyle';
import { useLocation } from '../../hooks/useLocation';
import { useWorkerStore } from '../../stores/workerStore';
import { getNearbyWorkers } from '../../services/workers';
import { formatRating } from '../../utils/formatters';
import { Worker } from '../../types/worker';

export default function MapScreen() {
  const router = useRouter();
  const { currentLocation, permissionStatus, requestPermission } = useLocation();
  const { nearbyWorkers, setNearbyWorkers, setSelectedWorker } = useWorkerStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<MapView>(null);

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
      if (currentLocation) {
        refreshTimer.current = setInterval(fetchWorkers, MAP_REFRESH_INTERVAL);
      }
      return () => {
        if (refreshTimer.current) clearInterval(refreshTimer.current);
      };
    }, [fetchWorkers, currentLocation]),
  );

  const handlePinPress = useCallback((worker: Worker) => {
    setSelectedId(worker.id);
    setSelectedWorker(worker);
  }, []);

  const visibleWorkers = useMemo(() => {
    const seen = new Set<string>();
    return nearbyWorkers.filter((w) => {
      if (w.latitude == null || w.longitude == null) return false;
      if (!w.id) return true;
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    });
  }, [nearbyWorkers]);

  const initialRegion: Region = currentLocation
    ? { ...currentLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: 54.0, longitude: -2.5, latitudeDelta: 8.0, longitudeDelta: 8.0 };

  const locationDenied = permissionStatus === 'denied';

  return (
    <View style={styles.screen}>
      {/* ── Header + Search ─────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.topSafe}>
        <View style={styles.header}>
          <Pressable style={styles.menuBtn}>
            <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>TradeFind</Text>
          <Pressable
            style={styles.profileBtn}
            onPress={() => router.push('/(customer)/profile')}
          >
            <Ionicons name="person-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/(customer)/search')}
        >
          <Ionicons name="search-outline" size={18} color={colors.textDisabled} />
          <Text style={styles.searchText}>Search for plumbers, electricians…</Text>
          <View style={styles.searchDivider} />
          <Ionicons name="options-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </SafeAreaView>

      {/* ── Map ─────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation={!!currentLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic={false}
          customMapStyle={LIGHT_MAP_STYLE}
        >
          {visibleWorkers.map((worker) => (
            <WorkerMapPin
              key={worker.id ?? worker.name}
              worker={worker}
              onPress={handlePinPress}
              selected={worker.id === selectedId}
            />
          ))}
        </MapView>

        {/* Recenter button */}
        {currentLocation && (
          <Pressable
            style={styles.recenterFab}
            onPress={() =>
              mapRef.current?.animateToRegion(
                { ...currentLocation, latitudeDelta: 0.03, longitudeDelta: 0.03 },
                400,
              )
            }
          >
            <Ionicons name="navigate" size={20} color={colors.primary} />
          </Pressable>
        )}

        {/* Location permission overlay */}
        {locationDenied && (
          <View style={styles.permOverlay}>
            <View style={styles.permCard}>
              <View style={styles.permIconWrap}>
                <Ionicons name="location-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.permTitle}>Location access needed</Text>
              <Text style={styles.permBody}>
                Enable location to see tradespeople near you on the map.
              </Text>
              <Pressable style={styles.permBtn} onPress={requestPermission}>
                <Text style={styles.permBtnText}>Enable Location</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* ── Bottom panel ────────────────────────────────────── */}
      <SafeAreaView edges={['bottom']} style={styles.panelSafe}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>
            {!currentLocation
              ? 'Finding your location…'
              : `${visibleWorkers.length} tradespeople near you`}
          </Text>
          {currentLocation && visibleWorkers.length > 0 && (
            <Pressable onPress={() => router.push('/(customer)/search')}>
              <Text style={styles.viewList}>View List</Text>
            </Pressable>
          )}
        </View>

        {currentLocation && visibleWorkers.length > 0 && (
          <FlatList
            data={visibleWorkers}
            keyExtractor={(w, i) => w.id ?? String(i)}
            renderItem={({ item }) => (
              <MapWorkerCard
                worker={item}
                onPress={() => router.push(`/(customer)/worker/${item.id}`)}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews
          />
        )}

        {currentLocation && visibleWorkers.length === 0 && (
          <View style={styles.emptyRow}>
            <Ionicons name="search-outline" size={18} color={colors.textDisabled} />
            <Text style={styles.emptyText}>No tradespeople found nearby</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function shortDist(metres: number): string {
  const miles = metres / 1609.344;
  if (miles < 0.1) return 'nearby';
  return `${miles.toFixed(1)} mi`;
}

function extractPrice(notes: string): string | null {
  const match = notes.match(/£[\d,]+(?:\/(?:hr|day|m²|visit))?/i);
  return match ? match[0] : null;
}

function MapWorkerCard({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  const isAvail = worker.isAvailable;
  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]}
      onPress={onPress}
    >
      {/* Avatar */}
      {worker.avatarUrl ? (
        <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <View style={[styles.availBadge, isAvail ? styles.availGreen : styles.availGray]}>
            <Text style={[styles.availText, { color: isAvail ? colors.success : colors.textDisabled }]}>
              {isAvail ? 'AVAILABLE' : 'BUSY'}
            </Text>
          </View>
          {worker.distance != null && (
            <Text style={styles.distShort}>{shortDist(worker.distance)}</Text>
          )}
        </View>

        <Text style={styles.workerName} numberOfLines={1}>{worker.name}</Text>
        <Text style={styles.workerTrade} numberOfLines={1}>{worker.trades[0]}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={styles.ratingText}>{formatRating(worker.rating)}</Text>
          {worker.reviewCount > 0 && (
            <Text style={styles.reviewCount}>({worker.reviewCount})</Text>
          )}
          {!!worker.pricingNotes && extractPrice(worker.pricingNotes) && (
            <Text style={styles.priceText}>{extractPrice(worker.pricingNotes)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Header
  topSafe: { backgroundColor: colors.surface, ...shadows.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  menuBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchText: { ...typography.body, color: colors.textDisabled, flex: 1 },
  searchDivider: { width: 1, height: 18, backgroundColor: colors.borderLight },

  // Map
  mapContainer: { flex: 1 },
  recenterFab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },

  // Permission overlay
  permOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  permCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    margin: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.lg,
  },
  permIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  permTitle: { ...typography.h4, color: colors.textPrimary, textAlign: 'center' },
  permBody: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  permBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  permBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },

  // Bottom panel
  panelSafe: { backgroundColor: colors.surface, ...shadows.lg },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  panelTitle: { ...typography.h4, color: colors.textPrimary },
  viewList: { ...typography.small, color: colors.primary, fontWeight: '600' },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyText: { ...typography.small, color: colors.textDisabled },

  // Worker card (horizontal layout)
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: 264,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    ...shadows.sm,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...typography.bodyMd, color: colors.primaryDark, fontWeight: '700' },
  cardContent: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  availBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  availGreen: { backgroundColor: colors.successBg },
  availGray: { backgroundColor: colors.surfaceElevated },
  availText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  distShort: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  workerName: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  workerTrade: { ...typography.caption, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  ratingText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  reviewCount: { ...typography.caption, color: colors.textSecondary },
  priceText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
