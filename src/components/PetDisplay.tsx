import type { Pet } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PetIcon } from '@/components/icons';

type PetDisplayProps = {
  pet: Pet;
};

export const PetDisplay = ({ pet }: PetDisplayProps) => {
  const progressPercentage = (pet.xp / pet.xpToNextLevel) * 100;

  return (
    <div className="flex items-center gap-4 text-foreground">
      <div className="rounded-full bg-primary/20 p-2 text-primary ring-2 ring-primary/50">
        <PetIcon evolutionStage={pet.evolutionStage} className="h-8 w-8" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <p className="font-headline font-bold text-lg text-primary">{pet.name}</p>
          <p className="text-sm font-bold text-accent">Lvl {pet.level}</p>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-primary/20" />
        <p className="text-right text-xs text-muted-foreground mt-1">
          {Math.floor(pet.xp)} / {Math.floor(pet.xpToNextLevel)} XP
        </p>
      </div>
    </div>
  );
};
