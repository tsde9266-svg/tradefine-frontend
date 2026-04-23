import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import StarRating from '../../components/ui/StarRating';
import KeyboardView from '../../components/layout/KeyboardView';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { createReview } from '../../services/reviews';

const RATING_LABELS: Record<number, string> = {
  1: 'Difficult',
  2: 'Fair',
  3: 'Average',
  4: 'Good',
  5: 'Great',
};

export default function ReviewCustomerScreen() {
  const { customerId, customerName, customerAvatar } =
    useLocalSearchParams<{ customerId: string; customerName?: string; customerAvatar?: string }>();
  const router = useRouter();
  const { show } = useToast();

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const name = customerName ?? 'Customer';

  const handleSubmit = async () => {
    if (rating === 0) {
      show('Please select a star rating', 'error');
      return;
    }
    if (!customerId) return;
    setSubmitting(true);
    try {
      await createReview({ toId: customerId, toType: 'customer', rating, text: text.trim(), photos: [] });
      show('Review posted', 'success');
      router.back();
    } catch {
      show('Could not post review. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardView>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Review Customer</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.prompt}>
            How was{' '}
            <Text style={styles.customerName}>{name}</Text>
            {'\n'}as a customer?
          </Text>

          <View style={styles.customerRow}>
            <Avatar uri={customerAvatar ?? null} name={name} size={48} />
            <Text style={styles.cName}>{name}</Text>
          </View>

          <View style={styles.starsSection}>
            <StarRating value={rating} interactive size="lg" onChange={setRating} />
            {rating > 0 && (
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
            )}
          </View>

          <View style={styles.textSection}>
            <TextInput
              style={styles.textArea}
              value={text}
              onChangeText={(t) => t.length <= 500 && setText(t)}
              placeholder="Describe your experience with this customer..."
              placeholderTextColor={colors.textDisabled}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{text.length}/500</Text>
          </View>

          <Text style={styles.note}>
            This helps build a trustworthy community for everyone
          </Text>

          <Button
            label="Post Review"
            variant="primary"
            fullWidth
            size="lg"
            loading={submitting}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backIcon: { fontSize: 22, color: colors.textPrimary },
  headerTitle: { ...typography.h4, color: colors.textPrimary },
  scroll: { padding: spacing.lg, paddingBottom: spacing.huge },
  prompt: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.lg,
  },
  customerName: { color: colors.primary },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  cName: { ...typography.bodyMd, color: colors.textPrimary },
  starsSection: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  ratingLabel: { ...typography.h3, color: colors.textPrimary },
  textSection: { marginBottom: spacing.lg },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 110,
  },
  charCount: {
    ...typography.caption,
    color: colors.textDisabled,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  note: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
});
