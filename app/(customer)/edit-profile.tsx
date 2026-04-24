import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import api from '../../services/api';

export default function CustomerEditProfileScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { show('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const { data } = await api.patch('/api/auth/profile', { name: name.trim(), phone: phone.trim() });
      setUser(data.data);
      show('Profile updated', 'success');
      router.back();
    } catch (e: any) {
      show(e?.response?.data?.error ?? 'Could not save changes', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="07700 000000"
              placeholderTextColor={colors.textDisabled}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputDisabledText}>{user?.email}</Text>
            </View>
            <Text style={styles.hint}>Email cannot be changed</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight, ...shadows.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h4, color: colors.textPrimary, fontWeight: '700' },
  form: { padding: spacing.lg, gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderLight, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 14, ...typography.body, color: colors.textPrimary },
  inputDisabled: { backgroundColor: colors.surfaceElevated, justifyContent: 'center' },
  inputDisabledText: { ...typography.body, color: colors.textSecondary },
  hint: { ...typography.caption, color: colors.textDisabled },
  footer: { padding: spacing.lg, marginTop: 'auto' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { ...typography.bodyMd, color: '#fff', fontWeight: '700' },
});
