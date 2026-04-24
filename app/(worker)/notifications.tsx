import React, { useCallback, useEffect } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import StarRating from '../../components/ui/StarRating';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { getNotifications, markAllRead } from '../../services/notifications';
import { useNotificationStore } from '../../stores/notificationStore';
import { Notification } from '../../types/notification';
import { formatDate } from '../../utils/formatters';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_CONFIG: Record<Notification['type'], { icon: IoniconsName; bg: string; color: string }> = {
  new_review:       { icon: 'star',            bg: '#FFFBEB', color: '#FBBF24' },
  account_approved: { icon: 'checkmark-circle', bg: '#DCFCE7', color: colors.success },
  profile_saved:    { icon: 'bookmark',         bg: '#FFF7ED', color: colors.primary },
  call_received:    { icon: 'call',             bg: '#FFF1F2', color: colors.error },
};

export default function WorkerNotificationsScreen() {
  const { show } = useToast();
  const { notifications, setNotifications, markAllRead: storeMarkAll, unreadCount } = useNotificationStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        show('Could not load notifications', 'error');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllRead();
      storeMarkAll();
    } catch {
      show('Could not mark as read', 'error');
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: Notification }) => {
    const cfg = TYPE_CONFIG[item.type] ?? { icon: 'notifications-outline' as IoniconsName, bg: '#F3F4F6', color: colors.textSecondary };
    const isCall = item.type === 'call_received';
    const isReview = item.type === 'new_review';

    return (
      <View style={[styles.card, !item.read && styles.cardUnread]}>
        {!item.read && <View style={styles.unreadBar} />}

        <View style={styles.cardInner}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.body}>{item.body}</Text>

            {/* Star display for reviews */}
            {isReview && <StarRating value={5} size="sm" style={styles.stars} />}

            {/* Action buttons for calls */}
            {isCall && (
              <View style={styles.actionBtns}>
                <Pressable
                  style={styles.callBackBtn}
                  onPress={() => {
                    const match = item.body.match(/[\d\s]{7,}/);
                    if (match) Linking.openURL(`tel:${match[0].trim()}`);
                  }}
                >
                  <Ionicons name="call" size={13} color={colors.textInverse} />
                  <Text style={styles.callBackText}>Call Back</Text>
                </Pressable>
                <Pressable style={styles.msgBtn}>
                  <Text style={styles.msgBtnText}>Message</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>Notifications</Text>
          <Text style={styles.pageSub}>Stay updated with your latest job activity</Text>
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAll} hitSlop={8}>
            <Text style={styles.markAll}>Mark all as read</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} width="100%" height={90} borderRadius={14} style={{ marginBottom: spacing.md }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          removeClippedSubviews
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState title="No notifications yet" subtitle="You will be notified of reviews, saves and calls" />
          }
          ListFooterComponent={
            notifications.length > 0
              ? <Text style={styles.footer}>END OF RECENT ACTIVITY</Text>
              : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: { flex: 1 },
  pageTitle: { ...typography.h2, color: colors.textPrimary },
  pageSub: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  markAll: { ...typography.small, color: colors.primary, fontWeight: '600', marginTop: 4 },

  skeletons: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.sm,
  },
  cardUnread: { backgroundColor: '#FFFAF7' },
  unreadBar: { width: 4, backgroundColor: colors.primary },
  cardInner: { flex: 1, flexDirection: 'row', padding: spacing.md, gap: spacing.md },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { ...typography.bodyMd, color: colors.textPrimary, flex: 1 },
  time: { ...typography.caption, color: colors.textDisabled, flexShrink: 0 },
  body: { ...typography.small, color: colors.textSecondary },
  stars: { marginTop: 4 },

  actionBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  callBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  callBackText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },
  msgBtn: {
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBtnText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  footer: { ...typography.label, color: colors.textDisabled, textAlign: 'center', paddingVertical: spacing.xl },
});
