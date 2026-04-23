import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { getTokens } from '../utils/storage';
import api from '../services/api';
import { ToastProvider } from '../components/ui/Toast';
import ErrorBoundary from '../components/ErrorBoundary';
import { useNotifications } from '../hooks/useNotifications';

function AuthGuard() {
  const { isAuthenticated, isLoading, setAuth, setLoading, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Register push notifications once authenticated
  useNotifications();

  // On app start: try to restore session via stored tokens
  useEffect(() => {
    (async () => {
      try {
        const { accessToken, refreshToken } = await getTokens();
        if (accessToken && refreshToken) {
          const { data } = await api.get('/api/auth/me');
          await setAuth(data.data, accessToken, refreshToken);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    })();
  }, []);

  // Route guard: redirect based on auth state + role
  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (isAuthenticated && inAuth) {
      if (user?.role === 'worker') {
        router.replace('/(worker)');
      } else {
        router.replace('/(customer)');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <AuthGuard />
            <Stack screenOptions={{ headerShown: false }} />
          </ToastProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
