'use client';

import * as React from 'react';
import { MapPin } from 'lucide-react';
import { StatusBar } from '@/components/StatusBar';
import { GameMap } from '@/components/Map';
import { QuizModal } from '@/components/QuizModal';
import { useLocationTracker } from '@/hooks/use-location-tracker';
import type { Pet, PointOfInterest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const initialPois: PointOfInterest[] = [
  { id: 'poi1', name: 'Central Park', position: { lat: 40.785091, lng: -73.968285 }, areaDescription: 'A large urban park in Manhattan, New York City, featuring walking paths, a zoo, and a carousel.', discovered: false },
  { id: 'poi2', name: 'Eiffel Tower', position: { lat: 48.8584, lng: 2.2945 }, areaDescription: 'A wrought-iron lattice tower on the Champ de Mars in Paris, France.', discovered: false },
  { id: 'poi3', name: 'Colosseum', position: { lat: 41.8902, lng: 12.4922 }, areaDescription: 'An oval amphitheatre in the centre of the city of Rome, Italy.', discovered: false },
  { id: 'poi4', name: 'Mount Fuji', position: { lat: 35.3606, lng: 138.7278 }, areaDescription: 'An active volcano that is Japan\'s tallest peak, known for its symmetrical cone.', discovered: false },
];

const XP_PER_KM = 100;
const PET_EVOLUTION_LEVELS = [5, 10, 15];

export default function MapPage() {
  const { position, distance, error } = useLocationTracker();
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
    if (!position) return;
      
    // Haversine formula to calculate distance between two lat/lng points
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
      
    const DISCOVERY_RADIUS_KM = 1; // 1km discovery radius
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
  }, [position, pois, toast]);

  const handleStartQuiz = (poi: PointOfInterest) => {
    setActiveQuizPoi(poi);
  };

  const handleCloseQuiz = () => {
    setActiveQuizPoi(null);
  };

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="flex h-full flex-col">
        <header className="flex items-center justify-center gap-2 p-4 font-headline text-2xl font-bold text-primary">
          <MapPin className="h-6 w-6" />
          <h1>City Unveiler</h1>
        </header>

        <div className="relative flex-1">
          {!googleMapsApiKey ? (
            <div className="p-4">
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Google Maps API Key Missing</AlertTitle>
                <AlertDescription>
                  Please add your Google Maps API key to .env to display the map.
                </AlertDescription>
              </Alert>
            </div>
          ) : error ? (
            <div className="p-4">
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Location Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <GameMap
              apiKey={googleMapsApiKey}
              userPosition={position}
              pois={pois}
              onStartQuiz={handleStartQuiz}
            />
          )}
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
