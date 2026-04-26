import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  label: string;
  loadingLabel?: string;    // e.g. "Saving…" shown during loading
  onPress: () => void;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: Size;
}

const paddingV: Record<Size, number> = { sm: 10, md: 14, lg: 18 };

const containerStyles = {
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent' as const, borderWidth: 2, borderColor: colors.primary },
  ghost:   { backgroundColor: 'transparent' as const },
  danger:  { backgroundColor: colors.error },
};

const pressedBg = {
  primary: colors.primaryDark,
  outline: colors.primaryLight,
  ghost:   colors.primaryLight,
  danger:  '#B91C1C',
};

const labelColors: Record<Variant, string> = {
  primary: colors.textInverse,
  outline: colors.primary,
  ghost:   colors.primary,
  danger:  colors.textInverse,
};

export default function Button({
  variant = 'primary',
  label,
  loadingLabel,
  onPress,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          containerStyles[variant],
          { paddingVertical: paddingV[size] },
          isDisabled && styles.disabled,
          pressed && !isDisabled && { backgroundColor: pressedBg[variant] },
        ]}
      >
        {loading ? (
          <View style={styles.row}>
            <ActivityIndicator
              size="small"
              color={variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.primary}
              style={{ marginRight: loadingLabel ? 8 : 0 }}
            />
            {loadingLabel && (
              <Text style={[styles.label, { color: labelColors[variant] }]}>{loadingLabel}</Text>
            )}
          </View>
        ) : (
          <View style={styles.row}>
            {icon && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[styles.label, { color: labelColors[variant] }]}>{label}</Text>
            {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  label: { ...typography.bodyMd },
});
