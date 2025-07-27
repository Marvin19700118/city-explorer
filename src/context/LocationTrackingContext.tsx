
'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { LatLng, CityPoints, CurrentArea } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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

const taiwanCounties = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '基隆市', '新竹市',
  '嘉義市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣',
  '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'
];

// XP per 100 meters
const XP_PER_100_METERS = 10;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";


interface LocationContextType {
  position: LatLng | null;
  distance: number;
  path: LatLng[];
  error: string | null;
  loading: boolean;
  isTracking: boolean;
  currentArea: CurrentArea | null;
  setCurrentArea: React.Dispatch<React.SetStateAction<CurrentArea | null>>;
  startTracking: () => void;
  stopTracking: () => void;
  addXp: (xpGained: number, forCounty?: string) => void;
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

  const previousPositionRef = useRef<{ latitude: number, longitude: number} | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastDistanceRef = React.useRef(0);
  const { toast } = useToast();

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

  const addXp = useCallback(async (xpGained: number, forCounty?: string) => {
    if (xpGained <= 0) return;

    let targetCounty = forCounty;

    if (!targetCounty && position) {
      const area = await getAreaNameFromPosition(position);
      if (area) targetCounty = area.county;
    }

    if (!targetCounty) return;

    const normalizedCounty = taiwanCounties.find(c => targetCounty!.includes(c.replace(/[市縣]/, ''))) || targetCounty;

    try {
        const savedPointsJSON = localStorage.getItem('cityPoints');
        const cityPoints: CityPoints = savedPointsJSON ? JSON.parse(savedPointsJSON) : {};
        
        cityPoints[normalizedCounty] = (cityPoints[normalizedCounty] || 0) + xpGained;
        
        localStorage.setItem('cityPoints', JSON.stringify(cityPoints));

    } catch (error) {
        console.error("Failed to update cityPoints in localStorage:", error);
        toast({
            title: "分數儲存失敗",
            description: "無法更新您的成就分數。",
            variant: "destructive",
        });
    }
  }, [position, getAreaNameFromPosition, toast]);


  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
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
    lastDistanceRef.current = 0;
    setPath(p => position ? [position] : []);

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

  // XP for exploration
  useEffect(() => {
    if (isTracking && distance > lastDistanceRef.current) {
        const distanceGained = distance - lastDistanceRef.current; // in km
        const xpGained = Math.floor((distanceGained * 1000) / 100) * XP_PER_100_METERS;
        
        if (xpGained > 0) {
            addXp(xpGained);
        }
        
        lastDistanceRef.current = distance;
    }
  }, [distance, isTracking, addXp]);


  return (
    <LocationContext.Provider value={{
        position,
        distance,
        path,
        error,
        loading,
        isTracking,
        currentArea,
        setCurrentArea,
        startTracking,
        stopTracking,
        addXp,
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
