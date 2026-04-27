import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { T } from '../../constants/tokens';
import { shadows } from '../../constants/shadows';
import { getNearbyWorkers } from '../../services/workers';
import { useLocation } from '../../hooks/useLocation';
import { Worker } from '../../types/worker';
import { formatDistance, formatRating } from '../../utils/formatters';

type SortKey = 'nearest' | 'rating' | 'available';

const BIRMINGHAM = { latitude: 52.4862, longitude: -1.8904 };

function StarRow({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline';
    stars.push(
      <Ionicons key={i} name={fill as any} size={13} color={T.orange} />,
    );
  }
  return <View style={styles.stars}>{stars}</View>;
}

function WorkerCard({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  const isAvail = worker.isAvailable;
  const distanceText = worker.distance != null ? formatDistance(worker.distance) : null;
  const tradeLabel = [worker.trades[0], distanceText].filter(Boolean).join(' • ');

  const handleCall = (e: any) => {
    e.stopPropagation();
    if (worker.phone) Linking.openURL(`tel:${worker.phone}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}
      onPress={onPress}
    >
      <View style={styles.cardRow}>
        {/* Avatar */}
        {worker.avatarUrl ? (
          <Image source={{ uri: worker.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>
              {worker.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.workerName} numberOfLines={1}>{worker.name}</Text>
            <Ionicons name="bookmark-outline" size={18} color={T.text3} />
          </View>

          <Text style={styles.tradeText} numberOfLines={1}>{tradeLabel}</Text>

          <View style={styles.ratingRow}>
            <StarRow rating={worker.rating} />
            <Text style={styles.ratingText}>{formatRating(worker.rating)} ({worker.reviewCount})</Text>
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.chipVerified}>
              <Text style={styles.chipVerifiedText}>VERIFIED</Text>
            </View>
            {isAvail ? (
              <View style={styles.chipAvail}>
                <Text style={styles.chipAvailText}>AVAILABLE NOW</Text>
              </View>
            ) : (
              <View style={styles.chipBusy}>
                <Text style={styles.chipBusyText}>BUSY</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* CTA */}
      {isAvail ? (
        <Pressable style={styles.ctaCall} onPress={handleCall}>
          <Ionicons name="call" size={17} color="#fff" />
          <Text style={styles.ctaCallText}>Call Now</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.ctaQuote} onPress={onPress}>
          <Ionicons name="calendar-outline" size={17} color={T.text2} />
          <Text style={styles.ctaQuoteText}>Request Quote</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const { currentLocation } = useLocation();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(params.q ?? '');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSort, setActiveSort] = useState<SortKey>('nearest');

  const search = useCallback(async (q: string, sort: SortKey) => {
    setLoading(true);
    const loc = currentLocation ?? BIRMINGHAM;
    try {
      const results = await getNearbyWorkers({
        lat: loc.latitude,
        lng: loc.longitude,
        radiusKm: 25,
        trade: q || undefined,
        availableOnly: sort === 'available' ? true : undefined,
        sortBy: sort === 'rating' ? 'rating' : 'distance',
      });
      setWorkers(results);
    } catch {
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
      search(params.q, activeSort);
    } else {
      search('', activeSort);
    }
  }, []);

  useEffect(() => {
    search(query, activeSort);
  }, [activeSort]);

  const title = query || 'Search Results';
  const subtitle = loading ? 'Searching…' : `${workers.length} results near you`;
  const NAV_TOP = insets.top + 12;
  const CONTENT_TOP = NAV_TOP + 56 + 16;

  const filterChips: { key: SortKey; label: string }[] = [
    { key: 'nearest',   label: 'Nearest' },
    { key: 'rating',    label: 'Top Rated' },
    { key: 'available', label: 'Available Now' },
  ];

  return (
    <View style={styles.screen}>
      {/* Floating nav */}
      <View style={[styles.nav, { top: NAV_TOP }]}>
        <Pressable style={styles.navBack} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={T.text1} />
        </Pressable>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.navSubtitle}>{subtitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={workers}
        keyExtractor={(w) => w.id}
        contentContainerStyle={[styles.list, { paddingTop: CONTENT_TOP }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Search bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={T.text3} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => search(query, activeSort)}
                placeholder="Search trades..."
                placeholderTextColor={T.text3}
                returnKeyType="search"
              />
              <Pressable hitSlop={8} onPress={() => {}}>
                <Ionicons name="options-outline" size={18} color={T.text2} />
              </Pressable>
            </View>

            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContent}
            >
              {filterChips.map((chip) => (
                <Pressable
                  key={chip.key}
                  style={[styles.filterChip, activeSort === chip.key && styles.filterChipActive]}
                  onPress={() => { Haptics.selectionAsync(); setActiveSort(chip.key); }}
                >
                  <Text style={[styles.filterChipText, activeSort === chip.key && styles.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={styles.filterChip}>
                <Text style={styles.filterChipText}>Price</Text>
              </Pressable>
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <WorkerCard
            worker={item}
            onPress={() => router.push(`/(customer)/worker/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  nav: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.nav,
    height: 56,
    paddingHorizontal: 8,
    ...shadows.md,
  },
  navBack: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: T.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: { flex: 1, alignItems: 'center' },
  navTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: T.text1,
    letterSpacing: -0.1,
  },
  navSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: T.text2,
    marginTop: 1,
  },

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F8',
    borderRadius: T.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: T.text1,
    padding: 0,
  },

  chipsScroll: { marginBottom: 16 },
  chipsContent: { gap: 10 },
  filterChip: {
    backgroundColor: '#DCE2F3',
    borderRadius: T.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: T.orange },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: T.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterChipTextActive: { color: '#fff' },

  card: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...shadows.sm,
  },
  cardRow: { flexDirection: 'row', gap: 14 },

  avatar: { width: 88, height: 88, borderRadius: 8, flexShrink: 0 },
  avatarFallback: {
    backgroundColor: T.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: T.orangeDark,
  },

  cardInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: T.text1,
    flexShrink: 1,
  },
  tradeText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: T.text2,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stars: { flexDirection: 'row', gap: 1 },
  ratingText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: T.text2,
  },

  chipsRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  chipVerified: {
    backgroundColor: '#E2E8F8',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipVerifiedText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: T.text2,
    letterSpacing: 0.3,
  },
  chipAvail: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipAvailText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#2E7D32',
    letterSpacing: 0.3,
  },
  chipBusy: {
    backgroundColor: '#D3DAEA',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipBusyText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: T.text2,
    letterSpacing: 0.3,
  },

  ctaCall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.orange,
    borderRadius: 10,
    paddingVertical: 14,
  },
  ctaCallText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  ctaQuote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E2E8F8',
    borderRadius: 10,
    paddingVertical: 14,
  },
  ctaQuoteText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: T.text2,
  },
});
