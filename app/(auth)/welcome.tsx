import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';

const ILLUSTRATION = require('../../assets/illustrations/onboarding_illustration_for_a_construction_app_a_friendly_tradesperson_holding.png');
const APP_ICON     = require('../../assets/icons/app_icon_app_icon_for_tradefi.png');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top 55% — illustration */}
      <View style={styles.illustrationContainer}>
        <Image source={ILLUSTRATION} style={styles.illustration} resizeMode="contain" />
      </View>

      {/* Bottom 45% — branding + CTAs */}
      <View style={styles.bottom}>
        {/* Logo row */}
        <View style={styles.logoRow}>
          <Image source={APP_ICON} style={styles.logoIcon} resizeMode="contain" />
          <Text style={styles.logoText}>TradeFind</Text>
        </View>

        <Text style={styles.tagline}>
          Find trusted tradespeople near you — instantly
        </Text>

        <View style={styles.buttons}>
          <Button
            variant="primary"
            label="I need a tradesperson"
            fullWidth
            onPress={() => router.push('/(auth)/register?role=customer')}
          />

          <View style={styles.gap} />

          <Button
            variant="outline"
            label="I'm a tradesperson"
            fullWidth
            onPress={() => router.push('/(auth)/register?role=worker')}
          />

          <View style={styles.gap} />

          <Button
            variant="ghost"
            label="Already have an account? Log In"
            fullWidth
            onPress={() => router.push('/(auth)/register?tab=login')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  illustrationContainer: {
    flex: 55,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  bottom: {
    flex: 45,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    justifyContent: 'flex-end',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoIcon: {
    width: 36,
    height: 36,
    marginRight: spacing.sm,
  },
  logoText: {
    ...typography.h2,
    color: colors.primary,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  buttons: {
    width: '100%',
  },
  gap: {
    height: spacing.md,
  },
});
