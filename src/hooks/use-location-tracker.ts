'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
  const [path, setPath] = useState<{ lat: number; lng: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);

  const previousPositionRef = useRef<{ latitude: number, longitude: number} | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    previousPositionRef.current = null;
  }, []);

  const startTracking = useCallback(() => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    if (isTracking) return;

    setLoading(true);
    setIsTracking(true);
    setPath([]); // Clear previous path

    // Get initial position
     navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        setPosition(newPos);
        setPath(p => [...p, newPos]);
        previousPositionRef.current = { latitude, longitude };
        setLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
            setError('Location access denied. Please enable location permissions in your browser settings.');
        } else {
            setError(`Error getting location: ${err.message}`);
        }
        setLoading(false);
        setIsTracking(false);
      },
      { enableHighAccuracy: true }
    );
    
    // Watch for position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPosition = { lat: latitude, lng: longitude };
        setPosition(newPosition);
        setPath(p => [...p, newPosition]);

        if (previousPositionRef.current) {
          const newDistance = haversineDistance(
            previousPositionRef.current,
            { latitude, longitude }
          );
          setDistance((d) => d + newDistance);
        }
        previousPositionRef.current = { latitude, longitude };
        if (loading) setLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
            setError('Location access denied. Please enable location permissions in your browser settings.');
        } else {
            setError(`Error watching location: ${err.message}`);
        }
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 10, // Update every 10 meters
      }
    );
  }, [isTracking, stopTracking, loading]);

  useEffect(() => {
    // On mount, just set loading to false. Tracking will be manually started.
    setLoading(false);
    // Stop tracking when component unmounts
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return { position, distance, error, loading, isTracking, path, startTracking, stopTracking };
};
