import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICON: Record<ToastType, IoniconName> = {
  success: 'checkmark-circle',
  error:   'alert-circle',
  info:    'information-circle',
};

const BG: Record<ToastType, string> = {
  success: '#16A34A',
  error:   colors.error,
  info:    '#1D4ED8',
};

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 2800,
  error:   4500,  // errors need longer — user must read them
  info:    3200,
};

function ToastItem({
  message, type, duration, onDone,
}: ToastMessage & { duration: number; onDone: () => void }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const scaleX     = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Haptic on appear
    if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Slide in
    Animated.parallel([
      Animated.spring(opacity,     { toValue: 1, useNativeDriver: true, speed: 20 }),
      Animated.spring(translateY,  { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();

    // Slide out after duration
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -16, duration: 220, useNativeDriver: true }),
      ]).start(onDone);
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        shadows.lg,
        { backgroundColor: BG[type], opacity, transform: [{ translateY }, { scaleX }] },
      ]}
    >
      <Ionicons name={ICON[type]} size={20} color="#fff" style={styles.icon} />
      <Text style={styles.message} numberOfLines={3}>{message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(ToastMessage & { duration: number })[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'success', duration?: number) => {
    const id = ++counter.current;
    const d = duration ?? DEFAULT_DURATION[type];
    setToasts((prev) => [...prev.slice(-2), { id, message, type, duration: d }]); // max 3 toasts
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDone={() => remove(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    gap: spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  icon: { marginRight: spacing.sm, flexShrink: 0 },
  message: {
    ...typography.bodyMd,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
  },
});
