import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';

import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { StackHeader } from '../../components/layout/AppHeader';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { TRADES } from '../../constants/trades';
import { updateWorkerProfile } from '../../services/workers';
import { uploadImage } from '../../services/upload';
import { useWorkerProfileStore } from '../../stores/workerProfileStore';
import { useAuthStore } from '../../stores/authStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { profile, updateProfile } = useWorkerProfileStore();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [pricingNotes, setPricingNotes] = useState(profile?.pricingNotes ?? '');
  const [selectedTrades, setSelectedTrades] = useState<string[]>(profile?.trades ?? []);
  const [serviceArea, setServiceArea] = useState(profile?.serviceAreaMiles ?? 10);
  const [certifications, setCertifications] = useState<string[]>(profile?.certifications ?? []);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>(profile?.portfolioPhotos ?? []);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showTradesPicker, setShowTradesPicker] = useState(false);
  const [certInput, setCertInput] = useState('');

  const availableTrades = TRADES.filter((t) => !selectedTrades.includes(t));

  const removeTrade = (trade: string) =>
    setSelectedTrades((prev) => prev.filter((t) => t !== trade));
  const addTrade = (trade: string) => {
    setSelectedTrades((prev) => [...prev, trade]);
    if (availableTrades.length <= 1) setShowTradesPicker(false);
  };

  const addCert = () => {
    const trimmed = certInput.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications((prev) => [...prev, trimmed]);
    }
    setCertInput('');
  };
  const removeCert = (cert: string) =>
    setCertifications((prev) => prev.filter((c) => c !== cert));

  const handleChangeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(result.assets[0].uri);
      setAvatarUri(url);
    } catch {
      show('Could not upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddPortfolioPhoto = async () => {
    if (portfolioPhotos.length >= 8) { show('Maximum 8 photos', 'info'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const urls = await Promise.all(
        result.assets.slice(0, 8 - portfolioPhotos.length).map((a) => uploadImage(a.uri)),
      );
      setPortfolioPhotos((prev) => [...prev, ...urls]);
    } catch {
      show('Could not upload photos', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePortfolioPhoto = (uri: string) => {
    Alert.alert('Remove Photo', 'Remove this photo from your portfolio?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setPortfolioPhotos((prev) => prev.filter((p) => p !== uri)) },
    ]);
  };

  const handleSave = async () => {
    if (selectedTrades.length === 0) { show('Select at least one trade', 'error'); return; }
    setSaving(true);
    try {
      const updated = await updateWorkerProfile({
        name, phone, bio, pricingNotes,
        trades: selectedTrades,
        serviceAreaMiles: serviceArea,
        certifications, portfolioPhotos,
        avatarUrl: avatarUri,
      });
      updateProfile(updated);
      show('Profile saved', 'success');
      router.back();
    } catch {
      show('Could not save profile. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <StackHeader title="Edit Profile" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Avatar ──────────────────────────────────────────── */}
        <View style={s.avatarSection}>
          <Pressable onPress={handleChangeAvatar} disabled={uploadingPhoto} style={s.avatarWrap}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={s.avatarImg} />
              : <View style={[s.avatarImg, s.avatarFallback]}>
                  <Text style={s.avatarInitials}>{initials || '?'}</Text>
                </View>
            }
            <View style={s.cameraBadge}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </Pressable>
          <Text style={s.avatarName}>{name || 'Your Name'}</Text>
          {user?.createdAt && (
            <Text style={s.avatarSince}>
              Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </Text>
          )}
        </View>

        {/* ── Identity & Contact ──────────────────────────────── */}
        <Text style={s.sectionTitle}>Identity & Contact</Text>
        <View style={s.card}>
          <Field label="Full Name">
            <TextInput style={s.fieldInput} value={name} onChangeText={setName}
              placeholder="Your full name" placeholderTextColor={colors.textDisabled}
              autoCapitalize="words" />
          </Field>
          <FieldDivider />
          <Field label="Phone Number">
            <TextInput style={s.fieldInput} value={phone} onChangeText={setPhone}
              placeholder="+44 7700 900000" placeholderTextColor={colors.textDisabled}
              keyboardType="phone-pad" />
          </Field>
          <FieldDivider />
          <Field label="Email Address">
            <Text style={s.fieldReadOnly}>{user?.email ?? '—'}</Text>
          </Field>
        </View>

        {/* ── Registered Trades ───────────────────────────────── */}
        <Text style={s.sectionTitle}>Registered Trades</Text>
        <View style={s.card}>
          {/* Selected trades as removable orange pills */}
          <View style={s.pillsRow}>
            {selectedTrades.map((trade) => (
              <View key={trade} style={s.selectedPill}>
                <Text style={s.selectedPillText}>{trade}</Text>
                <Pressable onPress={() => removeTrade(trade)} hitSlop={6} style={s.pillRemove}>
                  <Text style={s.pillRemoveText}>×</Text>
                </Pressable>
              </View>
            ))}
            {/* + Add Trade button */}
            <Pressable style={s.addPill} onPress={() => setShowTradesPicker((v) => !v)}>
              <Ionicons name="add" size={14} color={colors.textSecondary} />
              <Text style={s.addPillText}>Add Trade</Text>
            </Pressable>
          </View>

          {/* Trade picker — expands inline */}
          {showTradesPicker && availableTrades.length > 0 && (
            <View style={s.tradePickerWrap}>
              <View style={s.tradeDivider} />
              <View style={s.pillsRow}>
                {availableTrades.map((trade) => (
                  <Pressable key={trade} style={s.unselectedPill} onPress={() => addTrade(trade)}>
                    <Text style={s.unselectedPillText}>{trade}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Certifications ──────────────────────────────────── */}
        <Text style={s.sectionTitle}>Certifications</Text>
        <View style={s.card}>
          {certifications.length > 0 && (
            <View style={[s.pillsRow, { marginBottom: spacing.md }]}>
              {certifications.map((c) => (
                <View key={c} style={s.selectedPill}>
                  <Text style={s.selectedPillText}>{c}</Text>
                  <Pressable onPress={() => removeCert(c)} hitSlop={6} style={s.pillRemove}>
                    <Text style={s.pillRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          {/* Add certification input */}
          <View style={s.certInputRow}>
            <TextInput
              style={s.certInput}
              value={certInput}
              onChangeText={setCertInput}
              placeholder="e.g. Gas Safe, NICEIC..."
              placeholderTextColor={colors.textDisabled}
              onSubmitEditing={addCert}
              returnKeyType="done"
            />
            <Pressable style={s.certAddBtn} onPress={addCert}>
              <Ionicons name="arrow-up" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* ── Service Area ─────────────────────────────────────── */}
        <View style={s.serviceHeaderRow}>
          <Text style={s.sectionTitle}>Service Area</Text>
          <Text style={s.serviceValue}>{serviceArea} <Text style={s.serviceUnit}>miles</Text></Text>
        </View>
        <View style={s.card}>
          <Text style={s.serviceDesc}>
            Define how far you are willing to travel from your location.
          </Text>
          <Slider
            style={s.slider}
            minimumValue={1}
            maximumValue={50}
            step={1}
            value={serviceArea}
            onValueChange={setServiceArea}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.borderLight}
            thumbTintColor={colors.primary}
          />
          <View style={s.sliderLabels}>
            <Text style={s.sliderLabel}>1 mi</Text>
            <Text style={s.sliderLabel}>50 mi</Text>
          </View>
        </View>

        {/* ── About You ────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>About You</Text>
        <View style={s.card}>
          <TextInput
            style={s.textArea}
            value={bio}
            onChangeText={(t) => t.length <= 300 && setBio(t)}
            placeholder="Professional background, experience, specialisms..."
            placeholderTextColor={colors.textDisabled}
            multiline
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{bio.length}/300</Text>
        </View>

        {/* ── Pricing Notes ────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Pricing Notes</Text>
        <View style={s.card}>
          <TextInput
            style={[s.textArea, { minHeight: 80 }]}
            value={pricingNotes}
            onChangeText={(t) => t.length <= 200 && setPricingNotes(t)}
            placeholder="e.g. Fixed call-out fee of £60 which includes the first hour..."
            placeholderTextColor={colors.textDisabled}
            multiline
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{pricingNotes.length}/200</Text>
        </View>

        {/* ── Recent Work Portfolio ────────────────────────────── */}
        <Text style={s.sectionTitle}>Recent Work Portfolio</Text>
        <View style={s.card}>
          <View style={s.photosGrid}>
            {portfolioPhotos.map((uri) => (
              <Pressable key={uri} onPress={() => removePortfolioPhoto(uri)} style={s.photoThumb}>
                <Image source={{ uri }} style={s.photoThumbImg} resizeMode="cover" />
                <View style={s.photoRemove}>
                  <Text style={s.photoRemoveText}>×</Text>
                </View>
              </Pressable>
            ))}
            {portfolioPhotos.length < 8 && (
              <Pressable
                style={s.addPhotoTile}
                onPress={handleAddPortfolioPhoto}
                disabled={uploadingPhoto}
              >
                <Ionicons name="image-outline" size={28} color={colors.textDisabled} />
                <Text style={s.addPhotoLabel}>{uploadingPhoto ? '…' : 'Add Photo'}</Text>
              </Pressable>
            )}
          </View>
          <Text style={s.hint}>{portfolioPhotos.length}/8 photos · tap photo to remove</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky save button */}
      <SafeAreaView edges={['bottom']} style={s.saveBar}>
        <Button label="Save Changes" variant="primary" fullWidth loading={saving} onPress={handleSave} size="lg" />
      </SafeAreaView>
    </SafeAreaView>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function FieldDivider() {
  return <View style={s.fieldDivider} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PHOTO_SIZE = 100;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.huge },

  /* Avatar */
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl, gap: 6 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.h2, color: '#fff', fontWeight: '700' },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  avatarName: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  avatarSince: { ...typography.small, color: colors.textSecondary },

  /* Section titles */
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },

  /* Cards */
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },

  /* Fields inside card */
  field: { gap: 6 },
  fieldLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  fieldInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  fieldReadOnly: { ...typography.body, color: colors.textDisabled, paddingVertical: 10 },
  fieldDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.md },

  /* Trade & cert pills */
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  selectedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  selectedPillText: { ...typography.small, color: '#fff', fontWeight: '600' },
  pillRemove: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  pillRemoveText: { color: '#fff', fontSize: 14, lineHeight: 16, fontWeight: '700' },

  addPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: colors.borderLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  addPillText: { ...typography.small, color: colors.textSecondary, fontWeight: '600' },

  unselectedPill: {
    borderWidth: 1.5, borderColor: colors.borderLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  unselectedPillText: { ...typography.small, color: colors.textPrimary },

  tradePickerWrap: { marginTop: spacing.sm },
  tradeDivider: { height: 1, backgroundColor: colors.borderLight, marginBottom: spacing.sm },

  /* Certifications input */
  certInputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  certInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  certAddBtn: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Service area */
  serviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  serviceValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  serviceUnit: { fontSize: 14, fontWeight: '600', color: colors.primary },
  serviceDesc: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.sm },
  slider: { width: '100%', height: 40, marginVertical: spacing.xs },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { ...typography.caption, color: colors.textSecondary },

  /* Text areas */
  textArea: {
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  charCount: { ...typography.caption, color: colors.textDisabled, alignSelf: 'flex-end', marginTop: spacing.xs },

  /* Portfolio */
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  photoThumb: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: radius.md, overflow: 'hidden' },
  photoThumbImg: { width: PHOTO_SIZE, height: PHOTO_SIZE },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  addPhotoTile: {
    width: PHOTO_SIZE, height: PHOTO_SIZE,
    borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.borderLight,
    borderStyle: Platform.OS === 'ios' ? 'dashed' : 'solid',
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  addPhotoLabel: { ...typography.caption, color: colors.textDisabled },
  hint: { ...typography.caption, color: colors.textSecondary },

  /* Save bar */
  saveBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    ...shadows.md,
  },
});
