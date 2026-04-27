import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';

import KeyboardView from '../../components/layout/KeyboardView';
import { useToast } from '../../components/ui/Toast';
import FloatingNav from '../../components/shared/FloatingNav';
import PrimaryButton from '../../components/shared/PrimaryButton';
import { T } from '../../constants/tokens';
import { shadows } from '../../constants/shadows';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '../../constants/config';
import { registerSchema, loginSchema } from '../../utils/validators';
import { register as apiRegister, login as apiLogin, socialAuth } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

type Tab = 'signup' | 'login';
type Role = 'customer' | 'worker';

function extractZodErrors(issues: { path: (string | number)[]; message: string }[]) {
  const errs: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !errs[key]) errs[key] = issue.message;
  }
  return errs;
}

// ── Inline field component ─────────────────────────────────────────────────────
function Field({
  icon,
  error,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={fStyles.wrap}>
      <View style={[fStyles.row, error && fStyles.rowError]}>
        <Ionicons name={icon} size={18} color={T.text2} style={fStyles.icon} />
        {children}
      </View>
      {error && <Text style={fStyles.error}>{error}</Text>}
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.regInput,
    borderRadius: T.input,
    paddingHorizontal: 14,
    height: 52,
  },
  rowError: { borderWidth: 1.5, borderColor: T.red },
  icon: { marginRight: 10 },
  error: { fontSize: 12, fontFamily: 'Inter_500Medium', color: T.red, marginTop: 4 },
});

