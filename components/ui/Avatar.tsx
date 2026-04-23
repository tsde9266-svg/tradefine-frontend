import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
  showOnlineDot?: boolean;
  isOnline?: boolean;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export default function Avatar({
  uri,
  name,
  size = 48,
  style,
  showOnlineDot = false,
  isOnline = false,
}: AvatarProps) {
  const dotSize = Math.max(size * 0.28, 10);

  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri ? (
        <ExpoImage
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {showOnlineDot && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: isOnline ? colors.available : colors.unavailable,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceElevated,
  },
  fallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
