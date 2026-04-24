import React, { useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';
import { formatDistance, formatRating } from '../../utils/formatters';
import { Worker } from '../../types/worker';

const SHEET_CONTENT = 260;

interface Props {
  workers: Worker[];
  visible: boolean;
}

export default function MapBottomSheet({ workers, visible }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPad = insets.bottom + spacing.sm;
  const sheetHeight = SHEET_CONTENT + bottomPad;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : sheetHeight,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [visible, sheetHeight]);

  return (
    <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]}>
      <View style={styles.handle} />
      <View style={styles.titleRow}>
        <Text style={styles.title}>
          {workers.length} {workers.length !== 1 ? 'tradespeople' : 'tradesperson'} near you
        </Text>
        <Pressable onPress={() => router.push('/(customer)/search')}>
          <Text style={styles.viewList}>View List</Text>
        </Pressable>
      </View>
      <FlatList
        data={workers}
        keyExtractor={(w, i) => w.id ?? String(i)}
        renderItem={({ item }) => (
          <MapWorkerCard
            worker={item}
            onPress={() => router.push(`/(customer)/worker/${item.id}`)}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        removeClippedSubviews
      />
    </Animated.View>
  );
}

function MapWorkerCard({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  const handleCall = () => Linking.openURL(`tel:${worker.phone}`);
  const isAvail = worker.isAvailable;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]} onPress={onPress}>
      {/* Avatar + availability dot */}
      <View style={styles.avatarWrap}>
        {worker.avatarUrl
          ? <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
          : <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>
                {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
        }
        <View style={[styles.dot, { backgroundColor: isAvail ? colors.available : colors.unavailable }]} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.badgeRow}>
          <View style={[styles.availBadge, isAvail ? styles.availBadgeGreen : styles.availBadgeGray]}>
            <Text style={[styles.availBadgeText, { color: isAvail ? colors.success : colors.textDisabled }]}>
              {isAvail ? 'AVAILABLE' : 'BUSY'}
            </Text>
          </View>
        </View>
        <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
        <Text style={styles.trade} numberOfLines={1}>{worker.trades[0]}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={styles.rating}>{formatRating(worker.rating)}</Text>
          {worker.distance != null && (
            <Text style={styles.distance}>· {formatDistance(worker.distance)}</Text>
          )}
          {!!worker.pricingNotes && (
            <Text style={styles.rate} numberOfLines={1}>{worker.pricingNotes}</Text>
          )}
        </View>
      </View>

      {/* Call button */}
      <Pressable
        style={styles.callBtn}
        onPress={e => { e.stopPropagation?.(); handleCall(); }}
      >
        <Ionicons name="call" size={16} color={colors.textInverse} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    ...shadows.lg,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: { ...typography.h4, color: colors.textPrimary },
  viewList: { ...typography.small, color: colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    gap: spacing.md,
    width: 280,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.bodyMd, color: colors.primaryDark, fontWeight: '700' },
  dot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: colors.surface,
  },
  info: { flex: 1, gap: 2 },
  badgeRow: { marginBottom: 2 },
  availBadge: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  availBadgeGreen: { backgroundColor: colors.successBg },
  availBadgeGray: { backgroundColor: colors.surfaceElevated },
  availBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  name: { ...typography.h4, color: colors.textPrimary },
  trade: { ...typography.caption, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  distance: { ...typography.caption, color: colors.textSecondary },
  rate: { ...typography.caption, color: colors.primary, fontWeight: '700', marginLeft: 'auto' },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
});
