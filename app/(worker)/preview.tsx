import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import StarRating from '../../components/ui/StarRating';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { useWorkerProfileStore } from '../../stores/workerProfileStore';
import { formatRating } from '../../utils/formatters';

export default function ProfilePreviewScreen() {
  const router = useRouter();
  const { profile } = useWorkerProfileStore();

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.empty}>No profile loaded. Complete your profile first.</Text>
      </SafeAreaView>
    );
  }

  const heroImage = profile.portfolioPhotos[0] ?? null;

  return (
    <View style={styles.screen}>
      {/* Preview banner — non-dismissable */}
      <View style={styles.previewBanner}>
        <Text style={styles.previewText}>👁 PREVIEW MODE — This is exactly what customers see</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          {heroImage ? (
            <ExpoImage source={{ uri: heroImage }} style={styles.hero} contentFit="cover" />
          ) : (
            <View style={[styles.hero, styles.heroFallback]} />
          )}
          <View style={styles.avatarWrapper}>
            <Avatar uri={profile.avatarUrl} name={profile.name} size={80} />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{profile.name}</Text>

          <View style={styles.tradesRow}>
            {profile.trades.map((t) => (
              <View key={t} style={styles.tradePill}>
                <Text style={styles.tradePillText}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ratingRow}>
            <StarRating value={profile.rating} size="md" />
            <Text style={styles.ratingText}>
              {formatRating(profile.rating)} ({profile.reviewCount} reviews)
            </Text>
          </View>

          <Badge type={profile.isAvailable ? 'available' : 'unavailable'} />
        </View>

        {/* About section */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.bodyText}>{profile.bio}</Text>
          </View>
        ) : null}

        {profile.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Certifications</Text>
            <View style={styles.pillsRow}>
              {profile.certifications.map((c) => (
                <View key={c} style={styles.certPill}>
                  <Text style={styles.certText}>🛡 {c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Service Area</Text>
          <Text style={styles.bodyText}>Up to {profile.serviceAreaMiles} miles</Text>
        </View>

        {profile.pricingNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pricing</Text>
            <Text style={[styles.bodyText, styles.italic]}>{profile.pricingNotes}</Text>
          </View>
        ) : null}

        {profile.portfolioPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photos</Text>
            <View style={styles.photosGrid}>
              {profile.portfolioPhotos.map((uri, i) => (
                <ExpoImage
                  key={i}
                  source={{ uri }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — Edit Profile */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(worker)/edit-profile')}
      >
        <Text style={styles.fabIcon}>✏️</Text>
      </Pressable>
    </View>
  );
}

const PHOTO_SIZE = 160;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  previewBanner: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  previewText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  scroll: {
    paddingBottom: spacing.huge,
  },
  heroContainer: {
    position: 'relative',
    marginBottom: 44,
  },
  hero: {
    width: '100%',
    height: 180,
  },
  heroFallback: {
    backgroundColor: colors.primaryLight,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -44,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    borderRadius: 44,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tradesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tradePill: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tradePillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  bodyText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  italic: {
    fontStyle: 'italic',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  certPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  certText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.md,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxxl,
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabIcon: {
    fontSize: 22,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.huge,
    paddingHorizontal: spacing.xxl,
  },
});
