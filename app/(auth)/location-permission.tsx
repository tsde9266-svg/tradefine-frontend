import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useAuthStore } from '../../stores/authStore';

const ILLUSTRATION = require('../../assets/illustrations/onboarding_illustration_for_a_construction_app_a_clean_stylized_map_with_map.png');

export default function LocationPermissionScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPostcode, setShowPostcode] = useState(false);
  const [postcode, setPostcode] = useState('');

  const navigateHome = () => {
    if (user?.role === 'worker') {
      router.replace('/(worker)');
    } else {
      router.replace('/(customer)');
    }
  };

  const handleAllow = async () => {
    setLoading(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        navigateHome();
      } else {
        setError('Location access denied. You can enter your postcode below instead.');
        setShowPostcode(true);
      }
    } catch {
      setError('Could not request location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostcodeSubmit = () => {
    if (postcode.trim().length < 3) {
      setError('Please enter a valid postcode');
      return;
    }
    navigateHome();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <Image source={ILLUSTRATION} style={styles.illustration} resizeMode="contain" />

        <Text style={styles.title}>Allow location access</Text>
        <Text style={styles.body}>
          We use your location to show you tradespeople nearby. Your exact location is
          never stored or shared without your consent.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {showPostcode && (
          <View style={styles.postcodeContainer}>
            <Input
              placeholder="e.g. B11 2QH"
              value={postcode}
              onChangeText={setPostcode}
              autoCapitalize="characters"
              label="Your postcode"
            />
            <Button
              label="Continue"
              variant="primary"
              fullWidth
              onPress={handlePostcodeSubmit}
            />
          </View>
        )}

        <View style={styles.buttons}>
          {!showPostcode && (
            <Button
              label="Allow Location"
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleAllow}
            />
          )}

          <View style={styles.gap} />

          <Button
            label="Enter my postcode instead"
            variant="ghost"
            fullWidth
            onPress={() => setShowPostcode(true)}
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
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: 260,
    marginBottom: spacing.xxxl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  error: {
    ...typography.small,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  postcodeContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  buttons: {
    width: '100%',
  },
  gap: {
    height: spacing.md,
  },
});
