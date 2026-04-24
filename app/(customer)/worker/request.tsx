import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useToast } from '../../../components/ui/Toast';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/radius';
import { spacing } from '../../../constants/spacing';
import { shadows } from '../../../constants/shadows';
import { typography } from '../../../constants/typography';
import { createJobRequest } from '../../../services/jobs';

type Mode = 'choose' | 'in_app' | 'call';

export default function RequestWorkerScreen() {
  const { workerId, workerName, workerPhone } =
    useLocalSearchParams<{ workerId: string; workerName: string; workerPhone: string }>();
  const router = useRouter();
  const { show } = useToast();

  const [mode, setMode] = useState<Mode>('choose');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [called, setCalled] = useState(false);

  const firstName = workerName?.split(' ')[0] ?? 'Worker';

  async function submitInApp() {
    if (description.trim().length < 10) {
      show('Please describe your job (at least 10 characters)', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const job = await createJobRequest({ workerId, type: 'in_app', description: description.trim() });
      router.replace(`/(customer)/worker/waiting?jobId=${job.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.error;
      if (!msg && e?.response?.status === 404) {
        show('Booking feature coming soon — call the worker directly for now', 'info');
      } else {
        show(msg ?? 'Could not send request', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCallAgreement() {
    setSubmitting(true);
    try {
      const job = await createJobRequest({ workerId, type: 'call' });
      router.replace(`/(customer)/worker/waiting?jobId=${job.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.error;
      if (!msg && e?.response?.status === 404) {
        show('Booking feature coming soon — call the worker directly for now', 'info');
      } else {
        show(msg ?? 'Could not confirm agreement', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCall() {
    if (workerPhone) {
      Linking.openURL(`tel:${workerPhone}`);
      setCalled(true);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => (mode === 'choose' ? router.back() : setMode('choose'))}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {mode === 'choose' ? `Request ${firstName}` : mode === 'in_app' ? 'Describe the Job' : 'Call & Confirm'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── CHOOSE MODE ────────────────────────────────────── */}
          {mode === 'choose' && (
            <>
              <Text style={styles.subtitle}>
                How would you like to proceed with {firstName}?
              </Text>

              {/* In-app request option */}
              <Pressable
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                onPress={() => setMode('in_app')}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="document-text-outline" size={26} color={colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Send a Request</Text>
                  <Text style={styles.optionDesc}>
                    Describe your job in-app. {firstName} will accept or decline and you can track his journey.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textDisabled} />
              </Pressable>

              {/* Call & confirm option */}
              <Pressable
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                onPress={() => setMode('call')}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="call-outline" size={26} color={colors.warning} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Call & Confirm</Text>
                  <Text style={styles.optionDesc}>
                    Call {firstName} directly, agree on terms verbally, then both confirm in-app to start tracking.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textDisabled} />
              </Pressable>

              <Text style={styles.hint}>
                Either way, once {firstName} confirms he's on his way, you'll see his live location.
              </Text>
            </>
          )}

          {/* ── IN-APP REQUEST ─────────────────────────────────── */}
          {mode === 'in_app' && (
            <>
              <Text style={styles.subtitle}>
                Tell {firstName} what you need. Be as specific as possible so he can prepare.
              </Text>

              <View style={styles.textAreaWrap}>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={`e.g. "My boiler has been making a banging noise and the heating isn't working. I think it needs a service or repair..."`}
                  placeholderTextColor={colors.textDisabled}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  {firstName} will receive a notification and can accept or decline. You'll be notified instantly.
                </Text>
              </View>

              <Pressable
                style={[styles.primaryBtn, (submitting || description.trim().length < 10) && styles.primaryBtnDisabled]}
                onPress={submitInApp}
                disabled={submitting || description.trim().length < 10}
              >
                <Ionicons name="send" size={17} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {submitting ? 'Sending…' : `Send Request to ${firstName}`}
                </Text>
              </Pressable>
            </>
          )}

          {/* ── CALL & CONFIRM ─────────────────────────────────── */}
          {mode === 'call' && (
            <>
              {/* Step 1 */}
              <View style={styles.stepCard}>
                <View style={styles.stepNumWrap}>
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>Call {firstName}</Text>
                  <Text style={styles.stepDesc}>
                    Discuss the job, agree on price and timing. Once you've agreed, come back here.
                  </Text>
                  <Pressable style={styles.callBtn} onPress={handleCall}>
                    <Ionicons name="call" size={17} color="#fff" />
                    <Text style={styles.callBtnText}>Call {firstName} now</Text>
                  </Pressable>
                </View>
              </View>

              {/* Step 2 */}
              <View style={[styles.stepCard, !called && styles.stepCardLocked]}>
                <View style={[styles.stepNumWrap, called && styles.stepNumDone]}>
                  <Text style={[styles.stepNum, called && styles.stepNumTextDone]}>2</Text>
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>Confirm your agreement</Text>
                  <Text style={styles.stepDesc}>
                    Tap below once you've both agreed. {firstName} will receive a notification to confirm he's on his way, and you'll be able to track him live.
                  </Text>
                  <Pressable
                    style={[styles.confirmBtn, (!called || submitting) && styles.primaryBtnDisabled]}
                    onPress={confirmCallAgreement}
                    disabled={!called || submitting}
                  >
                    <Ionicons name="checkmark-circle" size={17} color={called ? '#fff' : colors.textDisabled} />
                    <Text style={[styles.confirmBtnText, !called && { color: colors.textDisabled }]}>
                      {submitting ? 'Confirming…' : `We agreed — ${firstName} is coming`}
                    </Text>
                  </Pressable>

                  {!called && (
                    <Text style={styles.lockedNote}>Call {firstName} first to unlock this step.</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  {firstName} must confirm on his end too. Tracking starts only once he taps "I'm on my way".
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    flex: 1,
    textAlign: 'center',
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '700',
  },

  content: { padding: spacing.lg, gap: spacing.lg },

  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  /* Option cards */
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  optionCardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  optionIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: { flex: 1, gap: 4 },
  optionTitle: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  optionDesc: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },

  hint: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },

  /* Text area */
  textAreaWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    padding: spacing.md,
    ...shadows.sm,
  },
  textArea: {
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 140,
    lineHeight: 22,
  },
  charCount: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  /* Info row */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoText: { ...typography.small, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  /* Step cards */
  stepCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  stepCardLocked: { opacity: 0.7 },
  stepNumWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  stepNumDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNum: { ...typography.bodyMd, color: colors.textSecondary, fontWeight: '700' },
  stepNumTextDone: { color: '#fff' },
  stepBody: { flex: 1, gap: spacing.sm },
  stepTitle: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  stepDesc: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },

  /* Buttons */
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  primaryBtnDisabled: { backgroundColor: colors.surfaceElevated },
  primaryBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },

  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  callBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },

  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  confirmBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },

  lockedNote: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: 2,
  },
});
