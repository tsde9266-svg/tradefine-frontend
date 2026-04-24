import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { StackHeader } from '../../components/layout/AppHeader';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { useAuthStore } from '../../stores/authStore';
import { getWorkerReviews } from '../../services/reviews';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

interface MyReview {
  id: string;
  toWorkerId: string;
  rating: number;
  text: string;
  photos: string[];
  reply?: string | null;
  createdAt: string;
  worker?: { name: string; avatarUrl?: string; trades: string[] };
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={13} color="#F59E0B" />
      ))}
    </View>
  );
}

export default function MyReviewsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/reviews/customer/${user.id}`)
      .then(({ data }) => setReviews(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StackHeader title="My Reviews" />

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={100} borderRadius={radius.lg} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="star-outline" size={48} color={colors.textDisabled} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySubtitle}>Reviews you leave for tradespeople will appear here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/(customer)/worker/${item.toWorkerId}`)}
            >
              <View style={styles.cardTop}>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName} numberOfLines={1}>
                    {item.worker?.name ?? 'Tradesperson'}
                  </Text>
                  <Text style={styles.workerTrade} numberOfLines={1}>
                    {item.worker?.trades?.[0] ?? ''}
                  </Text>
                </View>
                <View style={styles.ratingCol}>
                  <Stars rating={item.rating} />
                  <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.reviewText} numberOfLines={3}>"{item.text}"</Text>

              {item.reply && (
                <View style={styles.replyBox}>
                  <Ionicons name="return-down-forward" size={13} color={colors.primary} />
                  <Text style={styles.replyText} numberOfLines={2}>{item.reply}</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md },
  skeletons: { padding: spacing.lg, gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, marginTop: 80, paddingHorizontal: spacing.xxl },
  emptyTitle: { ...typography.h4, color: colors.textPrimary },
  emptySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  workerInfo: { flex: 1 },
  workerName: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  workerTrade: { ...typography.caption, color: colors.textSecondary },
  ratingCol: { alignItems: 'flex-end', gap: 4 },
  dateText: { ...typography.caption, color: colors.textDisabled },
  reviewText: { ...typography.small, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 20 },
  replyBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm },
  replyText: { ...typography.caption, color: colors.primaryDark, flex: 1, lineHeight: 18 },
});
