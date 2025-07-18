'use client';

import * as React from 'react';
import { MapPin, Play, Square, Trophy } from 'lucide-react';
import { StatusBar } from '@/components/StatusBar';
import { GameMap } from '@/components/Map';
import { QuizModal } from '@/components/QuizModal';
import { useLocationTracker } from '@/hooks/use-location-tracker';
import type { Pet, PointOfInterest, Trip } from '@/lib/types';
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

const mockTrip: Trip = {
  id: 'mock-trip-1',
  date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  distance: 1.05,
  path: [
    { lat: 25.0330, lng: 121.5220 },
    { lat: 25.0335, lng: 121.5225 },
    { lat: 25.0340, lng: 121.5230 },
    { lat: 25.0345, lng: 121.5235 },
    { lat: 25.0350, lng: 121.5230 },
    { lat: 25.0355, lng: 121.5225 },
    { lat: 25.0360, lng: 121.5220 },
    { lat: 25.0365, lng: 121.5225 },
    { lat: 25.0370, lng: 121.5230 },
    { lat: 25.0375, lng: 121.5235 },
    { lat: 25.0380, lng: 121.5240 },
  ],
  startTime: new Date(Date.now() - 86400000 - 900000).toISOString(), // Yesterday, 15 minutes duration
  endTime: new Date(Date.now() - 86400000).toISOString(),
};


const XP_PER_KM = 100;
const PET_EVOLUTION_LEVELS = [5, 10, 15];

