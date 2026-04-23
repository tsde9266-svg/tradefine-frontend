import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  label: string;
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
  primary:  { backgroundColor: colors.primary },
  outline:  { backgroundColor: 'transparent' as const, borderWidth: 2, borderColor: colors.primary },
  ghost:    { backgroundColor: 'transparent' as const },
  danger:   { backgroundColor: colors.error },
};

const pressedStyles = {
  primary:  { backgroundColor: colors.primaryDark },
  outline:  { backgroundColor: colors.primaryLight },
  ghost:    { backgroundColor: colors.primaryLight },
  danger:   { backgroundColor: '#B91C1C' },
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
  onPress,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        containerStyles[variant],
        { paddingVertical: paddingV[size] },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && pressedStyles[variant],
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.primary}
        />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.label, { color: labelColors[variant] }]}>{label}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  label: {
    ...typography.bodyMd,
  },
});
