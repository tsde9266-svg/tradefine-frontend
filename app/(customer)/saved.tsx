import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WorkerCardLarge from '../../components/worker/WorkerCardLarge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { getSavedWorkers, unsaveWorker } from '../../services/workers';
import { useWorkerStore } from '../../stores/workerStore';
import { Worker } from '../../types/worker';

export default function SavedScreen() {
  const { show } = useToast();
  const { toggleSave } = useWorkerStore();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSavedWorkers();
        setWorkers(data);
      } catch {
        show('Could not load saved workers', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUnsave = useCallback(async (workerId: string) => {
    try {
      await unsaveWorker(workerId);
      await toggleSave(workerId);
      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      show('Removed from saved', 'info');
    } catch {
      show('Could not remove worker', 'error');
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Worker }) => (
      <WorkerCardLarge
        worker={item}
        showUnsave
        onUnsave={() => handleUnsave(item.id)}
      />
    ),
    [handleUnsave],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Saved Tradespeople</Text>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={100} borderRadius={14} style={styles.skeleton} />
          ))}
        </View>
      ) : workers.length === 0 ? (
        <EmptyState
          illustration={require('../../assets/illustrations/empty_state_illustration_for_saved_items_an_empty_bookmark_ribbon_with_a_dashed.png')}
          title="No saved tradespeople"
          subtitle="Save workers you trust for quick access"
        />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  skeletons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  skeleton: {
    marginBottom: spacing.sm,
  },
});
