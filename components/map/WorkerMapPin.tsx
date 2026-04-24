import React, { memo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { Worker } from '../../types/worker';

interface WorkerMapPinProps {
  worker: Worker;
  onPress: (worker: Worker) => void;
  selected?: boolean;
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function WorkerMapPin({ worker, onPress, selected = false }: WorkerMapPinProps) {
  const [imageReady, setImageReady] = useState(!worker.avatarUrl);

  if (worker.latitude == null || worker.longitude == null) return null;

  const initials = getInitials(worker.name);

  return (
    <Marker
      coordinate={{ latitude: worker.latitude, longitude: worker.longitude }}
      onPress={() => onPress(worker)}
      anchor={{ x: 0.5, y: 1.0 }}
      tracksViewChanges={!imageReady}
    >
      <View style={styles.wrapper}>
        {/* Circle ring + avatar — no elevation, no overflow:hidden, no shadows */}
        <View style={[styles.ring, selected && styles.ringSelected]}>
          {worker.avatarUrl ? (
            <Image
              source={{ uri: worker.avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
              onLoad={() => setImageReady(true)}
              onError={() => setImageReady(true)}
            />
          ) : (
            <View style={styles.fallback}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Downward tail */}
        <View style={[styles.tail, selected && styles.tailSelected]} />
      </View>
    </Marker>
  );
}

export default memo(WorkerMapPin);

const RING  = 44;
const INNER = 34; // RING minus border space

const styles = StyleSheet.create({
  // Keep wrapper completely plain — any elevation/shadow kills the marker on Android
  wrapper: {
    alignItems: 'center',
  },

  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSelected: {
    borderColor: colors.primaryDark,
    borderWidth: 4,
  },

  // borderRadius on image directly — works on Android without overflow:hidden
  avatar: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
  },
  fallback: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 12,
  },

  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
  tailSelected: {
    borderTopColor: colors.primaryDark,
  },
});
