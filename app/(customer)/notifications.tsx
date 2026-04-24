import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { getNotifications, markAllRead } from '../../services/notifications';
import { Notification } from '../../types/notification';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_CONFIG: Record<string, { icon: IoniconsName; bg: string; color: string }> = {
  new_review:       { icon: 'star',             bg: '#FFFBEB', color: '#FBBF24' },
  account_approved: { icon: 'checkmark-circle', bg: '#EFF6FF', color: '#3B82F6' },
  profile_saved:    { icon: 'bookmark',         bg: '#FFF7ED', color: colors.primary },
  call_received:    { icon: 'call',             bg: '#FFF1F2', color: colors.error },
  job_request:      { icon: 'send',             bg: '#F0FDF4', color: colors.success },
  job_accepted:     { icon: 'checkmark-circle', bg: '#F0FDF4', color: colors.success },
  job_declined:     { icon: 'close-circle',     bg: '#FEF2F2', color: colors.error },
  job_started:      { icon: 'navigate',         bg: '#EFF6FF', color: colors.primary },
  job_completed:    { icon: 'trophy',           bg: '#FFFBEB', color: '#F59E0B' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CustomerNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    await markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={handleMarkAll}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={72} borderRadius={radius.lg} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textDisabled} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type] ?? { icon: 'notifications-outline', bg: colors.surfaceElevated, color: colors.textSecondary };
            return (
              <View style={[styles.row, !item.read && styles.rowUnread]}>
                <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowBody2} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.rowTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight, ...shadows.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h4, color: colors.textPrimary, fontWeight: '700' },
  markAll: { ...typography.small, color: colors.primary, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.sm },
  skeletons: { padding: spacing.lg, gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.md, marginTop: 80 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadows.sm },
  rowUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' },
  rowBody2: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },
  rowTime: { ...typography.caption, color: colors.textDisabled, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4, flexShrink: 0 },
});
