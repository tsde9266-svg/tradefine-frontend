import { useEffect, useRef } from 'react';
import { startTracking, stopTracking, onWorkerMoved } from '../services/socket';
import { useTrackingStore, TrackingPosition } from '../stores/trackingStore';

export function useWorkerTracking(workerId: string | null) {
  const { startTracking: storeStart, updatePosition, stopTracking: storeStop } =
    useTrackingStore();
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!workerId) return;

    storeStart(workerId);
    startTracking(workerId);

    unsubRef.current = onWorkerMoved((data) => {
      updatePosition({ latitude: data.lat, longitude: data.lng });
    });

    return () => {
      stopTracking(workerId);
      storeStop();
      unsubRef.current?.();
    };
  }, [workerId]);

  return useTrackingStore();
}
