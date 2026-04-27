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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Avatar from '../../../components/ui/Avatar';
import StarRating from '../../../components/ui/StarRating';
import SkeletonLoader from '../../../components/ui/SkeletonLoader';
import ReviewCard from '../../../components/worker/ReviewCard';
import FloatingNav from '../../../components/shared/FloatingNav';
import { useToast } from '../../../components/ui/Toast';
import { T } from '../../../constants/tokens';
import { shadows } from '../../../constants/shadows';
import { getWorkerById } from '../../../services/workers';
import { getWorkerReviews, replyToReview } from '../../../services/reviews';
import { saveWorker, unsaveWorker } from '../../../services/workers';
import { getActiveJobs } from '../../../services/jobs';
import { useWorkerStore } from '../../../stores/workerStore';
import { Worker } from '../../../types/worker';
import { Review } from '../../../types/review';
import { JobRequest } from '../../../types/job';
import { formatRating } from '../../../utils/formatters';

// Icons per trade — shown in the services grid
const TRADE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  default:        'construct-outline',
  plumber:        'water-outline',
  electrician:    'flash-outline',
  carpenter:      'hammer-outline',
  painter:        'color-palette-outline',
  roofer:         'home-outline',
  builder:        'business-outline',
  gas:            'flame-outline',
  cleaner:        'sparkles-outline',
};

function tradeIcon(trade: string): keyof typeof Ionicons.glyphMap {
  const key = trade.toLowerCase();
  return Object.keys(TRADE_ICONS).find((k) => key.includes(k))
    ? TRADE_ICONS[Object.keys(TRADE_ICONS).find((k) => key.includes(k))!]
    : TRADE_ICONS.default;
}

