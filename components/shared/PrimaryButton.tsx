import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../constants/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function PrimaryButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
}: PrimaryButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={[fullWidth && styles.full, { transform: [{ scale }] }]}>
      <Pressable
        style={[styles.btn, isDisabled && styles.disabled]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={styles.row}>
            {icon && <Ionicons name={icon} size={18} color="#fff" style={styles.icon} />}
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
  btn: {
    height: 56,
    borderRadius: T.pill,
    backgroundColor: T.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    shadowColor: T.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
  label: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: -0.2,
  },
});
