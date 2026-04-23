import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

type Size = 'sm' | 'md' | 'lg';

interface StarRatingProps {
  value: number;
  interactive?: boolean;
  size?: Size;
  onChange?: (rating: number) => void;
}

const STAR_SIZE: Record<Size, number> = { sm: 14, md: 20, lg: 28 };

function Star({ filled, half, sizePx, onPress }: {
  filled: boolean;
  half: boolean;
  sizePx: number;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!onPress) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.4, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,   duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const starChar = filled ? '★' : half ? '⭑' : '☆';
  const starColor = filled || half ? colors.star : colors.border;

  return (
    <Pressable onPress={onPress ? handlePress : undefined} hitSlop={4}>
      <Animated.Text
        style={[
          styles.star,
          { fontSize: sizePx, color: starColor, transform: [{ scale }] },
        ]}
      >
        {starChar}
      </Animated.Text>
    </Pressable>
  );
}

export default function StarRating({
  value,
  interactive = false,
  size = 'md',
  onChange,
}: StarRatingProps) {
  const sizePx = STAR_SIZE[size];

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = value >= i;
        const half   = !filled && value >= i - 0.5;
        return (
          <Star
            key={i}
            filled={filled}
            half={half}
            sizePx={sizePx}
            onPress={interactive && onChange ? () => onChange(i) : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
});
