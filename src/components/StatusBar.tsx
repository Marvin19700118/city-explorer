
import { Footprints, MapPin } from 'lucide-react';
import type { CurrentArea } from '@/lib/types';
import { useLocation } from '@/context/LocationTrackingContext';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';

export const StatusBar = () => {
  const { distance, currentArea } = useLocation();
  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="flex flex-col items-center justify-center rounded-lg p-3 text-center border">
        <div className="flex items-center gap-2">
            <Footprints className="h-5 w-5 text-accent" />
            <span className="text-sm text-muted-foreground">已探索</span>
        </div>
        <p className="font-headline text-2xl font-bold text-foreground">
          {distance.toFixed(2)} <span className="text-base font-normal text-muted-foreground">km</span>
        </p>
      </Card>
       <Card className="flex flex-col items-center justify-center rounded-lg p-3 text-center h-full border">
         <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">目前位置</span>
        </div>
        {currentArea ? (
          <div className="flex flex-col items-center">
            <p className="font-headline text-lg font-bold text-foreground">
              {currentArea.village || currentArea.district}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentArea.city} {currentArea.district}
            </p>
          </div>
        ) : (
           <p className="font-headline text-base font-bold text-muted-foreground mt-1">
                定位中...
            </p>
        )}
      </Card>
    </div>
  );
};
