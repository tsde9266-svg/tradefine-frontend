import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StarRating from '../../../components/ui/StarRating';
import SkeletonLoader from '../../../components/ui/SkeletonLoader';
import ReviewCard from '../../../components/worker/ReviewCard';
import { useToast } from '../../../components/ui/Toast';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/radius';
import { spacing } from '../../../constants/spacing';
import { shadows } from '../../../constants/shadows';
import { typography } from '../../../constants/typography';
import { getWorkerById } from '../../../services/workers';
import { getWorkerReviews, replyToReview } from '../../../services/reviews';
import { saveWorker, unsaveWorker } from '../../../services/workers';
import { getActiveJobs } from '../../../services/jobs';
import { useWorkerStore } from '../../../stores/workerStore';
import { Worker } from '../../../types/worker';
import { Review } from '../../../types/review';
import { JobRequest } from '../../../types/job';
import { formatRating } from '../../../utils/formatters';

type ProfileTab = 'about' | 'reviews' | 'photos';

export default function WorkerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const { isSaved, toggleSave } = useWorkerStore();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeJob, setActiveJob] = useState<JobRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [w, r] = await Promise.all([
          getWorkerById(id),
          getWorkerReviews(id),
        ]);
        setWorker(w);
        setReviews(r);
        // Jobs API — graceful: if not yet deployed on server, ignore
        try {
          const jobs = await getActiveJobs();
          setActiveJob(jobs.find((j) => j.workerId === w.id) ?? null);
        } catch {
          // jobs endpoint not yet available — silently ignore
        }
      } catch {
        show('Could not load profile', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSaveToggle = useCallback(async () => {
    if (!worker || savingToggle) return;
    setSavingToggle(true);
    try {
      if (isSaved(worker.id)) {
        await unsaveWorker(worker.id);
        show('Removed from saved', 'info');
      } else {
        await saveWorker(worker.id);
        show('Worker saved', 'success');
      }
      await toggleSave(worker.id);
    } catch {
      show('Could not update saved', 'error');
    } finally {
      setSavingToggle(false);
    }
  }, [worker, savingToggle, isSaved, toggleSave]);

  const handleCall = useCallback(() => {
    if (worker?.phone) Linking.openURL(`tel:${worker.phone}`);
  }, [worker]);

  const handleReply = useCallback(
    async (reviewId: string, reply: string) => {
      await replyToReview(reviewId, reply);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, reply } : r)),
      );
      show('Reply posted', 'success');
    },
    [],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <SkeletonLoader width="100%" height={200} borderRadius={0} />
        <View style={styles.loadingBody}>
          <SkeletonLoader width={80} height={80} borderRadius={40} />
          <SkeletonLoader width="60%" height={24} borderRadius={8} style={styles.skeletonGap} />
          <SkeletonLoader width="40%" height={16} borderRadius={8} style={styles.skeletonGap} />
        </View>
      </SafeAreaView>
    );
  }

  if (!worker) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.errorText}>Worker not found</Text>
      </SafeAreaView>
    );
  }

  const saved = isSaved(worker.id);
  const heroImage = worker.portfolioPhotos[0] ?? null;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        {/* Back button */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
        </Pressable>

        {/* Hero photo */}
        <View style={styles.heroContainer}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.hero} resizeMode="cover" />
          ) : (
            <View style={[styles.hero, styles.heroFallback]} />
          )}
          <View style={styles.avatarWrapper}>
            <Avatar uri={worker.avatarUrl} name={worker.name} size={80} style={styles.avatar} />
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.name}>{worker.name}</Text>
          <View style={styles.tradesRow}>
            {worker.trades.map((t) => (
              <View key={t} style={styles.tradePill}>
                <Text style={styles.tradePillText}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={styles.ratingRow}>
            <StarRating value={worker.rating} size="md" />
            <Text style={styles.ratingText}>
              {formatRating(worker.rating)} ({worker.reviewCount} reviews)
            </Text>
          </View>
          <Badge type={worker.isAvailable ? 'available' : 'unavailable'} />
        </View>

        {/* Tab bar — sticky */}
        <View style={styles.tabRow}>
          {(['about', 'reviews', 'photos'] as ProfileTab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'about' && (
            <AboutTab worker={worker} />
          )}

          {activeTab === 'reviews' && (
            <View>
              {reviews.length === 0 ? (
                <Text style={styles.emptyText}>No reviews yet</Text>
              ) : (
                reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} onReply={handleReply} />
                ))
              )}
            </View>
          )}

          {activeTab === 'photos' && (
            <PhotosGrid photos={worker.portfolioPhotos} />
          )}
        </View>

        <View style={{ height: spacing.huge }} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        {/* Primary CTA — changes based on job state */}
        {activeJob?.status === 'started' ? (
          <Pressable
            style={styles.primaryCta}
            onPress={() => router.push(`/(customer)/worker/tracking?workerId=${worker.id}`)}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.primaryCtaText}>Track {worker.name.split(' ')[0]} Live</Text>
          </Pressable>
        ) : activeJob ? (
          <Pressable
            style={[styles.primaryCta, { backgroundColor: colors.warning }]}
            onPress={() => router.push(`/(customer)/worker/waiting?jobId=${activeJob.id}`)}
          >
            <Ionicons name="time" size={18} color="#fff" />
            <Text style={styles.primaryCtaText}>View Request Status</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.primaryCta}
            onPress={() =>
              router.push(
                `/(customer)/worker/request?workerId=${worker.id}&workerName=${encodeURIComponent(worker.name)}&workerPhone=${encodeURIComponent(worker.phone ?? '')}`,
              )
            }
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.primaryCtaText}>Request {worker.name.split(' ')[0]}</Text>
          </Pressable>
        )}

        {/* Call icon button */}
        <Pressable onPress={handleCall} style={styles.iconBtn}>
          <Ionicons name="call" size={20} color={colors.primary} />
        </Pressable>

        {/* Save icon button */}
        <Pressable
          onPress={handleSaveToggle}
          style={[styles.iconBtn, saved && styles.iconBtnActive]}
          disabled={savingToggle}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function AboutTab({ worker }: { worker: Worker }) {
  const CORE_SERVICES = [
    { label: 'Emergency Call-out', price: 'From £80' },
    { label: 'Standard Hourly Rate', price: '£45/hr' },
    { label: 'Free Quote', price: 'Free' },
  ];

  return (
    <View style={styles.aboutSection}>
      {worker.bio ? (
        <>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <Text style={styles.bodyText}>{worker.bio}</Text>
        </>
      ) : null}

      {/* Core Services */}
      <Text style={styles.sectionLabel}>CORE SERVICES</Text>
      <View style={styles.servicesCard}>
        {CORE_SERVICES.map((s, i) => (
          <View key={s.label} style={[styles.serviceRow, i > 0 && styles.serviceDivider]}>
            <Text style={styles.serviceLabel}>{s.label}</Text>
            <Text style={styles.servicePrice}>{s.price}</Text>
          </View>
        ))}
      </View>

      {worker.certifications.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>CERTIFICATIONS</Text>
          <View style={styles.pillsRow}>
            {worker.certifications.map((c) => (
              <View key={c} style={styles.certPill}>
                <Ionicons name="shield-checkmark-outline" size={12} color={colors.primaryDark} />
                <Text style={styles.certPillText}>{c}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>SERVICE AREA</Text>
      <Text style={styles.bodyText}>Up to {worker.serviceAreaMiles} miles from current location</Text>

      {worker.pricingNotes ? (
        <>
          <Text style={styles.sectionLabel}>PRICING NOTES</Text>
          <Text style={[styles.bodyText, styles.italic]}>{worker.pricingNotes}</Text>
        </>
      ) : null}
    </View>
  );
}

function PhotosGrid({ photos }: { photos: string[] }) {
  if (photos.length === 0) {
    return <Text style={styles.emptyText}>No portfolio photos yet</Text>;
  }
  return (
    <View style={styles.photosGrid}>
      {photos.map((uri, i) => (
        <Image key={i} source={{ uri }} style={styles.gridPhoto} resizeMode="cover" />
      ))}
    </View>
  );
}

const PHOTO_SIZE = 170;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  hero: {
    width: '100%',
    height: 200,
  },
  heroFallback: {
    backgroundColor: colors.primaryLight,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -40,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    borderRadius: 44,
  },
  avatar: {},
  infoCard: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: spacing.lg,
  },
  aboutSection: {
    gap: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: -spacing.xs,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  certPillText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  servicesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  serviceDivider: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  serviceLabel: { ...typography.body, color: colors.textPrimary },
  servicePrice: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridPhoto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.md,
  },
  trackButtonContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    ...shadows.md,
  },
  primaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  primaryCtaText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  iconBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.borderLight,
  },
  iconBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  loadingBody: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  skeletonGap: {
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.huge,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
