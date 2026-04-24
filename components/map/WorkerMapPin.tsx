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
        {/*
          Single view handles both the border AND the circular clip.
          overflow:hidden works here because there is NO elevation on
          any view in this component — elevation disables clipping on Android.
        */}
        <View style={[styles.pin, selected && styles.pinSelected]}>
          {worker.avatarUrl ? (
            <Image
              source={{ uri: worker.avatarUrl }}
              style={styles.img}
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
        <View style={[styles.tail, selected && styles.tailSelected]} />
      </View>
    </Marker>
  );
}

export default memo(WorkerMapPin);

const PIN = 46;

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },

  pin: {
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    overflow: 'hidden', // clips image to circle — works without elevation
    alignItems: 'center',
    justifyContent: 'center',
    // NO elevation, NO shadow — elevation breaks overflow:hidden on Android
  },
  pinSelected: { borderColor: colors.primaryDark, borderWidth: 4 },

  img: { width: PIN, height: PIN },

  fallback: {
    width: PIN,
    height: PIN,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  initials: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 13,
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
  tailSelected: { borderTopColor: colors.primaryDark },
});
