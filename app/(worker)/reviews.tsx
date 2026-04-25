import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ReviewCard from '../../components/worker/ReviewCard';
import StarRating from '../../components/ui/StarRating';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { TabHeader } from '../../components/layout/AppHeader';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { getWorkerReviews, replyToReview } from '../../services/reviews';
import { useWorkerProfileStore } from '../../stores/workerProfileStore';
import { useAuth } from '../../hooks/useAuth';
import { Review } from '../../types/review';
import { formatRating } from '../../utils/formatters';

type FilterTab = 'all' | '5' | 'recent';

// ── Rating bar — shows count, not percentage ──────────────────────────────────
function RatingBar({ star, count, max }: { star: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <View style={bar.row}>
      <Text style={bar.label}>{star} Star</Text>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={bar.count}>{count}</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 5 },
  label: { ...typography.caption, color: colors.textSecondary, width: 42 },
  track: { flex: 1, height: 7, backgroundColor: colors.surfaceElevated, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#F97316', borderRadius: radius.full },
  count: { ...typography.caption, color: colors.textSecondary, width: 20, textAlign: 'right' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function WorkerReviewsScreen() {
  const { user } = useAuth();
  const { profile } = useWorkerProfileStore();
  const { show } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const workerId = profile?.id ?? user?.id ?? '';

  useEffect(() => {
    if (!workerId) return;
    (async () => {
      try {
        const data = await getWorkerReviews(workerId);
        setReviews(data);
      } catch {
        show('Could not load reviews', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [workerId]);

  const handleReply = useCallback(async (reviewId: string, reply: string) => {
    await replyToReview(reviewId, reply);
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, reply } : r));
    show('Reply posted', 'success');
  }, []);

  const filtered = reviews.filter((r) => {
    if (activeTab === '5') return r.rating === 5;
    if (activeTab === 'recent') return Date.now() - new Date(r.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const maxCount = Math.max(...[5, 4, 3, 2, 1].map((s) => reviews.filter((r) => r.rating === s).length), 1);
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: '5', label: '5 Star' },
    { key: 'recent', label: 'Recent' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TabHeader profileRoute="/(worker)/preview" />

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={100} borderRadius={14} style={{ marginBottom: spacing.md }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReviewCard review={item} onReply={handleReply} isWorkerView />
          )}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Page title */}
              <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>My Reviews</Text>
                <View style={styles.pageRatingRow}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.pageRating}>{formatRating(avgRating)}</Text>
                  <Text style={styles.pageCount}>({reviews.length} reviews)</Text>
                </View>
              </View>

              {/* Summary card: big rating + bar chart */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryLeft}>
                  <Text style={styles.bigRating}>{formatRating(avgRating)}</Text>
                  <StarRating value={avgRating} size="md" />
                  <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
                </View>
                <View style={styles.summaryRight}>
                  {starCounts.map(({ star, count }) => (
                    <RatingBar key={star} star={star} count={count} max={maxCount} />
                  ))}
                </View>
              </View>

              {/* Filter pills */}
              <View style={styles.tabRow}>
                {TABS.map((tab) => (
                  <Pressable
                    key={tab.key}
                    style={[styles.pill, activeTab === tab.key && styles.pillActive]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text style={[styles.pillLabel, activeTab === tab.key && styles.pillLabelActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState title="No reviews yet" subtitle="Your reviews from customers will appear here" />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  skeletons: { padding: spacing.lg, gap: spacing.md },

  /* Page header */
  pageHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: 4,
  },
  pageTitle: { ...typography.h2, color: colors.textPrimary },
  pageRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pageRating: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  pageCount: { ...typography.small, color: colors.textSecondary },

  /* Summary card */
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  summaryLeft: { alignItems: 'center', gap: spacing.xs, minWidth: 72 },
  bigRating: { fontSize: 40, fontWeight: '800', color: colors.textPrimary, lineHeight: 44 },
  reviewCount: { ...typography.caption, color: colors.textSecondary },
  summaryRight: { flex: 1, justifyContent: 'center' },

  /* Filter pills */
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  pillLabelActive: { color: '#fff' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
});
