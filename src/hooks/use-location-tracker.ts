'use client';

import { useState, useEffect, useRef } from 'react';

// Haversine formula to calculate distance between two lat/lng points
const haversineDistance = (
  coords1: { latitude: number; longitude: number },
  coords2: { latitude: number; longitude: number }
) => {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const useLocationTracker = () => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const previousPositionRef = useRef<{ latitude: number, longitude: number} | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMounted) return;
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        previousPositionRef.current = { latitude, longitude };
        setLoading(false);
      },
      (err) => {
        if (!isMounted) return;
        setError(`Error getting location: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
    
    // Watch for position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isMounted) return;
        const { latitude, longitude } = pos.coords;
        const newPosition = { lat: latitude, lng: longitude };
        setPosition(newPosition);

        if (previousPositionRef.current) {
          const newDistance = haversineDistance(
            previousPositionRef.current,
            { latitude, longitude }
          );
          setDistance((d) => d + newDistance);
        }
        previousPositionRef.current = { latitude, longitude };
      },
      (err) => {
         if (!isMounted) return;
        setError(`Error watching location: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 10, // Update every 10 meters
      }
    );

    return () => {
      isMounted = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { position, distance, error, loading };
};
