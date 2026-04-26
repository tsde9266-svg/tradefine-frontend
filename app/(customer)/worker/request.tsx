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
import * as Haptics from 'expo-haptics';

import { useToast } from '../../../components/ui/Toast';
import { StackHeader } from '../../../components/layout/AppHeader';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/radius';
import { spacing } from '../../../constants/spacing';
import { shadows } from '../../../constants/shadows';
import { typography } from '../../../constants/typography';
import { createJobRequest } from '../../../services/jobs';

export default function RequestWorkerScreen() {
  const { workerId, workerName, workerPhone } =
    useLocalSearchParams<{ workerId: string; workerName: string; workerPhone: string }>();
  const router = useRouter();
  const { show } = useToast();

  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCallFlow, setShowCallFlow] = useState(false);
  const [called, setCalled] = useState(false);
  const [confirmingCall, setConfirmingCall] = useState(false);

  const firstName = workerName?.split(' ')[0] ?? 'Worker';

  if (!workerId) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StackHeader title={`Request ${firstName}`} />
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>Something went wrong. Please go back and try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleSendRequest() {
    if (description.trim().length < 10) {
      show('Describe your job in at least 10 characters', 'error');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const job = await createJobRequest({ workerId, type: 'in_app', description: description.trim() });
      router.replace(`/(customer)/worker/waiting?jobId=${job.id}`);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.error;
      if (status === 409) show('You already have an active request with this worker.', 'info');
      else if (status === 403) show(msg ?? 'This worker is not available for booking right now.', 'error');
      else if (status === 404) show('Worker not found. Please go back and try again.', 'error');
      else show(msg ?? 'Could not send request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmCall() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirmingCall(true);
    try {
      const job = await createJobRequest({ workerId, type: 'call' });
      router.replace(`/(customer)/worker/waiting?jobId=${job.id}`);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.error;
      if (status === 409) show('You already have an active request with this worker.', 'info');
      else show(msg ?? 'Could not confirm. Please try again.', 'error');
    } finally {
      setConfirmingCall(false);
    }
  }

  function handleCall() {
    if (workerPhone) Linking.openURL(`tel:${workerPhone}`);
    setCalled(true);
  }

  // ── Call & Confirm sub-flow ─────────────────────────────────
  if (showCallFlow) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StackHeader title="Call & Confirm" onBack={() => setShowCallFlow(false)} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.callFlowTitle}>Agree with {firstName} on the phone first</Text>
          <Text style={styles.callFlowSub}>
            Call {firstName}, discuss the job, price and timing. When you're both happy, confirm below — you'll be able to track his journey live.
          </Text>

          <Pressable style={styles.callPrimaryBtn} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callPrimaryText}>Call {firstName}</Text>
          </Pressable>

          {called ? (
            <View style={styles.confirmedSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>You spoke — great!</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.confirmInfo}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
                <Text style={styles.confirmInfoText}>
                  {firstName} will receive a notification to confirm he's on his way.
                  Tracking starts the moment he confirms.
                </Text>
              </View>

              <Pressable
                style={[styles.confirmBtn, confirmingCall && { opacity: 0.7 }]}
                onPress={handleConfirmCall}
                disabled={confirmingCall}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.confirmBtnText}>
                  {confirmingCall ? 'Confirming…' : `We agreed — ${firstName} is coming`}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.callHint}>Call {firstName} first, then you can confirm the agreement.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Main request screen (default) ──────────────────────────
  const charColor = description.length > 450
    ? colors.error
    : description.length > 375
    ? colors.warning
    : colors.textDisabled;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StackHeader title={`Request ${firstName}`} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Worker context */}
          <Text style={styles.heading}>What do you need help with?</Text>
          <Text style={styles.sub}>
            Tell {firstName} about the job — the more detail you give, the better he can prepare.
          </Text>

          {/* Description input */}
          <View style={styles.textAreaCard}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder={`e.g. "My boiler is making a knocking noise and the heating keeps cutting out. I need it looked at as soon as possible..."`}
              placeholderTextColor={colors.textDisabled}
              multiline
              maxLength={500}
              textAlignVertical="top"
              autoFocus
            />
            <Text style={[styles.charCount, { color: charColor }]}>{description.length}/500</Text>
          </View>

          {/* What happens next */}
          <View style={styles.nextStepsCard}>
            <Text style={styles.nextTitle}>What happens next</Text>
            {[
              { icon: 'notifications-outline' as const, text: `${firstName} gets notified and can accept or decline` },
              { icon: 'checkmark-circle-outline' as const, text: 'You\'ll be notified the moment he responds' },
              { icon: 'navigate-outline' as const, text: 'Once he starts, track his live location here' },
            ].map((step, i) => (
              <View key={i} style={styles.nextStep}>
                <Ionicons name={step.icon} size={16} color={colors.primary} />
                <Text style={styles.nextText}>{step.text}</Text>
              </View>
            ))}
          </View>

          {/* Send button */}
          <Pressable
            style={[styles.sendBtn, (submitting || description.trim().length < 10) && styles.sendBtnDisabled]}
            onPress={handleSendRequest}
            disabled={submitting || description.trim().length < 10}
          >
            <Ionicons name="send" size={17} color="#fff" />
            <Text style={styles.sendBtnText}>
              {submitting ? 'Sending request…' : `Send Request to ${firstName}`}
            </Text>
          </Pressable>

          {/* Secondary: already called */}
          <Pressable style={styles.callInsteadBtn} onPress={() => setShowCallFlow(true)}>
            <Ionicons name="call-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.callInsteadText}>Already spoken with {firstName}? Confirm a verbal agreement</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },

  heading: { ...typography.h2, color: colors.textPrimary },
  sub: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginTop: -spacing.sm },

  /* Text area */
  textAreaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
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
  charCount: { ...typography.caption, textAlign: 'right', marginTop: spacing.xs },

  /* Next steps */
  nextStepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  nextTitle: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  nextStep: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  nextText: { ...typography.small, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  /* Send button */
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.full, paddingVertical: 16,
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceElevated },
  sendBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },

  /* Secondary call option */
  callInsteadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  callInsteadText: { ...typography.small, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  /* Call flow */
  callFlowTitle: { ...typography.h3, color: colors.textPrimary },
  callFlowSub: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  callPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.md, backgroundColor: colors.primary,
    borderRadius: radius.full, paddingVertical: 16,
  },
  callPrimaryText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
  callHint: { ...typography.small, color: colors.textDisabled, textAlign: 'center' },
  confirmedSection: { gap: spacing.lg },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  confirmInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: '#F0FDF4', borderRadius: radius.lg, padding: spacing.md,
  },
  confirmInfoText: { ...typography.small, color: colors.success, flex: 1, lineHeight: 18 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.success,
    borderRadius: radius.full, paddingVertical: 16,
  },
  confirmBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
});
