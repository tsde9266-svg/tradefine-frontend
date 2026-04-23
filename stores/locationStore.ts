import { create } from 'zustand';

export interface Coords {
  latitude: number;
  longitude: number;
}

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface LocationState {
  currentLocation: Coords | null;
  permissionStatus: PermissionStatus;
  setLocation: (coords: Coords) => void;
  setPermissionStatus: (status: PermissionStatus) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  permissionStatus: 'undetermined',
  setLocation: (coords) => set({ currentLocation: coords }),
  setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
  clearLocation: () => set({ currentLocation: null }),
}));
