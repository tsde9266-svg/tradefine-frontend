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

  return (
    <Marker
      coordinate={{ latitude: worker.latitude, longitude: worker.longitude }}
      onPress={() => onPress(worker)}
      anchor={{ x: 0.5, y: 1.0 }}
      tracksViewChanges={!imageReady}
    >
      <View style={styles.wrapper}>
        {/* Orange border ring — NO overflow:hidden, NO elevation */}
        <View style={[styles.ring, selected && styles.ringSelected]}>
          {/*
            Inner clip view: overflow:hidden clips the image into a circle.
            This works on Android ONLY when this view has NO elevation.
            Never combine elevation + overflow:hidden on the same View on Android.
          */}
          <View style={styles.imageClip}>
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
                <Text style={styles.initials}>{getInitials(worker.name)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tail */}
        <View style={[styles.tail, selected && styles.tailSelected]} />
      </View>
    </Marker>
  );
}

export default memo(WorkerMapPin);

const RING  = 44;
const INNER = 34;

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },

  // Draws the circular orange border — no overflow:hidden, no elevation
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

  // Clips the image to circle — overflow:hidden works here because NO elevation on this view
  imageClip: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    overflow: 'hidden',
  },

  avatar: {
    width: INNER,
    height: INNER,
  },
  fallback: {
    width: INNER,
    height: INNER,
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
