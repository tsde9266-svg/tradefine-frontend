import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNotificationStore } from '../stores/notificationStore';
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
  const receivedRef = useRef<Notifications.EventSubscription | null>(null);
  const responseRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Refresh list when a notification arrives in foreground
    receivedRef.current = Notifications.addNotificationReceivedListener(() => {
      getNotifications().then(setNotifications).catch(() => {});
    });

    // Handle tap on notification (app backgrounded or killed)
    responseRef.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // Future: navigate to relevant screen based on _response.notification.request.content.data
        getNotifications().then(setNotifications).catch(() => {});
      },
    );

    return () => {
      receivedRef.current?.remove();
      responseRef.current?.remove();
    };
  }, []);
}
