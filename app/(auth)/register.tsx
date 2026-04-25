import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import KeyboardView from '../../components/layout/KeyboardView';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '../../constants/config';
import { registerSchema, loginSchema } from '../../utils/validators';
import { register as apiRegister, login as apiLogin, socialAuth } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

// Required by expo-auth-session to complete the OAuth redirect
WebBrowser.maybeCompleteAuthSession();

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
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [signupLoading, setSignupLoading] = useState(false);

  const router = useRouter();
  const { show } = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  // ─── Google OAuth ───────────────────────────────────────────────────────────
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId:     GOOGLE_IOS_CLIENT_ID,
    webClientId:     GOOGLE_WEB_CLIENT_ID,
    scopes:          ['openid', 'email', 'profile'],
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleSocialAuth('google', idToken);
      } else {
        show('Google sign-in failed — no token received', 'error');
        setSocialLoading(null);
      }
    } else if (googleResponse?.type === 'error') {
      show('Google sign-in failed. Please try again.', 'error');
      setSocialLoading(null);
    } else if (googleResponse?.type === 'dismiss') {
      setSocialLoading(null); // user cancelled — no toast
    }
  }, [googleResponse]);

  // ─── Shared social auth handler ─────────────────────────────────────────────
  async function handleSocialAuth(provider: 'google' | 'apple', token: string, name?: string) {
    setSocialLoading(provider);
    try {
      const payload = await socialAuth({ provider, token, role, name });
      await setAuth(payload.user, payload.accessToken, payload.refreshToken);
      // New users → location permission. Returning users → home.
      if (payload.isNewUser) {
        router.replace('/(auth)/location-permission');
      } else {
        router.replace(payload.user.role === 'worker' ? '/(worker)' : '/(customer)');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Sign-in failed. Please try again.';
      show(msg, 'error');
    } finally {
      setSocialLoading(null);
    }
  }

  // ─── Apple sign-in ──────────────────────────────────────────────────────────
  async function handleApple() {
    setSocialLoading('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token');
      // Apple only provides name on the FIRST sign-in — capture it now
      const name = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean).join(' ') || undefined;
      await handleSocialAuth('apple', credential.identityToken, name);
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        show('Apple sign-in failed. Please try again.', 'error');
      }
      setSocialLoading(null);
    }
  }

  // ─── Google button handler ──────────────────────────────────────────────────
  async function handleGoogle() {
    if (!GOOGLE_ANDROID_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID && !GOOGLE_WEB_CLIENT_ID) {
      show('Google sign-in is not configured yet', 'info');
      return;
    }
    setSocialLoading('google');
    await googlePromptAsync();
    // Response handled in useEffect above
  }

  // ─── Email auth ─────────────────────────────────────────────────────────────
  async function onSignUp() {
    const result = registerSchema.safeParse({
      name: signupName, email: signupEmail, phone: signupPhone,
      password: signupPassword, agreedToTerms: agreedToTerms as true,
    });
    if (!result.success) { setSignupErrors(extractZodErrors(result.error.issues)); return; }
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
  }

  async function onLogin() {
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) { setLoginErrors(extractZodErrors(result.error.issues)); return; }
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
  }

  const isSocialLoading = socialLoading !== null;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardView>
        <View style={styles.container}>
          {/* Tab toggle */}
          <View style={styles.tabRow}>
            {(['signup', 'login'] as Tab[]).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                  {tab === 'signup' ? 'Sign Up' : 'Log In'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── Social sign-in buttons (same for both tabs) ─── */}
          <View style={styles.socialSection}>
            {/* Google */}
            <Pressable
              style={[styles.socialBtn, isSocialLoading && styles.socialBtnDisabled]}
              onPress={handleGoogle}
              disabled={isSocialLoading}
            >
              {socialLoading === 'google' ? (
                <Text style={styles.socialBtnText}>Signing in…</Text>
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <Text style={styles.socialBtnText}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            {/* Apple — iOS only */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={radius.lg}
                style={styles.appleBtn}
                onPress={handleApple}
              />
            )}
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Email / password form ─── */}
          {activeTab === 'signup' ? (
            <View>
              <Input label="Full Name" placeholder="Jane Smith" value={signupName}
                onChangeText={setSignupName} error={signupErrors.name} autoCapitalize="words" />
              <Input label="Email" placeholder="jane@example.com" value={signupEmail}
                onChangeText={setSignupEmail} error={signupErrors.email}
                keyboardType="email-address" autoCapitalize="none" />
              <Input label="Phone" placeholder="07700 900000" value={signupPhone}
                onChangeText={setSignupPhone} error={signupErrors.phone} keyboardType="phone-pad" />
              <Input label="Password" placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={signupPassword} onChangeText={setSignupPassword}
                error={signupErrors.password} secureTextEntry={!showPassword}
                iconRight={<Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>}
                onIconRightPress={() => setShowPassword((p) => !p)} />

              <Pressable style={styles.termsRow} onPress={() => setAgreedToTerms((p) => !p)}>
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
                </Text>
              </Pressable>
              {signupErrors.agreedToTerms && (
                <Text style={styles.fieldError}>{signupErrors.agreedToTerms}</Text>
              )}

              <View style={styles.buttonGap} />
              <Button label="Create Account" variant="primary" fullWidth
                loading={signupLoading} onPress={onSignUp} />
            </View>
          ) : (
            <View>
              <Input label="Email" placeholder="jane@example.com" value={loginEmail}
                onChangeText={setLoginEmail} error={loginErrors.email}
                keyboardType="email-address" autoCapitalize="none" />
              <Input label="Password" placeholder="Your password" value={loginPassword}
                onChangeText={setLoginPassword} error={loginErrors.password}
                secureTextEntry={!showPassword}
                iconRight={<Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>}
                onIconRightPress={() => setShowPassword((p) => !p)} />

              <Pressable style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>

              <View style={styles.buttonGap} />
              <Button label="Log In" variant="primary" fullWidth
                loading={loginLoading} onPress={onLogin} />
            </View>
          )}
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.xxl },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface, ...shadows.sm },
  tabLabel: { ...typography.bodyMd, color: colors.textSecondary },
  tabLabelActive: { color: colors.textPrimary, fontWeight: '600' },

  // Social buttons
  socialSection: { gap: spacing.sm, marginBottom: spacing.lg },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  socialBtnDisabled: { opacity: 0.6 },
  socialBtnText: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' },
  appleBtn: { width: '100%', height: 50 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },

  // Form
  buttonGap: { height: spacing.md },
  showHide: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  forgotRow: { alignSelf: 'flex-end', marginTop: spacing.xs },
  forgotText: { ...typography.small, color: colors.primary, fontWeight: '600' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  termsText: { ...typography.small, color: colors.textSecondary, flex: 1 },
  termsLink: { color: colors.primary, fontWeight: '600' },
  fieldError: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
});
