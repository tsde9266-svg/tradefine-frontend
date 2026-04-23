import { create } from 'zustand';

export interface TrackingPosition {
  latitude: number;
  longitude: number;
}

interface TrackingState {
  isTracking: boolean;
  activeWorkerId: string | null;
  workerPosition: TrackingPosition | null;

  startTracking: (workerId: string, initialPosition?: TrackingPosition) => void;
  updatePosition: (position: TrackingPosition) => void;
  stopTracking: () => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  isTracking: false,
  activeWorkerId: null,
  workerPosition: null,

  startTracking: (activeWorkerId, initialPosition) =>
    set({ isTracking: true, activeWorkerId, workerPosition: initialPosition ?? null }),

  updatePosition: (workerPosition) => set({ workerPosition }),

  stopTracking: () =>
    set({ isTracking: false, activeWorkerId: null, workerPosition: null }),
}));
