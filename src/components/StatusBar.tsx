import { Footprints } from 'lucide-react';

type StatusBarProps = {
  distance: number;
};

export const StatusBar = ({ distance }: StatusBarProps) => {
  return (
    <div className="flex items-center justify-center p-2 h-[88px]">
      <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4 w-48">
        <Footprints className="h-8 w-8 text-accent" />
        <p className="font-headline text-2xl font-bold text-foreground mt-1">
          {distance.toFixed(2)} km
        </p>
        <p className="text-sm text-muted-foreground">已探索</p>
      </div>
    </div>
  );
};
