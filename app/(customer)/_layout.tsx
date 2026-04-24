import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useNotificationStore } from '../../stores/notificationStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, badge }: { name: IoniconsName; focused: boolean; badge?: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconsName)}
      size={24}
      color={focused ? colors.primary : colors.textSecondary}
    />
  );
}

export default function CustomerLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: spacing.xs,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ focused }) => <TabIcon name="bookmark" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
      <Tabs.Screen name="worker/[id]"      options={{ href: null }} />
      <Tabs.Screen name="worker/tracking" options={{ href: null }} />
      <Tabs.Screen name="worker/review"   options={{ href: null }} />
      <Tabs.Screen name="worker/request"  options={{ href: null }} />
      <Tabs.Screen name="worker/waiting"  options={{ href: null }} />
      <Tabs.Screen name="search"          options={{ href: null }} />
      <Tabs.Screen name="notifications"   options={{ href: null }} />
      <Tabs.Screen name="edit-profile"    options={{ href: null }} />
      <Tabs.Screen name="my-reviews"      options={{ href: null }} />
    </Tabs>
  );
}
