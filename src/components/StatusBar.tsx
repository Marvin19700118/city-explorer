import { Footprints, MapPin } from 'lucide-react';
import type { CurrentArea } from '@/lib/types';

type StatusBarProps = {
  distance: number;
  currentArea: CurrentArea | null;
};

export const StatusBar = ({ distance, currentArea }: StatusBarProps) => {
  return (
    <div className="flex items-center justify-center gap-4 p-2 h-[88px]">
      <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4 w-48 text-center">
        <Footprints className="h-8 w-8 text-accent" />
        <p className="font-headline text-2xl font-bold text-foreground mt-1">
          {distance.toFixed(2)} km
        </p>
        <p className="text-sm text-muted-foreground">已探索</p>
      </div>
       <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4 w-48 text-center">
        <MapPin className="h-8 w-8 text-sky-500" />
        {currentArea ? (
          <>
            <p className="font-headline text-lg font-bold text-foreground mt-1 truncate w-full" title={`${currentArea.city}${currentArea.district}`}>
              {currentArea.city} {currentArea.district}
            </p>
            <p className="text-sm text-muted-foreground truncate w-full" title={currentArea.village}>
                {currentArea.village || '探索中...'}
            </p>
          </>
        ) : (
           <>
            <p className="font-headline text-lg font-bold text-foreground mt-1">
                定位中...
            </p>
            <p className="text-sm text-muted-foreground">
                請稍候
            </p>
           </>
        )}
      </div>
    </div>
  );
};
