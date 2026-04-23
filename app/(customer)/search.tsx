import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import WorkerCardLarge from '../../components/worker/WorkerCardLarge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { getNearbyWorkers } from '../../services/workers';
import { useLocation } from '../../hooks/useLocation';
import { Worker } from '../../types/worker';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { currentLocation } = useLocation();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(params.q ?? '');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');

  const search = useCallback(async (q: string) => {
    if (!currentLocation) return;
    setLoading(true);
    try {
      const results = await getNearbyWorkers({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        radiusKm: 20,
        trade: q || undefined,
        availableOnly,
        sortBy,
      });
      setWorkers(results);
    } catch {
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [currentLocation, availableOnly, sortBy]);

  useEffect(() => {
    inputRef.current?.focus();
    if (params.q) search(params.q);
  }, []);

  useEffect(() => {
    search(query);
  }, [availableOnly, sortBy]);

  const renderItem = useCallback(
    ({ item }: { item: Worker }) => <WorkerCardLarge worker={item} />,
    [],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search(query)}
            placeholder="Search plumbers, electricians..."
            placeholderTextColor={colors.textDisabled}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); setWorkers([]); }}>
              <Text style={styles.clear}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <Pressable
          style={[styles.filterChip, availableOnly && styles.filterChipActive]}
          onPress={() => setAvailableOnly((p) => !p)}
        >
          <Text style={[styles.filterChipText, availableOnly && styles.filterChipTextActive]}>
            Available Now
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, sortBy === 'distance' && styles.filterChipActive]}
          onPress={() => setSortBy('distance')}
        >
          <Text style={[styles.filterChipText, sortBy === 'distance' && styles.filterChipTextActive]}>
            Nearest
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, sortBy === 'rating' && styles.filterChipActive]}
          onPress={() => setSortBy('rating')}
        >
          <Text style={[styles.filterChipText, sortBy === 'rating' && styles.filterChipTextActive]}>
            Top Rated
          </Text>
        </Pressable>
      </View>

      {workers.length > 0 && !loading && (
        <Text style={styles.resultCount}>
          {workers.length} result{workers.length !== 1 ? 's' : ''} near you
        </Text>
      )}

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={i} width="100%" height={100} borderRadius={14} style={styles.skeleton} />
          ))}
        </View>
      ) : workers.length === 0 && query.length > 0 ? (
        <EmptyState
          illustration={require('../../assets/illustrations/empty_state_illustration_for_a_search_result_a_sad_looking_construction_hard.png')}
          title="No results found"
          subtitle={`No tradespeople found for "${query}"`}
        />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  back: {
    fontSize: 22,
    color: colors.textPrimary,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  clear: {
    fontSize: 16,
    color: colors.textDisabled,
    padding: spacing.xs,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  resultCount: {
    ...typography.small,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  skeletons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  skeleton: {
    marginBottom: spacing.sm,
  },
});
