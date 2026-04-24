import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { getNearbyWorkers } from '../../services/workers';
import { useLocation } from '../../hooks/useLocation';
import { Worker } from '../../types/worker';
import { formatDistance, formatRating } from '../../utils/formatters';

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

  useEffect(() => { search(query); }, [availableOnly, sortBy]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={17} color={colors.textDisabled} />
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
              <Pressable onPress={() => { setQuery(''); setWorkers([]); }} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Filter pills */}
        <View style={styles.filtersRow}>
          <Pressable
            style={[styles.pill, sortBy === 'distance' && styles.pillActive]}
            onPress={() => setSortBy('distance')}
          >
            <Ionicons name="navigate-outline" size={13} color={sortBy === 'distance' ? colors.textInverse : colors.textSecondary} />
            <Text style={[styles.pillText, sortBy === 'distance' && styles.pillTextActive]}>Distance</Text>
          </Pressable>
          <Pressable
            style={[styles.pill, sortBy === 'rating' && styles.pillActive]}
            onPress={() => setSortBy('rating')}
          >
            <Ionicons name="star-outline" size={13} color={sortBy === 'rating' ? colors.textInverse : colors.textSecondary} />
            <Text style={[styles.pillText, sortBy === 'rating' && styles.pillTextActive]}>Rating</Text>
          </Pressable>
          <View style={styles.togglePill}>
            <Text style={styles.toggleLabel}>Available Now</Text>
            <Switch
              value={availableOnly}
              onValueChange={setAvailableOnly}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>
        </View>
      </View>

      {/* Results count */}
      {!loading && workers.length > 0 && (
        <Text style={styles.resultCount}>
          {workers.length} {query ? `electricians` : 'tradespeople'} near Birmingham
        </Text>
      )}

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3, 4].map(i => (
            <SkeletonLoader key={i} width="100%" height={90} borderRadius={14} style={{ marginBottom: spacing.sm }} />
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
          keyExtractor={w => w.id}
          renderItem={({ item }) => (
            <SearchResultCard
              worker={item}
              onPress={() => router.push(`/(customer)/worker/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

function SearchResultCard({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  const isAvailable = worker.isAvailable;
  const handleCall = () => Linking.openURL(`tel:${worker.phone}`);

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]} onPress={onPress}>
      {/* Avatar */}
      <View style={styles.cardAvatarWrap}>
        {worker.avatarUrl
          ? <Image source={{ uri: worker.avatarUrl }} style={styles.cardAvatar} />
          : <View style={[styles.cardAvatar, styles.cardAvatarFallback]}>
              <Text style={styles.cardAvatarInitials}>
                {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
        }
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{worker.name}</Text>
          <View style={[styles.statusBadge, isAvailable ? styles.statusAvail : styles.statusBusy]}>
            <Text style={[styles.statusText, { color: isAvailable ? colors.success : colors.warning }]}>
              {isAvailable ? '● AVAILABLE' : '● BUSY'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardTrade} numberOfLines={1}>
          {worker.trades[0]} {worker.distance != null ? `• ${formatDistance(worker.distance)}` : ''}
        </Text>
        <View style={styles.cardStarRow}>
          <Ionicons name="star" size={13} color="#FBBF24" />
          <Text style={styles.cardRating}>{formatRating(worker.rating)}</Text>
          <Text style={styles.cardReviews}>({worker.reviewCount} reviews)</Text>
        </View>
      </View>

      {/* Action */}
      <View style={styles.cardAction}>
        {isAvailable ? (
          <Pressable
            style={styles.callBtn}
            onPress={e => { e.stopPropagation(); handleCall(); }}
          >
            <Ionicons name="call" size={14} color={colors.textInverse} />
            <Text style={styles.callBtnText}>Call</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.bookLaterBtn} onPress={onPress}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.bookLaterText}>Book later</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  filterBtn: {
    width: 40, height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },

  /* Filters */
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: colors.textInverse },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },

  /* Results */
  resultCount: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 32 },
  skeletons: { paddingHorizontal: spacing.lg, marginTop: spacing.md },

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardAvatarWrap: { flexShrink: 0 },
  cardAvatar: { width: 64, height: 64, borderRadius: radius.md },
  cardAvatarFallback: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardAvatarInitials: { ...typography.h3, color: colors.primaryDark },
  cardInfo: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  cardName: { ...typography.h4, color: colors.textPrimary },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  statusAvail: { backgroundColor: colors.successBg },
  statusBusy: { backgroundColor: colors.warningBg },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardTrade: { ...typography.small, color: colors.textSecondary },
  cardStarRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardRating: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  cardReviews: { ...typography.caption, color: colors.textSecondary },
  cardAction: { flexShrink: 0 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  callBtnText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },
  bookLaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
  },
  bookLaterText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
});
