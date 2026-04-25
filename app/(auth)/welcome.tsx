import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';

const BG = require('../../assets/illustrations/splash_bg.png');
const APP_ICON = require('../../assets/icons/app_icon_app_icon_for_tradefi.png');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/* Full-screen background photo */}
      <ImageBackground
        source={BG}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        imageStyle={{ objectFit: 'cover' }}
      />

      {/* White gradient — transparent at top, solid white at ~55% so text is readable */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,1)', '#ffffff']}
        locations={[0, 0.35, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top spacer — keeps content in lower portion of screen */}
        <View style={{ flex: 1 }} />

        {/* ── Content ── */}
        <View style={styles.content}>
          {/* App icon */}
          <View style={styles.iconWrap}>
            <Image source={APP_ICON} style={styles.iconImg} resizeMode="contain" />
          </View>

          {/* Brand */}
          <Text style={styles.brand}>TradeFind</Text>

          {/* Headline */}
          <Text style={styles.headline}>
            Find trusted{'\n'}tradespeople near you{'\n'}— instantly
          </Text>

          {/* Subtitle */}
          <Text style={styles.sub}>
            Your direct link to local professionals{'\n'}for every job, big or small.
          </Text>

          {/* CTA buttons */}
          <View style={styles.btns}>
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
              <Ionicons name="people-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.btnOutlineText}>I'm a tradesperson</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Join 50k+ professionals and homeowners today</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  safe: { flex: 1 },

  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    alignItems: 'center',
  },

  /* App icon */
  iconWrap: {
    width: 72, height: 72,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  iconImg: { width: 72, height: 72 },

  /* Brand */
  brand: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  /* Headline — dark text, large */
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },

  /* Subtitle */
  sub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* Buttons */
  btns: { width: '100%', gap: spacing.sm, marginTop: spacing.sm },

  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 16,
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
    gap: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: radius.full,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  btnOutlineText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  footer: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
