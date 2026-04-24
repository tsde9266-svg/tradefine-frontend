import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { useAuthStore } from '../../stores/authStore';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(false);

  const navigateHome = () => {
    router.replace(user?.role === 'worker' ? '/(worker)' : '/(customer)');
  };

  const handleAllow = async () => {
    setLoading(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } finally {
      setLoading(false);
      navigateHome();
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.ripple3} />
          <View style={styles.ripple2} />
          <View style={styles.ripple1} />
          <View style={styles.pinCircle}>
            <Ionicons name="location" size={40} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Allow location access</Text>
        <Text style={styles.body}>
          We use your location to show you available tradespeople nearby. Your
          location is only shared with your consent.
        </Text>

        {/* Primary button */}
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.88 }]}
          onPress={handleAllow}
          disabled={loading}
        >
          <Ionicons name="location" size={18} color={colors.textInverse} />
          <Text style={styles.btnPrimaryText}>
            {loading ? 'Requesting…' : 'Allow Location'}
          </Text>
        </Pressable>

        {/* Ghost button */}
        <Pressable
          style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.7 }]}
          onPress={navigateHome}
        >
          <Text style={styles.btnGhostText}>Set Manually</Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Ionicons name="lock-closed" size={13} color={colors.textDisabled} />
          <Text style={styles.footerText}>Encrypted and private</Text>
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  illustrationWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  ripple3: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 90,
    backgroundColor: '#FED7AA',
    opacity: 0.35,
  },
  ripple2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FDBA74',
    opacity: 0.45,
  },
  ripple1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FB923C',
    opacity: 0.25,
  },
  pinCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btnPrimaryText: {
    ...typography.bodyMd,
    color: colors.textInverse,
    fontWeight: '700',
  },
  btnGhost: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 14,
    width: '100%',
  },
  btnGhostText: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
  },
  footerText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
});
