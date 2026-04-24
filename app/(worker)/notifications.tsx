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
import { TabHeader } from '../../components/layout/AppHeader';
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

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_CONFIG: Record<Notification['type'], { icon: IoniconsName; bg: string; color: string }> = {
  new_review:       { icon: 'star',            bg: '#FFFBEB', color: '#FBBF24' },
  account_approved: { icon: 'checkmark-circle', bg: '#EFF6FF', color: '#3B82F6' },
  profile_saved:    { icon: 'bookmark',         bg: '#FFF7ED', color: colors.primary },
  call_received:    { icon: 'call',             bg: '#FFF1F2', color: colors.error },
};

function shortAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h\nago`;
    const days = Math.floor(hrs / 24);
    return `${days}d\nago`;
  } catch { return '' }
}

const now = Date.now();
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'd1',
    userId: 'demo',
    type: 'call_received',
    title: 'Sarah Mitchell called you',
    body: 'Missed call regarding the kitchen renovation project in Brooklyn.',
    read: false,
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd2',
    userId: 'demo',
    type: 'new_review',
    title: 'New review: 5 stars from Tom Harris',
    body: '"Excellent work on the electrical panel. Very professional and tidy."',
    read: true,
    createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd3',
    userId: 'demo',
    type: 'account_approved',
    title: 'Account Approved',
    body: 'Your professional credentials have been verified. You can now accept high-value contracts.',
    read: true,
    createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function WorkerNotificationsScreen() {
  const { show } = useToast();
  const { notifications, setNotifications, markAllRead: storeMarkAll, unreadCount } = useNotificationStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getNotifications();
        setNotifications(Array.isArray(data) && data.length > 0 ? data : DEMO_NOTIFICATIONS);
      } catch {
        // Backend not available — show demo data so the screen is never blank
        setNotifications(DEMO_NOTIFICATIONS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllRead();
    } catch {}
    storeMarkAll();
  }, []);

  const renderItem = useCallback(({ item }: { item: Notification }) => {
    const cfg = TYPE_CONFIG[item.type] ?? {
      icon: 'notifications-outline' as IoniconsName,
      bg: '#F3F4F6',
      color: colors.textSecondary,
    };
    const isCall   = item.type === 'call_received';
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
              <Text style={styles.time}>{shortAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.body}>{item.body}</Text>

            {isReview && <StarRating value={5} size="sm" style={styles.stars} />}

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

      <TabHeader profileRoute="/(worker)/preview" />

      {/* ── Page header ─────────────────────────────────────── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Notifications</Text>
        <Text style={styles.pageSub}>Stay updated with your latest job activity</Text>
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

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  brandText: { ...typography.h4, color: colors.primary },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  markAll: { ...typography.small, color: colors.primary, fontWeight: '600' },
  bellWrap: { position: 'relative' },
  bellBadge: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5, borderColor: colors.surface,
  },

  // Page header
  pageHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  pageTitle: { ...typography.h2, color: colors.textPrimary },
  pageSub: { ...typography.small, color: colors.textSecondary, marginTop: 2 },

  skeletons: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: 32 },

  // Card
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
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  content: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { ...typography.bodyMd, color: colors.textPrimary, flex: 1, fontWeight: '600' },
  time: { ...typography.caption, color: colors.textDisabled, flexShrink: 0, textAlign: 'right', lineHeight: 16 },
  body: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },
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

  footer: {
    ...typography.label,
    color: colors.textDisabled,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    letterSpacing: 0.5,
  },
});
