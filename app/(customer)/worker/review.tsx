import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import StarRating from '../../../components/ui/StarRating';
import KeyboardView from '../../../components/layout/KeyboardView';
import { useToast } from '../../../components/ui/Toast';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/radius';
import { spacing } from '../../../constants/spacing';
import { typography } from '../../../constants/typography';
import { getWorkerById } from '../../../services/workers';
import { createReview } from '../../../services/reviews';
import { uploadImage } from '../../../services/upload';
import { Worker } from '../../../types/worker';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export default function LeaveReviewScreen() {
  const { workerId } = useLocalSearchParams<{ workerId: string }>();
  const router = useRouter();
  const { show } = useToast();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (workerId) getWorkerById(workerId).then(setWorker).catch(() => {});
  }, [workerId]);

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const url = await uploadImage(result.assets[0].uri);
      setPhotos((p) => [...p, url]);
    } catch {
      show('Could not upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      show('Please select a star rating', 'error');
      return;
    }
    if (text.trim().length < 10) {
      show('Please write at least a short review', 'error');
      return;
    }
    if (!workerId) return;
    setSubmitting(true);
    try {
      await createReview({ toId: workerId, toType: 'worker', rating, text: text.trim(), photos });
      show('Review posted!', 'success');
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Leave a Review</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Prompt */}
          <Text style={styles.prompt}>
            How was your experience with{'\n'}
            <Text style={styles.workerName}>{worker?.name ?? '…'}</Text>?
          </Text>

          {/* Worker info row */}
          {worker && (
            <View style={styles.workerRow}>
              <Avatar uri={worker.avatarUrl} name={worker.name} size={48} />
              <View>
                <Text style={styles.wName}>{worker.name}</Text>
                <Text style={styles.wTrade}>{worker.trades[0]}</Text>
              </View>
            </View>
          )}

          {/* Star selector */}
          <View style={styles.starsSection}>
            <StarRating value={rating} interactive size="lg" onChange={setRating} />
            {rating > 0 && (
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
            )}
          </View>

          {/* Text input */}
          <View style={styles.textSection}>
            <TextInput
              style={styles.textArea}
              value={text}
              onChangeText={(t) => t.length <= 500 && setText(t)}
              placeholder="Share details about your experience..."
              placeholderTextColor={colors.textDisabled}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{text.length}/500</Text>
          </View>

          {/* Photo upload */}
          <Text style={styles.photosLabel}>Add Photos (optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosList}
          >
            {photos.map((uri) => (
              <ExpoImage
                key={uri}
                source={{ uri }}
                style={styles.photoThumb}
                contentFit="cover"
              />
            ))}
            <Pressable
              style={styles.addPhotoTile}
              onPress={handleAddPhoto}
              disabled={uploading}
            >
              <Text style={styles.addPhotoPlus}>{uploading ? '…' : '+'}</Text>
            </Pressable>
          </ScrollView>

          <Text style={styles.disclaimer}>Reviews cannot be edited after posting</Text>

          <View style={styles.submitContainer}>
            <Button
              label="Post Review"
              variant="primary"
              fullWidth
              size="lg"
              loading={submitting}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  prompt: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 28,
  },
  workerName: {
    color: colors.primary,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  wName: { ...typography.bodyMd, color: colors.textPrimary },
  wTrade: { ...typography.small, color: colors.textSecondary },
  starsSection: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  ratingLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  textSection: {
    marginBottom: spacing.lg,
  },
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
  photosLabel: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  photosList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  addPhotoTile: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: Platform.OS === 'ios' ? 'dashed' : 'solid',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoPlus: {
    fontSize: 28,
    color: colors.textDisabled,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  submitContainer: {
    marginTop: spacing.sm,
  },
});