export default function WorkerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const { isSaved, toggleSave } = useWorkerStore();
  const insets = useSafeAreaInsets();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeJob, setActiveJob] = useState<JobRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [w, r] = await Promise.all([getWorkerById(id), getWorkerReviews(id)]);
        setWorker(w);
        setReviews(r);
        try {
          const jobs = await getActiveJobs();
          setActiveJob(jobs.find((j) => j.workerId === w.id) ?? null);
        } catch { /* jobs endpoint optional */ }
      } catch {
        show('Could not load profile', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!worker) return;
      getActiveJobs()
        .then((jobs) => setActiveJob(jobs.find((j) => j.workerId === worker.id) ?? null))
        .catch(() => {});
    }, [worker]),
  );

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

  const handleReply = useCallback(async (reviewId: string, reply: string) => {
    await replyToReview(reviewId, reply);
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply } : r)));
    show('Reply posted', 'success');
  }, []);

  if (loading) {
    return (
      <View style={styles.screen}>
        <SkeletonLoader width="100%" height={200} borderRadius={0} />
        <View style={{ padding: 20, gap: 12 }}>
          <SkeletonLoader width={80} height={80} borderRadius={40} />
          <SkeletonLoader width="60%" height={24} borderRadius={8} />
          <SkeletonLoader width="40%" height={16} borderRadius={8} />
        </View>
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.emptyText}>Worker not found</Text>
      </View>
    );
  }

  const saved = isSaved(worker.id);
  const heroImage = worker.portfolioPhotos[0] ?? null;
  const firstName = worker.name.split(' ')[0];

  return (
    <View style={styles.screen}>
      {/* Floating nav — back | share + bookmark */}
      <FloatingNav
        leftAction="back"
        onLeft={() => router.back()}
        rightContent={
          <View style={styles.navRight}>
            <Pressable style={styles.navIconBtn} hitSlop={8}>
              <Ionicons name="share-outline" size={20} color={T.text1} />
            </Pressable>
            <Pressable
              style={styles.navIconBtn}
              onPress={handleSaveToggle}
              disabled={savingToggle}
              hitSlop={8}
            >
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={saved ? T.orange : T.text1}
              />
            </Pressable>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Hero image ──────────────────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.hero} resizeMode="cover" />
          ) : (
            <View style={[styles.hero, { backgroundColor: T.raised }]} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* ── Profile header ──────────────────────────────────────────────────── */}
        <View style={styles.profileSection}>
          {/* Avatar overlapping hero */}
          <View style={styles.avatarWrap}>
            <Avatar uri={worker.avatarUrl} name={worker.name} size={84} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{worker.name}</Text>
            <Ionicons name="checkmark-circle" size={22} color={T.orange} />
          </View>

          <Text style={styles.trade}>{worker.trades.join(' & ')}</Text>

          <View style={styles.metaRow}>
            <StarRating value={worker.rating} size="sm" />
            <Text style={styles.ratingText}>
              {formatRating(worker.rating)}
              <Text style={styles.reviewCount}> ({worker.reviewCount} reviews)</Text>
            </Text>
            {worker.distance != null && (
              <>
                <View style={styles.dot} />
                <Ionicons name="location-outline" size={14} color={T.text2} />
                <Text style={styles.metaText}>{worker.distance.toFixed(1)} mi</Text>
              </>
            )}
          </View>

          {/* Availability pill */}
          <View style={[styles.availPill, !worker.isAvailable && styles.unavailPill]}>
            <View style={[styles.availDot, !worker.isAvailable && styles.unavailDot]} />
            <Text style={[styles.availText, !worker.isAvailable && styles.unavailText]}>
              {worker.isAvailable ? 'Available Now' : 'Unavailable'}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* ── Certifications ────────────────────────────────────────────────── */}
          {worker.certifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Certifications & Badges</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {worker.certifications.map((cert) => (
                    <View key={cert} style={styles.chip}>
                      <Ionicons name="shield-checkmark-outline" size={16} color={T.orange} />
                      <Text style={styles.chipText}>{cert}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* ── About ─────────────────────────────────────────────────────────── */}
          {worker.bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About {firstName}</Text>
              <View style={styles.card}>
                <Text style={styles.bioText}>{worker.bio}</Text>
              </View>
            </View>
          ) : null}

          {/* ── Popular Services ──────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Services</Text>
            <View style={styles.servicesGrid}>
              {worker.trades.slice(0, 4).map((trade) => (
                <View key={trade} style={styles.serviceCard}>
                  <Ionicons name={tradeIcon(trade)} size={28} color={T.orange} />
                  <Text style={styles.serviceLabel}>{trade}</Text>
                  <Text style={styles.servicePrice}>From £80</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Recent Reviews ────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Reviews</Text>
              {reviews.length > 2 && (
                <Pressable style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>See all</Text>
                  <Ionicons name="chevron-forward" size={14} color={T.orange} />
                </Pressable>
              )}
            </View>
            {reviews.length === 0 ? (
              <Text style={styles.emptyText}>No reviews yet</Text>
            ) : (
              reviews.slice(0, 2).map((r) => (
                <ReviewCard key={r.id} review={r} onReply={handleReply} />
              ))
            )}
          </View>
        </View>

        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>

      {/* ── Sticky bottom bar ───────────────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {/* Bookmark */}
        <Pressable
          style={[styles.bookmarkBtn, saved && styles.bookmarkBtnActive]}
          onPress={handleSaveToggle}
          disabled={savingToggle}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? T.orange : T.text1}
          />
        </Pressable>

        {/* Primary CTA — adapts to job state */}
        {activeJob?.status === 'started' ? (
          <Pressable
            style={styles.ctaBtn}
            onPress={() => router.push(`/(customer)/worker/tracking?workerId=${worker.id}`)}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.ctaText}>Track {firstName} Live</Text>
          </Pressable>
        ) : activeJob ? (
          <Pressable
            style={[styles.ctaBtn, { backgroundColor: T.amber }]}
            onPress={() => router.push(`/(customer)/worker/waiting?jobId=${activeJob.id}`)}
          >
            <Ionicons name="time" size={18} color="#fff" />
            <Text style={styles.ctaText}>View Request Status</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.ctaBtn}
            onPress={handleCall}
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.ctaText}>Call {firstName}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  // Nav right cluster
  navRight: { flexDirection: 'row', gap: 4, marginRight: 4 },
  navIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  heroWrap: { height: 200, overflow: 'hidden' },
  hero: { width: '100%', height: 200 },

  // Profile header
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -42,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: T.card,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadows.sm,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { fontSize: 26, fontFamily: 'Inter_700Bold', color: T.text1, letterSpacing: -0.4 },
  trade: { fontSize: 15, fontFamily: 'Inter_400Regular', color: T.text2, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  ratingText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: T.text1 },
  reviewCount: { fontFamily: 'Inter_400Regular', color: T.text2 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: T.text3 },
  metaText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: T.text2 },

  // Availability pill
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: T.greenBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: T.pill,
  },
  unavailPill: { backgroundColor: T.raised },
  availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.green },
  unavailDot: { backgroundColor: T.text3 },
  availText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: T.green, letterSpacing: 0.3 },
  unavailText: { color: T.text3 },

  // Body
  body: { paddingHorizontal: 20 },

  // Sections
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: T.text1, letterSpacing: -0.2, marginBottom: 14 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: T.orange },

  // Certification chips
  chipsRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: T.chip,
    ...shadows.sm,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: T.text1 },

  // About card
  card: {
    backgroundColor: T.card,
    borderRadius: T.card,
    padding: 16,
    ...shadows.sm,
  },
  bioText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: T.text2, lineHeight: 22 },

  // Services 2×2 grid
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCard: {
    width: '47%',
    backgroundColor: T.card,
    borderRadius: T.card,
    padding: 16,
    gap: 6,
    ...shadows.sm,
  },
  serviceLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: T.text1 },
  servicePrice: { fontSize: 14, fontFamily: 'Inter_400Regular', color: T.text2 },

  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: T.text2, textAlign: 'center', marginTop: 12 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: T.card,
    borderTopWidth: 1,
    borderTopColor: T.borderL,
    ...shadows.md,
  },
  bookmarkBtn: {
    width: 52, height: 52,
    borderRadius: 12,
    backgroundColor: T.raised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.borderL,
  },
  bookmarkBtnActive: { backgroundColor: 'rgba(249,115,22,0.1)', borderColor: T.orange },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: T.orange,
    borderRadius: T.pill,
    shadowColor: T.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});
