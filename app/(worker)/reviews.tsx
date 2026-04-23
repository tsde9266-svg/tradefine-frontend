import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ReviewCard from '../../components/worker/ReviewCard';
import StarRating from '../../components/ui/StarRating';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
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

type FilterTab = 'all' | '5' | '4' | 'recent';

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{star}★</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={barStyles.pct}>{Math.round(pct)}%</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  label: { ...typography.small, color: colors.textSecondary, width: 24, textAlign: 'right' },
  track: { flex: 1, height: 8, backgroundColor: colors.surfaceElevated, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.star, borderRadius: radius.full },
  pct: { ...typography.caption, color: colors.textSecondary, width: 34, textAlign: 'right' },
});

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
    if (activeTab === '4') return r.rating === 4;
    if (activeTab === 'recent') {
      const d = new Date(r.createdAt);
      return Date.now() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const renderItem = useCallback(
    ({ item }: { item: Review }) => (
      <ReviewCard review={item} onReply={handleReply} isWorkerView />
    ),
    [handleReply],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.pageTitle}>My Reviews</Text>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={100} borderRadius={14} style={styles.skeleton} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          removeClippedSubviews
          ListHeaderComponent={
            <View>
              {/* Summary card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryLeft}>
                  <Text style={styles.bigRating}>{formatRating(avgRating)}</Text>
                  <StarRating value={avgRating} size="md" />
                  <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
                </View>
                <View style={styles.summaryRight}>
                  {starCounts.map(({ star, count }) => (
                    <RatingBar key={star} star={star} count={count} total={reviews.length} />
                  ))}
                </View>
              </View>

              {/* Filter tabs */}
              <View style={styles.tabRow}>
                {(['all', '5', '4', 'recent'] as FilterTab[]).map((tab) => (
                  <Pressable
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                      {tab === 'all' ? 'All' : tab === 'recent' ? 'Recent' : `${tab}★`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              illustration={require('../../assets/illustrations/empty_state_illustration_for_reviews_a_friendly_speech_bubble_with_a_plus_sign.png')}
              title="No reviews yet"
              subtitle="Your reviews from customers will appear here"
            />
          }
          contentContainerStyle={styles.list}
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
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.lg,
    ...shadows.sm,
  },
  summaryLeft: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 70,
  },
  bigRating: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  reviewCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryRight: {
    flex: 1,
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
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
  skeleton: { marginBottom: spacing.sm },
});
