import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../constants/tokens';
import { shadows } from '../../constants/shadows';

type LeftAction = 'back' | 'menu' | 'wordmark' | 'close';
type RightAction = 'avatar' | 'icon' | null;

interface FloatingNavProps {
  title?: string;
  subtitle?: string;
  leftAction?: LeftAction;
  rightAction?: RightAction;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  avatarUrl?: string;
  onLeft?: () => void;
  onRight?: () => void;
  /** Override the entire right side with custom content */
  rightContent?: React.ReactNode;
}

export default function FloatingNav({
  title,
  subtitle,
  leftAction = 'back',
  rightAction = null,
  rightIcon,
  onLeft,
  onRight,
  rightContent,
}: FloatingNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { top: insets.top + 12 }]}>
      {/* Left */}
      <Pressable style={styles.leftBtn} onPress={onLeft} hitSlop={8}>
        {leftAction === 'wordmark' ? (
          <Text style={styles.wordmark}>TradeFind</Text>
        ) : (
          <View style={styles.iconBtn}>
            <Ionicons
              name={
                leftAction === 'back'  ? 'chevron-back' :
                leftAction === 'close' ? 'close' :
                'menu'
              }
              size={22}
              color={T.text1}
            />
          </View>
        )}
      </Pressable>

      {/* Centre */}
      <View style={styles.centre}>
        {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>

      {/* Right */}
      {rightContent ? (
        rightContent
      ) : rightAction === 'icon' && rightIcon ? (
        <Pressable style={styles.iconBtn} onPress={onRight} hitSlop={8}>
          <Ionicons name={rightIcon} size={22} color={T.text1} />
        </Pressable>
      ) : rightAction === 'avatar' ? (
        <Pressable style={styles.avatarRing} onPress={onRight} hitSlop={8}>
          <View style={styles.avatarInner} />
        </Pressable>
      ) : (
        <View style={styles.rightSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.nav,
    height: 56,
    paddingHorizontal: 8,
    ...shadows.md,
  },
  leftBtn: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: T.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
    color: T.orange,
    letterSpacing: -0.3,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: T.text1,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: T.text2,
    marginTop: 1,
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: T.orange,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.raised,
  },
  avatarInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.text3,
  },
  rightSpacer: { width: 40 },
});
