import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const insets = useSafeAreaInsets();
  const { profile } = useWorkerProfileStore();

  if (!profile) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.empty}>No profile loaded. Complete your profile first.</Text>
      </View>
    );
  }

  const heroImage = profile.portfolioPhotos[0] ?? null;
  const initials = profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const statsItems = [
    { icon: 'cash-outline' as const,     label: 'Hourly Rate',   value: '£45/hr' },
    { icon: 'location-outline' as const, label: 'Service Area',  value: `${profile.serviceAreaMiles}mi` },
    { icon: 'time-outline' as const,     label: 'Response',      value: '< 1hr' },
    { icon: 'checkmark-circle-outline' as const, label: 'Completion', value: '98%' },
  ];

  return (
    <View style={styles.screen}>
      {/* Preview banner */}
      <View style={[styles.previewBanner, { paddingTop: insets.top + spacing.sm }]}>
        <Ionicons name="eye-outline" size={14} color="#fff" />
        <Text style={styles.previewText}>PREVIEW MODE — This is exactly what customers see</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          {heroImage
            ? <Image source={{ uri: heroImage }} style={styles.hero} resizeMode="cover" />
            : <View style={[styles.hero, styles.heroFallback]} />
          }
          <View style={styles.avatarWrapper}>
            {profile.avatarUrl
              ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
              : <View style={[styles.avatarImg, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
            }
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.availBadge}>
            <View style={[styles.availDot, { backgroundColor: profile.isAvailable ? colors.available : colors.unavailable }]} />
            <Text style={[styles.availText, { color: profile.isAvailable ? colors.success : colors.textSecondary }]}>
              {profile.isAvailable ? 'AVAILABLE NOW' : 'UNAVAILABLE'}
            </Text>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.tradesRow}>
            {profile.trades.map((t: string) => (
              <View key={t} style={styles.tradePill}>
                <Text style={styles.tradePillText}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={styles.ratingRow}>
            <StarRating value={profile.rating} size="sm" />
            <Text style={styles.ratingText}>
              {formatRating(profile.rating)} ({profile.reviewCount} reviews)
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {statsItems.map((s, i) => (
            <View key={s.label} style={[styles.statItem, i < statsItems.length - 1 && styles.statBorder]}>
              <Ionicons name={s.icon} size={18} color={colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Trust badges */}
        <View style={styles.badgesRow}>
          {['Verified', 'Insured', 'Licensed'].map(badge => (
            <View key={badge} style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={13} color={colors.success} />
              <Text style={styles.trustBadgeText}>{badge}</Text>
            </View>
          ))}
        </View>

        {/* About */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text style={styles.bodyText}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Certifications */}
        {profile.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CERTIFICATIONS</Text>
            <View style={styles.pillsRow}>
              {profile.certifications.map((c: string) => (
                <View key={c} style={styles.certPill}>
                  <Ionicons name="shield-checkmark-outline" size={12} color={colors.primaryDark} />
                  <Text style={styles.certText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pricing */}
        {profile.pricingNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PRICING</Text>
            <Text style={[styles.bodyText, styles.italic]}>{profile.pricingNotes}</Text>
          </View>
        ) : null}

        {/* Photos */}
        {profile.portfolioPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PORTFOLIO</Text>
            <View style={styles.photosGrid}>
              {profile.portfolioPhotos.map((uri: string, i: number) => (
                <Image key={i} source={{ uri }} style={styles.photo} resizeMode="cover" />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — Edit Profile */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => router.push('/(worker)/edit-profile')}
      >
        <Ionicons name="create-outline" size={22} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const PHOTO_SIZE = 160;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  previewText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  scroll: { paddingBottom: 120 },

  heroContainer: { position: 'relative', marginBottom: 52 },
  hero: { width: '100%', height: 200 },
  heroFallback: { backgroundColor: colors.primaryLight },
  avatarWrapper: {
    position: 'absolute',
    bottom: -52,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    borderRadius: 52,
  },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.h3, color: '#fff' },

  infoSection: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  name: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  tradesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
  tradePill: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tradePillText: { ...typography.caption, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingText: { ...typography.small, color: colors.textSecondary },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, gap: 3 },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.borderLight },
  statValue: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textSecondary, fontSize: 9 },

  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  trustBadgeText: { ...typography.caption, color: colors.success, fontWeight: '700' },

  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionLabel: { ...typography.label, color: colors.textSecondary, letterSpacing: 0.5 },
  bodyText: { ...typography.body, color: colors.textPrimary },
  italic: { fontStyle: 'italic' },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  certPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  certText: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: radius.md },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.huge,
    paddingHorizontal: spacing.xxl,
  },
});
