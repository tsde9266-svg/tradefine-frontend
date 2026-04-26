import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Pressable,
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
// Jitter: ±1s so 10k users don't all hit the DB at exactly the same moment
function pollInterval() { return POLL_BASE + Math.random() * 1000 - 500; }

interface StatusConfig {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  showSpinner: boolean;
}

function getStatusConfig(job: JobRequest): StatusConfig {
  const firstName = job.worker?.name?.split(' ')[0] ?? 'Worker';
  const configs: Record<JobStatus, StatusConfig> = {
    pending: {
      icon: 'time-outline',
      iconBg: colors.primaryLight,
      iconColor: colors.primary,
      title: `Waiting for ${firstName} to respond`,
      subtitle: 'He\'ll accept or decline shortly. You\'ll be notified instantly.',
      showSpinner: true,
    },
    call_pending: {
      icon: 'call-outline',
      iconBg: '#FFF7ED',
      iconColor: colors.warning,
      title: `Waiting for ${firstName} to confirm`,
      subtitle: `${firstName} will receive your agreement confirmation and tap "I'm on my way".`,
      showSpinner: true,
    },
    accepted: {
      icon: 'checkmark-circle-outline',
      iconBg: '#DCFCE7',
      iconColor: colors.success,
      title: `${firstName} accepted!`,
      subtitle: `He'll start his journey shortly. You'll be notified the moment he sets off.`,
      showSpinner: true,
    },
    started: {
      icon: 'navigate',
      iconBg: colors.primaryLight,
      iconColor: colors.primary,
      title: `${firstName} is on his way!`,
      subtitle: 'Opening live tracking…',
      showSpinner: true,
    },
    completed: {
      icon: 'checkmark-done-circle-outline',
      iconBg: '#DCFCE7',
      iconColor: colors.success,
      title: 'Job completed!',
      subtitle: `${firstName} has finished. How did it go?`,
      showSpinner: false,
    },
    declined: {
      icon: 'close-circle-outline',
      iconBg: '#FEF2F2',
      iconColor: colors.error,
      title: `${firstName} declined`,
      subtitle: 'Try requesting another tradesperson nearby.',
      showSpinner: false,
    },
    cancelled: {
      icon: 'close-circle-outline',
      iconBg: colors.surfaceElevated,
      iconColor: colors.textSecondary,
      title: 'Request cancelled',
      subtitle: 'The job request has been cancelled.',
      showSpinner: false,
    },
  };
  return configs[job.status];
}

