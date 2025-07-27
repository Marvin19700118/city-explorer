import { Footprints, MapPin } from 'lucide-react';
import type { CurrentArea } from '@/lib/types';
import { useLocation } from '@/context/LocationTrackingContext';
import { cn } from '@/lib/utils';

export const StatusBar = () => {
  const { distance, currentArea } = useLocation();
  return (
    <div className="flex items-center justify-center gap-4 p-2 h-[88px]">
      <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4 w-48 text-center">
        <Footprints className="h-8 w-8 text-accent" />
        <p className="font-headline text-2xl font-bold text-foreground mt-1">
          {distance.toFixed(2)} km
        </p>
        <p className="text-sm text-muted-foreground">已探索</p>
      </div>
       <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4 w-48 text-center h-full">
        <MapPin className="h-8 w-8 text-sky-500" />
        {currentArea ? (
          <>
            <p className={cn("font-headline font-bold text-foreground mt-1 truncate w-full", currentArea.village ? 'text-base' : 'text-lg')} title={`${currentArea.city} ${currentArea.district}`}>
              {currentArea.city} {currentArea.district}
            </p>
            {currentArea.village && <p className="text-sm text-muted-foreground">{currentArea.village}</p>}
            {!currentArea.village && <p className="text-sm text-muted-foreground">目前位置</p>}
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
