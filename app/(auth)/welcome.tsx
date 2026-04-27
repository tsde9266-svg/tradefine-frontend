import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';

const BG_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD9gF6n0x_AJV6XkfLduKtLaNCQRqFQfB8Qg0qlvXk4Gpsd6-USXtkOvnIEv-X-Jp7F7tY0ssOegEZKl0hRV0uMZ3l1vREepkFdtNxK5MC02ny7Ux533cz_-1yec58VrFxhGki6dOJHEtWgNlftwWZGrLJmQPL0MSjR8qjiZsMgQbXFJmo_EjJ8CXm_3PauaIyxNvbpz2IAHjWT3AMcEQ1ThJ1EncWaSj4FQE7g1zWsBD7J79_Id5CK_8JEjijVJt8DIo0twQ8Opdo';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      {/* Exact Stitch background image */}
      <ImageBackground
        source={{ uri: BG_URI }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Top dark fade */}
      <LinearGradient
        colors={['rgba(21,28,39,0.50)', 'transparent']}
        style={styles.gradTop}
      />

      {/* Bottom vignette */}
      <LinearGradient
        colors={['transparent', 'rgba(21,28,39,0.82)', 'rgba(21,28,39,0.97)']}
        locations={[0, 0.45, 1]}
        style={styles.gradBottom}
      />

      {/* TradeFind — top left */}
      <View style={[styles.brandWrap, { top: insets.top + 12 }]}>
        <Text style={styles.brand}>TradeFind</Text>
      </View>

      {/* Glass card — pinned to bottom */}
      <View style={[styles.cardWrap, { paddingBottom: insets.bottom + 20 }]}>
        <BlurView intensity={18} tint="dark" style={styles.card}>
          {/* Headline + subtitle */}
          <View style={styles.textBlock}>
            <Text style={styles.headline}>Find a trusted tradesperson, instantly.</Text>
            <Text style={styles.subtitle}>50,000+ verified professionals across the UK</Text>
          </View>

          {/* Buttons */}
          <View style={styles.btns}>
            <Pressable
              style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.88 }]}
              onPress={() => router.push('/(auth)/register?role=customer')}
            >
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>I need a tradesperson</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/(auth)/register?role=worker')}
            >
              <Text style={styles.btnOutlineText}>I'm a tradesperson</Text>
            </Pressable>
          </View>

          {/* Sign in — orange underline via border-bottom View */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.signInText}>Sign in</Text>
              <View style={styles.signInUnderline} />
            </Pressable>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1520' },

  gradTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '45%',
  },
  gradBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '65%',
  },

  brandWrap: {
    position: 'absolute',
    left: 20,
  },
  brand: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    color: '#ffffff',
    letterSpacing: -0.5,
  },

  cardWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },

  // BlurView acts as the glass card
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 24,
    gap: 20,
  },

  textBlock: { gap: 6 },
  headline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#ffffff',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
  },

  btns: { gap: 12 },

  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 56,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },

  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    height: 56,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  btnOutlineText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
  },
  signInText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#ffffff',
  },
  // Orange underline — 2px, offset 3px below text, matching Stitch's decoration-2
  signInUnderline: {
    height: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
    borderRadius: 1,
  },
});