export default function MapPage() {
  const { position, distance, path, error, loading, isTracking, startTracking, stopTracking: trackerStop } = useLocationTracker();
  const { toast } = useToast();
  
  const [totalDistance, setTotalDistance] = React.useState(0);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const tripStartTimeRef = React.useRef<string | null>(null);
  const prevPetRef = React.useRef<Pet>();

  const [pet, setPet] = React.useState<Pet>({
    name: 'Sparky',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    evolutionStage: 1,
  });

  const [pois, setPois] = React.useState<PointOfInterest[]>([]);
  const [activeQuizPoi, setActiveQuizPoi] = React.useState<PointOfInterest | null>(null);
  
  const handleStartTracking = () => {
    tripStartTimeRef.current = new Date().toISOString();
    startTracking();
  }

  const stopTracking = () => {
    if (path.length > 1 && distance > 0.01) { // only save meaningful trips
      const newTrip: Trip = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        distance: distance,
        path: path,
        startTime: tripStartTimeRef.current,
        endTime: new Date().toISOString(),
      };
      const existingTripsJSON = localStorage.getItem('trips');
      const existingTrips: Trip[] = existingTripsJSON ? JSON.parse(existingTripsJSON) : [];
      const updatedTrips = [...existingTrips, newTrip];
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips); // Update state to re-render map
      toast({
        title: "Trip Saved!",
        description: `Your ${distance.toFixed(2)} km trip has been saved to history.`,
      });
      setTotalDistance(prev => prev + distance);
    }
    trackerStop();
    tripStartTimeRef.current = null;
  };

  const addXp = React.useCallback((amount: number) => {
    toast({
        title: "XP Gained!",
        description: `You earned ${amount} XP.`,
    });
    // This will trigger the useEffect for leveling up
    setPet(p => ({ ...p, xp: p.xp + amount }));
  }, [toast]);


  React.useEffect(() => {
    // Load saved data from localStorage on mount
    const savedPois = localStorage.getItem('pois');
    if (savedPois) {
      setPois(JSON.parse(savedPois));
    } else {
      setPois(initialPois);
    }
    
    const existingTripsJSON = localStorage.getItem('trips');
    if (existingTripsJSON) {
        const existingTrips: Trip[] = JSON.parse(existingTripsJSON);
        setTrips(existingTrips);
        const savedTotalDistance = existingTrips.reduce((acc, trip) => acc + trip.distance, 0);
        setTotalDistance(savedTotalDistance);
    } else {
        // If no trips exist, add the mock trip
        const initialTrips = [mockTrip];
        localStorage.setItem('trips', JSON.stringify(initialTrips));
        setTrips(initialTrips);
        setTotalDistance(mockTrip.distance);
    }
    
    const savedPet = localStorage.getItem('pet');
    if (savedPet) {
        setPet(JSON.parse(savedPet));
    }
  }, []);


  React.useEffect(() => {
    // This effect runs whenever totalDistance or distance changes, calculating XP from distance
    const distanceXp = (totalDistance + distance) * XP_PER_KM;
    setPet(currentPet => ({...currentPet, xp: distanceXp}));
  }, [distance, totalDistance]);


  React.useEffect(() => {
    // This effect handles level ups based on XP changes.
    // It calculates the new level and evolution state.
    const currentPet = pet;
    let currentXp = currentPet.xp;
    let currentLevel = 1;
    let xpForNext = 100;
    let currentEvolutionStage = 1;

    // Recalculate level from base XP
    while (currentXp >= xpForNext) {
        currentXp -= xpForNext;
        currentLevel++;
        xpForNext = Math.floor(xpForNext * 1.5);
        
        const newEvolutionStage = PET_EVOLUTION_LEVELS.filter(l => currentLevel >= l).length + 1;
        if (newEvolutionStage > currentEvolutionStage) {
            currentEvolutionStage = newEvolutionStage;
        }
    }

    const finalPetState: Pet = {
        ...currentPet,
        xp: Math.round(currentXp),
        level: currentLevel,
        xpToNextLevel: xpForNext,
        evolutionStage: currentEvolutionStage,
    };

    // Only update state if something has actually changed to avoid infinite loops
    if (finalPetState.level !== currentPet.level || finalPetState.evolutionStage !== currentPet.evolutionStage || finalPetState.xp !== currentPet.xp) {
        setPet(finalPetState);
        localStorage.setItem('pet', JSON.stringify(finalPetState));
    }

  }, [pet.xp]);

  // Separate effect for showing toast notifications on level/evolution change
  React.useEffect(() => {
    // use a ref to track the previous state to compare against
    if (prevPetRef.current) {
        const prevPet = prevPetRef.current;
        if (pet.evolutionStage > prevPet.evolutionStage) {
            toast({
                title: "Your pet evolved!",
                description: `${pet.name} has reached a new form!`,
            });
        } else if (pet.level > prevPet.level) {
            toast({
                title: "Level Up!",
                description: `${pet.name} is now level ${pet.level}!`,
            });
        }
    }
    
    // update the ref with the current pet state for the next render
    prevPetRef.current = pet;
  }, [pet.level, pet.evolutionStage, pet.name, toast]);

  React.useEffect(() => {
    if (!position || !isTracking || pois.length === 0) return;
      
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
    let updatedPois = pois;
    let didDiscover = false;

    const undiscoveredPois = updatedPois.filter(p => !p.discovered);

    for (const poi of undiscoveredPois) {
      const dist = getDistanceInKm(poi.position, position);

      if (dist < DISCOVERY_RADIUS_KM) {
        updatedPois = updatedPois.map(p => p.id === poi.id ? { ...p, discovered: true } : p);
        didDiscover = true;
        toast({
            title: "New Area Discovered!",
            description: `You've unveiled ${poi.name}.`,
            variant: "default",
        });
      }
    }
    
    if (didDiscover) {
        setPois(updatedPois);
        localStorage.setItem('pois', JSON.stringify(updatedPois));
    }
  }, [position, pois, toast, isTracking]);

  const handleStartQuiz = (poi: PointOfInterest) => {
    setActiveQuizPoi(poi);
  };
  
  const handleStartLocalChallenge = async () => {
    if (!position || !googleMapsApiKey) return;

    try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: position });
        
        if (response.results && response.results[0]) {
            // Find a descriptive name for the area
            const areaName = 
                response.results.find(r => r.types.includes('locality'))?.formatted_address || 
                response.results[0].formatted_address;

            const localPoi: PointOfInterest = {
                id: `local-${Date.now()}`,
                name: 'Current Location',
                position: position,
                areaDescription: `The user is currently near ${areaName}.`,
                discovered: true
            };
            setActiveQuizPoi(localPoi);
        } else {
             toast({ title: "Could not identify location", description: "Failed to find address details for your current position.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Reverse geocoding failed", error);
        toast({ title: "Geocoding Error", description: "Could not fetch location details.", variant: "destructive" });
    }
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
    
    if (error) {
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

    if (loading) {
       return <Skeleton className="h-full w-full" />
    }
    
    return (
       <GameMap
        apiKey={googleMapsApiKey}
        userPosition={position}
        defaultCenter={TAIPEI_CENTER}
        pois={pois}
        path={path}
        trips={trips}
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
          <div className="flex items-center gap-2">
             <Button onClick={handleStartLocalChallenge} disabled={!position} variant="outline" size="sm">
              <Trophy /> 在地挑戰
            </Button>
            {!isTracking ? (
              <Button onClick={handleStartTracking} disabled={loading} size="sm">
                <Play /> Start
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="destructive" size="sm">
                <Square /> Stop
              </Button>
            )}
          </div>
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
        onQuizComplete={addXp}
      />
    </div>
  );
}
