import type { Pet } from '@/lib/types';
import { PetDisplay } from './PetDisplay';
import { Separator } from './ui/separator';
import { Footprints } from 'lucide-react';

type StatusBarProps = {
  distance: number;
  pet: Pet;
};

export const StatusBar = ({ distance, pet }: StatusBarProps) => {
  return (
    <div className="grid grid-cols-5 items-center gap-2 p-2">
      <div className="col-span-2 flex flex-col items-center justify-center rounded-lg bg-muted/50 p-2">
        <Footprints className="h-6 w-6 text-accent" />
        <p className="font-headline text-lg font-bold text-foreground">
          {distance.toFixed(2)} km
        </p>
        <p className="text-xs text-muted-foreground">Explored</p>
      </div>
      <Separator orientation="vertical" className="h-16" />
      <div className="col-span-2">
        <PetDisplay pet={pet} />
      </div>
    </div>
  );
};
