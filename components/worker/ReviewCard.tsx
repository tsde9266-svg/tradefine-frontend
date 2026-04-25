import React, { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from '../ui/StarRating';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { formatDate } from '../../utils/formatters';
import { Review } from '../../types/review';

interface ReviewCardProps {
  review: Review;
  onReply?: (reviewId: string, reply: string) => Promise<void>;
  isWorkerView?: boolean;
}

function Avatar({ uri, name }: { uri?: string | null; name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={s.avatar} />;
  }
  return (
    <View style={[s.avatar, s.avatarFallback]}>
      <Text style={s.avatarInitials}>{initials}</Text>
    </View>
  );
}

function ReviewCard({ review, onReply, isWorkerView = false }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 180;

  return (
    <View style={s.card}>
      {/* Row 1: avatar + name (left) + date (right) */}
      <View style={s.headerRow}>
        <Avatar uri={review.fromUserAvatar} name={review.fromUserName} />
        <View style={s.headerMeta}>
          <View style={s.nameRow}>
            <Text style={s.name}>{review.fromUserName}</Text>
            <Text style={s.date}>{formatDate(review.createdAt)}</Text>
          </View>
          {/* Row 2: stars */}
          <StarRating value={review.rating} size="sm" />
        </View>
      </View>

      {/* Review text */}
      <Pressable onPress={() => isLong && setExpanded((e) => !e)}>
        <Text style={s.text} numberOfLines={expanded || !isLong ? undefined : 3}>
          {review.text}
        </Text>
        {isLong && (
          <Text style={s.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
        )}
      </Pressable>

      {/* Existing reply */}
      {review.reply && (
        <View style={s.replyBox}>
          <Text style={s.replyLabel}>Your Reply</Text>
          <Text style={s.replyText}>{review.reply}</Text>
        </View>
      )}

      {/* Reply button / input (worker only, no reply yet) */}
      {isWorkerView && !review.reply && onReply && (
        <ReplyInput reviewId={review.id} onReply={onReply} />
      )}
    </View>
  );
}

function ReplyInput({ reviewId, onReply }: {
  reviewId: string;
  onReply: (id: string, reply: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <Pressable style={s.replyBtn} onPress={() => setOpen(true)}>
        <Ionicons name="return-down-forward" size={13} color={colors.primary} />
        <Text style={s.replyBtnText}>REPLY</Text>
      </Pressable>
    );
  }

  return (
    <View style={s.replyInputWrap}>
      <TextInput
        style={s.replyInput}
        value={text}
        onChangeText={setText}
        multiline
        placeholder="Write your reply…"
        placeholderTextColor={colors.textDisabled}
        textAlignVertical="top"
        autoFocus
      />
      <View style={s.replyActions}>
        <Pressable onPress={() => setOpen(false)}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[s.postBtn, (!text.trim() || loading) && { opacity: 0.5 }]}
          onPress={async () => {
            if (!text.trim()) return;
            setLoading(true);
            await onReply(reviewId, text.trim());
            setLoading(false);
            setOpen(false);
          }}
          disabled={!text.trim() || loading}
        >
          <Text style={s.postBtnText}>{loading ? 'Posting…' : 'Post Reply'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default memo(ReviewCard);

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },

  /* Header: avatar + meta */
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, flexShrink: 0 },
  avatarFallback: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },

  headerMeta: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  date: { ...typography.caption, color: colors.textSecondary },

  /* Review text */
  text: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  readMore: { ...typography.small, color: colors.primary, fontWeight: '600', marginTop: 2 },

  /* Reply box (existing reply) */
  replyBox: {
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  replyLabel: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  replyText: { ...typography.small, color: colors.textPrimary },

  /* Reply button */
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  replyBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* Reply input */
  replyInputWrap: { gap: spacing.sm },
  replyInput: {
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    ...typography.body,
    color: colors.textPrimary,
  },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.small, color: colors.textSecondary },
  postBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  postBtnText: { ...typography.caption, color: '#fff', fontWeight: '700' },
});
