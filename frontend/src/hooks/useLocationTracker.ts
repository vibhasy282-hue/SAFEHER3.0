'use client';

import { useEffect, useRef, useCallback } from 'react';
import { locationAPI } from '@/lib/api';

export function useLocationTracker() {
  const watchId = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await locationAPI.update({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
          });
        } catch (error) {
          console.error('Location update error:', error);
        }
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  return { startTracking, stopTracking };
}
