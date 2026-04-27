import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import WorkerMapPin from '../../components/map/WorkerMapPin';
import { T } from '../../constants/tokens';
import { shadows } from '../../constants/shadows';
import { MAP_REFRESH_INTERVAL, NEARBY_RADIUS_KM } from '../../constants/config';
import { LIGHT_MAP_STYLE } from '../../constants/mapStyle';
import { useLocation } from '../../hooks/useLocation';
import { useWorkerStore } from '../../stores/workerStore';
import { getNearbyWorkers } from '../../services/workers';
import { formatRating } from '../../utils/formatters';
import { Worker } from '../../types/worker';

const TRADES = ['Plumbers', 'Electricians', 'Carpenters', 'Gas Engineers', 'Painters'];
const BIRMINGHAM = { latitude: 52.4862, longitude: -1.8904 };

function extractPrice(notes: string): string | null {
  const m = notes?.match(/£[\d,]+(?:\/(?:hr|day|m²|visit))?/i);
  return m ? m[0] : null;
}

function shortDist(metres: number): string {
  const miles = metres / 1609.344;
  if (miles < 0.1) return 'nearby';
  return `${miles.toFixed(1)} mi`;
}

function MapWorkerCard({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  const price = extractPrice(worker.pricingNotes ?? '');
  const isAvail = worker.isAvailable;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]}
      onPress={onPress}
    >
      <View style={styles.cardRow}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {worker.avatarUrl ? (
            <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.initials}>
                {worker.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.onlineDot, isAvail ? styles.dotGreen : styles.dotRed]} />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.cardInfoTop}>
            <Text style={styles.workerName} numberOfLines={1}>{worker.name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={T.orange} />
              <Text style={styles.ratingText}>{formatRating(worker.rating)}</Text>
            </View>
          </View>

          <Text style={styles.workerTrade} numberOfLines={1}>{worker.trades[0]}</Text>

          <View style={styles.metaRow}>
            {price && (
              <View style={styles.pricePill}>
                <Text style={styles.priceText}>{price}</Text>
              </View>
            )}
            {worker.distance != null && (
              <View style={styles.distRow}>
                <Ionicons name="location-outline" size={11} color={T.text3} />
                <Text style={styles.distText}>{shortDist(worker.distance)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLocation, permissionStatus, requestPermission } = useLocation();
  const { nearbyWorkers, setNearbyWorkers, setSelectedWorker } = useWorkerStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTrade, setActiveTrade] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<MapView>(null);

  const fetchWorkers = useCallback(async () => {
    const loc = currentLocation ?? BIRMINGHAM;
    try {
      const workers = await getNearbyWorkers({
        lat: loc.latitude,
        lng: loc.longitude,
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

  const filteredWorkers = useMemo(() => {
    if (!activeTrade) return visibleWorkers;
    return visibleWorkers.filter((w) =>
      w.trades.some((t) => t.toLowerCase().includes(activeTrade.toLowerCase())),
    );
  }, [visibleWorkers, activeTrade]);

  const loc = currentLocation ?? BIRMINGHAM;
  const initialRegion: Region = {
    ...loc,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const SEARCH_TOP = insets.top + 8;
  const BOTTOM_SAFE = insets.bottom;
  const locationDenied = permissionStatus === 'denied';

  return (
    <View style={styles.screen}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        customMapStyle={LIGHT_MAP_STYLE}
      >
        {filteredWorkers.map((worker) => (
          <WorkerMapPin
            key={worker.id ?? worker.name}
            worker={worker}
            onPress={handlePinPress}
            selected={worker.id === selectedId}
          />
        ))}
      </MapView>

      {/* Floating search bar */}
      <View style={[styles.searchWrap, { top: SEARCH_TOP }]}>
        <Ionicons name="search-outline" size={18} color={T.text3} style={{ marginRight: 4 }} />
        <Pressable
          style={styles.searchInput}
          onPress={() => router.push('/(customer)/search')}
        >
          <Text style={styles.searchPlaceholder}>Search Birmingham…</Text>
        </Pressable>
        <Pressable
          style={styles.filterBtn}
          onPress={() => {}}
          hitSlop={8}
        >
          <Ionicons name="options-outline" size={18} color={T.text1} />
        </Pressable>
      </View>

      {/* Location denied overlay */}
      {locationDenied && (
        <View style={styles.permOverlay}>
          <View style={styles.permCard}>
            <View style={styles.permIcon}>
              <Ionicons name="location-outline" size={28} color={T.orange} />
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

      {/* Bottom sheet */}
      <View style={[styles.sheet, { paddingBottom: BOTTOM_SAFE + 56 }]}>
        {/* Grabber */}
        <View style={styles.grabberRow}>
          <View style={styles.grabber} />
        </View>

        {/* Trade filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tradeChipsContent}
          style={styles.tradeChipsScroll}
        >
          {TRADES.map((trade) => {
            const isActive = activeTrade === trade;
            return (
              <Pressable
                key={trade}
                style={[styles.tradeChip, isActive && styles.tradeChipActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTrade(isActive ? null : trade);
                }}
              >
                <Text style={[styles.tradeChipText, isActive && styles.tradeChipTextActive]}>
                  {trade}
                </Text>
                {isActive && (
                  <Ionicons name="close" size={12} color="#fff" style={{ marginLeft: 4 }} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Worker cards horizontal */}
        {filteredWorkers.length > 0 ? (
          <FlatList
            data={filteredWorkers}
            keyExtractor={(w, i) => w.id ?? String(i)}
            renderItem={({ item }) => (
              <MapWorkerCard
                worker={item}
                onPress={() => router.push(`/(customer)/worker/${item.id}`)}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContent}
            snapToInterval={296}
            decelerationRate="fast"
            removeClippedSubviews
          />
        ) : (
          <View style={styles.emptyRow}>
            <Ionicons name="search-outline" size={18} color={T.text3} />
            <Text style={styles.emptyText}>No tradespeople found nearby</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  // Floating search
  searchWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.nav,
    height: 56,
    paddingHorizontal: 16,
    ...shadows.md,
  },
  searchInput: { flex: 1, marginHorizontal: 8 },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: T.text3,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: T.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Permission overlay
  permOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 30,
  },
  permCard: {
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 24,
    margin: 32,
    alignItems: 'center',
    gap: 12,
    ...shadows.lg,
  },
  permIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: T.orangeLight,
    alignItems: 'center', justifyContent: 'center',
  },
  permTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: T.text1, textAlign: 'center' },
  permBody: { fontSize: 13, fontFamily: 'Inter_400Regular', color: T.text2, textAlign: 'center' },
  permBtn: {
    backgroundColor: T.orange, borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  permBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: T.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...shadows.lg,
  },
  grabberRow: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  grabber: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },

  // Trade chips
  tradeChipsScroll: { marginBottom: 4 },
  tradeChipsContent: { paddingHorizontal: 16, gap: 8 },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tradeChipActive: {
    backgroundColor: T.orange,
    borderColor: T.orange,
    shadowColor: T.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tradeChipText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: T.text1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tradeChipTextActive: { color: '#fff' },

  // Worker cards
  cardsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: T.text3 },

  card: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 16,
    width: 280,
    borderWidth: 1,
    borderColor: T.borderL,
    ...shadows.sm,
  },
  cardRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },

  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarFallback: {
    backgroundColor: T.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 16, fontFamily: 'Inter_700Bold', color: T.orangeDark },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: T.card,
  },
  dotGreen: { backgroundColor: '#22C55E' },
  dotRed:   { backgroundColor: '#EF4444' },

  cardInfo: { flex: 1 },
  cardInfoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  workerName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: T.text1, flexShrink: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: T.text1 },
  workerTrade: { fontSize: 13, fontFamily: 'Inter_400Regular', color: T.text2, marginBottom: 8 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pricePill: {
    backgroundColor: `${T.orange}1A`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: T.orange },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  distText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: T.text2 },
});
