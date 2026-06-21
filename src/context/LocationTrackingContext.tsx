
'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { LatLng, CurrentArea } from '@/lib/types';

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

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";


interface LocationContextType {
  position: LatLng | null;
  distance: number;
  path: LatLng[];
  error: string | null;
  loading: boolean;
  isTracking: boolean;
  currentArea: CurrentArea | null;
  elevationGain: number;
  speed: number | null;
  setCurrentArea: React.Dispatch<React.SetStateAction<CurrentArea | null>>;
  startTracking: () => void;
  stopTracking: () => void;
  getAreaNameFromPosition: (pos: LatLng) => Promise<CurrentArea | null>;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const LocationTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState(0);
  const [path, setPath] = useState<LatLng[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [currentArea, setCurrentArea] = useState<CurrentArea | null>(null);
  const [elevationGain, setElevationGain] = useState(0);
  const [speed, setSpeed] = useState<number | null>(null);

  const previousPositionRef = useRef<{ latitude: number, longitude: number} | null>(null);
  const previousAltitudeRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const getAreaNameFromPosition = useCallback(async (pos: {lat: number, lng: number}): Promise<CurrentArea | null> => {
     if (!GOOGLE_MAPS_API_KEY || typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.Geocoder) return null;
     
     try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: pos, language: 'zh-TW' });
        
        if (response.results && response.results.length > 0) {
            const result = response.results[0];
            const components = result.address_components;
            const get = (type: string) => components.find(c => c.types.includes(type))?.long_name || '';

            const city = get('administrative_area_level_1').replace('臺', '台');
            const district = get('administrative_area_level_2') || get('locality');
            
            let fullAddress = city + district;

            return { city, district, fullAddress, county: city };
        }
        return null;
     } catch (err) {
        console.error("Reverse geocoding failed. This might be due to API quota or network issues.", err);
        return null;
     }
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    previousPositionRef.current = null;
    previousAltitudeRef.current = null;
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    if (watchIdRef.current !== null) return;

    setIsTracking(true);
    setDistance(0);
    setElevationGain(0);
    previousPositionRef.current = null;
    previousAltitudeRef.current = null;
    setPath(position ? [position] : []);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPosition = { lat: latitude, lng: longitude };
        setPosition(newPosition);
        setPath(p => [...p, newPosition]);
        // speed in m/s → convert to km/h
        setSpeed(pos.coords.speed != null ? pos.coords.speed * 3.6 : null);

        if (previousPositionRef.current) {
          const newDistance = haversineDistance(
            previousPositionRef.current,
            { latitude, longitude }
          );
          setDistance((d) => d + newDistance);
        }
        previousPositionRef.current = { latitude, longitude };

        const altitude = pos.coords.altitude;
        if (altitude !== null) {
          if (previousAltitudeRef.current !== null) {
            const gain = altitude - previousAltitudeRef.current;
            if (gain > 2) setElevationGain(g => g + gain);
          }
          previousAltitudeRef.current = altitude;
        }
        if (loading) setLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
            setError('Location access denied. Please enable location permissions.');
        } else {
            setError(`Error watching location: ${err.message}`);
        }
        stopTracking();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, distanceFilter: 10 }
    );
  }, [loading, position, stopTracking]);

  // Initial position fetch
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        setPosition(newPos);
        previousPositionRef.current = { latitude, longitude };
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
            setError('Location access denied. Please enable permissions.');
        } else {
            setError(`Error getting location: ${err.message}`);
        }
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // Update current area name when position changes
  useEffect(() => {
    if (position) {
      getAreaNameFromPosition(position).then(area => {
        if (area) setCurrentArea(area);
      });
    }
  }, [position, getAreaNameFromPosition]);

  return (
    <LocationContext.Provider value={{
        position,
        distance,
        path,
        error,
        loading,
        isTracking,
        currentArea,
        elevationGain,
        speed,
        setCurrentArea,
        startTracking,
        stopTracking,
        getAreaNameFromPosition
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationTrackingProvider');
  }
  return context;
};
