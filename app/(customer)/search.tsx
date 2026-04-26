import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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

type SortBy = 'distance' | 'rating';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { currentLocation } = useLocation();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(params.q ?? '');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('distance');

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

  const resultLabel = workers.length > 0
    ? `${workers.length} ${query ? query.toLowerCase() : 'tradesperson'}${workers.length !== 1 ? 's' : ''} near Birmingham`
    : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ── Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={16} color={colors.textDisabled} />
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
                <Ionicons name="close-circle" size={17} color={colors.textDisabled} />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterIconBtn}>
            <Ionicons name="options-outline" size={19} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Filter pills */}
        <View style={styles.filtersRow}>
          <SortPill
            label="Distance"
            active={sortBy === 'distance'}
            onPress={() => setSortBy('distance')}
          />
          <SortPill
            label="Rating"
            active={sortBy === 'rating'}
            onPress={() => setSortBy('rating')}
          />
          <View style={styles.togglePill}>
            <Text style={styles.toggleLabel}>Available Now</Text>
            <Switch
              value={availableOnly}
              onValueChange={(v) => { Haptics.selectionAsync(); setAvailableOnly(v); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
            />
          </View>
        </View>
      </View>

      {/* ── Results ───────────────────────────────────────────── */}
      {!loading && resultLabel && (
        <Text style={styles.resultCount}>{resultLabel}</Text>
      )}

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader
              key={i}
              width="100%"
              height={120}
              borderRadius={radius.xl}
              style={{ marginBottom: spacing.sm }}
            />
          ))}
        </View>
      ) : workers.length === 0 && query.length > 0 ? (
        <EmptyState
          illustration={require('../../assets/illustrations/empty_state_illustration_for_a_search_result_a_sad_looking_construction_hard.png')}
          title="No results found"
          subtitle={`No tradespeople found for "${query}"`}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={workers}
            keyExtractor={(w) => w.id}
            renderItem={({ item }) => (
              <WorkerCard
                worker={item}
                onPress={() => router.push(`/(customer)/worker/${item.id}`)}
              />
            )}
            contentContainerStyle={styles.list}
            removeClippedSubviews
            showsVerticalScrollIndicator={false}
          />
          {/* Gradient fade signals more content below */}
          <LinearGradient
            colors={['transparent', colors.background]}
            style={styles.listFade}
            pointerEvents="none"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function SortPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
      <Ionicons name="chevron-down" size={12} color={active ? colors.textInverse : colors.textSecondary} />
    </Pressable>
  );
}

function AvailabilityPulseDot({ active }: { active: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [active]);
  return <Animated.View style={[styles.badgeDot, active ? styles.dotGreen : styles.dotOrange, active && { opacity: pulse }]} />;
}

function WorkerCard({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  const isAvailable = worker.isAvailable;

  const handleCall = (e: any) => {
    e.stopPropagation();
    if (worker.phone) Linking.openURL(`tel:${worker.phone}`);
  };

  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const distanceText = worker.distance != null ? formatDistance(worker.distance) : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Top section: avatar + info */}
      <View style={styles.cardTop}>
        {worker.avatarUrl ? (
          <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
            <View style={[styles.badge, isAvailable ? styles.badgeAvail : styles.badgeBusy]}>
              <AvailabilityPulseDot active={isAvailable} />
              <Text style={[styles.badgeText, isAvailable ? styles.badgeTextAvail : styles.badgeTextBusy]}>
                {isAvailable ? 'AVAILABLE' : 'BUSY'}
              </Text>
            </View>
          </View>

          <Text style={styles.trade} numberOfLines={1}>
            {worker.trades[0]}{distanceText ? ` • ${distanceText}` : ''}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#FBBF24" />
            <Text style={styles.ratingVal}>{formatRating(worker.rating)}</Text>
            <Text style={styles.reviewCount}>({worker.reviewCount} reviews)</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Full-width action button */}
      {isAvailable ? (
        <Pressable style={styles.callBtn} onPress={handleCall}>
          <Ionicons name="call" size={15} color="#fff" />
          <Text style={styles.callBtnText}>Call</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.bookBtn} onPress={onPress}>
          <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.bookBtnText}>Book later</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────

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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  filterIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderLight,
  },

  /* Filters */
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
    borderColor: colors.borderLight,
  },
  toggleLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },

  /* Results */
  resultCount: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 80 },
  skeletons: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  listFade: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 64,
    pointerEvents: 'none',
  },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardPressed: { opacity: 0.95, transform: [{ scale: 0.99 }] },

  /* Card top section */
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 72, height: 72,
    borderRadius: 10,
    flexShrink: 0,
  },
  avatarFallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { ...typography.h3, color: colors.primaryDark, fontWeight: '700' },

  cardInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { ...typography.h4, color: colors.textPrimary, flexShrink: 1 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeAvail: { backgroundColor: colors.successBg },
  badgeBusy: { backgroundColor: colors.warningBg },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  dotGreen: { backgroundColor: colors.success },
  dotOrange: { backgroundColor: colors.warning },
  badgeText: { fontSize: 10, fontWeight: '700' },
  badgeTextAvail: { color: colors.success },
  badgeTextBusy: { color: colors.warning },

  trade: { ...typography.small, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingVal: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  reviewCount: { ...typography.caption, color: colors.textSecondary },

  /* Card divider */
  cardDivider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  /* Full-width action buttons */
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    margin: spacing.md,
    borderRadius: radius.lg,
  },
  callBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
    margin: spacing.md,
    borderRadius: radius.lg,
  },
  bookBtnText: { ...typography.bodyMd, color: colors.textSecondary, fontWeight: '600' },
});
