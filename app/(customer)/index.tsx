import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import WorkerCard from '../../components/worker/WorkerCard';
import WorkerCardLarge from '../../components/worker/WorkerCardLarge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { TRADES } from '../../constants/trades';
import { NEARBY_RADIUS_KM } from '../../constants/config';
import { useLocation } from '../../hooks/useLocation';
import { useWorkerStore } from '../../stores/workerStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { getNearbyWorkers } from '../../services/workers';
import { Worker } from '../../types/worker';

const FILTER_TRADES = ['All', 'Plumber', 'Electrician', 'Builder / General Contractor', 'Carpenter / Joiner', 'Painter & Decorator', 'Gas Engineer', 'Decorator'];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { currentLocation } = useLocation();
  const { nearbyWorkers, setNearbyWorkers, filters, setFilters } = useWorkerStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [ratedWorkers, setRatedWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTrade, setActiveTrade] = useState('All');

  const fetchWorkers = useCallback(async () => {
    if (!currentLocation) return;
    setError('');
    try {
      const [available, rated] = await Promise.all([
        getNearbyWorkers({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          radiusKm: 5,
          availableOnly: true,
          trade: activeTrade === 'All' ? undefined : activeTrade,
        }),
        getNearbyWorkers({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          radiusKm: NEARBY_RADIUS_KM,
          sortBy: 'rating',
          trade: activeTrade === 'All' ? undefined : activeTrade,
        }),
      ]);
      setAvailableWorkers(available);
      setRatedWorkers(rated);
      setNearbyWorkers([...available, ...rated]);
    } catch {
      setError('Could not load tradespeople. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentLocation, activeTrade]);

  useEffect(() => {
    setLoading(true);
    fetchWorkers();
  }, [fetchWorkers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkers();
  }, [fetchWorkers]);

  const renderAvailableCard = useCallback(
    ({ item }: { item: Worker }) => <WorkerCard worker={item} />,
    [],
  );
  const renderRatedCard = useCallback(
    ({ item }: { item: Worker }) => <WorkerCardLarge worker={item} />,
    [],
  );
  const keyExtractor = useCallback((item: Worker) => item.id, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>
            {currentLocation ? 'Near you' : 'Set location'}
          </Text>
        </Pressable>
        <Pressable style={styles.notifButton} onPress={() => {}}>
          <Text style={styles.notifIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Search bar */}
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/(customer)/search')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search plumbers, electricians...</Text>
        </Pressable>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          style={styles.filterScroll}
        >
          {FILTER_TRADES.map((trade) => (
            <Pressable
              key={trade}
              style={[styles.chip, activeTrade === trade && styles.chipActive]}
              onPress={() => setActiveTrade(trade)}
            >
              <Text style={[styles.chipText, activeTrade === trade && styles.chipTextActive]}>
                {trade}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Available Now section */}
        <Text style={styles.sectionTitle}>Available Now Near You</Text>
        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonRow}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width={200} height={220} borderRadius={14} style={styles.skeletonCard} />
            ))}
          </ScrollView>
        ) : availableWorkers.length === 0 ? (
          <Text style={styles.emptyInline}>No one available nearby right now</Text>
        ) : (
          <FlatList
            data={availableWorkers}
            keyExtractor={keyExtractor}
            renderItem={renderAvailableCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews
            scrollEnabled
          />
        )}

        {/* Highly Rated section */}
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Highly Rated</Text>
        {loading ? (
          <View style={styles.skeletonVertical}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width="100%" height={100} borderRadius={14} style={styles.skeletonVerticalCard} />
            ))}
          </View>
        ) : error ? (
          <EmptyState
            title="Couldn't load tradespeople"
            subtitle={error}
            action={{ label: 'Retry', onPress: fetchWorkers }}
          />
        ) : ratedWorkers.length === 0 ? (
          <EmptyState
            illustration={require('../../assets/illustrations/empty_state_illustration_for_a_search_result_a_sad_looking_construction_hard.png')}
            title="No tradespeople found"
            subtitle="Try expanding your search radius or changing your filters"
          />
        ) : (
          <FlatList
            data={ratedWorkers}
            keyExtractor={keyExtractor}
            renderItem={renderRatedCard}
            scrollEnabled={false}
            removeClippedSubviews
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationPin: {
    fontSize: 16,
  },
  locationText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  notifButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  notifIcon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.textDisabled,
  },
  filterScroll: {
    marginBottom: spacing.sm,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitleSpaced: {
    marginTop: spacing.xxl,
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  emptyInline: {
    ...typography.small,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  skeletonRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  skeletonCard: {
    marginRight: spacing.md,
  },
  skeletonVertical: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  skeletonVerticalCard: {
    marginBottom: spacing.sm,
  },
});
