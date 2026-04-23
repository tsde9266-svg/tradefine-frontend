import { create } from 'zustand';
import { Worker } from '../types/worker';

interface WorkerProfileState {
  profile: Worker | null;
  isAvailable: boolean;

  setProfile: (profile: Worker) => void;
  setAvailable: (available: boolean) => void;
  updateProfile: (updates: Partial<Worker>) => void;
}

export const useWorkerProfileStore = create<WorkerProfileState>((set) => ({
  profile: null,
  isAvailable: false,

  setProfile: (profile) => set({ profile, isAvailable: profile.isAvailable }),
  setAvailable: (isAvailable) =>
    set((state) => ({
      isAvailable,
      profile: state.profile ? { ...state.profile, isAvailable } : null,
    })),
  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),
}));
