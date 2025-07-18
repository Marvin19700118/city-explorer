'use client';

import * as React from 'react';
import { MapPin, Play, Square } from 'lucide-react';
import { StatusBar } from '@/components/StatusBar';
import { GameMap } from '@/components/Map';
import { QuizModal } from '@/components/QuizModal';
import { useLocationTracker } from '@/hooks/use-location-tracker';
import type { Pet, PointOfInterest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const TAIPEI_CENTER = { lat: 25.0330, lng: 121.5654 };

const initialPois: PointOfInterest[] = [
  { id: 'poi1', name: 'Taipei 101', position: { lat: 25.0339, lng: 121.5645 }, areaDescription: 'A supertall skyscraper in Xinyi District, Taipei, Taiwan. It was officially the world\'s tallest from its opening in 2004 until 2010.', discovered: false },
  { id: 'poi2', name: 'National Palace Museum', position: { lat: 25.1026, lng: 121.5485 }, areaDescription: 'Located in Shilin, Taipei, it has a permanent collection of nearly 700,000 pieces of ancient Chinese imperial artifacts and artworks, making it one of the largest of its type in the world.', discovered: false },
  { id: 'poi3', name: 'Chiang Kai-shek Memorial Hall', position: { lat: 25.0345, lng: 121.5218 }, areaDescription: 'A national monument, landmark and tourist attraction erected in memory of Chiang Kai-shek, former President of the Republic of China.', discovered: false },
  { id: 'poi4', name: 'Ximending', position: { lat: 25.0479, lng: 121.5074 }, areaDescription: 'A neighborhood and shopping district in the Wanhua District of Taipei, Taiwan. It was the first pedestrian zone in Taiwan.', discovered: false },
];

const XP_PER_KM = 100;
const PET_EVOLUTION_LEVELS = [5, 10, 15];

export default function MapPage() {
  const { position, distance, path, error, loading, isTracking, startTracking, stopTracking } = useLocationTracker();
  const { toast } = useToast();

  const [pet, setPet] = React.useState<Pet>({
    name: 'Sparky',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    evolutionStage: 1,
  });

  const [pois, setPois] = React.useState<PointOfInterest[]>(initialPois);
  const [activeQuizPoi, setActiveQuizPoi] = React.useState<PointOfInterest | null>(null);

  React.useEffect(() => {
    const newXp = distance * XP_PER_KM;
    
    setPet(currentPet => {
        if (newXp <= currentPet.xp) return currentPet;

        let currentXp = newXp;
        let currentLevel = currentPet.level;
        let xpForNext = currentPet.xpToNextLevel;
        let currentEvolutionStage = currentPet.evolutionStage;

        while (currentXp >= xpForNext) {
            currentXp -= xpForNext;
            currentLevel++;
            xpForNext = Math.floor(xpForNext * 1.5);
            
            const newEvolutionStage = PET_EVOLUTION_LEVELS.filter(l => currentLevel >= l).length + 1;
            if (newEvolutionStage > currentEvolutionStage) {
                currentEvolutionStage = newEvolutionStage;
                toast({
                    title: "Your pet evolved!",
                    description: `${currentPet.name} has reached a new form!`,
                });
            } else {
                toast({
                    title: "Level Up!",
                    description: `${currentPet.name} is now level ${currentLevel}!`,
                });
            }
        }

        return {
            ...currentPet,
            xp: Math.round(currentXp),
            level: currentLevel,
            xpToNextLevel: xpForNext,
            evolutionStage: currentEvolutionStage,
        };
    });

  }, [distance, toast]);

  React.useEffect(() => {
    if (!position || !isTracking) return;
      
    const getDistanceInKm = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (pos2.lat - pos1.lat) * (Math.PI / 180);
      const dLon = (pos2.lng - pos1.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pos1.lat * (Math.PI / 180)) *
        Math.cos(pos2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
      
    const DISCOVERY_RADIUS_KM = 0.5; // 500 meters
    const undiscoveredPois = pois.filter(p => !p.discovered);

    for (const poi of undiscoveredPois) {
      const dist = getDistanceInKm(poi.position, position);

      if (dist < DISCOVERY_RADIUS_KM) {
        setPois(prevPois => prevPois.map(p => p.id === poi.id ? { ...p, discovered: true } : p));
        toast({
            title: "New Area Discovered!",
            description: `You've unveiled ${poi.name}.`,
            variant: "default",
        });
      }
    }
  }, [position, pois, toast, isTracking]);

  const handleStartQuiz = (poi: PointOfInterest) => {
    setActiveQuizPoi(poi);
  };

  const handleCloseQuiz = () => {
    setActiveQuizPoi(null);
  };

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const renderMapContent = () => {
    if (!googleMapsApiKey) {
      return (
        <div className="p-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Google Maps API Key Missing</AlertTitle>
            <AlertDescription>
              Please add your Google Maps API key to the .env file to display the map.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    if (error && !isTracking) {
       return (
        <div className="p-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Location Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      );
    }

    if (loading && !position) {
       return <Skeleton className="h-full w-full" />
    }
    
    return (
       <GameMap
        apiKey={googleMapsApiKey}
        userPosition={position}
        defaultCenter={TAIPEI_CENTER}
        pois={pois}
        path={path}
        onStartQuiz={handleStartQuiz}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-2 p-4 font-headline text-2xl font-bold text-primary">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            <h1>City Unveiler</h1>
          </div>
          {!isTracking ? (
            <Button onClick={startTracking} disabled={loading && isTracking}>
              <Play /> Start Exploring
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="destructive">
              <Square /> Stop
            </Button>
          )}
        </header>

        <div className="relative flex-1">
          {renderMapContent()}
        </div>

        <div className="border-t-2 border-primary/20 p-2">
          <StatusBar distance={distance} pet={pet} />
        </div>
      <QuizModal
        poi={activeQuizPoi}
        isOpen={!!activeQuizPoi}
        onClose={handleCloseQuiz}
      />
    </div>
  );
}
