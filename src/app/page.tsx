'use client';

import * as React from 'react';
import { Map, MapPin } from 'lucide-react';
import { StatusBar } from '@/components/StatusBar';
import { GameMap } from '@/components/Map';
import { QuizModal } from '@/components/QuizModal';
import { useLocationTracker } from '@/hooks/use-location-tracker';
import type { Pet, PointOfInterest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"

const initialPois: PointOfInterest[] = [
  { id: 'poi1', name: 'Central Park', position: { x: 45, y: 30 }, areaDescription: 'A large urban park in Manhattan, New York City, featuring walking paths, a zoo, and a carousel.', discovered: false },
  { id: 'poi2', name: 'Eiffel Tower', position: { x: 75, y: 65 }, areaDescription: 'A wrought-iron lattice tower on the Champ de Mars in Paris, France.', discovered: false },
  { id: 'poi3', name: 'Colosseum', position: { x: 20, y: 80 }, areaDescription: 'An oval amphitheatre in the centre of the city of Rome, Italy.', discovered: false },
  { id: 'poi4', name: 'Mount Fuji', position: { x: 90, y: 10 }, areaDescription: 'An active volcano that is Japan\'s tallest peak, known for its symmetrical cone.', discovered: false },
];

const XP_PER_KM = 100;
const PET_EVOLUTION_LEVELS = [5, 10, 15];

export default function Home() {
  const { position, distance } = useLocationTracker();
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
    const DISCOVERY_RADIUS = 10;
    const undiscoveredPois = pois.filter(p => !p.discovered);

    for (const poi of undiscoveredPois) {
      const dx = poi.position.x - position.x;
      const dy = poi.position.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < DISCOVERY_RADIUS) {
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-body text-foreground">
      <div className="relative mx-auto flex h-[800px] max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border-4 border-primary/50 bg-background shadow-2xl shadow-primary/20">
        <header className="flex items-center justify-center gap-2 p-4 font-headline text-2xl font-bold text-primary">
          <MapPin className="h-6 w-6" />
          <h1>City Unveiler</h1>
        </header>

        <main className="relative flex-1">
          <GameMap
            userPosition={position}
            pois={pois}
            onStartQuiz={handleStartQuiz}
          />
        </main>

        <footer className="border-t-2 border-primary/20 p-2">
          <StatusBar distance={distance} pet={pet} />
        </footer>
      </div>
      <QuizModal
        poi={activeQuizPoi}
        isOpen={!!activeQuizPoi}
        onClose={handleCloseQuiz}
      />
    </div>
  );
}
