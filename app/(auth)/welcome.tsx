import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';

const BG = require('../../assets/illustrations/onboarding_illustration_for_a_construction_app_a_friendly_tradesperson_holding.png');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground source={BG} style={styles.screen} resizeMode="cover">
      {/* Dark gradient overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Logo block — top center */}
        <View style={styles.logoSection}>
          <View style={styles.logoTile}>
            <Text style={styles.logoTileText}>TradeFind</Text>
          </View>
          <Text style={styles.brandName}>TradeFind</Text>
        </View>

        {/* Hero text — center */}
        <View style={styles.heroSection}>
          <Text style={styles.headline}>
            Find trusted{'\n'}tradespeople near you{'\n'}— instantly
          </Text>
          <Text style={styles.sub}>
            Your direct link to local professionals{'\n'}for every job, big or small.
          </Text>
        </View>

        {/* CTAs — bottom */}
        <View style={styles.ctaSection}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.88 }]}
            onPress={() => router.push('/(auth)/register?role=customer')}
          >
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>I need a tradesperson</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.88 }]}
            onPress={() => router.push('/(auth)/register?role=worker')}
          >
            <Ionicons name="people-outline" size={18} color="#fff" />
            <Text style={styles.btnOutlineText}>I'm a tradesperson</Text>
          </Pressable>

          <Text style={styles.footer}>Join 50k+ professionals and homeowners today</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Stronger at bottom so text/buttons are readable
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  safe: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },

  /* Logo */
  logoSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoTile: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: 'rgba(20,20,30,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  logoTileText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  brandName: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
  },

  /* Hero */
  heroSection: {
    gap: spacing.md,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  sub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
  },

  /* CTAs */
  ctaSection: {
    gap: spacing.md,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    gap: spacing.sm,
  },
  btnPrimaryText: {
    ...typography.bodyMd,
    color: '#fff',
    fontWeight: '700',
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: 14,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnOutlineText: {
    ...typography.bodyMd,
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
