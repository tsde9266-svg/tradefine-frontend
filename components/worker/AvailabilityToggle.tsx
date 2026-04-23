import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

import Button from '../ui/Button';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { LOCATION_UPDATE_INTERVAL_FOREGROUND } from '../../constants/config';
import { toggleAvailability } from '../../services/workers';
import { emitLocationUpdate, emitWorkerOffline } from '../../services/socket';
import { useWorkerProfileStore } from '../../stores/workerProfileStore';
import { useLocationStore } from '../../stores/locationStore';
import { useToast } from '../ui/Toast';

// Module-level interval — must not live in React state
let locationInterval: ReturnType<typeof setInterval> | null = null;

export default function AvailabilityToggle() {
  const { isAvailable, setAvailable } = useWorkerProfileStore();
  const { setLocation } = useLocationStore();
  const { show } = useToast();
  const [loading, setLoading] = useState(false);

  // Animated pulsing dot for the ON state
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isAvailable) {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ]),
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      pulse.setValue(1);
    }
    return () => pulseAnim.current?.stop();
  }, [isAvailable]);

  const startLocationEmission = (lat: number, lng: number) => {
    emitLocationUpdate(lat, lng);
    locationInterval = setInterval(async () => {
      // Guard: never emit if store says offline
      if (!useWorkerProfileStore.getState().isAvailable) {
        stopLocationEmission();
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        emitLocationUpdate(latitude, longitude);
      } catch {}
    }, LOCATION_UPDATE_INTERVAL_FOREGROUND);
  };

  const stopLocationEmission = () => {
    if (locationInterval !== null) {
      clearInterval(locationInterval);
      locationInterval = null;
    }
  };

  const handleGoAvailable = async () => {
    setLoading(true);
    try {
      // Step 1 — ensure location permission
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      }
      if (status !== 'granted') {
        show('Location access is needed to go available', 'error');
        return;
      }

      // Step 2 — get current position
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = pos.coords;
      setLocation({ latitude: lat, longitude: lng });

      // Step 3 — tell server
      await toggleAvailability({ available: true, lat, lng });

      // Step 4 — start emitting location
      startLocationEmission(lat, lng);

      // Step 5 — update store
      setAvailable(true);
      show('You\'re now live and visible to customers', 'success');
    } catch {
      show('Could not go available. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoOffline = async () => {
    setLoading(true);
    try {
      // Step 1 — IMMEDIATELY stop location emission before anything else
      stopLocationEmission();

      // Step 2 — update store so any in-flight interval guard triggers
      setAvailable(false);

      // Step 3 — notify server + socket
      await toggleAvailability({ available: false });
      emitWorkerOffline();

      show('You\'re now offline', 'info');
    } catch {
      show('Could not go offline. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isAvailable) {
    return (
      <View style={styles.cardOn}>
        <View style={styles.headerRow}>
          <View style={styles.pulseWrapper}>
            <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulse }] }]} />
            <View style={styles.pulseDotCore} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.titleOn}>You're LIVE</Text>
            <Text style={styles.subtitleOn}>Customers can find you nearby</Text>
          </View>
        </View>
        <Button
          label="Go Offline"
          variant="outline"
          fullWidth
          loading={loading}
          onPress={handleGoOffline}
        />
      </View>
    );
  }

  return (
    <View style={styles.cardOff}>
      <View style={styles.headerRow}>
        <Text style={styles.toggleIcon}>👁‍🗨</Text>
        <View style={styles.textBlock}>
          <Text style={styles.titleOff}>You're currently invisible</Text>
          <Text style={styles.subtitleOff}>Customers cannot find you right now</Text>
        </View>
      </View>
      <Button
        label="Go Available"
        variant="primary"
        fullWidth
        loading={loading}
        onPress={handleGoAvailable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardOff: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardOn: {
    backgroundColor: colors.successBg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  titleOff: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  titleOn: {
    ...typography.h3,
    color: colors.success,
  },
  subtitleOff: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  subtitleOn: {
    ...typography.small,
    color: colors.success,
    marginTop: spacing.xs,
  },
  toggleIcon: {
    fontSize: 32,
  },
  pulseWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.available,
    opacity: 0.3,
  },
  pulseDotCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.available,
  },
});
