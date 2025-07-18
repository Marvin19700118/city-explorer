'use client';

import { useState, useEffect, useRef } from 'react';

const MAP_WIDTH = 100;
const MAP_HEIGHT = 100;
const SPEED_KMH = 5; // walking speed
const UPDATE_INTERVAL_MS = 2000;

export const useLocationTracker = () => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [distance, setDistance] = useState(0);
  const previousPositionRef = useRef(position);

  useEffect(() => {
    const interval = setInterval(() => {
      const angle = Math.random() * 2 * Math.PI;
      const distancePerInterval = (SPEED_KMH * 1000 / 3600) * (UPDATE_INTERVAL_MS / 1000);
      
      // We scale distance for game purposes. A "map unit" is not a meter.
      // Let's say 1 map unit = 10 meters. So distance in map units is distancePerInterval / 10.
      const step = distancePerInterval / 10;

      setPosition(prev => {
        const newPos = {
          x: Math.max(0, Math.min(MAP_WIDTH, prev.x + Math.cos(angle) * step)),
          y: Math.max(0, Math.min(MAP_HEIGHT, prev.y + Math.sin(angle) * step)),
        };
        previousPositionRef.current = prev;
        return newPos;
      });

    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const prev = previousPositionRef.current;
    const dx = position.x - prev.x;
    const dy = position.y - prev.y;
    // Again, this is in map units. We convert back to a "real" distance for our stats.
    const distanceInMapUnits = Math.sqrt(dx * dx + dy * dy);
    const distanceInKm = distanceInMapUnits * 10 / 1000;

    if (distanceInKm > 0) {
        setDistance(d => d + distanceInKm);
    }
  }, [position]);

  return { position, distance };
};
