import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import KeyboardView from '../../components/layout/KeyboardView';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '../../utils/validators';
import { register as apiRegister, login as apiLogin } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

type Tab = 'signup' | 'login';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ role?: string; tab?: string }>();
  const initialTab: Tab = params.tab === 'login' ? 'login' : 'signup';
  const role = (params.role ?? 'customer') as 'customer' | 'worker';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { show } = useToast();
  const setAuth = useAuthStore(s => s.setAuth);

  // --- Sign Up form ---
  const signupForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });

  // --- Log In form ---
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSignUp = signupForm.handleSubmit(async ({ agreedToTerms: _, ...values }) => {
    try {
      const payload = await apiRegister({ ...values, role });
      await setAuth(payload.user, payload.accessToken, payload.refreshToken);
      router.replace('/(auth)/location-permission');
    } catch (err: any) {
      show(err?.response?.data?.error ?? 'Registration failed. Please try again.', 'error');
    }
  });

  const onLogin = loginForm.handleSubmit(async (values) => {
    try {
      const payload = await apiLogin(values);
      await setAuth(payload.user, payload.accessToken, payload.refreshToken);
      if (payload.user.role === 'worker') {
        router.replace('/(worker)');
      } else {
        router.replace('/(customer)');
      }
    } catch (err: any) {
      show(err?.response?.data?.error ?? 'Login failed. Check your credentials.', 'error');
    }
  });

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardView>
        <View style={styles.container}>
          {/* Tab toggle */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, activeTab === 'signup' && styles.tabActive]}
              onPress={() => setActiveTab('signup')}
            >
              <Text style={[styles.tabLabel, activeTab === 'signup' && styles.tabLabelActive]}>
                Sign Up
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'login' && styles.tabActive]}
              onPress={() => setActiveTab('login')}
            >
              <Text style={[styles.tabLabel, activeTab === 'login' && styles.tabLabelActive]}>
                Log In
              </Text>
            </Pressable>
          </View>

          {activeTab === 'signup' ? (
            <View>
              <Text style={styles.heading}>Create your account</Text>

              <Controller
                control={signupForm.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Input
                    label="Full Name"
                    placeholder="Jane Smith"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                )}
              />

              <Controller
                control={signupForm.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Input
                    label="Email"
                    placeholder="jane@example.com"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />

              <Controller
                control={signupForm.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <Input
                    label="Phone"
                    placeholder="07700 900000"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                )}
              />

              <Controller
                control={signupForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Input
                    label="Password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    iconRight={
                      <Text style={styles.showHide}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    }
                    onIconRightPress={() => setShowPassword(p => !p)}
                  />
                )}
              />

              {/* Terms checkbox */}
              <Pressable
                style={styles.termsRow}
                onPress={() => {
                  setAgreedToTerms(p => !p);
                  signupForm.setValue('agreedToTerms', !agreedToTerms as true);
                }}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
                </Text>
              </Pressable>
              {signupForm.formState.errors.agreedToTerms && (
                <Text style={styles.fieldError}>
                  {signupForm.formState.errors.agreedToTerms.message}
                </Text>
              )}

              <View style={styles.buttonGap} />
              <Button
                label="Create Account"
                variant="primary"
                fullWidth
                loading={signupForm.formState.isSubmitting}
                onPress={onSignUp}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                label="Continue with Google"
                variant="outline"
                fullWidth
                onPress={() => show('Google sign-in coming soon', 'info')}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.heading}>Welcome back</Text>

              <Controller
                control={loginForm.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Input
                    label="Email"
                    placeholder="jane@example.com"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />

              <Controller
                control={loginForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Input
                    label="Password"
                    placeholder="Your password"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    iconRight={
                      <Text style={styles.showHide}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    }
                    onIconRightPress={() => setShowPassword(p => !p)}
                  />
                )}
              />

              <Pressable style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>

              <View style={styles.buttonGap} />
              <Button
                label="Log In"
                variant="primary"
                fullWidth
                loading={loginForm.formState.isSubmitting}
                onPress={onLogin}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                label="Continue with Google"
                variant="outline"
                fullWidth
                onPress={() => show('Google sign-in coming soon', 'info')}
              />
            </View>
          )}
        </View>
      </KeyboardView>
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
    padding: spacing.xxl,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.xxl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabLabel: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  heading: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  showHide: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  fieldError: {
    ...typography.caption,
    color: colors.error,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  buttonGap: {
    height: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.small,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.xs,
  },
  forgotText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
});
