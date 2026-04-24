import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import AvailabilityToggle from '../../components/worker/AvailabilityToggle';
import { TabHeader } from '../../components/layout/AppHeader';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { getWorkerById } from '../../services/workers';
import { connectSocket } from '../../services/socket';
import { getActiveJobs, respondToJob, startJob, completeJob } from '../../services/jobs';
import { useAuth } from '../../hooks/useAuth';
import { useWorkerProfileStore } from '../../stores/workerProfileStore';
import { useAuthStore } from '../../stores/authStore';
import { getGreeting } from '../../utils/formatters';
import { JobRequest } from '../../types/job';

interface ActivityItem {
  id: string;
  type: 'save' | 'review' | 'call';
  title: string;
  subtitle: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'save',   title: 'Sarah Miller saved your profile',  subtitle: '2 hours ago' },
  { id: '2', type: 'review', title: 'John David left a review',         subtitle: '5 hours ago · "Great work on the plumbing!"' },
  { id: '3', type: 'call',   title: 'Missed Call from 078 9920 331',    subtitle: 'Yesterday at 6:45 PM' },
];

// ── Broadcast animation for the LIVE card ────────────────────────────────────
function BroadcastIcon() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.stagger(400, [
        Animated.sequence([
          Animated.timing(ring1, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(ring1, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring2, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(ring2, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const ringStyle = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
  });

  return (
    <View style={bc.wrap}>
      <Animated.View style={[bc.ring, ringStyle(ring1)]} />
      <Animated.View style={[bc.ring, ringStyle(ring2)]} />
      <View style={bc.core}>
        <Ionicons name="radio" size={28} color="#fff" />
      </View>
    </View>
  );
}

const bc = StyleSheet.create({
  wrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  core: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function WorkerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { profile, setProfile } = useWorkerProfileStore();
  const [stats] = useState({ views: 124, calls: 8, reviews: 3, rating: 4.9 });
  const [activeJobs, setActiveJobs] = useState<JobRequest[]>([]);
  const [jobActionLoading, setJobActionLoading] = useState<string | null>(null);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const isLive = profile?.isAvailable ?? false;

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const w = await getWorkerById(user.id);
        setProfile(w);
        if (accessToken) connectSocket(accessToken, w.id);
        try {
          const jobs = await getActiveJobs();
          setActiveJobs(jobs);
        } catch {}
      } catch {
        if (accessToken) connectSocket(accessToken);
      }
    })();
  }, [user?.id, accessToken]);

  const handleJobAction = useCallback(async (
    jobId: string,
    action: 'accept' | 'decline' | 'confirm_call' | 'start' | 'complete',
  ) => {
    setJobActionLoading(jobId + action);
    try {
      let updated: JobRequest;
      if (action === 'accept' || action === 'decline' || action === 'confirm_call') {
        updated = await respondToJob(jobId, action);
      } else if (action === 'start') {
        updated = await startJob(jobId);
      } else {
        updated = await completeJob(jobId);
      }
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === jobId ? updated : j))
          .filter((j) => ['pending', 'call_pending', 'accepted', 'started'].includes(j.status)),
      );
      show(
        action === 'accept' ? 'Request accepted' :
        action === 'decline' ? 'Request declined' :
        action === 'confirm_call' ? 'Confirmed — customer notified' :
        action === 'start' ? 'Journey started — customer is tracking you' :
        'Job marked complete',
        action === 'decline' ? 'info' : 'success',
      );
    } catch {
      show('Action failed, please try again', 'error');
    } finally {
      setJobActionLoading(null);
    }
  }, [show]);

  const handleShare = useCallback(async () => {
    if (!profile) return;
    try {
      await Share.share({
        message: `Check out my profile on TradeFind: https://tradefind.app/w/${profile.id}`,
        ...(Platform.OS === 'ios' && { url: `https://tradefind.app/w/${profile.id}` }),
      });
    } catch {}
  }, [profile]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Fixed standard top bar */}
      <TabHeader profileRoute="/(worker)/preview" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()}, {firstName} 👋</Text>
            <Text style={styles.greetingSub}>Here is what's happening with your business today.</Text>
          </View>
        </View>

        {/* Incoming job requests */}
        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeJobs.some((j) => j.status === 'pending' || j.status === 'call_pending')
                  ? '🔔 Incoming Requests'
                  : 'Active Job'}
              </Text>
              <View style={styles.jobsBadge}>
                <Text style={styles.jobsBadgeText}>{activeJobs.length}</Text>
              </View>
            </View>
            {activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                loading={jobActionLoading}
                onAction={handleJobAction}
              />
            ))}
          </View>
        )}

        {/* ── LIVE card ─────────────────────────────────────── */}
        {isLive ? (
          <View style={styles.liveCard}>
            <BroadcastIcon />
            <Text style={styles.liveTitle}>You're LIVE</Text>
            <Text style={styles.liveSub}>Customers can find and book you in real-time.</Text>
            <AvailabilityToggle variant="dark" />
          </View>
        ) : (
          /* ── OFFLINE card ─────────────────────────────────── */
          <View style={styles.offlineCard}>
            <View style={styles.offlineIconWrap}>
              <Ionicons name="eye-off-outline" size={28} color={colors.textSecondary} />
            </View>
            <Text style={styles.offlineTitle}>You're currently invisible to customers</Text>
            <Text style={styles.offlineSub}>Go available to start receiving new service inquiries.</Text>
            <AvailabilityToggle variant="dark" />
          </View>
        )}

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.statLabel}>PROFILE VIEWS</Text>
            </View>
            <Text style={styles.statValue}>{stats.views}</Text>
            <Text style={styles.statDelta}>+12% vs yest.</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.statLabel}>CALLS RECEIVED</Text>
            </View>
            <Text style={styles.statValue}>{stats.calls}</Text>
            <Text style={[styles.statDelta, { color: colors.textDisabled }]}>Steady</Text>
          </View>
        </View>

        {/* Reviews highlight */}
        <View style={styles.reviewsRow}>
          <Ionicons name="star" size={18} color="#FBBF24" />
          <Text style={styles.reviewsLabel}>NEW REVIEWS</Text>
          <Text style={styles.reviewsCount}>{stats.reviews}</Text>
          <Text style={styles.reviewsStars}>★★</Text>
          <Text style={styles.reviewsAll}>All 5-star</Text>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Pressable hitSlop={8} onPress={() => router.push('/(worker)/notifications')}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>
          <View style={styles.activityCard}>
            {MOCK_ACTIVITY.map((item, i) => {
              const cfg =
                item.type === 'save'   ? { icon: 'bookmark'  as const, bg: '#FFF7ED', color: colors.primary } :
                item.type === 'review' ? { icon: 'star'       as const, bg: '#FFFBEB', color: '#FBBF24' } :
                                         { icon: 'call'        as const, bg: '#FFF1F2', color: colors.error };
              return (
                <View key={item.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <Pressable style={styles.activityRow}>
                    <View style={[styles.activityIconWrap, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                    </View>
                    <View style={styles.activityText}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <Text style={styles.activitySub}>{item.subtitle}</Text>
                    </View>
                    {item.type === 'call' ? (
                      <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                    ) : (
                      <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsRow}>
            {[
              { icon: 'create-outline'  as const, label: 'Edit Profile',  onPress: () => router.push('/(worker)/edit-profile') },
              { icon: 'star-outline'    as const, label: 'View Reviews',  onPress: () => router.push('/(worker)/reviews') },
              { icon: 'share-outline'   as const, label: 'Share Profile', onPress: handleShare },
            ].map((a) => (
              <Pressable key={a.label} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]} onPress={a.onPress}>
                <Ionicons name={a.icon} size={22} color={colors.primary} />
                <Text style={styles.actionLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── JobCard component ─────────────────────────────────────────────────────────
interface JobCardProps {
  job: JobRequest;
  loading: string | null;
  onAction: (jobId: string, action: 'accept' | 'decline' | 'confirm_call' | 'start' | 'complete') => void;
}

function JobCard({ job, loading, onAction }: JobCardProps) {
  const customerName = job.customer?.name ?? 'A customer';
  const isLoading = (action: string) => loading === job.id + action;

  const stripColor: Record<string, string> = {
    pending: colors.primary, call_pending: colors.warning,
    accepted: colors.success, started: colors.primary,
  };
  const statusLabel: Record<string, string> = {
    pending: 'New Request', call_pending: 'Call Agreement',
    accepted: 'Accepted', started: 'En Route',
  };

  return (
    <View style={jc.card}>
      <View style={[jc.strip, { backgroundColor: stripColor[job.status] ?? colors.textSecondary }]} />
      <View style={jc.body}>
        <View style={jc.topRow}>
          <Text style={jc.customerName}>{customerName}</Text>
          <View style={[jc.badge, { backgroundColor: (stripColor[job.status] ?? colors.textSecondary) + '22' }]}>
            <Text style={[jc.badgeText, { color: stripColor[job.status] ?? colors.textSecondary }]}>
              {statusLabel[job.status] ?? job.status}
            </Text>
          </View>
          {job.type === 'call' && (
            <View style={jc.callTag}>
              <Ionicons name="call" size={10} color={colors.warning} />
              <Text style={jc.callTagText}>Via call</Text>
            </View>
          )}
        </View>
        {job.description && <Text style={jc.desc} numberOfLines={2}>"{job.description}"</Text>}
        {job.type === 'call' && !job.description && <Text style={jc.desc}>Agreed verbally on a phone call.</Text>}

        <View style={jc.actions}>
          {job.status === 'pending' && (
            <>
              <Pressable style={[jc.btn, jc.acceptBtn]} onPress={() => onAction(job.id, 'accept')} disabled={!!loading}>
                {isLoading('accept') ? <ActivityIndicator size="small" color="#fff" /> : <>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                  <Text style={jc.acceptText}>Accept</Text>
                </>}
              </Pressable>
              <Pressable style={[jc.btn, jc.declineBtn]} onPress={() => onAction(job.id, 'decline')} disabled={!!loading}>
                {isLoading('decline') ? <ActivityIndicator size="small" color={colors.error} /> : <>
                  <Ionicons name="close" size={14} color={colors.error} />
                  <Text style={jc.declineText}>Decline</Text>
                </>}
              </Pressable>
            </>
          )}
          {job.status === 'call_pending' && (
            <>
              <Pressable style={[jc.btn, jc.acceptBtn, { flex: 1 }]} onPress={() => onAction(job.id, 'confirm_call')} disabled={!!loading}>
                {isLoading('confirm_call') ? <ActivityIndicator size="small" color="#fff" /> : <>
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  <Text style={jc.acceptText}>I'm heading there</Text>
                </>}
              </Pressable>
              <Pressable style={[jc.btn, jc.declineBtn]} onPress={() => onAction(job.id, 'decline')} disabled={!!loading}>
                <Ionicons name="close" size={14} color={colors.error} />
              </Pressable>
            </>
          )}
          {job.status === 'accepted' && (
            <Pressable style={[jc.btn, jc.startBtn, { flex: 1 }]} onPress={() => onAction(job.id, 'start')} disabled={!!loading}>
              {isLoading('start') ? <ActivityIndicator size="small" color="#fff" /> : <>
                <Ionicons name="navigate" size={14} color="#fff" />
                <Text style={jc.acceptText}>Start Journey</Text>
              </>}
            </Pressable>
          )}
          {job.status === 'started' && (
            <Pressable style={[jc.btn, jc.completeBtn, { flex: 1 }]} onPress={() => onAction(job.id, 'complete')} disabled={!!loading}>
              {isLoading('complete') ? <ActivityIndicator size="small" color="#fff" /> : <>
                <Ionicons name="checkmark-done" size={14} color="#fff" />
                <Text style={jc.acceptText}>Job Complete</Text>
              </>}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const jc = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.sm, ...shadows.sm },
  strip: { width: 4 },
  body: { flex: 1, padding: spacing.md, gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  customerName: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  callTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF7ED', borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  callTagText: { fontSize: 10, fontWeight: '600', color: colors.warning },
  desc: { ...typography.small, color: colors.textSecondary, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, paddingHorizontal: spacing.md, borderRadius: radius.md, flex: 1 },
  acceptBtn: { backgroundColor: colors.success },
  declineBtn: { borderWidth: 1.5, borderColor: colors.error, flex: 0, paddingHorizontal: spacing.md },
  startBtn: { backgroundColor: colors.primary },
  completeBtn: { backgroundColor: '#059669' },
  acceptText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  declineText: { ...typography.caption, color: colors.error, fontWeight: '600' },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },

  /* Greeting */
  greeting: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greetingText: { ...typography.h2, color: colors.textPrimary },
  greetingSub: { ...typography.small, color: colors.textSecondary, marginTop: 3, maxWidth: 280 },

  /* LIVE card */
  liveCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#16A34A',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  liveTitle: { ...typography.h2, color: '#fff', fontWeight: '800' },
  liveSub: { ...typography.body, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },

  /* OFFLINE card */
  offlineCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  offlineIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  offlineTitle: { ...typography.h4, color: colors.textPrimary },
  offlineSub: { ...typography.small, color: colors.textSecondary },

  /* Stats */
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statLabel: { ...typography.label, color: colors.textSecondary, fontSize: 10 },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statDelta: { ...typography.caption, color: colors.success },

  /* Reviews highlight */
  reviewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  reviewsLabel: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  reviewsCount: { ...typography.h3, color: colors.textPrimary, fontWeight: '800' },
  reviewsStars: { ...typography.bodyMd, color: '#FBBF24' },
  reviewsAll: { ...typography.small, color: colors.success, fontWeight: '600', marginLeft: 'auto' },

  /* Sections */
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  viewAll: { ...typography.small, color: colors.primary, fontWeight: '600' },
  jobsBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  jobsBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  /* Activity */
  activityCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadows.sm },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  activityIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityText: { flex: 1 },
  activityTitle: { ...typography.bodyMd, color: colors.textPrimary },
  activitySub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 56 + spacing.md },

  /* Quick actions */
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: spacing.xs, ...shadows.sm },
  actionLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
