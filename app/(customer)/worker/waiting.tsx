import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

import { useToast } from '../../../components/ui/Toast';
import { StackHeader } from '../../../components/layout/AppHeader';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/radius';
import { spacing } from '../../../constants/spacing';
import { shadows } from '../../../constants/shadows';
import { typography } from '../../../constants/typography';
import { getJobById, cancelJob } from '../../../services/jobs';
import { JobRequest, JobStatus } from '../../../types/job';

const POLL_BASE = 5000;
function pollInterval() { return POLL_BASE + Math.random() * 1000 - 500; }

// ── Status config ─────────────────────────────────────────────

type StatusConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  headline: string;
  detail: string;
  isActive: boolean; // still waiting / in progress
};

function getConfig(job: JobRequest): StatusConfig {
  const name = job.worker?.name?.split(' ')[0] ?? 'Worker';
  const map: Record<JobStatus, StatusConfig> = {
    pending: {
      icon: 'hourglass-outline',
      iconBg: colors.primaryLight,
      iconColor: colors.primary,
      headline: `Request sent to ${name}`,
      detail: 'Tradespeople usually respond within a few minutes. You\'ll get a notification straight away.',
      isActive: true,
    },
    call_pending: {
      icon: 'call-outline',
      iconBg: '#FFF7ED',
      iconColor: colors.warning,
      headline: `Waiting for ${name} to confirm`,
      detail: `${name} will tap "I'm on my way" to confirm the call agreement. You'll then be able to track him live.`,
      isActive: true,
    },
    accepted: {
      icon: 'checkmark-circle-outline',
      iconBg: '#DCFCE7',
      iconColor: colors.success,
      headline: `${name} accepted!`,
      detail: `He's preparing to head out. You'll be notified the moment he starts his journey.`,
      isActive: true,
    },
    started: {
      icon: 'navigate',
      iconBg: colors.primaryLight,
      iconColor: colors.primary,
      headline: `${name} is on his way`,
      detail: 'Opening live tracking…',
      isActive: true,
    },
    completed: {
      icon: 'checkmark-done-circle',
      iconBg: '#DCFCE7',
      iconColor: colors.success,
      headline: 'Job completed',
      detail: `How did it go with ${name}? Your review helps other customers.`,
      isActive: false,
    },
    declined: {
      icon: 'close-circle-outline',
      iconBg: '#FEF2F2',
      iconColor: colors.error,
      headline: `${name} couldn't take the job`,
      detail: 'No worries — try requesting another tradesperson nearby.',
      isActive: false,
    },
    cancelled: {
      icon: 'close-circle-outline',
      iconBg: colors.surfaceElevated,
      iconColor: colors.textSecondary,
      headline: 'Request cancelled',
      detail: 'The job request has been cancelled.',
      isActive: false,
    },
  };
  return map[job.status] ?? map.pending;
}

// ── Progress steps ────────────────────────────────────────────

const STEPS: { statuses: JobStatus[]; label: string }[] = [
  { statuses: ['pending', 'call_pending'], label: 'Sent' },
  { statuses: ['accepted'], label: 'Accepted' },
  { statuses: ['started'], label: 'En Route' },
  { statuses: ['completed'], label: 'Done' },
];