export default function WaitingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { show } = useToast();

  const [job, setJob] = useState<JobRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const handledTransition = useRef(false);
  const failCount = useRef(0);

  // Pulse animation for spinner states
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Poll for job status
  useEffect(() => {
    if (!jobId) return;

    async function poll() {
      try {
        const updated = await getJobById(jobId);
        setJob(updated);

        if (handledTransition.current) return;

        if (updated.status === 'started') {
          handledTransition.current = true;
          setTimeout(() => {
            router.replace(`/(customer)/worker/tracking?workerId=${updated.workerId}`);
          }, 800);
        } else if (updated.status === 'completed') {
          handledTransition.current = true;
          setTimeout(() => {
            router.replace(`/(customer)/worker/review?workerId=${updated.workerId}`);
          }, 1500);
        } else if (updated.status === 'declined' || updated.status === 'cancelled') {
          handledTransition.current = true;
        }
      } catch {
        failCount.current += 1;
        if (failCount.current >= 3) {
          setNetworkError(true);
        }
      }
    }

    poll();
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      timer = setTimeout(async () => { await poll(); schedule(); }, pollInterval());
    }
    schedule();
    return () => clearTimeout(timer);
  }, [jobId]);

  async function handleCancel() {
    if (!job) return;
    Alert.alert(
      'Cancel request?',
      `Are you sure you want to cancel your request to ${job.worker?.name?.split(' ')[0] ?? 'this worker'}?`,
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
              show('Could not cancel request', 'error');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }

  const canCancel = job && ['pending', 'call_pending', 'accepted'].includes(job.status);
  const isTerminal = job && ['declined', 'cancelled'].includes(job.status);
  const config = job ? getStatusConfig(job) : null;
  const firstName = job?.worker?.name?.split(' ')[0] ?? 'Worker';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StackHeader title="Job Status" onBack={isTerminal ? undefined : () => {}} />

      <View style={styles.content}>
        {networkError && !job ? (
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Ionicons name="wifi-outline" size={48} color={colors.textDisabled} />
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Cannot reach the server. Check your connection and try again.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryBtnText}>Go Back</Text>
            </Pressable>
          </View>
        ) : !job ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            {/* Worker info */}
            <View style={styles.workerCard}>
              {job.worker?.avatarUrl ? (
                <Image source={{ uri: job.worker.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>
                    {job.worker?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{job.worker?.name ?? 'Worker'}</Text>
                <Text style={styles.workerTrade}>{job.worker?.trades?.[0] ?? '—'}</Text>
                {job.worker?.phone && (
                  <Pressable
                    style={styles.callLink}
                    onPress={() => Linking.openURL(`tel:${job.worker!.phone}`)}
                  >
                    <Ionicons name="call-outline" size={13} color={colors.primary} />
                    <Text style={styles.callLinkText}>Call {firstName}</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Status card */}
            <Animated.View style={[styles.statusCard, config?.showSpinner && { opacity: pulseAnim }]}>
              <View style={[styles.statusIconWrap, { backgroundColor: config!.iconBg }]}>
                <Ionicons name={config!.icon} size={32} color={config!.iconColor} />
              </View>
              <Text style={styles.statusTitle}>{config!.title}</Text>
              <Text style={styles.statusSubtitle}>{config!.subtitle}</Text>
              {config!.showSpinner && (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.sm }} />
              )}
            </Animated.View>

            {/* Job details */}
            {job.description && (
              <View style={styles.descCard}>
                <Text style={styles.descLabel}>YOUR REQUEST</Text>
                <Text style={styles.descText}>{job.description}</Text>
              </View>
            )}

            {/* Call type indicator */}
            {job.type === 'call' && (
              <View style={styles.typeRow}>
                <Ionicons name="call" size={14} color={colors.warning} />
                <Text style={styles.typeText}>Agreed via phone call</Text>
              </View>
            )}

            {/* Actions */}
            {canCancel && (
              <Pressable
                style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                <Text style={styles.cancelBtnText}>{cancelling ? 'Cancelling…' : 'Cancel request'}</Text>
              </Pressable>
            )}

            {isTerminal && (
              <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
                <Text style={styles.primaryBtnText}>Find another tradesperson</Text>
              </Pressable>
            )}

            {job.status === 'completed' && (
              <Pressable
                style={styles.primaryBtn}
                onPress={() => router.push(`/(customer)/worker/review?workerId=${job.workerId}`)}
              >
                <Ionicons name="star-outline" size={17} color="#fff" />
                <Text style={styles.primaryBtnText}>Leave a review</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    ...typography.h4, color: colors.textPrimary, fontWeight: '700',
  },

  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    alignItems: 'stretch',
    justifyContent: 'center',
  },

  /* Worker card */
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { ...typography.h3, color: '#fff', fontWeight: '700' },
  workerInfo: { flex: 1, gap: 3 },
  workerName: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  workerTrade: { ...typography.small, color: colors.textSecondary },
  callLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  callLinkText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  /* Status card */
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  statusIconWrap: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  statusTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center', fontWeight: '700' },
  statusSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  /* Description */
  descCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  descLabel: { ...typography.label, color: colors.textSecondary, fontSize: 10 },
  descText: { ...typography.body, color: colors.textPrimary, lineHeight: 20 },

  /* Call type */
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  typeText: { ...typography.caption, color: colors.textSecondary },

  /* Buttons */
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: 'rgba(220,38,38,0.06)',
  },
  cancelBtnText: { ...typography.bodyMd, color: colors.error, fontWeight: '600' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  primaryBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
});
