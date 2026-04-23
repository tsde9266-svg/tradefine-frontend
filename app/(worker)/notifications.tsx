import React, { useCallback, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { getNotifications, markAllRead } from '../../services/notifications';
import { useNotificationStore } from '../../stores/notificationStore';
import { Notification } from '../../types/notification';
import { formatDate } from '../../utils/formatters';

const TYPE_ICON: Record<Notification['type'], string> = {
  new_review:       '⭐',
  account_approved: '✅',
  profile_saved:    '🔖',
  call_received:    '📞',
};

const TYPE_COLOR: Record<Notification['type'], string> = {
  new_review:       '#FBBF24',
  account_approved: '#16A34A',
  profile_saved:    '#F97316',
  call_received:    '#F97316',
};

export default function WorkerNotificationsScreen() {
  const { show } = useToast();
  const { notifications, setNotifications, markAllRead: storeMarkAll, unreadCount } =
    useNotificationStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch {
        show('Could not load notifications', 'error');
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
    const iconColor = TYPE_COLOR[item.type];
    return (
      <View style={[styles.row, !item.read && styles.rowUnread]}>
        <View style={[styles.unreadBar, { backgroundColor: item.read ? 'transparent' : colors.primary }]} />
        <View style={[styles.iconCircle, { backgroundColor: iconColor + '22' }]}>
          <Text style={styles.icon}>{TYPE_ICON[item.type]}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAll} hitSlop={8}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} width="100%" height={72} borderRadius={12} style={styles.skeleton} />
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          removeClippedSubviews
          ListEmptyComponent={
            <EmptyState
              title="No notifications yet"
              subtitle="You will be notified of reviews, saves and calls"
            />
          }
          contentContainerStyle={styles.list}
        />
      )}
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  markAllText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingBottom: spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  rowUnread: {
    backgroundColor: colors.surface,
  },
  unreadBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  body: {
    ...typography.small,
    color: colors.textSecondary,
  },
  time: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: 2,
  },
  skeletons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  skeleton: { marginBottom: spacing.xs },
});
