/**
 * AppHeader — single source of truth for all top bars in the app.
 *
 * Two variants:
 *  <TabHeader />          — used on every main tab screen (Map, Saved, Profile, Home)
 *  <StackHeader title />  — used on every push/modal screen
 *
 * Both produce exactly 56 px tall bars (10 px vertical padding + 36 px icon row).
 * No per-screen overrides needed.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';

// ─── Shared bar shell ────────────────────────────────────────────────────────

const BAR_V = 10; // 10 + 36 + 10 = 56px on every screen

function BarShell({ children }: { children: React.ReactNode }) {
  return <View style={s.bar}>{children}</View>;
}

function IconSlot({
  onPress,
  bg = 'elevated',
  children,
}: {
  onPress?: () => void;
  bg?: 'elevated' | 'primary';
  children: React.ReactNode;
}) {
  const backgroundColor = bg === 'primary' ? colors.primaryLight : colors.surfaceElevated;
  if (onPress) {
    return (
      <Pressable style={[s.slot, { backgroundColor }]} onPress={onPress} hitSlop={6}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.slot, { backgroundColor }]}>{children}</View>;
}

// ─── Tab header ──────────────────────────────────────────────────────────────

interface TabHeaderProps {
  /** Override the avatar press destination (defaults to /(customer)/profile) */
  profileRoute?: string;
}

export function TabHeader({ profileRoute = '/(customer)/profile' }: TabHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <BarShell>
      <IconSlot>
        <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
      </IconSlot>

      <Text style={s.brand}>TradeFind</Text>

      <IconSlot bg="primary" onPress={() => router.push(profileRoute as any)}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={s.avatarImg} />
        ) : (
          <Ionicons name="person-outline" size={18} color={colors.primary} />
        )}
      </IconSlot>
    </BarShell>
  );
}

// ─── Stack header (back-button screens) ─────────────────────────────────────

interface StackHeaderProps {
  title: string;
  /** Optional right-side node. Pass null to hide. */
  right?: React.ReactNode;
  /** Override default router.back() */
  onBack?: () => void;
}

export function StackHeader({ title, right, onBack }: StackHeaderProps) {
  const router = useRouter();

  return (
    <BarShell>
      <IconSlot onPress={onBack ?? (() => router.back())}>
        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
      </IconSlot>

      <Text style={s.stackTitle} numberOfLines={1}>{title}</Text>

      {/* Right slot — keep same width as left so title stays centred */}
      {right !== undefined ? (
        <View style={s.slot}>{right}</View>
      ) : (
        <View style={s.slot} />
      )}
    </BarShell>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: BAR_V,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },

  // 36×36 touch target used for every icon on both sides
  slot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarImg: { width: 36, height: 36 },

  brand: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  stackTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
});
