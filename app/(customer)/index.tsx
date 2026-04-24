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

  // Request permission on first open
  useEffect(() => {
    if (permissionStatus === 'undetermined') requestPermission();
  }, [permissionStatus]);

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
      // leave previous results visible; toast handled by service layer if needed
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentLocation, activeTrade]);

  // Fetch whenever location is first obtained or trade filter changes
  useEffect(() => {
    if (currentLocation) fetchWorkers();
  }, [fetchWorkers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkers();
  }, [fetchWorkers]);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const locationText = currentLocation ? 'Near you' : 'Location not set';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.locationLabel}>YOUR LOCATION</Text>
          <Pressable style={styles.locationRow} onPress={requestPermission}>
            <Ionicons
              name={currentLocation ? 'location' : 'location-outline'}
              size={16}
              color={currentLocation ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.locationText, !currentLocation && { color: colors.textSecondary }]}>
              {locationText}
            </Text>
          </Pressable>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={() => router.push('/(customer)/profile')}>
            <View style={styles.avatarSmall}>
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
        {/* Heading */}
        <Text style={styles.heading}>Find a trusted{'\n'}professional</Text>

        {/* Search bar */}
        <Pressable style={styles.searchBar} onPress={() => router.push('/(customer)/search')}>
          <Ionicons name="search-outline" size={18} color={colors.textDisabled} />
          <Text style={styles.searchPlaceholder}>Search by trade, name...</Text>
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
          <Text style={styles.sectionTitle}>Available Now Near You</Text>
          <Pressable onPress={() => router.push('/(customer)/search')}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        {!currentLocation && permissionStatus !== 'denied' ? (
          // Waiting for location (permission undetermined or granted but GPS loading)
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonRow}>
            {[1, 2].map(i => (
              <SkeletonLoader key={i} width={200} height={240} borderRadius={14} style={{ marginRight: spacing.md }} />
            ))}
          </ScrollView>
        ) : loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonRow}>
            {[1, 2].map(i => (
              <SkeletonLoader key={i} width={200} height={240} borderRadius={14} style={{ marginRight: spacing.md }} />
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
        <View style={[styles.sectionHeader, { marginTop: spacing.xxl }]}>
          <Text style={styles.sectionTitle}>Highly Rated</Text>
        </View>

        {!currentLocation && permissionStatus !== 'denied' ? (
          <View style={styles.skeletonCol}>
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} width="100%" height={90} borderRadius={14} style={{ marginBottom: spacing.sm }} />
            ))}
          </View>
        ) : loading ? (
          <View style={styles.skeletonCol}>
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} width="100%" height={90} borderRadius={14} style={{ marginBottom: spacing.sm }} />
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
  const heroImage = worker.portfolioPhotos?.[0] ?? worker.avatarUrl;
  return (
    <Pressable style={({ pressed }) => [styles.availCard, pressed && { opacity: 0.93 }]} onPress={onPress}>
      <View style={styles.availImageWrap}>
        {heroImage
          ? <ExpoImage source={{ uri: heroImage }} style={styles.availImage} contentFit="cover" />
          : <View style={[styles.availImage, styles.availImageFallback]}>
              <Ionicons name="person" size={40} color={colors.textDisabled} />
            </View>
        }
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <Text style={styles.ratingBadgeText}>{formatRating(worker.rating)}</Text>
        </View>
        <View style={styles.availBadge}>
          <View style={styles.availDot} />
          <Text style={styles.availBadgeText}>AVAILABLE</Text>
        </View>
      </View>
      <View style={styles.availBody}>
        <Text style={styles.availName} numberOfLines={1}>{worker.name}</Text>
        <Text style={styles.availTrade} numberOfLines={1}>
          {worker.trades[0]}{worker.distance != null ? ` · ${formatDistance(worker.distance)}` : ''}
        </Text>
        <View style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </View>
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
        <Text style={styles.ratedName} numberOfLines={1}>{worker.name}</Text>
        <Text style={styles.ratedTrade} numberOfLines={1}>{worker.trades[0]}</Text>
        <View style={styles.ratedStarRow}>
          <Ionicons name="star" size={13} color="#FBBF24" />
          <Text style={styles.ratedRating}>{formatRating(worker.rating)}</Text>
          <Text style={styles.ratedReviews}>{worker.reviewCount} reviews</Text>
        </View>
      </View>
      <View style={styles.ratedRight}>
        <Text style={styles.ratedPrice}>From £45/hr</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 32 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  locationLabel: { ...typography.label, color: colors.textDisabled, fontSize: 10, marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { ...typography.bodyMd, color: colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: { padding: spacing.xs },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },

  /* Heading */
  heading: {
    ...typography.h1,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    lineHeight: 34,
  },

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchPlaceholder: { ...typography.body, color: colors.textDisabled, flex: 1 },

  /* Permission banner */
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  permText: { flex: 1 },
  permTitle: { ...typography.bodyMd, color: colors.primaryDark, fontWeight: '600' },
  permSub: { ...typography.caption, color: colors.primary, marginTop: 2 },

  /* Chips */
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.textInverse },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  viewAll: { ...typography.small, color: colors.primary, fontWeight: '600' },
  emptyInline: {
    ...typography.small,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  skeletonRow: { paddingHorizontal: spacing.lg },
  skeletonCol: { paddingHorizontal: spacing.lg },
  horizontalList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },

  /* Empty box */
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  emptyBoxTitle: { ...typography.h4, color: colors.textPrimary, textAlign: 'center' },
  emptyBoxSub: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },

  /* Available card */
  availCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadows.md,
  },
  availImageWrap: { width: '100%', height: 140, position: 'relative' },
  availImage: { width: '100%', height: '100%' },
  availImageFallback: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  ratingBadgeText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  availBadge: {
    position: 'absolute', bottom: spacing.sm, left: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  availBadgeText: { ...typography.caption, color: '#fff', fontWeight: '700', fontSize: 10 },
  availBody: { padding: spacing.md, gap: spacing.xs },
  availName: { ...typography.h4, color: colors.textPrimary },
  availTrade: { ...typography.small, color: colors.textSecondary },
  bookBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  bookBtnText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },

  /* Rated card */
  ratedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  ratedAvatarWrap: { flexShrink: 0 },
  ratedAvatar: { width: 56, height: 56, borderRadius: 28 },
  ratedAvatarFallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratedAvatarInitials: { ...typography.h3, color: colors.primaryDark },
  ratedInfo: { flex: 1, gap: 3 },
  ratedName: { ...typography.h4, color: colors.textPrimary },
  ratedTrade: { ...typography.small, color: colors.textSecondary },
  ratedStarRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratedRating: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  ratedReviews: { ...typography.caption, color: colors.textSecondary },
  ratedRight: { alignItems: 'flex-end', gap: 4 },
  ratedPrice: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
