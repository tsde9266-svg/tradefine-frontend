import { useCallback, useEffect, useRef, useState } from 'react';
import { getNearbyWorkers, NearbyParams } from '../services/workers';
import { useWorkerStore } from '../stores/workerStore';
import { useLocationStore } from '../stores/locationStore';

export function useNearbyWorkers(params: Partial<NearbyParams> = {}) {
  const { currentLocation } = useLocationStore();
  const { setNearbyWorkers } = useWorkerStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const fetch = useCallback(async () => {
    if (!currentLocation) return;
    setLoading(true);
    setError(null);
    try {
      const workers = await getNearbyWorkers({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        radiusKm: 10,
        ...params,
      });
      if (mountedRef.current) {
        setNearbyWorkers(workers);
      }
    } catch {
      if (mountedRef.current) setError('Could not load nearby workers');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentLocation, JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { loading, error, refetch: fetch };
}
