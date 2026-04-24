import React from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../stores/authStore';
import { TabHeader } from '../../components/layout/AppHeader';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';

type MenuItem = { label: string; icon: keyof typeof Ionicons.glyphMap; onPress?: () => void; danger?: boolean; right?: React.ReactNode };

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Location sharing',
      icon: 'location-outline',
      right: <Switch value={true} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />,
    },
    { label: 'Edit Profile',   icon: 'person-outline',        onPress: () => router.push('/(customer)/edit-profile') },
    { label: 'My Reviews',     icon: 'star-outline',          onPress: () => router.push('/(customer)/my-reviews') },
    { label: 'Notifications',  icon: 'notifications-outline', onPress: () => router.push('/(customer)/notifications') },
    { label: 'Help & Support', icon: 'help-circle-outline',   onPress: () => Linking.openURL('mailto:support@tradefind.app') },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TabHeader />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* (header moved above ScrollView) */}

        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {user?.avatarUrl
              ? <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
              : <View style={[styles.avatarImg, styles.avatarFallback]}>
                  <Ionicons name="person" size={40} color={colors.textInverse} />
                </View>
            }
            <Pressable style={styles.editAvatarBtn}>
              <Ionicons name="pencil" size={12} color={colors.textInverse} />
            </Pressable>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { value: '12', label: 'Jobs Done' },
            { value: '8',  label: 'Reviews' },
            { value: '5',  label: 'Saved' },
          ].map((s, i, arr) => (
            <View key={s.label} style={[styles.statBox, i < arr.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionLabel}>Account Settings</Text>
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed, i > 0 && styles.menuBorder]}
              onPress={item.onPress}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.right ?? <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />}
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [styles.menuRow, styles.menuBorder, pressed && styles.menuRowPressed]}
            onPress={handleLogout}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.error }]}>Log Out</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>TradeFind v2.4.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },


  avatarSection: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 4 },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  name: { ...typography.h2, color: colors.textPrimary },
  email: { ...typography.small, color: colors.textSecondary },
  phone: { ...typography.small, color: colors.textSecondary },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.borderLight },
  statValue: { ...typography.h3, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  sectionLabel: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  menu: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    gap: spacing.md,
  },
  menuBorder: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  menuRowPressed: { backgroundColor: colors.surfaceElevated },
  menuIconWrap: { width: 28, alignItems: 'center' },
  menuLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  version: { ...typography.caption, color: colors.textDisabled, textAlign: 'center', marginTop: spacing.xxl },
});
