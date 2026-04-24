import React, { useEffect, useState } from 'react';
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
import Input from '../../components/ui/Input';
import KeyboardView from '../../components/layout/KeyboardView';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { TRADES } from '../../constants/trades';
import { updateWorkerProfile } from '../../services/workers';
import { uploadImage } from '../../services/upload';
import { useWorkerProfileStore } from '../../stores/workerProfileStore';
import { StackHeader } from '../../components/layout/AppHeader';

const QUICK_CERTS = ['Gas Safe', 'NICEIC', 'CSCS', 'City & Guilds'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { profile, updateProfile } = useWorkerProfileStore();

  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [pricingNotes, setPricingNotes] = useState(profile?.pricingNotes ?? '');
  const [selectedTrades, setSelectedTrades] = useState<string[]>(profile?.trades ?? []);
  const [serviceArea, setServiceArea] = useState(profile?.serviceAreaMiles ?? 10);
  const [certifications, setCertifications] = useState<string[]>(profile?.certifications ?? []);
  const [certInput, setCertInput] = useState('');
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>(profile?.portfolioPhotos ?? []);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const toggleTrade = (trade: string) => {
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade],
    );
  };

  const addCert = (cert: string) => {
    const trimmed = cert.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications((prev) => [...prev, trimmed]);
    }
    setCertInput('');
  };

  const removeCert = (cert: string) => {
    setCertifications((prev) => prev.filter((c) => c !== cert));
  };

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
    if (portfolioPhotos.length >= 8) {
      show('Maximum 8 portfolio photos', 'info');
      return;
    }
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
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setPortfolioPhotos((prev) => prev.filter((p) => p !== uri)),
      },
    ]);
  };

  const handleSave = async () => {
    if (selectedTrades.length === 0) {
      show('Select at least one trade', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateWorkerProfile({
        name,
        phone,
        bio,
        pricingNotes,
        trades: selectedTrades,
        serviceAreaMiles: serviceArea,
        certifications,
        portfolioPhotos,
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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardView>
        <StackHeader title="Edit Profile" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Profile photo */}
          <SectionHeader label="Profile Photo" />
          <View style={styles.avatarSection}>
            <Pressable onPress={handleChangeAvatar} disabled={uploadingPhoto} style={styles.avatarPressable}>
              {avatarUri
                ? <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                : <View style={[styles.avatarImg, styles.avatarFallback]}>
                    <Ionicons name="person" size={40} color={colors.textInverse} />
                  </View>
              }
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={14} color={colors.textInverse} />
              </View>
            </Pressable>
            <Pressable onPress={handleChangeAvatar} disabled={uploadingPhoto}>
              <Text style={styles.changePhotoLink}>
                {uploadingPhoto ? 'Uploading…' : 'Change Photo'}
              </Text>
            </Pressable>
          </View>

          {/* Basic info */}
          <SectionHeader label="Basic Info" />
          <View style={styles.sectionBody}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoCapitalize="words"
            />
            <Input
              label="Phone (shown to customers)"
              value={phone}
              onChangeText={setPhone}
              placeholder="07700 900000"
              keyboardType="phone-pad"
            />
            <Input
              label="Email"
              value={profile?.userId ?? ''}
              editable={false}
              placeholder="Change via support"
              style={styles.readOnly}
            />
          </View>

          {/* About */}
          <SectionHeader label="About" />
          <View style={styles.sectionBody}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={styles.textArea}
              value={bio}
              onChangeText={(t) => t.length <= 300 && setBio(t)}
              placeholder="Tell customers about yourself..."
              placeholderTextColor={colors.textDisabled}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/300</Text>

            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Pricing Notes</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 72 }]}
              value={pricingNotes}
              onChangeText={(t) => t.length <= 200 && setPricingNotes(t)}
              placeholder="e.g. Call-out charge £50, hourly rate £45..."
              placeholderTextColor={colors.textDisabled}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{pricingNotes.length}/200</Text>
          </View>

          {/* Trades */}
          <SectionHeader label="Trades" />
          <View style={styles.sectionBody}>
            <Text style={styles.hint}>Select all that apply (minimum 1)</Text>
            <View style={styles.chipsGrid}>
              {TRADES.map((trade) => {
                const active = selectedTrades.includes(trade);
                return (
                  <Pressable
                    key={trade}
                    style={[styles.tradeChip, active && styles.tradeChipActive]}
                    onPress={() => toggleTrade(trade)}
                  >
                    <Text style={[styles.tradeChipText, active && styles.tradeChipTextActive]}>
                      {trade}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Service area */}
          <SectionHeader label="Service Area" />
          <View style={styles.sectionBody}>
            <Text style={styles.serviceAreaLabel}>
              You cover <Text style={styles.serviceAreaValue}>{serviceArea} miles</Text> from your location
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={serviceArea}
              onValueChange={setServiceArea}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>1 mi</Text>
              <Text style={styles.sliderLabel}>50 mi</Text>
            </View>
          </View>

          {/* Certifications */}
          <SectionHeader label="Certifications" />
          <View style={styles.sectionBody}>
            <View style={styles.quickCerts}>
              {QUICK_CERTS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.quickCertChip, certifications.includes(c) && styles.quickCertActive]}
                  onPress={() => certifications.includes(c) ? removeCert(c) : addCert(c)}
                >
                  <Text style={[styles.quickCertText, certifications.includes(c) && styles.quickCertTextActive]}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.certInputRow}>
              <TextInput
                style={styles.certInput}
                value={certInput}
                onChangeText={setCertInput}
                placeholder="Add a certification..."
                placeholderTextColor={colors.textDisabled}
                onSubmitEditing={() => addCert(certInput)}
                returnKeyType="done"
              />
              <Pressable style={styles.certAddBtn} onPress={() => addCert(certInput)}>
                <Text style={styles.certAddText}>Add</Text>
              </Pressable>
            </View>
            <View style={styles.certTags}>
              {certifications.map((c) => (
                <View key={c} style={styles.certTag}>
                  <Text style={styles.certTagText}>{c}</Text>
                  <Pressable onPress={() => removeCert(c)} hitSlop={6}>
                    <Text style={styles.certTagRemove}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Portfolio photos */}
          <SectionHeader label="Portfolio Photos" />
          <View style={styles.sectionBody}>
            <View style={styles.photosGrid}>
              {portfolioPhotos.map((uri) => (
                <Pressable
                  key={uri}
                  onPress={() => removePortfolioPhoto(uri)}
                  style={styles.photoThumb}
                >
                  <Image
                    source={{ uri }}
                    style={styles.photoThumbImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoRemoveOverlay}>
                    <Text style={styles.photoRemoveIcon}>×</Text>
                  </View>
                </Pressable>
              ))}
              {portfolioPhotos.length < 8 && (
                <Pressable
                  style={styles.addPhotoTile}
                  onPress={handleAddPortfolioPhoto}
                  disabled={uploadingPhoto}
                >
                  <Text style={styles.addPhotoIcon}>+</Text>
                  <Text style={styles.addPhotoLabel}>
                    {uploadingPhoto ? '…' : 'Add Photo'}
                  </Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.hint}>{portfolioPhotos.length}/8 photos · tap to remove</Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardView>

      {/* Sticky save button */}
      <SafeAreaView edges={['bottom']} style={styles.saveBar}>
        <Button
          label="Save Changes"
          variant="primary"
          fullWidth
          loading={saving}
          onPress={handleSave}
          size="lg"
        />
      </SafeAreaView>
    </SafeAreaView>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeaderText}>{label}</Text>
    </View>
  );
}

const PHOTO_SIZE = 90;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  scroll: {
    paddingBottom: spacing.huge,
  },
  sectionHeaderRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  sectionHeaderText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  sectionBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  avatarPressable: { position: 'relative' },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  editAvatarBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  changePhotoLink: { ...typography.bodyMd, color: colors.primary, fontWeight: '600' },
  readOnly: {
    color: colors.textDisabled,
  },
  inputLabel: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 96,
  },
  charCount: {
    ...typography.caption,
    color: colors.textDisabled,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tradeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tradeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tradeChipText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  tradeChipTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  serviceAreaLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  serviceAreaValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  quickCerts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickCertChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  quickCertActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  quickCertText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  quickCertTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  certInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  certInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  certAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  certAddText: {
    ...typography.bodyMd,
    color: colors.textInverse,
  },
  certTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  certTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  certTagText: {
    ...typography.small,
    color: colors.textPrimary,
  },
  certTagRemove: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  photoThumb: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  photoThumbImage: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },
  photoRemoveOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveIcon: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  addPhotoTile: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: Platform.OS === 'ios' ? 'dashed' : 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addPhotoIcon: {
    fontSize: 28,
    color: colors.textDisabled,
  },
  addPhotoLabel: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.md,
  },
});
