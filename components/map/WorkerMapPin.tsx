import React, { memo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { T } from '../../constants/tokens';
import { Worker } from '../../types/worker';

interface WorkerMapPinProps {
  worker: Worker;
  onPress: (worker: Worker) => void;
  selected?: boolean;
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function extractPrice(notes: string): string | null {
  const m = notes?.match(/£[\d,]+(?:\/(?:hr|day|m²|visit))?/i);
  return m ? m[0] : null;
}

function WorkerMapPin({ worker, onPress, selected = false }: WorkerMapPinProps) {
  const [imageReady, setImageReady] = useState(!worker.avatarUrl);

  if (worker.latitude == null || worker.longitude == null) return null;

  const price = extractPrice(worker.pricingNotes ?? '');
  const isAvail = worker.isAvailable;
  const PIN = selected ? 52 : 44;

  return (
    <Marker
      coordinate={{ latitude: worker.latitude, longitude: worker.longitude }}
      onPress={() => onPress(worker)}
      anchor={{ x: 0.5, y: 1.0 }}
      tracksViewChanges={!imageReady}
    >
      <View style={styles.wrapper}>
        {/* Price tooltip above pin */}
        {price && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipPrice}>{price}</Text>
            <Text style={styles.tooltipUnit}> /hr</Text>
          </View>
        )}

        {/* Avatar circle */}
        <View style={[
          styles.pin,
          { width: PIN, height: PIN, borderRadius: PIN / 2 },
          selected ? styles.pinSelected : styles.pinDefault,
          !isAvail && styles.pinUnavail,
        ]}>
          {worker.avatarUrl ? (
            <Image
              source={{ uri: worker.avatarUrl }}
              style={{ width: PIN, height: PIN }}
              resizeMode="cover"
              onLoad={() => setImageReady(true)}
              onError={() => setImageReady(true)}
            />
          ) : (
            <View style={[styles.fallback, { width: PIN, height: PIN }]}>
              <Text style={styles.initials}>{getInitials(worker.name)}</Text>
            </View>
          )}

          {/* Availability dot */}
          <View style={[styles.dot, isAvail ? styles.dotGreen : styles.dotRed]} />
        </View>

        {/* Triangle stem */}
        <View style={[styles.tail, selected ? styles.tailSelected : styles.tailDefault]} />
      </View>
    </Marker>
  );
}

export default memo(WorkerMapPin);

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },

  tooltip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tooltipPrice: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: T.orange,
  },
  tooltipUnit: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: T.text2,
  },

  pin: {
    borderWidth: 2.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDefault: { borderColor: T.orange, backgroundColor: T.orangeLight },
  pinSelected: { borderColor: T.orange, backgroundColor: T.orange, borderWidth: 3 },
  pinUnavail: { borderColor: T.text3, opacity: 0.65 },

  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.orangeLight,
  },
  initials: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: T.orangeDark,
  },

  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  dotGreen: { backgroundColor: '#22C55E' },
  dotRed:   { backgroundColor: '#EF4444' },

  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailDefault:  { borderTopColor: T.orange },
  tailSelected: { borderTopColor: T.orange },
});
