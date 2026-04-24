import React, { useCallback, useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { getSavedWorkers, unsaveWorker } from '../../services/workers';
import { useWorkerStore } from '../../stores/workerStore';
import { Worker } from '../../types/worker';
import { formatRating } from '../../utils/formatters';

export default function SavedScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { toggleSave } = useWorkerStore();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSavedWorkers();
        setWorkers(data);
      } catch {
        show('Could not load saved workers', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUnsave = useCallback(async (workerId: string) => {
    try {
      await unsaveWorker(workerId);
      await toggleSave(workerId);
      setWorkers(prev => prev.filter(w => w.id !== workerId));
      show('Removed from saved', 'info');
    } catch {
      show('Could not remove', 'error');
    }
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Saved Tradespeople</Text>
        <Text style={styles.subtitle}>Review and manage your favourite professionals.</Text>
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} width="100%" height={120} borderRadius={14} style={{ marginBottom: spacing.md }} />
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
          keyExtractor={w => w.id}
          renderItem={({ item }) => (
            <SavedCard
              worker={item}
              onPress={() => router.push(`/(customer)/worker/${item.id}`)}
              onUnsave={() => handleUnsave(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
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

function SavedCard({ worker, onPress, onUnsave }: { worker: Worker; onPress: () => void; onUnsave: () => void }) {
  const isAvailable = worker.isAvailable;
  const handleCall = () => Linking.openURL(`tel:${worker.phone}`);

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]} onPress={onPress}>
      {/* Top row */}
      <View style={styles.cardTop}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {worker.avatarUrl
            ? <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
            : <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>
                  {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
          }
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
            <View style={[styles.statusBadge, isAvailable ? styles.statusAvail : styles.statusBusy]}>
              <Text style={[styles.statusText, { color: isAvailable ? colors.success : colors.warning }]}>
                {isAvailable ? 'AVAILABLE' : 'BUSY'}
              </Text>
            </View>
            <Pressable onPress={onUnsave} hitSlop={8} style={styles.unsaveBtn}>
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

      {/* Bottom actions */}
      <View style={styles.actions}>
        <Pressable style={styles.callBtn} onPress={e => { e.stopPropagation?.(); handleCall(); }}>
          <Ionicons name="call" size={16} color={colors.textInverse} />
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.small, color: colors.textSecondary, marginTop: 3 },
  skeletons: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatarWrap: { flexShrink: 0 },
  avatar: { width: 60, height: 60, borderRadius: radius.md },
  avatarFallback: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.h3, color: colors.primaryDark },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'nowrap' },
  name: { ...typography.h4, color: colors.textPrimary, flexShrink: 1 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  statusAvail: { backgroundColor: colors.successBg },
  statusBusy: { backgroundColor: colors.warningBg },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  unsaveBtn: { marginLeft: 'auto' },
  trade: { ...typography.small, color: colors.textSecondary },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  reviews: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 11,
  },
  callBtnText: { ...typography.bodyMd, color: colors.textInverse, fontWeight: '700' },
  calendarBtn: {
    width: 46, height: 46,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  footerText: { ...typography.small, color: colors.textDisabled },
});
