import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '../stores/locationStore';

export function useLocation() {
  const { currentLocation, permissionStatus, setLocation, setPermissionStatus } =
    useLocationStore();

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status as 'granted' | 'denied' | 'undetermined');

      if (status === 'granted') {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } catch {}
      }
    })();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status as 'granted' | 'denied' | 'undetermined');
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      return true;
    }
    return false;
  };

  const refreshLocation = async (): Promise<void> => {
    if (permissionStatus !== 'granted') return;
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {}
  };

  return { currentLocation, permissionStatus, requestPermission, refreshLocation };
}
