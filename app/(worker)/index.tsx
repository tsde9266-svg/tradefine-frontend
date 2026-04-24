import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import AvailabilityToggle from '../../components/worker/AvailabilityToggle';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { getWorkerById } from '../../services/workers';
import { connectSocket } from '../../services/socket';
import { useAuth } from '../../hooks/useAuth';
import { useWorkerProfileStore } from '../../stores/workerProfileStore';
import { useAuthStore } from '../../stores/authStore';
import { getGreeting } from '../../utils/formatters';

interface ActivityItem {
  id: string;
  type: 'save' | 'review' | 'call';
  title: string;
  subtitle: string;
  timeAgo: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'save',   title: 'Sarah Miller saved your profile', subtitle: '2 hours ago',              timeAgo: '2h ago' },
  { id: '2', type: 'review', title: 'John David left a review',        subtitle: '5 hours ago · "Great work on the plumbing!"', timeAgo: '5h ago' },
  { id: '3', type: 'call',   title: 'Missed Call from 078 9920 331',   subtitle: 'Yesterday at 6:45 PM',     timeAgo: 'Yest.' },
];

export default function WorkerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const accessToken = useAuthStore(s => s.accessToken);
  const { profile, setProfile } = useWorkerProfileStore();
  const [stats, setStats] = useState({ views: 124, calls: 8, reviews: 3 });

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const isLive = profile?.isAvailable ?? false;

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const w = await getWorkerById(user.id);
        setProfile(w);
        if (accessToken) connectSocket(accessToken, w.id);
      } catch {
        if (accessToken) connectSocket(accessToken);
      }
    })();
  }, [user?.id, accessToken]);

  const handleShare = useCallback(async () => {
    if (!profile) return;
    try {
      await Share.share({
        message: `Check out my profile on TradeFind: https://tradefind.app/w/${profile.id}`,
        ...(Platform.OS === 'ios' && { url: `https://tradefind.app/w/${profile.id}` }),
      });
    } catch {}
  }, [profile]);

  const activityIcon = (type: ActivityItem['type']) => {
    if (type === 'save')   return { name: 'bookmark' as const, bg: '#FFF7ED', color: colors.primary };
    if (type === 'review') return { name: 'star' as const, bg: '#FFFBEB', color: '#FBBF24' };
    return { name: 'call' as const, bg: '#FFF1F2', color: colors.error };
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Here is what's happening with your business today.</Text>
          </View>
          <Pressable style={styles.avatarBtn} onPress={() => router.push('/(worker)/preview')}>
            <Ionicons name="person" size={20} color={colors.textInverse} />
          </Pressable>
        </View>

        {/* Live / Offline status card */}
        {isLive ? (
          <View style={styles.liveCard}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.livePulse} />
              <Text style={styles.liveTitle}>You're LIVE</Text>
            </View>
            <Text style={styles.liveSubtitle}>Customers can find and book you in real-time</Text>
            <AvailabilityToggle variant="dark" />
          </View>
        ) : (
          <View style={styles.offlineCard}>
            <View style={styles.offlineIconWrap}>
              <Ionicons name="eye-off-outline" size={28} color={colors.textSecondary} />
            </View>
            <Text style={styles.offlineTitle}>You're currently invisible to customers</Text>
            <Text style={styles.offlineSub}>Go available to start receiving new service inquiries.</Text>
            <AvailabilityToggle />
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.statLabel}>PROFILE VIEWS</Text>
            </View>
            <Text style={styles.statValue}>{stats.views}</Text>
            <Text style={styles.statDelta}>+12% vs yest.</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.statLabel}>CALLS RECEIVED</Text>
            </View>
            <Text style={styles.statValue}>{stats.calls}</Text>
            <Text style={[styles.statDelta, { color: colors.textDisabled }]}>Steady</Text>
          </View>
        </View>

        {/* New reviews highlight */}
        <View style={styles.reviewsHighlight}>
          <Ionicons name="star" size={16} color="#FBBF24" />
          <Text style={styles.reviewsHighlightText}>
            <Text style={styles.reviewsHighlightBold}>NEW REVIEWS  {stats.reviews} </Text>
            {'★★ All 5-star'}
          </Text>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Pressable hitSlop={8}><Text style={styles.viewAll}>View all</Text></Pressable>
          </View>
          <View style={styles.activityCard}>
            {MOCK_ACTIVITY.map((item, i) => {
              const ic = activityIcon(item.type);
              return (
                <View key={item.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <Pressable style={styles.activityRow}>
                    <View style={[styles.activityIconWrap, { backgroundColor: ic.bg }]}>
                      <Ionicons name={ic.name} size={18} color={ic.color} />
                    </View>
                    <View style={styles.activityText}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <Text style={styles.activitySub}>{item.subtitle}</Text>
                    </View>
                    {item.type === 'call' && (
                      <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsRow}>
            {[
              { icon: 'create-outline' as const,  label: 'Edit Profile',   onPress: () => router.push('/(worker)/edit-profile') },
              { icon: 'star-outline' as const,     label: 'View Reviews',   onPress: () => router.push('/(worker)/reviews') },
              { icon: 'share-outline' as const,    label: 'Share Profile',  onPress: handleShare },
            ].map(action => (
              <Pressable key={action.label} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]} onPress={action.onPress}>
                <Ionicons name={action.icon} size={22} color={colors.primary} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 32 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: { ...typography.h2, color: colors.textPrimary },
  subGreeting: { ...typography.small, color: colors.textSecondary, marginTop: 3, maxWidth: 260 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Live card */
  liveCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#16A34A',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  livePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  liveTitle: { ...typography.h3, color: '#fff' },
  liveSubtitle: { ...typography.small, color: 'rgba(255,255,255,0.85)' },

  /* Offline card */
  offlineCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  offlineIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  offlineTitle: { ...typography.h4, color: colors.textPrimary },
  offlineSub: { ...typography.small, color: colors.textSecondary },

  /* Stats */
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statLabel: { ...typography.label, color: colors.textSecondary, fontSize: 10 },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statDelta: { ...typography.caption, color: colors.success },

  /* Reviews highlight */
  reviewsHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  reviewsHighlightText: { ...typography.small, color: colors.textSecondary },
  reviewsHighlightBold: { fontWeight: '700', color: colors.textPrimary },

  /* Sections */
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  viewAll: { ...typography.small, color: colors.primary, fontWeight: '600' },

  /* Activity */
  activityCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadows.sm },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  activityIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityText: { flex: 1 },
  activityTitle: { ...typography.bodyMd, color: colors.textPrimary },
  activitySub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 56 + spacing.md },

  /* Quick actions */
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  actionLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
