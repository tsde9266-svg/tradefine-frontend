import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Worker } from '../types/worker';

const SAVED_KEY = 'tf_saved_workers';

interface WorkerFilters {
  trade: string | null;
  availableOnly: boolean;
  radiusKm: number;
  sortBy: 'distance' | 'rating';
}

interface WorkerState {
  nearbyWorkers: Worker[];
  selectedWorker: Worker | null;
  savedWorkerIds: string[];
  filters: WorkerFilters;

  setNearbyWorkers: (workers: Worker[]) => void;
  setSelectedWorker: (worker: Worker | null) => void;
  setFilters: (filters: Partial<WorkerFilters>) => void;
  toggleSave: (workerId: string) => Promise<void>;
  loadSavedIds: () => Promise<void>;
  isSaved: (workerId: string) => boolean;
}

export const useWorkerStore = create<WorkerState>((set, get) => ({
  nearbyWorkers: [],
  selectedWorker: null,
  savedWorkerIds: [],
  filters: {
    trade: null,
    availableOnly: false,
    radiusKm: 10,
    sortBy: 'distance',
  },

  setNearbyWorkers: (nearbyWorkers) => set({ nearbyWorkers }),
  setSelectedWorker: (selectedWorker) => set({ selectedWorker }),

  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),

  toggleSave: async (workerId) => {
    const { savedWorkerIds } = get();
    const next = savedWorkerIds.includes(workerId)
      ? savedWorkerIds.filter((id) => id !== workerId)
      : [...savedWorkerIds, workerId];
    set({ savedWorkerIds: next });
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
  },

  loadSavedIds: async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_KEY);
      if (raw) set({ savedWorkerIds: JSON.parse(raw) });
    } catch {}
  },

  isSaved: (workerId) => get().savedWorkerIds.includes(workerId),
}));
