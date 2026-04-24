import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import KeyboardView from '../../components/layout/KeyboardView';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { registerSchema, loginSchema } from '../../utils/validators';
import { register as apiRegister, login as apiLogin } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

type Tab = 'signup' | 'login';

function extractZodErrors(issues: { path: (string | number)[]; message: string }[]) {
  const errs: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !errs[key]) errs[key] = issue.message;
  }
  return errs;
}

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ role?: string; tab?: string }>();
  const initialTab: Tab = params.tab === 'login' ? 'login' : 'signup';
  const role = (params.role ?? 'customer') as 'customer' | 'worker';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [showPassword, setShowPassword] = useState(false);

  // --- Login state ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginLoading, setLoginLoading] = useState(false);

  // --- Signup state ---
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [signupLoading, setSignupLoading] = useState(false);

  const router = useRouter();
  const { show } = useToast();
  const setAuth = useAuthStore(s => s.setAuth);

  const onSignUp = async () => {
    const result = registerSchema.safeParse({
      name: signupName,
      email: signupEmail,
      phone: signupPhone,
      password: signupPassword,
      agreedToTerms: agreedToTerms as true,
    });
    if (!result.success) {
      setSignupErrors(extractZodErrors(result.error.issues));
      return;
    }
    setSignupErrors({});
    setSignupLoading(true);
    try {
      const payload = await apiRegister({ name: signupName, email: signupEmail, phone: signupPhone, password: signupPassword, role });
      await setAuth(payload.user, payload.accessToken, payload.refreshToken);
      router.replace('/(auth)/location-permission');
    } catch (err: any) {
      show(err?.response?.data?.error ?? 'Registration failed. Please try again.', 'error');
    } finally {
      setSignupLoading(false);
    }
  };

  const onLogin = async () => {
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      setLoginErrors(extractZodErrors(result.error.issues));
      return;
    }
    setLoginErrors({});
    setLoginLoading(true);
    try {
      const payload = await apiLogin({ email: loginEmail, password: loginPassword });
      await setAuth(payload.user, payload.accessToken, payload.refreshToken);
      router.replace(payload.user.role === 'worker' ? '/(worker)' : '/(customer)');
    } catch (err: any) {
      show(err?.response?.data?.error ?? 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

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
              <Text style={styles.heading}>Join our network</Text>
              <Text style={styles.subheading}>Start finding trusted tradespeople in your area</Text>

              <Input
                label="Full Name"
                placeholder="Jane Smith"
                value={signupName}
                onChangeText={setSignupName}
                error={signupErrors.name}
                autoCapitalize="words"
              />
              <Input
                label="Email"
                placeholder="jane@example.com"
                value={signupEmail}
                onChangeText={setSignupEmail}
                error={signupErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Phone"
                placeholder="07700 900000"
                value={signupPhone}
                onChangeText={setSignupPhone}
                error={signupErrors.phone}
                keyboardType="phone-pad"
              />
              <Input
                label="Password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={signupPassword}
                onChangeText={setSignupPassword}
                error={signupErrors.password}
                secureTextEntry={!showPassword}
                iconRight={
                  <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
                }
                onIconRightPress={() => setShowPassword(p => !p)}
              />

              {/* Terms checkbox */}
              <Pressable
                style={styles.termsRow}
                onPress={() => setAgreedToTerms(p => !p)}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
                </Text>
              </Pressable>
              {signupErrors.agreedToTerms && (
                <Text style={styles.fieldError}>{signupErrors.agreedToTerms}</Text>
              )}

              <View style={styles.buttonGap} />
              <Button
                label="Create Account"
                variant="primary"
                fullWidth
                loading={signupLoading}
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
              <Text style={styles.subheading}>Sign in to continue to TradeFind</Text>

              <Input
                label="Email"
                placeholder="jane@example.com"
                value={loginEmail}
                onChangeText={setLoginEmail}
                error={loginErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Password"
                placeholder="Your password"
                value={loginPassword}
                onChangeText={setLoginPassword}
                error={loginErrors.password}
                secureTextEntry={!showPassword}
                iconRight={
                  <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
                }
                onIconRightPress={() => setShowPassword(p => !p)}
              />

              <Pressable style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>

              <View style={styles.buttonGap} />
              <Button
                label="Log In"
                variant="primary"
                fullWidth
                loading={loginLoading}
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
    marginBottom: spacing.xs,
  },
  subheading: {
    ...typography.small,
    color: colors.textSecondary,
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
