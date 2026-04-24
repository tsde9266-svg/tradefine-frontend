import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { TabHeader } from '../../components/layout/AppHeader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { getSavedWorkers, unsaveWorker } from '../../services/workers';
import { Worker } from '../../types/worker';
import { formatRating } from '../../utils/formatters';

export default function SavedScreen() {
  const router = useRouter();
  const { show } = useToast();
  const user = useAuthStore((s) => s.user);

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Refetch every time this tab comes into focus — fixes stale data bug
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getSavedWorkers()
        .then((data) => { if (active) setWorkers(data); })
        .catch(() => { if (active) show('Could not load saved workers', 'error'); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, []),
  );

  const handleUnsave = useCallback(async (workerId: string) => {
    try {
      await unsaveWorker(workerId);
      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      show('Removed from saved', 'info');
    } catch {
      show('Could not remove', 'error');
    }
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TabHeader />

      {/* Page title */}
      <View style={styles.pageHeader}>
        <Text style={styles.title}>Saved Tradespeople</Text>
        <Text style={styles.subtitle}>Review and manage your favourite professionals.</Text>
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={130} borderRadius={radius.xl} style={{ marginBottom: spacing.md }} />
          ))}
        </View>
      ) : workers.length === 0 ? (
        <EmptyState
          illustration={require('../../assets/illustrations/empty_state_illustration_for_saved_items_an_empty_bookmark_ribbon_with_a_dashed.png')}
          title="No saved tradespeople"
          subtitle="Save workers you trust for quick access"
        />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(w) => w.id}
          renderItem={({ item }) => (
            <SavedCard
              worker={item}
              onPress={() => router.push(`/(customer)/worker/${item.id}`)}
              onUnsave={() => handleUnsave(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <Ionicons name="bookmark" size={22} color={colors.border} />
              <Text style={styles.footerText}>End of your saved list</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function SavedCard({
  worker,
  onPress,
  onUnsave,
}: {
  worker: Worker;
  onPress: () => void;
  onUnsave: () => void;
}) {
  const isAvailable = worker.isAvailable;

  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Top: avatar + info */}
      <View style={styles.cardTop}>
        {worker.avatarUrl ? (
          <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
            <View style={[styles.badge, isAvailable ? styles.badgeAvail : styles.badgeBusy]}>
              <View style={[styles.badgeDot, isAvailable ? styles.dotGreen : styles.dotOrange]} />
              <Text style={[styles.badgeText, isAvailable ? styles.badgeTextAvail : styles.badgeTextBusy]}>
                {isAvailable ? 'AVAILABLE' : 'BUSY'}
              </Text>
            </View>
            {/* Filled bookmark — tap to unsave */}
            <Pressable onPress={onUnsave} hitSlop={10} style={styles.bookmarkBtn}>
              <Ionicons name="bookmark" size={18} color={colors.primary} />
            </Pressable>
          </View>

          <Text style={styles.trade}>{worker.trades[0]}</Text>

          <View style={styles.starRow}>
            <Ionicons name="star" size={13} color="#FBBF24" />
            <Text style={styles.rating}>{formatRating(worker.rating)}</Text>
            <Text style={styles.reviews}>({worker.reviewCount} reviews)</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.callBtn}
          onPress={(e) => {
            e.stopPropagation();
            if (worker.phone) Linking.openURL(`tel:${worker.phone}`);
          }}
        >
          <Ionicons name="call" size={16} color="#fff" />
          <Text style={styles.callBtnText}>Call</Text>
        </Pressable>
        <Pressable style={styles.calendarBtn} onPress={onPress}>
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },


  /* Page header */
  pageHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.small, color: colors.textSecondary, marginTop: 3 },

  skeletons: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: 32 },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardPressed: { opacity: 0.95 },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  avatar: { width: 72, height: 72, borderRadius: 10, flexShrink: 0 },
  avatarFallback: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.h3, color: colors.primaryDark },

  info: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.h4, color: colors.textPrimary, flexShrink: 1 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeAvail: { backgroundColor: colors.successBg },
  badgeBusy:  { backgroundColor: colors.warningBg },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  dotGreen:   { backgroundColor: colors.success },
  dotOrange:  { backgroundColor: colors.warning },
  badgeText: { fontSize: 9, fontWeight: '700' },
  badgeTextAvail: { color: colors.success },
  badgeTextBusy:  { color: colors.warning },

  bookmarkBtn: { marginLeft: 'auto' },

  trade: { ...typography.small, color: colors.textSecondary },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  reviews: { ...typography.caption, color: colors.textSecondary },

  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.sm },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 12,
  },
  callBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  calendarBtn: {
    width: 46, height: 46, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },

  footer: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  footerText: { ...typography.small, color: colors.textDisabled },
});
