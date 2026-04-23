import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import Badge from '../ui/Badge';
import StarRating from '../ui/StarRating';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { formatDistance, formatRating } from '../../utils/formatters';
import { Worker } from '../../types/worker';

interface WorkerCardProps {
  worker: Worker;
}

function WorkerCard({ worker }: WorkerCardProps) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push(`/(customer)/worker/${worker.id}`);
  }, [worker.id]);

  const tradeLine =
    worker.trades.length > 1
      ? `${worker.trades[0]} & more`
      : worker.trades[0] ?? 'Tradesperson';

  const heroImage = worker.portfolioPhotos[0] ?? null;

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* Hero image */}
      <View style={styles.imageContainer}>
        {heroImage ? (
          <ExpoImage
            source={{ uri: heroImage }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>
              {worker.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
        <Text style={styles.trade} numberOfLines={1}>{tradeLine}</Text>

        <View style={styles.ratingRow}>
          <StarRating value={worker.rating} size="sm" />
          <Text style={styles.ratingText}>{formatRating(worker.rating)}</Text>
          {worker.distance != null && (
            <Text style={styles.distance}> · {formatDistance(worker.distance)}</Text>
          )}
        </View>

        <Badge type={worker.isAvailable ? 'available' : 'unavailable'} />
      </View>
    </Pressable>
  );
}

export default memo(WorkerCard);

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.md,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  imageContainer: {
    width: '100%',
    height: 120,
  },
  image: {
    width: '100%',
    height: 120,
  },
  imageFallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    ...typography.h2,
    color: colors.primaryDark,
  },
  body: {
    padding: spacing.md,
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
    marginVertical: spacing.xs,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  distance: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
