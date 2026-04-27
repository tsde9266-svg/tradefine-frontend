import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Location from 'expo-location';

import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { NEARBY_RADIUS_KM } from '../../constants/config';
import { useLocation } from '../../hooks/useLocation';
import { useWorkerStore } from '../../stores/workerStore';
import { useAuthStore } from '../../stores/authStore';
import { getNearbyWorkers } from '../../services/workers';
import { Worker } from '../../types/worker';
import { formatDistance, formatRating } from '../../utils/formatters';

const TRADES = ['All', 'Plumber', 'Electrician', 'Builder', 'Carpenter', 'Painter', 'Gas Engineer', 'Roofer'];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { currentLocation, permissionStatus, requestPermission } = useLocation();
  const { setNearbyWorkers } = useWorkerStore();
  const user = useAuthStore(s => s.user);

  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [ratedWorkers, setRatedWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTrade, setActiveTrade] = useState('All');
  const [locationName, setLocationName] = useState<string>('Near You');

  useEffect(() => {
    if (permissionStatus === 'undetermined') requestPermission();
  }, [permissionStatus]);

  useEffect(() => {
    if (!currentLocation) return;
    Location.reverseGeocodeAsync(currentLocation)
      .then(([geo]) => {
        if (geo) {
          const parts = [geo.city ?? geo.subregion, geo.postalCode].filter(Boolean);
          if (parts.length) setLocationName(parts.join(', '));
        }
      })
      .catch(() => {});
  }, [currentLocation]);

  const fetchWorkers = useCallback(async () => {
    if (!currentLocation) return;
    setLoading(true);
    try {
      const trade = activeTrade === 'All' ? undefined : activeTrade;
      const [available, rated] = await Promise.all([
        getNearbyWorkers({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          radiusKm: 5,
          availableOnly: true,
          trade,
        }),
        getNearbyWorkers({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          radiusKm: NEARBY_RADIUS_KM,
          sortBy: 'rating',
          trade,
        }),
      ]);
      setAvailableWorkers(available);
      setRatedWorkers(rated);
      setNearbyWorkers([...available, ...rated]);
    } catch {
      // leave previous results visible
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentLocation, activeTrade]);

  useEffect(() => {
    if (currentLocation) fetchWorkers();
  }, [fetchWorkers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkers();
  }, [fetchWorkers]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Floating Header */}
      <View style={styles.header}>
        <Pressable style={styles.locationRow} onPress={requestPermission}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <View>
            <Text style={styles.locationCity}>
              {currentLocation ? locationName : 'Location not set'}
            </Text>
            <Text style={styles.locationSub}>CHANGE LOCATION</Text>
          </View>
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable style={styles.notifBtn} onPress={() => router.push('/(customer)/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            <View style={styles.notifDot} />
          </Pressable>
          <Pressable onPress={() => router.push('/(customer)/profile')}>
            <View style={styles.avatar}>
              {user?.avatarUrl
                ? <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                : <Ionicons name="person" size={18} color={colors.textInverse} />
              }
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* Search bar */}
        <Pressable style={styles.searchBar} onPress={() => router.push('/(customer)/search')}>
          <Ionicons name="search-outline" size={20} color={colors.textDisabled} />
          <Text style={styles.searchPlaceholder}>Search plumbers, electricians...</Text>
          <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
        </Pressable>

        {/* Location permission banner */}
        {permissionStatus === 'denied' && (
          <Pressable style={styles.permBanner} onPress={requestPermission}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <View style={styles.permText}>
              <Text style={styles.permTitle}>Enable location to find tradespeople near you</Text>
              <Text style={styles.permSub}>Tap to open settings and allow location access</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
          </Pressable>
        )}

        {/* Trade chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {TRADES.map((t) => (
            <Pressable
              key={t}
              style={[styles.chip, activeTrade === t && styles.chipActive]}
              onPress={() => setActiveTrade(t)}
            >
              <Text style={[styles.chipText, activeTrade === t && styles.chipTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Available Now */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available right now</Text>
          <Pressable onPress={() => router.push('/(customer)/search')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {!currentLocation && permissionStatus !== 'denied' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {[1, 2].map(i => (
              <SkeletonLoader key={i} width={190} height={240} borderRadius={12} style={{ marginRight: spacing.md }} />
            ))}
          </ScrollView>
        ) : loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {[1, 2].map(i => (
              <SkeletonLoader key={i} width={190} height={240} borderRadius={12} style={{ marginRight: spacing.md }} />
            ))}
          </ScrollView>
        ) : availableWorkers.length === 0 ? (
          <Text style={styles.emptyInline}>
            {permissionStatus === 'denied'
              ? 'Enable location to see available tradespeople'
              : 'No one available nearby right now'}
          </Text>
        ) : (
          <FlatList
            data={availableWorkers}
            keyExtractor={w => w.id}
            renderItem={({ item }) => (
              <AvailableCard
                worker={item}
                onPress={() => router.push(`/(customer)/worker/${item.id}`)}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews
          />
        )}

        {/* Highly Rated */}
        <Text style={styles.sectionTitleStandalone}>Highly rated near you</Text>

        {!currentLocation && permissionStatus !== 'denied' ? (
          <View style={styles.skeletonCol}>
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} width="100%" height={82} borderRadius={12} style={{ marginBottom: spacing.sm }} />
            ))}
          </View>
        ) : loading ? (
          <View style={styles.skeletonCol}>
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} width="100%" height={82} borderRadius={12} style={{ marginBottom: spacing.sm }} />
            ))}
          </View>
        ) : ratedWorkers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={40} color={colors.textDisabled} />
            <Text style={styles.emptyBoxTitle}>No tradespeople found</Text>
            <Text style={styles.emptyBoxSub}>
              {permissionStatus === 'denied'
                ? 'Enable location access to see tradespeople near you'
                : 'Try expanding your search or changing filters'}
            </Text>
          </View>
        ) : (
          ratedWorkers.map(w => (
            <RatedCard
              key={w.id}
              worker={w}
              onPress={() => router.push(`/(customer)/worker/${w.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AvailableCard({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.availCard, pressed && { opacity: 0.92 }]} onPress={onPress}>
      {/* Available badge — absolute top-left */}
      <View style={styles.availBadge}>
        <View style={styles.availDot} />
        <Text style={styles.availBadgeText}>Available</Text>
      </View>

      {/* Avatar */}
      <View style={styles.availAvatarWrap}>
        {worker.avatarUrl
          ? <ExpoImage source={{ uri: worker.avatarUrl }} style={styles.availAvatar} contentFit="cover" />
          : <View style={[styles.availAvatar, styles.availAvatarFallback]}>
              <Ionicons name="person" size={32} color={colors.textDisabled} />
            </View>
        }
      </View>

      {/* Info */}
      <Text style={styles.availName} numberOfLines={1}>{worker.name}</Text>
      <View style={styles.availStarRow}>
        <Ionicons name="star" size={13} color={colors.star} />
        <Text style={styles.availRating}>{formatRating(worker.rating)}</Text>
        <Text style={styles.availReviews}>({worker.reviewCount})</Text>
      </View>
      <Text style={styles.availTrade} numberOfLines={1}>
        {worker.trades[0]}{worker.distance != null ? ` · ${formatDistance(worker.distance)}` : ''}
      </Text>

      {/* Call Now button — absolute bottom */}
      <View style={styles.callBtn}>
        <Text style={styles.callBtnText}>Call Now</Text>
      </View>
    </Pressable>
  );
}

function RatedCard({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.ratedCard, pressed && { opacity: 0.93 }]} onPress={onPress}>
      <View style={styles.ratedAvatarWrap}>
        {worker.avatarUrl
          ? <Image source={{ uri: worker.avatarUrl }} style={styles.ratedAvatar} />
          : <View style={[styles.ratedAvatar, styles.ratedAvatarFallback]}>
              <Text style={styles.ratedAvatarInitials}>
                {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
        }
      </View>
      <View style={styles.ratedInfo}>
        <View style={styles.ratedTopRow}>
          <Text style={styles.ratedName} numberOfLines={1}>{worker.name}</Text>
          <Text style={styles.ratedPrice}>From £45/hr</Text>
        </View>
        <View style={styles.ratedMidRow}>
          <View style={styles.ratedStarRow}>
            <Ionicons name="star" size={13} color={colors.star} />
            <Text style={styles.ratedRating}>{formatRating(worker.rating)}</Text>
            <Text style={styles.ratedReviews}>({worker.reviewCount})</Text>
          </View>
          {worker.status === 'approved' && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.ratedTrade} numberOfLines={1}>
          {worker.trades[0]}{worker.distance != null ? ` · ${formatDistance(worker.distance)}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: spacing.md, paddingBottom: 32 },

  // ── Floating Header ────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    ...shadows.md,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  locationCity: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  locationSub: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.textDisabled,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  notifBtn: { position: 'relative', padding: 2 },
  notifDot: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5, borderColor: colors.surface,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5, borderColor: colors.border,
  },
  avatarImg: { width: 34, height: 34, borderRadius: 17 },

  // ── Search ─────────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 52,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textDisabled,
    flex: 1,
  },

  // ── Permission banner ──────────────────────────────────────────────────────
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  permText: { flex: 1 },
  permTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.primaryDark,
  },
  permSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },

  // ── Trade chips ────────────────────────────────────────────────────────────
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.textInverse },

  // ── Section headers ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionTitleStandalone: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.primary,
  },
  emptyInline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  horizontalList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  skeletonCol: { paddingHorizontal: spacing.lg },

  // ── Empty box ──────────────────────────────────────────────────────────────
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  emptyBoxTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyBoxSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Available card ─────────────────────────────────────────────────────────
  availCard: {
    width: 190,
    height: 240,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingTop: 36,           // room for the "Available" badge at top
    paddingBottom: 52,        // room for the absolute "Call Now" button at bottom
    marginRight: spacing.md,
    alignItems: 'center',
    position: 'relative',
    ...shadows.md,
  },
  availBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#DCFCE7',
    borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.available },
  availBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#15803D',
  },
  availAvatarWrap: { marginBottom: spacing.sm },
  availAvatar: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: colors.surfaceElevated,
  },
  availAvatarFallback: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  availName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 3,
  },
  availStarRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  availRating: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  availReviews: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  availTrade: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  callBtn: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  callBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textInverse,
  },

  // ── Rated card ─────────────────────────────────────────────────────────────
  ratedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  ratedAvatarWrap: { flexShrink: 0 },
  ratedAvatar: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1, borderColor: colors.border,
  },
  ratedAvatarFallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  ratedAvatarInitials: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.primaryDark,
  },
  ratedInfo: { flex: 1, gap: 4 },
  ratedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratedName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  ratedPrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  ratedMidRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratedStarRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratedRating: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  ratedReviews: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  verifiedText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  ratedTrade: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
});
