import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { spacing } from '../../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  shadow?: 'sm' | 'md' | 'lg';
  padding?: boolean;
}

export default function Card({
  children,
  onPress,
  style,
  shadow = 'sm',
  padding = true,
}: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          shadows[shadow],
          padding && styles.padding,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, shadows[shadow], padding && styles.padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  padding: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.92,
  },
});
