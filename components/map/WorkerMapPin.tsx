import React, { memo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
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

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function getTradeIcon(trade: string): IoniconName {
  const t = trade.toLowerCase();
  if (t.includes('electr'))                        return 'flash';
  if (t.includes('plumb') || t.includes('bath'))   return 'water';
  if (t.includes('gas'))                           return 'flame';
  if (t.includes('carpen') || t.includes('join'))  return 'hammer';
  if (t.includes('paint') || t.includes('decor'))  return 'color-palette';
  if (t.includes('landscape') || t.includes('garden')) return 'leaf';
  if (t.includes('lock'))                          return 'key';
  if (t.includes('roof'))                          return 'home';
  if (t.includes('tile'))                          return 'grid';
  if (t.includes('clean'))                         return 'sparkles';
  if (t.includes('build') || t.includes('contract')) return 'construct';
  return 'build';
}

function WorkerMapPin({ worker, onPress, selected = false }: WorkerMapPinProps) {
  const [imageReady, setImageReady] = useState(!worker.avatarUrl);

  if (worker.latitude == null || worker.longitude == null) return null;

  const initials = getInitials(worker.name);
  const tradeIcon = getTradeIcon(worker.trades[0] ?? '');

  return (
    <Marker
      coordinate={{ latitude: worker.latitude, longitude: worker.longitude }}
      onPress={() => onPress(worker)}
      // anchor at bottom-center of the tail — this is critical on Android Google Maps
      anchor={{ x: 0.5, y: 1.0 }}
      tracksViewChanges={!imageReady}
    >
      {/* Wrapper: avatar circle + tail below, centered */}
      <View style={styles.wrapper}>
        {/* Avatar ring */}
        <View style={[styles.ring, selected && styles.ringSelected]}>
          {worker.avatarUrl ? (
            <Image
              source={{ uri: worker.avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
              onLoad={() => setImageReady(true)}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Trade badge — sits at top-right outside the ring */}
        <View style={styles.badge}>
          <Ionicons name={tradeIcon} size={9} color={colors.primary} />
        </View>

        {/* Tail triangle */}
        <View style={[styles.tail, selected && styles.tailSelected]} />
      </View>
    </Marker>
  );
}

export default memo(WorkerMapPin);

const BORDER = 3;
const RING   = 46;
const INNER  = RING - BORDER * 2; // 40 — the circular image area inside the border

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', elevation: 6 },

  // Circular border ring — NO overflow:hidden because elevation breaks it on Android
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: BORDER,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    // iOS shadow only — Android uses elevation on the wrapper instead
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  ringSelected: {
    borderColor: colors.primaryDark,
    borderWidth: 4,
  },

  // Image has its own borderRadius — does NOT rely on parent overflow:hidden
  avatar: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
  },
  avatarFallback: {
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
    fontSize: 13,
  },

  // Trade icon badge — absolutely over top-right of ring
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },

  // Downward-pointing triangle
  tail: {
    marginTop: -1,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
  tailSelected: {
    borderTopColor: colors.primaryDark,
  },
});
