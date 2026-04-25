import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';
import { getNotifications } from '../services/notifications';
import api from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TradeFind',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await api.patch('/api/auth/push-token', { token }).catch(() => {});
    return token;
  } catch {
    return null;
  }
}

export function useNotifications() {
  const { setNotifications } = useNotificationStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const receivedRef = useRef<Notifications.EventSubscription | null>(null);
  const responseRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Refresh list when notification arrives in foreground
    receivedRef.current = Notifications.addNotificationReceivedListener(() => {
      getNotifications().then(setNotifications).catch(() => {});
    });

    // Navigate to the relevant screen when user taps a notification
    responseRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      getNotifications().then(setNotifications).catch(() => {});

      const data = (response.notification.request.content.data ?? {}) as Record<string, string>;
      const screen = data.screen;
      const role = user?.role;

      // Customer-targeted notifications
      if (role === 'customer') {
        if (screen === 'job_status' && data.jobId) {
          router.push(`/(customer)/worker/waiting?jobId=${data.jobId}`);
        } else if (screen === 'tracking' && data.workerId) {
          router.push(`/(customer)/worker/tracking?workerId=${data.workerId}`);
        } else if (screen === 'review' && data.workerId) {
          router.push(`/(customer)/worker/review?workerId=${data.workerId}`);
        } else {
          router.push('/(customer)/notifications');
        }
      }

      // Worker-targeted notifications
      if (role === 'worker') {
        if (screen === 'job_request') {
          // Dashboard shows incoming requests at top
          router.push('/(worker)');
        } else if (screen === 'new_review') {
          router.push('/(worker)/reviews');
        } else if (screen === 'account_approved') {
          router.push('/(worker)');
        } else {
          router.push('/(worker)/notifications');
        }
      }
    });

    return () => {
      receivedRef.current?.remove();
      responseRef.current?.remove();
    };
  }, [user?.role]);
}
