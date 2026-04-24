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
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function getTradeIcon(trade: string): IoniconName {
  const t = trade.toLowerCase();
  if (t.includes('electr'))  return 'flash';
  if (t.includes('plumb') || t.includes('bathroom')) return 'water';
  if (t.includes('gas'))     return 'flame';
  if (t.includes('carpenter') || t.includes('joiner')) return 'hammer';
  if (t.includes('paint'))   return 'color-palette';
  if (t.includes('landscape') || t.includes('garden')) return 'leaf';
  if (t.includes('lock'))    return 'key';
  if (t.includes('hvac') || t.includes('heating')) return 'thermometer';
  if (t.includes('roof'))    return 'home';
  if (t.includes('tile'))    return 'grid';
  if (t.includes('kitchen')) return 'restaurant';
  if (t.includes('floor'))   return 'layers';
  if (t.includes('architect')) return 'compass';
  if (t.includes('survey'))  return 'analytics';
  if (t.includes('glazier')) return 'glasses-outline';
  if (t.includes('scaffold')) return 'git-network';
  if (t.includes('ground'))  return 'earth';
  if (t.includes('demo'))    return 'warning';
  if (t.includes('damp'))    return 'shield-checkmark';
  if (t.includes('builder') || t.includes('contractor')) return 'construct';
  return 'build';
}

function WorkerMapPin({ worker, onPress, selected = false }: WorkerMapPinProps) {
  const [ready, setReady] = useState(!worker.avatarUrl);

  if (worker.latitude == null || worker.longitude == null) return null;

  return (
    <Marker
      coordinate={{ latitude: worker.latitude, longitude: worker.longitude }}
      onPress={() => onPress(worker)}
      tracksViewChanges={!ready}
    >
      <View style={styles.wrapper}>
        <View style={styles.pinWrap}>
          <View style={[styles.pin, selected && styles.pinSelected]}>
            {worker.avatarUrl ? (
              <Image
                source={{ uri: worker.avatarUrl }}
                style={styles.avatar}
                resizeMode="cover"
                onLoad={() => setReady(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.initials}>{getInitials(worker.name)}</Text>
              </View>
            )}
          </View>
          <View style={styles.badge}>
            <Ionicons name={getTradeIcon(worker.trades[0] ?? '')} size={9} color={colors.primary} />
          </View>
        </View>
        <View style={[styles.tail, selected && styles.tailSelected]} />
      </View>
    </Marker>
  );
}

export default memo(WorkerMapPin);

const AVATAR_SIZE = 36;
const PIN_SIZE = AVATAR_SIZE + 6;  // 42
const BADGE_SIZE = 18;
const WRAP_SIZE = PIN_SIZE + 10;   // 52 — extra room so badge never clips

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  pinWrap: {
    width: WRAP_SIZE,
    height: WRAP_SIZE,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    elevation: 10,
  },
  pin: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: colors.primary,
    padding: 3,
    borderWidth: 2.5,
    borderColor: colors.surface,
    overflow: 'hidden',
    elevation: 6,
  },
  pinSelected: {
    borderColor: colors.primaryDark,
    transform: [{ scale: 1.15 }],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
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
