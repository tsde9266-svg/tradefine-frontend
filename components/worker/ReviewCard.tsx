import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Avatar from '../ui/Avatar';
import StarRating from '../ui/StarRating';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { formatDate } from '../../utils/formatters';
import { Review } from '../../types/review';

interface ReviewCardProps {
  review: Review;
  onReply?: (reviewId: string, reply: string) => Promise<void>;
  isWorkerView?: boolean;
}

function ReviewCard({ review, onReply, isWorkerView = false }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 180;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={review.fromUserAvatar} name={review.fromUserName} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{review.fromUserName}</Text>
          <View style={styles.ratingRow}>
            <StarRating value={review.rating} size="sm" />
            <Text style={styles.date}> · {formatDate(review.createdAt)}</Text>
          </View>
        </View>
      </View>

      <Pressable onPress={() => isLong && setExpanded((e) => !e)}>
        <Text style={styles.text} numberOfLines={expanded || !isLong ? undefined : 3}>
          {review.text}
        </Text>
        {isLong && (
          <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
        )}
      </Pressable>

      {review.reply && (
        <View style={styles.replyBox}>
          <Text style={styles.replyLabel}>Your reply</Text>
          <Text style={styles.replyText}>{review.reply}</Text>
        </View>
      )}

      {isWorkerView && !review.reply && onReply && (
        <ReplyInput reviewId={review.id} onReply={onReply} />
      )}
    </View>
  );
}

function ReplyInput({
  reviewId,
  onReply,
}: {
  reviewId: string;
  onReply: (id: string, reply: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)}>
        <Text style={styles.replyAction}>Reply to this review</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.replyInputContainer}>
      <TextInput
        style={styles.replyInputField}
        value={text}
        onChangeText={setText}
        multiline
        placeholder="Write your reply..."
        placeholderTextColor="#9CA3AF"
        textAlignVertical="top"
      />
      <Pressable
        style={[styles.replySubmit, loading && { opacity: 0.6 }]}
        onPress={async () => {
          if (!text.trim()) return;
          setLoading(true);
          await onReply(reviewId, text.trim());
          setLoading(false);
          setOpen(false);
        }}
        disabled={loading}
      >
        <Text style={styles.replySubmitText}>Post Reply</Text>
      </Pressable>
    </View>
  );
}

export default memo(ReviewCard);

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
  },
  readMore: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  replyBox: {
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  replyLabel: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  replyText: {
    ...typography.small,
    color: colors.textPrimary,
  },
  replyAction: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  replyInputContainer: {
    gap: spacing.sm,
  },
  replyInputField: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    ...typography.body,
    color: colors.textPrimary,
  },
  replySubmit: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  replySubmitText: {
    ...typography.bodyMd,
    color: colors.textInverse,
  },
});