function ProgressBar({ status }: { status: JobStatus }) {
  const stepIndex = STEPS.findIndex((s) => s.statuses.includes(status));
  const active = stepIndex >= 0 ? stepIndex : 0;

  return (
    <View style={pb.row}>
      {STEPS.map((step, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <React.Fragment key={step.label}>
            <View style={pb.step}>
              <View style={[pb.dot, done && pb.dotDone, current && pb.dotCurrent]}>
                {done && <Ionicons name="checkmark" size={9} color="#fff" />}
              </View>
              <Text style={[pb.label, (done || current) && pb.labelActive]}>{step.label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[pb.line, done && pb.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const pb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  step: { alignItems: 'center', gap: 5 },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotCurrent: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  label: { ...typography.caption, color: colors.textDisabled, fontSize: 10 },
  labelActive: { color: colors.primary, fontWeight: '600' },
  line: { flex: 1, height: 2, backgroundColor: colors.borderLight, marginBottom: 12 },
  lineDone: { backgroundColor: colors.primary },
});

// ── Main screen ───────────────────────────────────────────────

export default function WaitingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { show } = useToast();

  const [job, setJob] = useState<JobRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const handledTransition = useRef(false);
  const failCount = useRef(0);
  const dotAnim = useRef(new Animated.Value(1)).current;

  // Pulsing dot for active states
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Polling
  useEffect(() => {
    if (!jobId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      if (!active) return;
      try {
        const updated = await getJobById(jobId);
        if (!active) return;
        failCount.current = 0;
        setNetworkError(false);
        setJob(updated);

        if (handledTransition.current) return;

        if (updated.status === 'started') {
          handledTransition.current = true;
          router.replace(`/(customer)/worker/tracking?workerId=${updated.workerId}`);
        } else if (updated.status === 'completed') {
          handledTransition.current = true;
          setTimeout(() => {
            if (active) router.replace(`/(customer)/worker/review?workerId=${updated.workerId}`);
          }, 1200);
        } else if (['declined', 'cancelled'].includes(updated.status)) {
          handledTransition.current = true;
        }
      } catch {
        if (!active) return;
        failCount.current += 1;
        if (failCount.current >= 3) setNetworkError(true);
        if (failCount.current >= 10) return;
      }
    }

    poll();
    function schedule() {
      timer = setTimeout(async () => {
        await poll();
        if (active) schedule();
      }, pollInterval());
    }
    schedule();

    return () => {
      active = false;
      clearTimeout(timer);
      handledTransition.current = true;
    };
  }, [jobId]);

  async function handleCancel() {
    if (!job) return;
    Alert.alert(
      'Cancel request?',
      `Are you sure? ${job.worker?.name?.split(' ')[0] ?? 'The worker'} will be notified.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel request',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelJob(job.id);
              router.back();
            } catch {
              show('Could not cancel. Try again.', 'error');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }

  const canCancel = job && ['pending', 'call_pending', 'accepted'].includes(job.status);
  const isTerminal = job && ['declined', 'cancelled', 'completed'].includes(job.status);
  const config = job ? getConfig(job) : null;
  const firstName = job?.worker?.name?.split(' ')[0] ?? 'Worker';

  // ── Render: loading / error / content ────────────────────────

  if (networkError && !job) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StackHeader title="Request Status" onBack={() => router.back()} />
        <View style={styles.centerWrap}>
          <Ionicons name="wifi-outline" size={52} color={colors.textDisabled} />
          <Text style={styles.errorTitle}>Can't reach the server</Text>
          <Text style={styles.errorSub}>Check your connection. Your request was sent — the worker will still see it.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StackHeader title="Request Status" onBack={() => {}} />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Connecting to {firstName}…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StackHeader
        title={isTerminal ? 'Request Closed' : `Requesting ${firstName}`}
        onBack={isTerminal ? undefined : () => {}}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Progress tracker */}
        {!isTerminal && <ProgressBar status={job.status} />}

        {/* Worker identity */}
        <View style={styles.workerSection}>
          {job.worker?.avatarUrl ? (
            <Image source={{ uri: job.worker.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>
                {job.worker?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          {/* Live activity dot */}
          {config?.isActive && (
            <Animated.View style={[styles.liveDot, { opacity: dotAnim }]} />
          )}
          <Text style={styles.workerName}>{job.worker?.name ?? 'Worker'}</Text>
          <Text style={styles.workerTrade}>{job.worker?.trades?.[0] ?? '—'}</Text>

          {/* Rating */}
          {job.worker?.rating != null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>{job.worker.rating.toFixed(1)}</Text>
            </View>
          )}

          {/* Call link */}
          {job.worker?.phone && (
            <Pressable style={styles.callPill} onPress={() => Linking.openURL(`tel:${job.worker!.phone}`)}>
              <Ionicons name="call" size={14} color={colors.primary} />
              <Text style={styles.callPillText}>Call {firstName}</Text>
            </Pressable>
          )}
        </View>

        {/* Status message */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconWrap, { backgroundColor: config!.iconBg }]}>
            <Ionicons name={config!.icon} size={28} color={config!.iconColor} />
          </View>
          <Text style={styles.statusHeadline}>{config!.headline}</Text>
          <Text style={styles.statusDetail}>{config!.detail}</Text>
        </View>

        {/* Job description (shows what was sent) */}
        {job.description && (
          <View style={styles.descCard}>
            <View style={styles.descHeader}>
              <Ionicons name="document-text-outline" size={15} color={colors.primary} />
              <Text style={styles.descLabel}>Your request</Text>
            </View>
            <Text style={styles.descText}>{job.description}</Text>
          </View>
        )}

        {/* Call agreement badge */}
        {job.type === 'call' && (
          <View style={styles.callBadge}>
            <Ionicons name="call" size={14} color={colors.warning} />
            <Text style={styles.callBadgeText}>Agreed via phone call</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {job.status === 'completed' && (
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push(`/(customer)/worker/review?workerId=${job.workerId}`)}
            >
              <Ionicons name="star-outline" size={17} color="#fff" />
              <Text style={styles.primaryBtnText}>Leave a Review</Text>
            </Pressable>
          )}

          {(job.status === 'declined' || job.status === 'cancelled') && (
            <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryBtnText}>Find Another Tradesperson</Text>
            </Pressable>
          )}

          {canCancel && (
            <Pressable
              style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
              onPress={handleCancel}
              disabled={cancelling}
            >
              <Text style={styles.cancelBtnText}>{cancelling ? 'Cancelling…' : 'Cancel Request'}</Text>
            </Pressable>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xxl },
  loadingText: { ...typography.body, color: colors.textSecondary },
  errorTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  errorSub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  backBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },

  /* Worker section */
  workerSection: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.h2, color: '#fff', fontWeight: '700' },
  liveDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2, borderColor: colors.background,
    position: 'absolute', top: 70, right: '35%',
  },
  workerName: { ...typography.h3, color: colors.textPrimary, fontWeight: '700', marginTop: spacing.xs },
  workerTrade: { ...typography.small, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  callPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg, paddingVertical: 8,
    marginTop: spacing.xs,
  },
  callPillText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  /* Status card */
  statusCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  statusIconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  statusHeadline: { ...typography.h4, color: colors.textPrimary, textAlign: 'center', fontWeight: '700' },
  statusDetail: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  /* Description */
  descCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  descHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  descLabel: { ...typography.caption, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  descText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },

  /* Call badge */
  callBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg,
    backgroundColor: '#FFF7ED',
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  callBadgeText: { ...typography.small, color: colors.warning, fontWeight: '600' },

  /* Actions */
  actions: { marginHorizontal: spacing.lg, gap: spacing.sm },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.full, paddingVertical: 16,
  },
  primaryBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  cancelBtn: {
    alignItems: 'center', paddingVertical: spacing.md,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.error,
    backgroundColor: 'rgba(220,38,38,0.06)',
  },
  cancelBtnText: { ...typography.bodyMd, color: colors.error, fontWeight: '600' },
});