const INPUT_TEXT: object = {
  flex: 1,
  fontSize: 15,
  fontFamily: 'Inter_400Regular',
  color: T.text1,
};

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ role?: string; tab?: string }>();
  const initialTab: Tab = params.tab === 'login' ? 'login' : 'signup';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [role, setRole] = useState<Role>((params.role as Role) ?? 'customer');
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup
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
  const insets = useSafeAreaInsets();

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId:     GOOGLE_IOS_CLIENT_ID,
    webClientId:     GOOGLE_WEB_CLIENT_ID,
    scopes:          ['openid', 'email', 'profile'],
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) handleSocialAuth('google', idToken);
      else { show('Google sign-in failed — no token received', 'error'); setSocialLoading(null); }
    } else if (googleResponse?.type === 'error') {
      show('Google sign-in failed. Please try again.', 'error'); setSocialLoading(null);
    } else if (googleResponse?.type === 'dismiss') {
      setSocialLoading(null);
    }
  }, [googleResponse]);

  async function handleSocialAuth(provider: 'google' | 'apple', token: string, name?: string) {
    setSocialLoading(provider);
    try {
      const payload = await socialAuth({ provider, token, role, name });
      await setAuth(payload.user, payload.accessToken, payload.refreshToken);
      if (payload.isNewUser) router.replace('/(auth)/location-permission');
      else router.replace(payload.user.role === 'worker' ? '/(worker)' : '/(customer)');
    } catch (err: any) {
      show(err?.response?.data?.error ?? 'Sign-in failed. Please try again.', 'error');
    } finally {
      setSocialLoading(null);
    }
  }

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
      const name = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean).join(' ') || undefined;
      await handleSocialAuth('apple', credential.identityToken, name);
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') show('Apple sign-in failed. Please try again.', 'error');
      setSocialLoading(null);
    }
  }

  async function handleGoogle() {
    if (!GOOGLE_ANDROID_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID && !GOOGLE_WEB_CLIENT_ID) {
      show('Google sign-in coming soon', 'info'); return;
    }
    setSocialLoading('google');
    await googlePromptAsync();
  }

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
    <View style={styles.screen}>
      {/* Branded header — X | TradeFind (orange) | spacer */}
      <View style={[styles.navHeader, { top: insets.top + 12 }]}>
        <Pressable style={styles.navClose} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={22} color={T.text1} />
        </Pressable>
        <Text style={styles.navBrand}>TradeFind</Text>
        <View style={styles.navSpacer} />
      </View>

      <KeyboardView>
        <View style={[styles.container, { paddingTop: insets.top + 80 }]}>

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

          {/* Headline */}
          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>
              {activeTab === 'signup' ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={styles.subline}>
              {activeTab === 'signup'
                ? 'Join thousands of professionals and homeowners.'
                : 'Sign in to continue to TradeFind.'}
            </Text>
          </View>

          {/* Role toggle — signup only */}
          {activeTab === 'signup' && (
            <View style={styles.roleRow}>
              {([
                { key: 'customer', icon: 'people-outline', label: 'I need help' },
                { key: 'worker',   icon: 'construct-outline', label: "I'm a tradesperson" },
              ] as const).map(({ key, icon, label }) => (
                <Pressable
                  key={key}
                  style={[styles.roleBtn, role === key && styles.roleBtnActive]}
                  onPress={() => setRole(key)}
                >
                  <Ionicons name={icon} size={20} color={role === key ? T.orange : T.text2} />
                  <Text style={[styles.roleBtnText, role === key && styles.roleBtnTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* ── Signup form ──────────────────────────────────────────────────── */}
          {activeTab === 'signup' ? (
            <View>
              <Field icon="person-outline" error={signupErrors.name}>
                <TextInput
                  style={INPUT_TEXT}
                  placeholder="Full Name"
                  placeholderTextColor={T.text3}
                  value={signupName}
                  onChangeText={setSignupName}
                  autoCapitalize="words"
                />
              </Field>

              <Field icon="mail-outline" error={signupErrors.email}>
                <TextInput
                  style={INPUT_TEXT}
                  placeholder="Email Address"
                  placeholderTextColor={T.text3}
                  value={signupEmail}
                  onChangeText={setSignupEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>

              {/* Phone — prefix + divider */}
              <View style={fStyles.wrap}>
                <View style={[fStyles.row, signupErrors.phone && fStyles.rowError]}>
                  <Text style={styles.phonePrefix}>+44</Text>
                  <View style={styles.phoneDivider} />
                  <TextInput
                    style={[INPUT_TEXT, { paddingLeft: 12 }]}
                    placeholder="Phone Number"
                    placeholderTextColor={T.text3}
                    value={signupPhone}
                    onChangeText={setSignupPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                {signupErrors.phone && <Text style={fStyles.error}>{signupErrors.phone}</Text>}
              </View>

              <Field icon="lock-closed-outline" error={signupErrors.password}>
                <TextInput
                  style={INPUT_TEXT}
                  placeholder="Password"
                  placeholderTextColor={T.text3}
                  value={signupPassword}
                  onChangeText={setSignupPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={T.text2}
                  />
                </Pressable>
              </Field>

              {/* Terms */}
              <Pressable style={styles.termsRow} onPress={() => setAgreedToTerms((p) => !p)}>
                <View style={[
                  styles.checkbox,
                  agreedToTerms && styles.checkboxChecked,
                  signupErrors.agreedToTerms && !agreedToTerms && styles.checkboxError,
                ]}>
                  {agreedToTerms && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and <Text style={styles.termsLink}>Privacy Policy</Text>.
                </Text>
              </Pressable>
              {signupErrors.agreedToTerms && (
                <Text style={fStyles.error}>{signupErrors.agreedToTerms}</Text>
              )}
            </View>
          ) : (
            /* ── Login form ──────────────────────────────────────────────────── */
            <View>
              <Field icon="mail-outline" error={loginErrors.email}>
                <TextInput
                  style={INPUT_TEXT}
                  placeholder="Email Address"
                  placeholderTextColor={T.text3}
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>

              <Field icon="lock-closed-outline" error={loginErrors.password}>
                <TextInput
                  style={INPUT_TEXT}
                  placeholder="Password"
                  placeholderTextColor={T.text3}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={T.text2}
                  />
                </Pressable>
              </Field>

              <Pressable style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>
          )}

          {/* CTA */}
          <View style={styles.ctaWrap}>
            <PrimaryButton
              label={activeTab === 'signup' ? 'Create Account' : 'Log In'}
              onPress={activeTab === 'signup' ? onSignUp : onLogin}
              loading={signupLoading || loginLoading}
              fullWidth
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social */}
          <Pressable
            style={[styles.socialBtn, isSocialLoading && { opacity: 0.6 }]}
            onPress={handleGoogle}
            disabled={isSocialLoading}
          >
            {socialLoading === 'google'
              ? <ActivityIndicator size="small" color={T.text2} />
              : <Ionicons name="logo-google" size={18} color="#4285F4" />
            }
            <Text style={styles.socialBtnText}>Google</Text>
          </Pressable>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={T.pill}
              style={styles.appleBtn}
              onPress={handleApple}
            />
          )}

          <View style={{ height: 32 + insets.bottom }} />
        </View>
      </KeyboardView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.regBg },

  container: { paddingHorizontal: 20 },

  // Tab
  tabRow: {
    flexDirection: 'row',
    backgroundColor: T.regTrack,
    borderRadius: T.pill,
    padding: 4,
    marginBottom: 28,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: T.pill },
  tabActive: { backgroundColor: T.card, ...shadows.sm },
  tabLabel: { fontSize: 16, fontFamily: 'Inter_500Medium', color: T.text2 },
  tabLabelActive: { fontFamily: 'Inter_700Bold', color: T.text1 },

  // Headline
  headlineBlock: { alignItems: 'center', marginBottom: 24 },
  headline: { fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: T.text1, letterSpacing: -0.5, textAlign: 'center' },
  subline: { fontSize: 15, fontFamily: 'Inter_400Regular', color: T.text2, textAlign: 'center', marginTop: 6 },

  // Role pills
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: T.input,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.regInput,
  },
  roleBtnActive: { borderColor: T.orange, backgroundColor: 'rgba(249,115,22,0.07)' },
  roleBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: T.text2 },
  roleBtnTextActive: { fontFamily: 'Inter_600SemiBold', color: T.orange },

  // Phone
  phonePrefix: { fontSize: 15, fontFamily: 'Inter_400Regular', color: T.text2 },
  phoneDivider: { width: 1, height: 22, backgroundColor: T.border, marginHorizontal: 4 },

  // Terms
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: T.border,
    backgroundColor: T.card,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: T.orange, borderColor: T.orange },
  checkboxError: { borderColor: T.red, borderWidth: 2 },
  termsText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: T.text2, flex: 1 },
  termsLink: { fontFamily: 'Inter_600SemiBold', color: T.orange },

  // Forgot
  forgotRow: { alignSelf: 'flex-end', marginTop: 4 },
  forgotText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: T.orange },

  // CTA
  ctaWrap: { marginTop: 24, marginBottom: 20 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: T.text2 },

  // Branded nav header
  navHeader: {
    position: 'absolute',
    left: 16, right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 56,
    paddingHorizontal: 8,
    ...shadows.md,
  },
  navClose: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  navBrand: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: T.orange,
    letterSpacing: -0.3,
  },
  navSpacer: { width: 40 },

  // Social
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 52, backgroundColor: '#FFFFFF',
    borderRadius: T.pill, borderWidth: 1.5, borderColor: T.border,
    marginBottom: 10, ...shadows.sm,
  },
  socialBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: T.text1 },
  appleBtn: { width: '100%', height: 52 },
});
