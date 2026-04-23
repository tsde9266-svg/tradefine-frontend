import React, { memo, useCallback } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import StarRating from '../ui/StarRating';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { formatDistance, formatRating } from '../../utils/formatters';
import { Worker } from '../../types/worker';

interface WorkerCardLargeProps {
  worker: Worker;
  onUnsave?: () => void;
  showUnsave?: boolean;
}

function WorkerCardLarge({ worker, onUnsave, showUnsave = false }: WorkerCardLargeProps) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push(`/(customer)/worker/${worker.id}`);
  }, [worker.id]);

  const handleCall = useCallback(() => {
    Linking.openURL(`tel:${worker.phone}`);
  }, [worker.phone]);

  const tradeLine = worker.trades[0] ?? 'Tradesperson';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Avatar */}
      <Avatar
        uri={worker.avatarUrl}
        name={worker.name}
        size={60}
        showOnlineDot
        isOnline={worker.isAvailable}
        style={styles.avatar}
      />

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
        <Text style={styles.trade} numberOfLines={1}>{tradeLine}</Text>

        <View style={styles.ratingRow}>
          <StarRating value={worker.rating} size="sm" />
          <Text style={styles.ratingText}>
            {formatRating(worker.rating)} ({worker.reviewCount})
          </Text>
        </View>

        {worker.distance != null && (
          <Text style={styles.distance}>{formatDistance(worker.distance)}</Text>
        )}

        <Badge type={worker.isAvailable ? 'available' : 'unavailable'} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [styles.callButton, pressed && styles.callPressed]}
          hitSlop={8}
        >
          <Text style={styles.callIcon}>📞</Text>
          <Text style={styles.callLabel}>Call</Text>
        </Pressable>

        {showUnsave && (
          <Pressable onPress={onUnsave} style={styles.unsaveButton} hitSlop={8}>
            <Text style={styles.bookmarkFilled}>🔖</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default memo(WorkerCardLarge);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  avatar: {
    marginRight: spacing.md,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  trade: {
    ...typography.small,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  distance: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  callButton: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  callPressed: {
    backgroundColor: colors.primaryLight,
  },
  callIcon: {
    fontSize: 14,
  },
  callLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  unsaveButton: {
    padding: spacing.xs,
  },
  bookmarkFilled: {
    fontSize: 20,
    color: colors.primary,
  },
});
