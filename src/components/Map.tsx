'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PointOfInterest } from '@/lib/types';
import { Button } from './ui/button';
import { MapPin, Sparkles } from 'lucide-react';

type GameMapProps = {
  userPosition: { x: number; y: number };
  pois: PointOfInterest[];
  onStartQuiz: (poi: PointOfInterest) => void;
};

const FOG_GRID_SIZE = 15;
const REVEAL_RADIUS = 2.5;

export const GameMap = ({ userPosition, pois, onStartQuiz }: GameMapProps) => {
  const fogTiles = React.useMemo(() => {
    return Array.from({ length: FOG_GRID_SIZE * FOG_GRID_SIZE });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-t-lg">
      <Image
        src="https://placehold.co/800x800.png"
        alt="City Map"
        layout="fill"
        objectFit="cover"
        className="opacity-50"
        data-ai-hint="night city map"
      />

      <div className="absolute inset-0 grid grid-cols-15 grid-rows-15">
        {fogTiles.map((_, i) => {
          const x = i % FOG_GRID_SIZE;
          const y = Math.floor(i / FOG_GRID_SIZE);
          const gridX = (userPosition.x / 100) * FOG_GRID_SIZE;
          const gridY = (userPosition.y / 100) * FOG_GRID_SIZE;
          const dist = Math.sqrt(Math.pow(x - gridX, 2) + Math.pow(y - gridY, 2));
          const isRevealed = dist < REVEAL_RADIUS;

          return (
            <div
              key={i}
              className={cn(
                'transition-opacity duration-1000 ease-in-out',
                isRevealed ? 'opacity-0' : 'opacity-100'
              )}
              style={{
                backgroundColor: 'rgba(18, 18, 18, 0.8)',
                backdropFilter: 'blur(2px)',
              }}
            />
          );
        })}
      </div>

      {/* User Pin */}
      <div
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${userPosition.x}%`, top: `${userPosition.y}%`, transition: 'left 2s linear, top 2s linear' }}
      >
        <div className="h-full w-full rounded-full bg-primary ring-4 ring-primary/30 animate-pulse" />
      </div>

      {/* Points of Interest */}
      {pois.map((poi) => (
        <div
          key={poi.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${poi.position.x}%`, top: `${poi.position.y}%` }}
        >
          <Button
            size="icon"
            variant={poi.discovered ? 'default' : 'secondary'}
            className={cn(
              "rounded-full h-10 w-10 transition-all duration-500",
              poi.discovered ? 'scale-100 animate-bounce' : 'scale-75 opacity-70',
              poi.discovered && "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/50"
            )}
            onClick={() => onStartQuiz(poi)}
            disabled={!poi.discovered}
            aria-label={`Start quiz for ${poi.name}`}
          >
            {poi.discovered ? <Sparkles className="h-5 w-5"/> : <MapPin className="h-5 w-5" />}
          </Button>
        </div>
      ))}
    </div>
  );
};
