import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
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
  icon: string;
  description: string;
  timeAgo: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', icon: '👁', description: 'Sarah viewed your profile', timeAgo: '2h ago' },
  { id: '2', icon: '⭐', description: 'Tom left you a 5-star review', timeAgo: '1d ago' },
  { id: '3', icon: '🔖', description: 'Your profile was saved by 3 people', timeAgo: '2d ago' },
];

export default function WorkerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { profile, setProfile } = useWorkerProfileStore();
  const [stats, setStats] = useState({ views: 0, calls: 0, reviews: 0 });

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  // Load worker profile + connect socket on mount
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        const workerProfile = await getWorkerById(user.id);
        setProfile(workerProfile);
        // Connect WebSocket with both auth token and worker profile ID
        if (accessToken) connectSocket(accessToken, workerProfile.id);
      } catch {
        if (accessToken) connectSocket(accessToken);
      }
    })();
  }, [user?.id, accessToken]);

  const handleShareProfile = useCallback(async () => {
    if (!profile) return;
    try {
      await Share.share({
        message: `Check out my profile on TradeFind: https://tradefind.app/w/${profile.id}`,
        ...(Platform.OS === 'ios' && { url: `https://tradefind.app/w/${profile.id}` }),
      });
    } catch {}
  }, [profile]);

  const renderActivity = useCallback(
    ({ item }: { item: ActivityItem }) => (
      <View style={styles.activityRow}>
        <Text style={styles.activityIcon}>{item.icon}</Text>
        <View style={styles.activityText}>
          <Text style={styles.activityDesc}>{item.description}</Text>
          <Text style={styles.activityTime}>{item.timeAgo}</Text>
        </View>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName} 👋
          </Text>
        </View>

        {/* Availability toggle */}
        <View style={styles.section}>
          <AvailabilityToggle />
        </View>

        {/* Today's stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.statsRow}>
            {[
              { label: 'Profile Views', value: stats.views },
              { label: 'Calls Received', value: stats.calls },
              { label: 'New Reviews', value: stats.reviews },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <FlatList
              data={MOCK_ACTIVITY}
              keyExtractor={(item) => item.id}
              renderItem={renderActivity}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push('/(worker)/edit-profile')}
            >
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionLabel}>Edit Profile</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push('/(worker)/reviews')}
            >
              <Text style={styles.actionIcon}>⭐</Text>
              <Text style={styles.actionLabel}>View Reviews</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={handleShareProfile}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionLabel}>Share Profile</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  greeting: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  activityIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityDesc: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.xxxl + spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
