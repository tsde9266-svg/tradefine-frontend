import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';

const BG = require('../../assets/illustrations/onboarding_illustration_for_a_construction_app_a_friendly_tradesperson_holding.png');
const LOGO = require('../../assets/icons/app_icon_app_icon_for_tradefi.png');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/* Full-screen background */}
      <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />
      </ImageBackground>

      {/* Bottom card */}
      <SafeAreaView style={styles.safeCard} edges={['bottom']}>
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <Image source={LOGO} style={styles.logoIcon} resizeMode="contain" />
            <Text style={styles.logoText}>TradeFind</Text>
          </View>

          <Text style={styles.headline}>
            Find trusted tradespeople{'\n'}near you — instantly
          </Text>
          <Text style={styles.sub}>
            Your direct link to local professionals for every job, big or small.
          </Text>

          {/* CTAs */}
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
            onPress={() => router.push('/(auth)/register?role=customer')}
          >
            <Ionicons name="search" size={18} color={colors.textInverse} style={styles.btnIcon} />
            <Text style={styles.btnPrimaryText}>I need a tradesperson</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnOutline, pressed && styles.btnOutlinePressed]}
            onPress={() => router.push('/(auth)/register?role=worker')}
          >
            <Ionicons name="person" size={18} color={colors.primary} style={styles.btnIcon} />
            <Text style={styles.btnOutlineText}>I'm a tradesperson</Text>
          </Pressable>

          <Text style={styles.footer}>Join 50k+ professionals and homeowners today</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  safeCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
  },
  logoText: {
    ...typography.h3,
    color: colors.primary,
  },
  headline: {
    ...typography.h1,
    color: colors.textPrimary,
    lineHeight: 36,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    gap: spacing.sm,
  },
  btnPrimaryPressed: {
    backgroundColor: colors.primaryDark,
  },
  btnIcon: {
    marginRight: 2,
  },
  btnPrimaryText: {
    ...typography.bodyMd,
    color: colors.textInverse,
    fontWeight: '700',
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  btnOutlinePressed: {
    backgroundColor: colors.primaryLight,
  },
  btnOutlineText: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
