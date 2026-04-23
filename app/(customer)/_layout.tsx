import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useNotificationStore } from '../../stores/notificationStore';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index:   { active: '🏠', inactive: '🏠' },
  map:     { active: '🗺️', inactive: '🗺️' },
  saved:   { active: '🔖', inactive: '🔖' },
  profile: { active: '👤', inactive: '👤' },
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  map: 'Map',
  saved: 'Saved',
  profile: 'Profile',
};

export default function CustomerLayout() {
  const insets = useSafeAreaInsets();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { paddingBottom: insets.bottom + spacing.xs },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: TAB_LABELS.index,
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>
              {TAB_ICONS.index.active}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: TAB_LABELS.map,
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>
              {TAB_ICONS.map.active}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: TAB_LABELS.saved,
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>
              {TAB_ICONS.saved.active}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: TAB_LABELS.profile,
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>
              {TAB_ICONS.profile.active}
            </Text>
          ),
        }}
      />
      {/* Hide nested worker screens from tab bar */}
      <Tabs.Screen name="worker/[id]"     options={{ href: null }} />
      <Tabs.Screen name="worker/tracking" options={{ href: null }} />
      <Tabs.Screen name="worker/review"   options={{ href: null }} />
      <Tabs.Screen name="search"          options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingTop: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
});
