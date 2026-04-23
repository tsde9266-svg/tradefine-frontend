import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Avatar from '../ui/Avatar';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { Worker } from '../../types/worker';

interface WorkerMapPinProps {
  worker: Worker;
  onPress: (worker: Worker) => void;
  selected?: boolean;
}

function WorkerMapPin({ worker, onPress, selected = false }: WorkerMapPinProps) {
  if (worker.latitude == null || worker.longitude == null) return null;

  return (
    <Marker
      coordinate={{ latitude: worker.latitude, longitude: worker.longitude }}
      onPress={() => onPress(worker)}
      tracksViewChanges={selected}
    >
      <View style={[styles.pin, selected && styles.pinSelected]}>
        <Avatar uri={worker.avatarUrl} name={worker.name} size={36} />
        <View style={styles.tail} />
      </View>
    </Marker>
  );
}

export default memo(WorkerMapPin);

const styles = StyleSheet.create({
  pin: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 2.5,
    borderColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinSelected: {
    borderColor: colors.primaryDark,
    transform: [{ scale: 1.15 }],
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
});
